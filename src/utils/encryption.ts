import { supabase } from '@/integrations/supabase/client';

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export interface EncryptedData {
  data: string; // base64 encoded encrypted data
  iv: string; // base64 encoded initialization vector
  salt?: string; // base64 encoded salt (for key derivation)
}

// Generate a random salt
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// Derive encryption key from password using PBKDF2
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data using AES-GCM
export async function encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv },
    key,
    encodedData
  );

  return {
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

// Decrypt data using AES-GCM
export async function decryptData(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
  const data = new Uint8Array(atob(encryptedData.data).split('').map(c => c.charCodeAt(0)));

  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv },
    key,
    data
  );

  return new TextDecoder().decode(decryptedData);
}

// Get or create user's encryption salt
export async function getUserEncryptionSalt(userId: string): Promise<Uint8Array> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('encryption_salt')
    .eq('id', userId)
    .single();

  if (error || !profile?.encryption_salt) {
    // Generate new salt
    const newSalt = generateSalt();
    const saltBase64 = btoa(String.fromCharCode(...newSalt));

    await supabase
      .from('profiles')
      .update({ encryption_salt: saltBase64 })
      .eq('id', userId);

    return newSalt;
  }

  // Decode existing salt
  return new Uint8Array(atob(profile.encryption_salt).split('').map(c => c.charCodeAt(0)));
}

// Create encryption key for user using stable user-based password (v2)
export async function createUserEncryptionKey(userId: string): Promise<CryptoKey> {
  // Use stable user-based encryption password (no session token dependency)
  const encryptionPassword = `${userId}:encryption_key_v2`;
  const salt = await getUserEncryptionSalt(userId);
  return deriveKey(encryptionPassword, salt);
}

// Legacy encryption key creation for fallback decryption
async function createLegacyUserEncryptionKey(userId: string): Promise<CryptoKey | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      return null;
    }

    // Legacy encryption password with session token
    const encryptionPassword = `${userId}:${session.access_token}:encryption`;
    const salt = await getUserEncryptionSalt(userId);
    
    return deriveKey(encryptionPassword, salt);
  } catch (error) {
    console.warn('Failed to create legacy encryption key:', error);
    return null;
  }
}

// Encrypt conversation content
export async function encryptConversationContent(content: any, userId: string): Promise<string> {
  const key = await createUserEncryptionKey(userId);
  const contentString = JSON.stringify(content);
  const encrypted = await encryptData(contentString, key);
  return JSON.stringify(encrypted);
}

// Decrypt conversation content with fallback support
export async function decryptConversationContent(encryptedContent: string, userId: string): Promise<any> {
  try {
    // Parse as encrypted data
    const encryptedData = JSON.parse(encryptedContent) as EncryptedData;
    
    // Check if this looks like encrypted data
    if (encryptedData.data && encryptedData.iv) {
      // Try with new stable encryption key first
      try {
        const key = await createUserEncryptionKey(userId);
        const decryptedString = await decryptData(encryptedData, key);
        return JSON.parse(decryptedString);
      } catch (newKeyError) {
        console.warn('Failed to decrypt with new key, trying legacy key...', newKeyError);
        
        // Fallback: try with legacy session-based encryption key
        const legacyKey = await createLegacyUserEncryptionKey(userId);
        if (legacyKey) {
          try {
            const decryptedString = await decryptData(encryptedData, legacyKey);
            console.log('Successfully decrypted with legacy key');
            return JSON.parse(decryptedString);
          } catch (legacyKeyError) {
            console.error('Failed to decrypt with legacy key as well:', legacyKeyError);
          }
        }
        
        // If both keys fail, throw a more descriptive error
        throw new Error('Cannot decrypt conversation - encryption key has changed. Please contact support if this persists.');
      }
    } else {
      // Legacy unencrypted data - return as is
      console.warn('Found unencrypted conversation data');
      return encryptedData;
    }
  } catch (error) {
    if (error.message.includes('encryption key has changed')) {
      throw error; // Re-throw our custom error
    }
    
    console.error('Error decrypting conversation content:', error);
    throw new Error(`Failed to load conversation: ${error.message}`);
  }
}