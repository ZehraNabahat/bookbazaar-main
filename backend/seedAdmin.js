import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce-ai');
    
    // Check if admin exists
    let admin = await User.findOne({ email: 'admin@bookbazaar.com' });
    
    if (admin) {
      console.log('Admin already exists!');
      admin.role = 'admin';
      admin.password = 'admin123';
      await admin.save();
      console.log('Admin password reset to admin123 and role ensured as admin.');
    } else {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@bookbazaar.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Admin created successfully!');
    }
    
    console.log('Email: admin@bookbazaar.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
