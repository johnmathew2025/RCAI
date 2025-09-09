import fs from "fs";

export function loadCryptoKey(): string {
  // Use raw 32-char key (utf8), not base64 as specified
  const K = process.env.CRYPTO_KEY_32 || process.env.AI_KEY_ENCRYPTION_SECRET;
  if (!K || K.length !== 32) {
    throw new Error('CRYPTO_KEY_32 must be exactly 32 chars');
  }
  return K;
}