import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookbazaar').then(async () => {
  const Product = (await import('./models/Product.js')).default;
  await Product.updateOne({ name: /Math/i }, { $set: { stock: 0 } });
  await Product.updateOne({ name: /English/i }, { $set: { stock: 0 } });
  console.log('Reset partial stock to 0');
  process.exit(0);
});
