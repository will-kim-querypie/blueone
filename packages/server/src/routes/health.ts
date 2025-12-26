import { Router } from 'express';
import { getSystemMetrics } from '@/services';
import logger from '@/utils/logger';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.get('/detailed', async (_req, res) => {
  try {
    const metrics = await getSystemMetrics();
    const isHealthy = metrics.cpuUsage < 90 && metrics.memoryUsage < 90 && metrics.disk.usagePercent < 95;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      metrics: {
        cpu: {
          usage: metrics.cpuUsage,
          unit: 'percent',
        },
        memory: {
          usage: metrics.memoryUsage,
          free: metrics.freeMemory,
          total: metrics.totalMemory,
          unit: 'bytes',
        },
        disk: {
          usage: metrics.disk.usagePercent,
          free: metrics.disk.free,
          total: metrics.disk.total,
          unit: 'bytes',
        },
        loadAverage: metrics.loadAverage,
      },
    });
  } catch (err) {
    logger.error(`[Health] Detailed check failed: ${err}`);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to retrieve system metrics',
    });
  }
});

export default router;
