
import { QueueScheduler, Worker } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis({ host: process.env.REDIS_HOST||'redis', port: +(process.env.REDIS_PORT||6379) });
new QueueScheduler('dns',{ connection });
new Worker('dns', async ()=> true, { connection });
console.log('[worker] started');
