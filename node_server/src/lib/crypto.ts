import * as crypto from 'crypto';

/**
 * Generates a cryptographically secure random string of a specified length using Node.js's crypto module.
 *
 * This function is specifically designed for a Node.js environment. It uses `crypto.randomBytes`,
 * the standard method for generating secure random data suitable for passwords, API keys,
 * session tokens, and other security-sensitive purposes.
 *
 * Like any string generation function, its time complexity is fundamentally O(n).
 *
 * @param {number} length The desired length of the random string. Must be a positive integer.
 * @returns {string} The generated random string.
 */
export function generateHash(length: number): string {
    // Validate input: ensure it's a positive integer.
    if (isNaN(length) || length <= 0) {
        console.error("Invalid length provided. Please provide a positive number.");
        return '';
    }

    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsetLength = charset.length;

    const randomBytes = crypto.randomBytes(length);

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset[randomBytes[i] % charsetLength];
    }
    
    return result;
}