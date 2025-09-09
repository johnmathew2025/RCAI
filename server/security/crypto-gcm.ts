import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// Use RAW 32-char env key (utf8), not base64
const K = process.env.CRYPTO_KEY_32 || process.env.AI_KEY_ENCRYPTION_SECRET;
if (!K || K.length !== 32) throw new Error('CRYPTO_KEY_32 must be exactly 32 chars');
export const ENC_KEY = Buffer.from(K, 'utf8');

export interface EncryptedSecret {
  keyCiphertextB64: string;
  keyIvB64: string;
  keyTagB64: string;
}

export function encryptSecret(plain: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    keyCiphertextB64: ct.toString('base64'),
    keyIvB64: iv.toString('base64'),
    keyTagB64: tag.toString('base64'),
  };
}

export function decryptSecret(encrypted: EncryptedSecret): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    ENC_KEY,
    Buffer.from(encrypted.keyIvB64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encrypted.keyTagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.keyCiphertextB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  
  return plaintext;
}