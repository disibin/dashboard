'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiGlobe } from 'react-icons/fi';

export default function UserProductCard({ product, index = 0 }) {
  const imageSrc = product?.image;
  const formattedNumber = String(index + 1).padStart(2, '0');
  const targetHref = `/user/products/${product.slug || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="group flex flex-col justify-between bg-white overflow-hidden box-border h-full border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative">
        <Link
          href={targetHref}
          className="flex flex-col no-underline grow"
        >
          <div className="p-3 flex flex-col gap-4 grow">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-500 m-0">
                {formattedNumber}
              </p>
              {product?.link && (
                <span className="text-xs text-slate-400 group-hover:text-primary transition-colors flex items-center gap-1">
                  <FiGlobe size={13} /> Live Demo
                </span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors m-0 font-poppins">
              {product?.name}
            </h3>

            <p className="text-[16px] leading-normal text-gray-900 m-0 font-poppins line-clamp-3">
              {product?.title}
            </p>
          </div>

          <div className="relative w-full overflow-hidden px-4 flex items-end bg-emerald-50 aspect-video">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product?.name || 'Product Image'}
                width={600}
                height={350}
                className="w-full aspect-video h-auto block will-change-[transform,border-color] transition-[transform,border-color] duration-500 ease-[cubic-bezier(0,0,0,0.98)] object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-48 bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-poppins border border-[#360065]/13">
                No preview image
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
