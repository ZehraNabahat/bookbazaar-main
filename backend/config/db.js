import mongoose from 'mongoose';
import { ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD, ensureAdminUser } from '../utils/ensureAdminUser.js';

const connectDB = async () => {
  const uri = (process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce-ai').trim();
  try {
    const conn = await mongoose.connect(uri);
    const label = uri.startsWith('mongodb+srv://') ? 'MongoDB Atlas' : 'MongoDB';
    console.log(`${label} connected: ${conn.connection.host}`);

    if (process.env.NODE_ENV !== 'production') {
      try {
        const { created, message } = await ensureAdminUser();
        if (created) {
          console.log(`Dev admin ready: ${ADMIN_EMAIL} / ${ADMIN_DEFAULT_PASSWORD}`);
        } else {
          console.log(`Dev admin: ${message}`);
        }
      } catch (seedErr) {
        console.warn('Could not ensure admin user:', seedErr.message);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
