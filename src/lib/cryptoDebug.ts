// src/lib/cryptoDebug.ts
// Optional debugging utilities for encryption troubleshooting

/**
 * Safely logs CryptoKey information without exposing the actual key material
 */
export const logCryptoKeyInfo = (key: CryptoKey | null, label: string = 'CryptoKey') => {
  if (!key) {
    console.log(`${label}: NULL`);
    return;
  }

  console.log(`${label} Info:`, {
    type: key.type,
    extractable: key.extractable,
    algorithm: key.algorithm,
    usages: key.usages,
  });
};

/**
 * Validates that an encrypted string has the correct format (iv.ciphertext)
 */
export const validateEncryptedFormat = (encrypted: string): boolean => {
  if (!encrypted || typeof encrypted !== 'string') {
    console.error('Invalid encrypted data: not a string');
    return false;
  }

  const parts = encrypted.split('.');
  if (parts.length !== 2) {
    console.error('Invalid encrypted format: expected "iv.ciphertext", got', encrypted.substring(0, 50));
    return false;
  }

  const [iv, ciphertext] = parts;
  
  if (!iv || iv.length === 0) {
    console.error('Invalid IV: empty or missing');
    return false;
  }

  if (!ciphertext || ciphertext.length === 0) {
    console.error('Invalid ciphertext: empty or missing');
    return false;
  }

  try {
    // Validate base64 encoding
    atob(iv);
    atob(ciphertext);
    return true;
  } catch (e) {
    console.error('Invalid base64 encoding in encrypted data');
    return false;
  }
};

/**
 * Tests encryption/decryption round-trip with a given key
 */
export const testEncryptionRoundTrip = async (
  key: CryptoKey, 
  testMessage: string = 'Test message 🔐'
): Promise<boolean> => {
  try {
    const { encryptMessage, decryptMessage } = await import('./crypto');
    
    console.log('🧪 Testing encryption round-trip...');
    console.log('Test message:', testMessage);
    
    const encrypted = await encryptMessage(testMessage, key);
    console.log('✅ Encryption successful');
    console.log('Encrypted format valid:', validateEncryptedFormat(encrypted));
    
    const decrypted = await decryptMessage(encrypted, key);
    console.log('✅ Decryption successful');
    console.log('Decrypted message:', decrypted);
    
    const matches = decrypted === testMessage;
    console.log(matches ? '✅ Round-trip test PASSED' : '❌ Round-trip test FAILED');
    
    return matches;
  } catch (error: any) {
    console.error('❌ Round-trip test FAILED:', error.message);
    return false;
  }
};

/**
 * Compares two keys to see if they're functionally equivalent
 * (Note: This exports keys, so use only for debugging, not in production)
 */
export const compareKeys = async (
  key1: CryptoKey, 
  key2: CryptoKey, 
  label1: string = 'Key1', 
  label2: string = 'Key2'
): Promise<boolean> => {
  try {
    const crypto = window.crypto || globalThis.crypto;
    
    const jwk1 = await crypto.subtle.exportKey('jwk', key1);
    const jwk2 = await crypto.subtle.exportKey('jwk', key2);
    
    const match = JSON.stringify(jwk1) === JSON.stringify(jwk2);
    
    console.log(`🔍 Comparing ${label1} vs ${label2}:`, match ? '✅ MATCH' : '❌ DIFFERENT');
    
    return match;
  } catch (error: any) {
    console.error('❌ Key comparison failed:', error.message);
    return false;
  }
};

/**
 * Comprehensive encryption system health check
 */
export const runEncryptionHealthCheck = async (
  userMasterKey: CryptoKey | null,
  personalKey: CryptoKey | null,
  encryptedMasterKey: string | null | undefined
): Promise<boolean> => {
  console.log('🏥 === ENCRYPTION HEALTH CHECK ===');
  
  let allChecksPass = true;

  // Check 1: Personal Key
  if (!personalKey) {
    console.error('❌ Personal key is NULL');
    allChecksPass = false;
  } else {
    console.log('✅ Personal key exists');
    logCryptoKeyInfo(personalKey, 'Personal Key');
  }

  // Check 2: User Master Key
  if (!userMasterKey) {
    console.error('❌ User master key is NULL');
    allChecksPass = false;
  } else {
    console.log('✅ User master key exists');
    logCryptoKeyInfo(userMasterKey, 'User Master Key');
  }

  // Check 3: Encrypted Master Key Format
  if (!encryptedMasterKey) {
    console.warn('⚠️ No encrypted master key stored (new user?)');
  } else {
    const formatValid = validateEncryptedFormat(encryptedMasterKey);
    if (formatValid) {
      console.log('✅ Encrypted master key format is valid');
    } else {
      console.error('❌ Encrypted master key format is INVALID');
      allChecksPass = false;
    }
  }

  // Check 4: Round-trip test with user master key
  if (userMasterKey) {
    const roundTripPass = await testEncryptionRoundTrip(userMasterKey);
    if (!roundTripPass) {
      allChecksPass = false;
    }
  }

  console.log(allChecksPass ? '✅ All checks PASSED' : '❌ Some checks FAILED');
  console.log('🏥 === END HEALTH CHECK ===');
  
  return allChecksPass;
};
