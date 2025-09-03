import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env file
const result = config({ path: resolve(process.cwd(), '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Add VITE_ prefix to process.env variables
process.env.VITE_FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;
process.env.VITE_FIREBASE_AUTH_DOMAIN = process.env.VITE_FIREBASE_AUTH_DOMAIN;
process.env.VITE_FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
process.env.VITE_FIREBASE_STORAGE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET;
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
process.env.VITE_FIREBASE_APP_ID = process.env.VITE_FIREBASE_APP_ID;
