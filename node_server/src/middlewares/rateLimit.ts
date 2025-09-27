import { redis } from '../lib/redis.js'


export class FixedWindowRateLimit {
  /* 
    paramters - 2 - (max, window) 
    max: Maximum number of requests allowed within the time window
    window:(seconds) Time window in seconds during which the requests are counted
  */
  constructor(max, window) {
    this.max = max;
    this.window = window;
    this.redisClient = redis;
  }

  withIPaddress() {
    return async (req, res, next) => {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (!ipAddress) {
        return res.json({ error: 'IP address is required' }, 400);
      }

      const key = `rate_limit:${ipAddress}`;
      const currentCount = parseInt((await this.redisClient.get(key)) || '0');

      if (currentCount === 0) {
        await this.redisClient.set(key, 1, 'EX', this.window);
        await next();
      } else if (currentCount < this.max) {
        await this.redisClient.incr(key);
        await next();
      } else {
        return res.json({ error: 'Rate limit exceeded', retryAfterSeconds: this.window }, 429);
      }
    };
  }
}
