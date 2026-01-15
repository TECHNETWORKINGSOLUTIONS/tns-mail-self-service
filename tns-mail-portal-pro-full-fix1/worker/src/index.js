
import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ host: process.env.REDIS_HOST || 'redis', port: +(process.env.REDIS_PORT||6379) });

const dnsQueue = new Queue('dns', { connection });
new QueueScheduler('dns', { connection });
new Worker('dns', async (job)=>{ return true; }, { connection });

console.log('[worker] started');
