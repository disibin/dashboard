'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '@/component/public/card/ProductCard';
const ProductsPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/public/product');
        if (res.data.success) {
          setProducts(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 pb-16">
      <div className="w-full flex flex-col gap-10 ">
        <div className="text-center">
          <h1 className="text-3xl sm:text-5xl text-slate-900 font-semibold font-poppins">
            Our Premium Products
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-poppins">
            Choose the perfect solution for your business. Scalable, secure, and reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-3xl font-poppins">
            No products available at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;

