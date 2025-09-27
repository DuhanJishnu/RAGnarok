import crypto from 'crypto';

export function generateRandom128CharString() {
  return crypto.randomBytes(64).toString('hex'); 
}