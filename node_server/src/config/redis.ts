import Redis from 'ioredis';

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // maxRetriesPerRequest: null, // Set to null for infinite retries
  // retryDelayOnFailover: 100,
  // enableReadyCheck: false,
  // lazyConnect: false,
  // connectTimeout: 60000,
  // commandTimeout: 60000,
  // keepAlive: 30000,
  // family: 4, // Use IPv4
  // enableOfflineQueue: false,
};

export const redis = new Redis(redisConnection);

// Handle Redis connection events
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('ready', () => {
  console.log('Redis ready');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});