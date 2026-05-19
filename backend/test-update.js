import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testUpdate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookbazaar');
    const Product = (await import('./models/Product.js')).default;
    
    const p = await Product.findOne();
    console.log("Updating product ID:", p._id);
    
    // Simulate req.body
    const payload = {
      name: p.name,
      seoTitle: 'Buy something',
      seoKeywords: ['test', 'keyword']
    };
    
    Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined) {
          p[key] = payload[key];
        }
    });
    
    await p.save();
    console.log("Success");
  } catch(err) {
    console.error("Error:", err);
  }
  process.exit();
}

testUpdate();
