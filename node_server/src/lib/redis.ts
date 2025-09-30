import { redis } from "../config/redis";

export async function setCachedData({key, value, ttlSeconds}: {
    key: string, 
    value: any, 
    ttlSeconds?: number
  }) {
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttlSeconds && ttlSeconds > 0) {
      return await redis.set(key, serializedValue, 'EX', ttlSeconds);
    } else {
      return await redis.set(key, serializedValue);
    }
  } catch (error) {
    console.error(`Error setting data for key ${key}:`, error);
    return null;
  }
}

/**
 * Retrieves data from Redis and handles JSON deserialization.
 * @param {string} key - The Redis key.
 * @returns {Promise<any | null>} - The parsed data or null if the key does not exist.
 */
export async function getCachedData(key: string) {
  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (parseError) {
      return data;
    }
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
}

/**
 * Deletes one or more keys from Redis.
 * @param {string | string[]} keys - The key(s) to delete.
 * @returns {Promise<number>} - The number of keys deleted.
 */
export async function deleteCachedData(keys: string | string[]) {
  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length === 0) return 0;

    return await redis.del(...keysArray);
  } catch (error) {
    console.error(`Error deleting keys ${keys}:`, error);
    return 0;
  }
}

/**
 * Updates an existing JSON object in Redis by replacing it with a new value.
 * NOTE: This is an expensive operation for partial updates. Use it for full replacement.
 * @param {string} key - The Redis key.
 * @param {any} newValue - The full new object or value to store.
 * @param {number} [ttlSeconds] - Optional expiration time in seconds.
 * @returns {Promise<string>} - The status result of the SET operation.
 */
export async function updateCachedData(key: string, newValue: any, ttlSeconds?: number) {
    return setCachedData({ key, value: newValue, ttlSeconds });
}