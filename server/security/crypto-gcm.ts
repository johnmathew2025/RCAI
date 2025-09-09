import crypto from 'crypto';
import { loadCryptoKey } from '../config/crypto-key';

// Use the existing crypto key loading system
const ENC_KEY = loadCryptoKey();

export interface EncryptedSecret {
  keyCiphertextB64: string;
  keyIvB64: string;
  keyTagB64: string;
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'utf8'), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return {
    keyCiphertextB64: ciphertext.toString('base64'),
    keyIvB64: iv.toString('base64'),
    keyTagB64: tag.toString('base64'),
  };
}

export function decryptSecret(encrypted: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENC_KEY, 'utf8'),
    Buffer.from(encrypted.keyIvB64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encrypted.keyTagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.keyCiphertextB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  
  return plaintext;
}