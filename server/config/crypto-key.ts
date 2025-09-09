import fs from "fs";

export function loadCryptoKey(): string {
  const env = process.env.CRYPTO_KEY_32;
  if (env) {
    if (env.length === 32) return env;
    throw new Error(
      `Invalid CRYPTO_KEY_32 length: ${env.length} chars. Must be exactly 32 characters.`
    );
  }

  const file = process.env.CRYPTO_KEY_FILE;
  if (file && fs.existsSync(file)) {
    const k = fs.readFileSync(file, "utf8").trim();
    if (k.length === 32) return k;
    throw new Error(
      `Invalid CRYPTO_KEY_FILE length: ${k.length} chars. Must be exactly 32 characters.`
    );
  }
  throw new Error(
    "Missing CRYPTO_KEY_32. Admin must set a 32-character key via Replit secrets."
  );
}