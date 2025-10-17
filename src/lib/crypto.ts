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

/**
 * Generates a new random conversation key or user master key.
 */
export const generateConversationKey = async (): Promise<CryptoKey> => {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // Make the key exportable
    ["encrypt", "decrypt"]
  );
};

/**
 * Exports a CryptoKey to a storable JSON Web Key (JWK) string format.
 */
export const exportConversationKey = async (key: CryptoKey): Promise<string> => {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(jwk);
};

/**
 * Imports a CryptoKey from a JWK string.
 */
export const importConversationKey = async (jwkString: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(jwkString);
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a conversation key using a user's master key.
 * This "wraps" the shared key so it can be stored securely for each user.
 */
export const encryptConversationKey = async (
  conversationKey: CryptoKey,
  userMasterKey: CryptoKey
): Promise<string> => {
  const jwkString = await exportConversationKey(conversationKey);
  // We can reuse your robust encryptMessage function for this
  return encryptMessage(jwkString, userMasterKey);
};

/**
 * Decrypts a conversation key using a user's master key.
 * This "unwraps" the shared key, making it usable for decrypting messages.
 */
export const decryptConversationKey = async (
  encryptedKey: string,
  userMasterKey: CryptoKey
): Promise<CryptoKey> => {
  // We reuse your robust decryptMessage function for this
  const jwkString = await decryptMessage(encryptedKey, userMasterKey);
  return importConversationKey(jwkString);
};
