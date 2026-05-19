
import Link from "next/link";
import SEOHead from "@/components/SEOHead";

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <SEOHead 
        title="Welcome to BookBazaar | Student Book Exchange"
        description="Buy and sell your used textbooks and fiction books easily."
        keywords={['books', 'used textbooks', 'book marketplace', 'student books']}
        ogTitle="BookBazaar - The Future of Book Shopping"
        ogDescription="Experience personalized book recommendations and lightning-fast search."
      />
      
      {/* Hero Section */}
      <section className="bg-navy-800 text-white rounded-2xl overflow-hidden mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 to-transparent z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="relative z-20 p-12 md:p-24 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Buy & Sell Books With Ease.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            List your old textbooks or find a great deal on your next favorite novel. BookBazaar is your campus marketplace.
          </p>
          <div className="flex gap-4">
            <Link href="/products" className="btn-secondary text-lg">
              Shop Books
            </Link>
            <Link href="/sell" className="btn-outline border-white text-white hover:bg-white hover:text-navy-900 text-lg">
              Sell a Book
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-navy-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Textbooks', 'Fiction', 'Non-Fiction', 'Science'].map((cat) => (
            <Link href={`/category/${cat.toLowerCase()}`} key={cat} className="card group relative overflow-hidden h-40">
              <div className="absolute inset-0 bg-teal-800 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white font-bold text-xl">{cat}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-navy-900">Trending Books</h2>
          <Link href="/products" className="text-teal-600 font-medium hover:underline">View all</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No books listed yet. Be the first to <Link href="/sell" className="text-teal-600 underline">sell a book</Link>!
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
      </section>
    </>
  );
}
