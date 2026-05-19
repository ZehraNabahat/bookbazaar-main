import Image from "next/image";
import Link from "next/link";
import SEOHead from "@/components/SEOHead";
import { notFound } from "next/navigation";
import AddToCartSection from "@/components/AddToCartSection";
import ProductViewTracker from "@/components/ProductViewTracker";
import ProductReviews from "@/components/ProductReviews";

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductViewTracker productId={product._id} />
      <SEOHead 
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.description}
        keywords={product.seoKeywords}
        ogImage={product.ogImage || product.images?.[0]}
        structuredData={product.structuredData}
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
        <div className="flex flex-col md:flex-row">
          {/* Image Gallery */}
          <div className="md:w-1/2 p-8 bg-gray-50 flex items-center justify-center border-r border-gray-200">
            <div className="relative w-full aspect-square max-w-md bg-white rounded-lg overflow-hidden shadow-sm">
              <Image 
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'} 
                alt={product.name}
                fill
                className="object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
            <nav className="text-sm text-gray-500 mb-4 flex gap-2">
              <Link href="/" className="hover:text-teal-600">Home</Link>
              <span>/</span>
              <Link href={`/category/${product.category?.toLowerCase()}`} className="hover:text-teal-600">{product.category}</Link>
              <span>/</span>
              <span className="text-gray-900">{product.brand}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center text-amber-400 text-sm">
                {'★'.repeat(Math.floor(product.ratings || 0))}
                <span className="text-gray-400 ml-1">({product.numReviews || 0} reviews)</span>
              </div>
              <span className={product.stock > 0 ? 'badge-success' : 'badge-warning'}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="mb-6 flex items-end gap-3">
              <span className="text-4xl font-bold text-navy-900">Rs. {product.price?.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-xl text-gray-400 line-through mb-1">Rs. {product.compareAtPrice?.toFixed(2)}</span>
              )}
            </div>

            <div className="prose prose-sm text-gray-600 mb-6 max-w-none">
              <p>{product.description}</p>
            </div>

            {product.seller && (
              <div className="mb-6">
                <Link href={`/chat/${product.seller}`} className="btn-outline flex items-center justify-center gap-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white py-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Chat with Seller
                </Link>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-gray-100">
              <AddToCartSection product={product} />
            </div>
          </div>
        </div>
      </div>

      <ProductReviews
        productId={product._id}
        productName={product.name}
        productSlug={product.slug}
      />
    </>
  );
}
