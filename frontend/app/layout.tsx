import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Link from "next/link";
import { FiShoppingCart, FiHeart, FiUser } from "react-icons/fi";
import AIChatWidget from "@/components/AIChatWidget";

import Header from "@/components/Header";
import { BOOK_CATEGORIES } from "@/lib/catalog";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "BookBazaar | AI E-Commerce Platform",
  description: "A state-of-the-art AI powered storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans flex flex-col min-h-screen bg-gray-50 text-gray-900`}>
        <Providers>
          <Header />

          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>

          <footer className="bg-navy-900 text-gray-300 py-12 mt-auto">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">BookBazaar</h3>
                <p className="text-sm">Your AI-powered shopping destination. Smart, fast, and personalized.</p>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Shop</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/products" className="hover:text-teal-400">All Products</Link></li>
                  {BOOK_CATEGORIES.map((cat) => (
                    <li key={cat.slug}>
                      <Link href={`/category/${cat.slug}`} className="hover:text-teal-400">
                        {cat.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Customer Service</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/contact" className="hover:text-teal-400">Contact Us</Link></li>
                  <li><Link href="/faq" className="hover:text-teal-400">FAQ</Link></li>
                  <li><Link href="/returns" className="hover:text-teal-400">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Newsletter</h4>
                <div className="flex">
                  <input type="email" placeholder="Your email" className="px-3 py-2 text-gray-900 rounded-l w-full text-sm outline-none" />
                  <button className="bg-teal-500 text-navy-900 px-3 py-2 rounded-r text-sm font-bold">Subscribe</button>
                </div>
              </div>
            </div>
          </footer>
          
          <AIChatWidget />
        </Providers>
      </body>
    </html>
  );
}
