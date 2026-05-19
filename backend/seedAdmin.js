import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD, ensureAdminUser } from './utils/ensureAdminUser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const run = async () => {
  const uri = (process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce-ai').trim();
  try {
    await mongoose.connect(uri);
    console.log('Connected to database');

    const { message } = await ensureAdminUser({ resetPassword: true });
    console.log(message);
    console.log('--- Admin login ---');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_DEFAULT_PASSWORD);
    console.log('URL: http://localhost:3000/login');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
