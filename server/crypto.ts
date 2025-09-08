import crypto from 'crypto';

// Ensure exactly 32 bytes for AES-256-GCM
const secret = process.env.AI_KEY_ENCRYPTION_SECRET || '';
const key = Buffer.from(secret.padEnd(32, '0').slice(0, 32), 'utf8');
if (key.length !== 32) throw new Error('AI_KEY_ENCRYPTION_SECRET must be 32 bytes');

export function encrypt(raw: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    cipher: Buffer.concat([enc, tag]).toString('base64'),
  };
}

export function decrypt(ivB64: string, cipherB64: string) {
  const iv = Buffer.from(ivB64, 'base64');
  const buf = Buffer.from(cipherB64, 'base64');
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
}

export const mask = (s: string) => s.length <= 6 ? '•••' : s.slice(0,3) + '••••' + s.slice(-3);