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

const ALERT_THRESHOLD = 80;
const DISK_ALERT_THRESHOLD = 90;
const COOLDOWN_MS = 15 * 60 * 1000;

let lastAlertTime = 0;
let lastDiskAlertTime = 0;

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

async function getCpuUsage(): Promise<number> {
  const startMeasure = cpuAverage();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const endMeasure = cpuAverage();

  const idleDiff = endMeasure.idle - startMeasure.idle;
  const totalDiff = endMeasure.total - startMeasure.total;

  return 100 - Math.floor((100 * idleDiff) / totalDiff);
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

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const cpuUsage = await getCpuUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);
  const disk = await getDiskMetrics();

  return {
    cpuUsage,
    memoryUsage,
    freeMemory,
    totalMemory,
    loadAverage: os.loadavg(),
    disk,
  };
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

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

export async function checkSystemHealth(): Promise<void> {
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

    if (alerts.length > 0 && now - lastAlertTime >= COOLDOWN_MS) {
      const message =
        `:rotating_light: *Blueone Server Alert* (${hostname})\n\n` +
        alerts.map((a) => `• ${a}`).join('\n') +
        `\n\nLoad Average: ${metrics.loadAverage.map((l) => l.toFixed(2)).join(', ')}`;

      await sendSlackAlert(message);
      lastAlertTime = now;
    } else if (alerts.length > 0) {
      logger.info('[Monitoring] CPU/Memory alert suppressed due to cooldown');
    }

    if (diskAlerts.length > 0 && now - lastDiskAlertTime >= COOLDOWN_MS) {
      const message =
        `:rotating_light: *Blueone Server Alert* (${hostname})\n\n` + diskAlerts.map((a) => `• ${a}`).join('\n');

      await sendSlackAlert(message);
      lastDiskAlertTime = now;
    } else if (diskAlerts.length > 0) {
      logger.info('[Monitoring] Disk alert suppressed due to cooldown');
    }
  } catch (err) {
    logger.error(`[Monitoring] Health check failed: ${err}`);
  }
}
