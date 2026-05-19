import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    category: { type: String, required: true },
    subcategory: { type: String },
    brand: { type: String, required: true },
    description: { type: String, required: true }, // rich text
    images: [{ type: String }], // Cloudinary URLs
    stock: { type: Number, required: true, default: 0 },
    sold: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },

    // SEO Fields
    seoTitle: { type: String, maxlength: 60 },
    seoDescription: { type: String, maxlength: 160 },
    seoKeywords: [{ type: String }],
    canonicalUrl: { type: String },
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
    structuredData: { type: String }, // JSON-LD string
    metaRobots: { type: String, default: 'index,follow' },
  },
  { timestamps: true }
);

const slugifyName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'product';

productSchema.statics.generateUniqueSlug = async function (name, excludeId) {
  const base = slugifyName(name);
  let slug = base;
  let suffix = 2;

  const slugExists = async (candidate) => {
    const query = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    return Boolean(await this.exists(query));
  };

  while (await slugExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

// Pre-validate hook to generate a unique slug from the product name
productSchema.pre('validate', async function () {
  if (this.name && !this.slug) {
    this.slug = await this.constructor.generateUniqueSlug(this.name, this._id);
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
