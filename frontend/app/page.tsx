"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import ProductCard from "./components/ProductCard";

type Product = {
  _id: string;
  name: string;
  descp: string;
  price: number;
  image_name: string;
};

const HomePage: React.FC = () => {
  // const [products, setProducts] = useState<Product[]>([]);
  // const [loading, setLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const S3_BASE = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";
  const { data, error, loading }: any = useFetch(`${API_BASE}/get-data`);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Ecom S3</h1>
            <p className="text-sm text-gray-600">
              Lightweight demo storefront — upload and list products
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Add Product
            </Link>
          </div>
        </header>

        {loading && <div className="text-gray-600">Loading products...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {!loading &&
            data?.data?.map((p: Product) => (
              <ProductCard key={p._id} product={p} s3Base={S3_BASE} />
            ))}
        </div>
      </div>
    </main>
  );
};

export default HomePage;
