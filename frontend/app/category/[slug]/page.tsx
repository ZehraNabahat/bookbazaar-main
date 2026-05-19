import Link from "next/link";
import SEOHead from "@/components/SEOHead";
import { categoryLabelFromSlug, TEXTBOOK_SUBCATEGORIES } from "@/lib/catalog";

async function getCategoryProducts(category: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products?category=${encodeURIComponent(category)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    return [];
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryTitle =
    categoryLabelFromSlug(params.slug) ||
    params.slug.charAt(0).toUpperCase() + params.slug.slice(1).replace('-', ' ');
  const products = await getCategoryProducts(categoryTitle);
  const isTextbooks = params.slug.toLowerCase() === 'textbooks';

  return (
    <div className="container mx-auto px-4 mt-8">
      <SEOHead 
        title={`${categoryTitle} Books | BookBazaar`}
        description={`Browse our collection of ${categoryTitle} books.`}
      />
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <nav className="text-sm text-gray-500 mb-2 flex gap-2">
            <Link href="/" className="hover:text-teal-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{categoryTitle}</span>
          </nav>
          <h1 className="text-3xl font-bold text-navy-900">{categoryTitle} Books</h1>
        </div>
        <p className="text-gray-600 font-medium">{products.length} Results</p>
      </div>

      {isTextbooks && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-navy-900 mb-3">Browse by level</h2>
          <div className="flex flex-wrap gap-2">
            {TEXTBOOK_SUBCATEGORIES.map((sub) => (
              <Link
                key={sub.slug}
                href={`/category/textbooks/${sub.slug}`}
                className="px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {products.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            No books found in this category. 
            <div className="mt-4">
              <Link href="/sell" className="btn-primary">Be the first to list one!</Link>
            </div>
          </div>
        ) : products.map((product: any) => (
          <Link href={`/products/${product.slug}`} key={product._id} className="card group flex flex-col hover:shadow-lg transition-shadow">
            <div className="h-64 bg-gray-100 relative overflow-hidden flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url('${product.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}')` }}
              />
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <p className="text-xs text-gray-500 mb-1">{product.category}</p>
              <h3 className="font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
              
              <div className="mt-auto flex justify-between items-center">
                <span className="font-bold text-lg text-navy-900">Rs. {product.price.toFixed(2)}</span>
                <span className="text-sm font-medium text-teal-600 hover:underline">
                  View Details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
