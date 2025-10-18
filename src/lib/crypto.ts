// src/lib/crypto.ts

// ===========================================================
// Universal Crypto Resolver for Browser + Node.js
// ===========================================================

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto; // Browser implementation
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto; // Node 18+ global crypto
  }
  try {
    // Node-compatible import fallback
    const { webcrypto } = require('crypto');
    return webcrypto;
  } catch (err) {
    throw new Error('Web Crypto API is not available in this environment.');
  }
}

function getSubtle(): SubtleCrypto {
  return getCrypto().subtle;
}

// ===========================================================
// Key Derivation (Password → AES-GCM derivation)
// ===========================================================

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

  const baseKey = await getSubtle().importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return getSubtle().deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// ===========================================================
// Message Encryption & Decryption
// ===========================================================

/**
 * Encrypts a plaintext message using AES-GCM.
 * @param {string} plaintext - The message to encrypt.
 * @param {CryptoKey} key - The AES-GCM key.
 */
export const encryptMessage = async (plaintext: string, key: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(plaintext);

  const iv = getCrypto().getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await getSubtle().encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  const ivString = btoa(String.fromCharCode(...iv));
  const encryptedString = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

  return `${ivString}.${encryptedString}`;
};

/**
 * Decrypts a bundled (IV + ciphertext) message using AES-GCM.
 * @param {string} bundledCiphertext - "iv.ciphertext" format.
 * @param {CryptoKey} key - The AES-GCM key.
 */
export const decryptMessage = async (bundledCiphertext: string, key: CryptoKey): Promise<string> => {
  const [ivString, encryptedString] = bundledCiphertext.split('.');
  if (!ivString || !encryptedString) {
    throw new Error('Invalid encrypted message format.');
  }

  const iv = new Uint8Array(atob(ivString).split('').map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(encryptedString).split('').map(c => c.charCodeAt(0)));

  const decryptedBuffer = await getSubtle().decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

// ===========================================================
// Conversation Key Management
// ===========================================================

export const generateConversationKey = async (): Promise<CryptoKey> => {
  return getSubtle().generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportConversationKey = async (key: CryptoKey): Promise<string> => {
  const jwk = await getSubtle().exportKey('jwk', key);
  return JSON.stringify(jwk);
};

export const importConversationKey = async (jwkString: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(jwkString);
  return getSubtle().importKey('jwk', jwk, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
};

// ===========================================================
// Master-Key Encryption Wrappers
// ===========================================================

export const encryptConversationKey = async (
  conversationKey: CryptoKey,
  userMasterKey: CryptoKey
): Promise<string> => {
  const jwkString = await exportConversationKey(conversationKey);
  return encryptMessage(jwkString, userMasterKey);
};

export const decryptConversationKey = async (
  encryptedKey: string,
  userMasterKey: CryptoKey
): Promise<CryptoKey> => {
  const jwkString = await decryptMessage(encryptedKey, userMasterKey);
  return importConversationKey(jwkString);
};
