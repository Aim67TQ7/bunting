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

// Create encryption key for user using a dedicated encryption password
export async function createUserEncryptionKey(userId: string): Promise<CryptoKey> {
  console.log('Creating encryption key for user:', userId);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Session data:', { hasSession: !!session, hasAccessToken: !!session?.access_token, sessionError });
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error(`Session error: ${sessionError.message}`);
  }
  
  if (!session?.access_token) {
    console.error('No active session or access token');
    throw new Error('No active session for encryption key generation');
  }

  // Use a combination of user ID and session for better security
  const encryptionPassword = `${userId}:${session.access_token}:encryption`;
  console.log('Getting user encryption salt...');
  
  const salt = await getUserEncryptionSalt(userId);
  console.log('Salt obtained, deriving key...');
  
  const key = await deriveKey(encryptionPassword, salt);
  console.log('Key derived successfully');
  
  return key;
}

// Encrypt conversation content
export async function encryptConversationContent(content: any, userId: string): Promise<string> {
  const key = await createUserEncryptionKey(userId);
  const contentString = JSON.stringify(content);
  const encrypted = await encryptData(contentString, key);
  return JSON.stringify(encrypted);
}

// Decrypt conversation content
export async function decryptConversationContent(encryptedContent: string, userId: string): Promise<any> {
  try {
    // Parse as encrypted data
    const encryptedData = JSON.parse(encryptedContent) as EncryptedData;
    
    // Check if this looks like encrypted data
    if (encryptedData.data && encryptedData.iv) {
      console.log('Attempting to decrypt conversation content for user:', userId);
      console.log('Encrypted data structure:', { hasData: !!encryptedData.data, hasIv: !!encryptedData.iv });
      
      const key = await createUserEncryptionKey(userId);
      console.log('Encryption key created successfully');
      
      const decryptedString = await decryptData(encryptedData, key);
      console.log('Decryption successful, parsing JSON...');
      
      return JSON.parse(decryptedString);
    } else {
      // Legacy unencrypted data - return as is but log warning
      console.warn('Found unencrypted conversation data - this should be migrated');
      return encryptedData;
    }
  } catch (error) {
    console.error('Error decrypting conversation content:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error('Failed to decrypt conversation content');
  }
}