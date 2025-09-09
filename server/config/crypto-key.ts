import fs from "fs";

export function loadCryptoKey(): string {
  const env = process.env.CRYPTO_KEY_32;
  if (env) {
    try {
      // Support both Base64-encoded 32-byte keys and raw 32-char strings
      if (env.length === 44) {
        // Likely Base64-encoded 32 bytes
        const decoded = Buffer.from(env, 'base64');
        if (decoded.length === 32) {
          return decoded.toString('utf8');
        }
        throw new Error(
          `Invalid CRYPTO_KEY_32: Base64 decodes to ${decoded.length} bytes. Must be exactly 32 bytes.`
        );
      } else if (env.length === 32) {
        // Raw 32-character string
        return env;
      } else {
        throw new Error(
          `Invalid CRYPTO_KEY_32 format: ${env.length} chars. Must be 32 chars or Base64-encoded 32 bytes (44 chars).`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid CRYPTO_KEY_32')) {
        throw error;
      }
      throw new Error(`Invalid CRYPTO_KEY_32: Not valid Base64 - ${error}`);
    }
  }

  const file = process.env.CRYPTO_KEY_FILE;
  if (file && fs.existsSync(file)) {
    const k = fs.readFileSync(file, "utf8").trim();
    if (k.length === 32) return k;
    try {
      const decoded = Buffer.from(k, 'base64');
      if (decoded.length === 32) {
        return decoded.toString('utf8');
      }
    } catch {}
    throw new Error(
      `Invalid CRYPTO_KEY_FILE: Must be 32 chars or Base64-encoded 32 bytes.`
    );
  }
  throw new Error(
    "Missing CRYPTO_KEY_32. Admin must set a 32-byte key (Base64 encoded) via Replit secrets."
  );
}