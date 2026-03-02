import { exec } from 'child_process';
import https from 'https';
import os from 'os';
import logger from '@/utils/logger';

interface DiskMetrics {
  diskPath: string;
  free: number;
  total: number;
  usagePercent: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  freeMemory: number;
  totalMemory: number;
  loadAverage: number[];
  disk: DiskMetrics;
}

interface Diagnostics {
  topProcesses: string;
  nodeProcess: { heapUsed: number; heapTotal: number; rss: number; uptime: number };
  pm2Info: string;
  networkInfo: { established: number; timeWait: number };
  topIPs: { tcpConnections: string; httpRequests: string };
  synFlood: number;
  systemUptime: number;
}

const ALERT_THRESHOLD = 80;
const DISK_ALERT_THRESHOLD = 90;
const COOLDOWN_MS = 15 * 60 * 1000;

let lastAlertTime = 0;
let lastDiskAlertTime = 0;

// --- Helper functions ---

function execAsync(cmd: string, timeout = 5000): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

function formatMB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

// --- Existing functions ---

function cpuAverage(): { idle: number; total: number } {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }

  return {
    idle: totalIdle / cpus.length,
    total: totalTick / cpus.length,
  };
}

let lastCpuAvg = cpuAverage();
let lastCpuTime = Date.now();
let lastCpuUsage = 0;

function getCpuUsageNonBlocking(): number {
  const now = Date.now();
  if (now - lastCpuTime < 5000) return lastCpuUsage;
  const current = cpuAverage();
  const idleDiff = current.idle - lastCpuAvg.idle;
  const totalDiff = current.total - lastCpuAvg.total;
  lastCpuUsage = totalDiff > 0 ? 100 - Math.floor((100 * idleDiff) / totalDiff) : 0;
  lastCpuAvg = current;
  lastCpuTime = now;
  return lastCpuUsage;
}

async function getDiskMetrics(): Promise<DiskMetrics> {
  const diskPath = '/';
  const isMac = os.platform() === 'darwin';

  // macOS: df uses 512-byte blocks by default, Linux: use -B1 for bytes
  const cmd = isMac
    ? "df / | tail -1 | awk '{print $2,$4}'"
    : "df -B1 / | tail -1 | awk '{print $2,$4}'";
  const blockSize = isMac ? 512 : 1;

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      const [totalBlocks, freeBlocks] = stdout.trim().split(' ').map(Number);
      const total = totalBlocks * blockSize;
      const free = freeBlocks * blockSize;
      const usagePercent = Math.round(((total - free) / total) * 100);

      resolve({
        diskPath,
        free,
        total,
        usagePercent,
      });
    });
  });
}

let cachedMetrics: SystemMetrics | null = null;
let cachedMetricsTime = 0;
const METRICS_CACHE_TTL_MS = 30_000;

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const now = Date.now();
  if (cachedMetrics && now - cachedMetricsTime < METRICS_CACHE_TTL_MS) {
    return cachedMetrics;
  }

  const cpuUsage = getCpuUsageNonBlocking();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);
  const disk = await getDiskMetrics();

  cachedMetrics = {
    cpuUsage,
    memoryUsage,
    freeMemory,
    totalMemory,
    loadAverage: os.loadavg(),
    disk,
  };
  cachedMetricsTime = now;
  return cachedMetrics;
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

// --- Diagnostics collection ---

async function getTopProcesses(): Promise<string> {
  const output = await execAsync('ps -eo pid,pcpu,pmem,rss,comm --sort=-pcpu | head -6');
  if (!output) return '';

  const lines = output.split('\n');
  const header = lines[0];
  const processes = lines.slice(1).map((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4) {
      const rssKb = parseInt(parts[3], 10);
      if (!isNaN(rssKb)) {
        parts[3] = formatMB(rssKb * 1024);
      }
    }
    return '  ' + parts.join('  ');
  });
  return '  ' + header.trim() + '\n' + processes.join('\n');
}

function getNodeProcessInfo(): Diagnostics['nodeProcess'] {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    rss: mem.rss,
    uptime: process.uptime(),
  };
}

async function getPM2Info(): Promise<string> {
  const output = await execAsync('pm2 jlist');
  if (!output) return '';

  try {
    const list = JSON.parse(output) as Array<{
      name: string;
      pm2_env?: { restart_time?: number; pm_uptime?: number };
      monit?: { memory?: number };
    }>;
    if (list.length === 0) return '';

    const app = list[0];
    const restarts = app.pm2_env?.restart_time ?? 'N/A';
    const uptime =
      app.pm2_env?.pm_uptime != null
        ? formatDuration((Date.now() - app.pm2_env.pm_uptime) / 1000)
        : 'N/A';
    const mem = app.monit?.memory != null ? formatMB(app.monit.memory) : 'N/A';
    return `Restarts: ${restarts} | Uptime: ${uptime} | Mem: ${mem}`;
  } catch {
    return '';
  }
}

async function getNetworkInfo(): Promise<Diagnostics['networkInfo']> {
  const [estOutput, twOutput] = await Promise.all([
    execAsync('ss -tna state established | tail -n +2 | wc -l'),
    execAsync('ss -tna state time-wait | tail -n +2 | wc -l'),
  ]);
  return {
    established: parseInt(estOutput, 10) || 0,
    timeWait: parseInt(twOutput, 10) || 0,
  };
}

async function getTopIPs(): Promise<Diagnostics['topIPs']> {
  // TCP connections by IP
  const tcpOutput = await execAsync(
    "ss -tna state established | awk 'NR>1{print $4}' | rev | cut -d: -f2- | rev | sort | uniq -c | sort -rn | head -5",
  );

  let tcpConnections = '';
  if (tcpOutput) {
    tcpConnections = tcpOutput
      .split('\n')
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        return match ? `  ${match[2]}  \u2014 ${Number(match[1]).toLocaleString()} connections` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  // Nginx access log - last 5 minutes
  const logPath = process.env.NGINX_ACCESS_LOG || '/var/log/nginx/access.log';
  let httpRequests = '';

  const httpOutput = await execAsync(
    `test -r "${logPath}" && awk -v s="$(date -d '5 minutes ago' '+%d/%b/%Y:%H:%M' 2>/dev/null || date -v-5M '+%d/%b/%Y:%H:%M' 2>/dev/null)" '{t=substr($4,2,17);if(t>=s)print $1}' "${logPath}" | sort | uniq -c | sort -rn | head -5`,
  );

  if (httpOutput) {
    httpRequests = httpOutput
      .split('\n')
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        return match ? `  ${match[2]}  \u2014 ${Number(match[1]).toLocaleString()} requests` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return { tcpConnections, httpRequests };
}

async function getSynFloodInfo(): Promise<number> {
  const output = await execAsync('ss -tna state syn-recv | tail -n +2 | wc -l');
  return parseInt(output, 10) || 0;
}

async function collectDiagnosticsImpl(): Promise<Diagnostics> {
  const nodeProcess = getNodeProcessInfo();
  const systemUptime = os.uptime();

  const [topProcesses, pm2Info, networkInfo, topIPs, synFlood] = await Promise.all([
    getTopProcesses(),
    getPM2Info(),
    getNetworkInfo(),
    getTopIPs(),
    getSynFloodInfo(),
  ]);

  return { topProcesses, nodeProcess, pm2Info, networkInfo, topIPs, synFlood, systemUptime };
}

const DIAGNOSTICS_TIMEOUT_MS = 10_000;

async function collectDiagnostics(): Promise<Diagnostics | null> {
  try {
    return await Promise.race([
      collectDiagnosticsImpl(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Diagnostics collection timed out')), DIAGNOSTICS_TIMEOUT_MS),
      ),
    ]);
  } catch (err) {
    logger.error(`[Monitoring] ${err}`);
    return null;
  }
}

// --- Alert formatting ---

function formatDiagnosticMessage(
  hostname: string,
  alerts: string[],
  metrics: SystemMetrics,
  diagnostics: Diagnostics,
): string {
  const lines: string[] = [];

  lines.push(`:rotating_light: *Blueone Server Alert* (${hostname})`);
  lines.push(`System Uptime: ${formatDuration(diagnostics.systemUptime)}`);
  lines.push('');

  for (const alert of alerts) {
    lines.push(`\u2022 ${alert}`);
  }
  lines.push('');

  // Load Average with trend
  const [load1, , load15] = metrics.loadAverage;
  const cpuCount = os.cpus().length;
  const loadEmoji = load1 > cpuCount ? '\uD83D\uDD34' : load1 > cpuCount * 0.7 ? '\uD83D\uDFE1' : '\uD83D\uDFE2';
  lines.push(
    `Load Average: ${loadEmoji} ${metrics.loadAverage.map((l) => l.toFixed(2)).join(', ')} (${cpuCount} cores)`,
  );

  if (load1 > load15 * 1.2) {
    lines.push('Load is rising \u2191');
  } else if (load1 < load15 * 0.8) {
    lines.push('Load is falling \u2193');
  }
  lines.push('');

  if (diagnostics.topProcesses) {
    lines.push('Top Processes (by CPU):');
    lines.push(diagnostics.topProcesses);
    lines.push('');
  }

  if (diagnostics.topIPs.tcpConnections) {
    lines.push('Top IPs (by TCP connections):');
    lines.push(diagnostics.topIPs.tcpConnections);
    lines.push('');
  }

  if (diagnostics.topIPs.httpRequests) {
    lines.push('Top IPs (by HTTP requests, last 5m):');
    lines.push(diagnostics.topIPs.httpRequests);
    lines.push('');
  }

  if (diagnostics.synFlood > 0) {
    lines.push(`\u26A0\uFE0F SYN_RECV: ${diagnostics.synFlood} (possible SYN flood)`);
    lines.push('');
  }

  // Node.js process
  const { heapUsed, heapTotal, rss, uptime } = diagnostics.nodeProcess;
  const heapPercent = Math.round((heapUsed / heapTotal) * 100);
  lines.push('Node.js Process:');
  lines.push(`  Heap: ${formatMB(heapUsed)} / ${formatMB(heapTotal)} (${heapPercent}%) | RSS: ${formatMB(rss)}`);
  lines.push(`  Uptime: ${formatDuration(uptime)}`);
  lines.push('');

  if (diagnostics.pm2Info) {
    lines.push('PM2 Status:');
    lines.push(`  ${diagnostics.pm2Info}`);
    lines.push('');
  }

  if (diagnostics.networkInfo.established > 0 || diagnostics.networkInfo.timeWait > 0) {
    lines.push('Network:');
    lines.push(
      `  TCP Established: ${diagnostics.networkInfo.established} | TIME_WAIT: ${diagnostics.networkInfo.timeWait}`,
    );
  }

  return lines.join('\n');
}

// --- Slack ---

export async function sendSlackAlert(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.error('[Monitoring] SLACK_WEBHOOK_URL is not configured');
    return;
  }

  const url = new URL(webhookUrl);
  const payload = JSON.stringify({
    text: message,
    username: 'Blueone Monitor',
    icon_emoji: ':warning:',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.resume(); // 응답 본문을 소비하여 연결 정리
        if (res.statusCode === 200) {
          logger.info('[Monitoring] Slack alert sent successfully');
          resolve();
        } else {
          logger.error(`[Monitoring] Slack alert failed: ${res.statusCode}`);
          reject(new Error(`Slack webhook returned ${res.statusCode}`));
        }
      },
    );

    req.on('error', (err) => {
      logger.error(`[Monitoring] Slack request error: ${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// --- Health check ---

let isHealthCheckRunning = false;

export async function checkSystemHealth(): Promise<void> {
  if (isHealthCheckRunning) {
    logger.info('[Monitoring] Health check skipped: previous run still in progress');
    return;
  }
  isHealthCheckRunning = true;
  try {
    const metrics = await getSystemMetrics();
    const alerts: string[] = [];
    const diskAlerts: string[] = [];

    if (metrics.cpuUsage >= ALERT_THRESHOLD) {
      alerts.push(`CPU usage is at ${metrics.cpuUsage}%`);
    }

    if (metrics.memoryUsage >= ALERT_THRESHOLD) {
      alerts.push(
        `Memory usage is at ${metrics.memoryUsage}% ` +
          `(${formatBytes(metrics.totalMemory - metrics.freeMemory)} / ${formatBytes(metrics.totalMemory)})`,
      );
    }

    if (metrics.disk.usagePercent >= DISK_ALERT_THRESHOLD) {
      diskAlerts.push(
        `Disk usage is at ${metrics.disk.usagePercent}% ` +
          `(${formatBytes(metrics.disk.total - metrics.disk.free)} / ${formatBytes(metrics.disk.total)})`,
      );
    }

    const now = Date.now();
    const hostname = os.hostname();

    const shouldSendAlert = alerts.length > 0 && now - lastAlertTime >= COOLDOWN_MS;
    const shouldSendDiskAlert = diskAlerts.length > 0 && now - lastDiskAlertTime >= COOLDOWN_MS;

    if (!shouldSendAlert && !shouldSendDiskAlert) {
      if (alerts.length > 0) {
        logger.info('[Monitoring] CPU/Memory alert suppressed due to cooldown');
      }
      if (diskAlerts.length > 0) {
        logger.info('[Monitoring] Disk alert suppressed due to cooldown');
      }
      return;
    }

    const diagnostics = await collectDiagnostics();

    if (shouldSendAlert) {
      if (diagnostics) {
        const message = formatDiagnosticMessage(hostname, alerts, metrics, diagnostics);
        await sendSlackAlert(message);
      } else {
        await sendSlackAlert(
          `:rotating_light: *Blueone Server Alert* (${hostname})\n` +
            alerts.map((a) => `\u2022 ${a}`).join('\n') +
            `\n\n_(Diagnostics collection timed out)_`,
        );
      }
      lastAlertTime = now;
    }

    if (shouldSendDiskAlert) {
      if (diagnostics) {
        const message = formatDiagnosticMessage(hostname, diskAlerts, metrics, diagnostics);
        await sendSlackAlert(message);
      } else {
        await sendSlackAlert(
          `:rotating_light: *Blueone Server Alert* (${hostname})\n` +
            diskAlerts.map((a) => `\u2022 ${a}`).join('\n') +
            `\n\n_(Diagnostics collection timed out)_`,
        );
      }
      lastDiskAlertTime = now;
    }
  } catch (err) {
    logger.error(`[Monitoring] Health check failed: ${err}`);
  } finally {
    isHealthCheckRunning = false;
  }
}
