// src/lib/crypto.ts

/**
 * Derives a strong, AES-GCM compatible encryption key from a user's password and salt.
 * Uses the PBKDF2 algorithm.
 * @param {string} password - The user's password.
 * @param {string} salt - The user's unique, stored salt.
 * @returns {Promise<CryptoKey>} - The derived CryptoKey object.
 */
export const deriveKey = async (password: string, salt: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  // 1. Import the user's password as a base key for PBKDF2.
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // 2. Derive a 256-bit AES-GCM key.
  // We use a high iteration count for security.
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 250000, // A good, modern iteration count
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 }, // Key algorithm and length
    true, // The key can be exported if needed (usually false is fine)
    ["encrypt", "decrypt"] // Key can be used for both actions
  );
};


/**
 * Encrypts a plaintext message using a derived AES-GCM CryptoKey.
 * @param {string} plaintext - The message to encrypt.
 * @param {CryptoKey} key - The CryptoKey derived from the user's password.
 * @returns {Promise<string>} - A base64 encoded string containing the IV and ciphertext.
 */
export const encryptMessage = async (plaintext: string, key: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(plaintext);

  // 1. Generate a random 12-byte Initialization Vector (IV).
  // The IV must be unique for every encryption with the same key.
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt the data.
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBuffer
  );

  // 3. Bundle the IV and the ciphertext together for storage.
  // We store them as `iv.ciphertext` in a single string.
  const ivString = btoa(String.fromCharCode.apply(null, Array.from(iv)));
  const encryptedString = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedBuffer))));
  
  return `${ivString}.${encryptedString}`;
};

/**
 * Decrypts a bundled (IV + ciphertext) message using a derived AES-GCM CryptoKey.
 * @param {string} bundledCiphertext - The base64 string from the database (e.g., "iv.ciphertext").
 * @param {CryptoKey} key - The CryptoKey derived from the user's password.
 * @returns {Promise<string>} - The original plaintext message.
 */
export const decryptMessage = async (bundledCiphertext: string, key: CryptoKey): Promise<string> => {
  // 1. Unbundle the IV and ciphertext from the stored string.
  const [ivString, encryptedString] = bundledCiphertext.split('.');
  if (!ivString || !encryptedString) {
    throw new Error("Invalid encrypted message format.");
  }

  const iv = new Uint8Array(atob(ivString).split('').map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(encryptedString).split('').map(c => c.charCodeAt(0)));

  // 2. Decrypt the data.
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  // 3. Decode the buffer back to a readable string.
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};
