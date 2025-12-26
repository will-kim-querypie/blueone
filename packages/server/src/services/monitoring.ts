import https from 'https';
import os from 'os';
import logger from '@/utils/logger';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  freeMemory: number;
  totalMemory: number;
  loadAverage: number[];
}

const ALERT_THRESHOLD = 80;
const COOLDOWN_MS = 15 * 60 * 1000;

let lastAlertTime = 0;

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

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const cpuUsage = await getCpuUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);

  return {
    cpuUsage,
    memoryUsage,
    freeMemory,
    totalMemory,
    loadAverage: os.loadavg(),
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

    logger.info(`[Monitoring] CPU: ${metrics.cpuUsage}%, Memory: ${metrics.memoryUsage}%`);

    if (metrics.cpuUsage >= ALERT_THRESHOLD) {
      alerts.push(`CPU usage is at ${metrics.cpuUsage}%`);
    }

    if (metrics.memoryUsage >= ALERT_THRESHOLD) {
      alerts.push(
        `Memory usage is at ${metrics.memoryUsage}% ` +
          `(${formatBytes(metrics.totalMemory - metrics.freeMemory)} / ${formatBytes(metrics.totalMemory)})`,
      );
    }

    if (alerts.length > 0) {
      const now = Date.now();

      if (now - lastAlertTime >= COOLDOWN_MS) {
        const hostname = os.hostname();
        const message =
          `:rotating_light: *Blueone Server Alert* (${hostname})\n\n` +
          alerts.map((a) => `• ${a}`).join('\n') +
          `\n\nLoad Average: ${metrics.loadAverage.map((l) => l.toFixed(2)).join(', ')}`;

        await sendSlackAlert(message);
        lastAlertTime = now;
      } else {
        logger.info('[Monitoring] Alert suppressed due to cooldown');
      }
    }
  } catch (err) {
    logger.error(`[Monitoring] Health check failed: ${err}`);
  }
}
