import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const testEnv = {
  email: process.env.TEST_EMAIL || 'demo@example.com',
  password: process.env.TEST_PASSWORD || 'secret123',
};
