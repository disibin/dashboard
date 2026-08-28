'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  const primaryImage =
    product?.images?.find((img) => img.is_primary)?.image ||
    product?.images?.[0]?.image;

  const priceObj = product?.prices || {};
  const price = Number(product?.price ?? priceObj.price) || 0;
  const discount = Number(product?.discount ?? priceObj.discount) || 0;
  const setupFee = Number(product?.setup_fee ?? priceObj.setup_fee) || 0;

  const finalPrice = Math.max(0, price - discount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Link
        href={`/products/${product?.slug}`}
        className="group flex flex-col w-full gap-3 overflow-hidden shadow-md hover:-translate-y-1 transition-all duration-300 h-full"
      >
        <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product?.name || 'Product'}
              width={500}
              height={500}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-poppins">
              No preview image
            </div>
          )}

          {product?.is_featured && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs font-poppins">
              Featured
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col justify-between grow gap-3">
          <h2 className="font-semibold text-slate-900 group-hover:text-primary transition-colors font-poppins line-clamp-2 text-base">
            {product?.name}
          </h2>

        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;

