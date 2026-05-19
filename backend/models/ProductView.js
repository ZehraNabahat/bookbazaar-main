import mongoose from 'mongoose';

const productViewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  },
  { timestamps: true }
);

productViewSchema.index({ userId: 1, createdAt: -1 });
productViewSchema.index({ sessionId: 1, createdAt: -1 });

const ProductView = mongoose.model('ProductView', productViewSchema);
export default ProductView;
