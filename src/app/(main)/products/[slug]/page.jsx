'use client';

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiCheck,
  FiExternalLink,
  FiMessageSquare,
  FiMaximize2,
  FiX,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
  FiVideo
} from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Context } from '@/component/helper/Context';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;

  const { userData, isLoggedIn } = useContext(Context);

  const [product, setProduct] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        const res = await axios.get(`/api/public/product/${slug}`);
        if (res.data.success) {
          setProduct(res.data.data);
        } else {
          toast.error("Product not found");
          router.push('/products');
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
        router.push('/products');
      }
    };
    fetchProduct();
  }, [slug, router]);

  if (!product) return null;

  const images = product.images || [];
  const primaryImageObj = images.find((img) => img.is_primary) || images[0] || null;
  const primaryImage = primaryImageObj?.image || null;

  const pricesObj = product.prices || {};
  const originalPrice = Number(product.price ?? pricesObj.price) || 0;
  const discountAmount = Number(product.discount ?? pricesObj.discount) || 0;
  const setupFee = Number(product.setup_fee ?? pricesObj.setup_fee) || 0;
  const serviceCharge = Number(product.service_charge ?? pricesObj.service_charge) || 0;

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return (
    <div className="min-h-screen w-full bg-slate-50/30 relative p-4 sm:p-6 md:p-8">
      <Toaster position="top-center" />

      <div className="w-full space-y-6">
        
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-semibold text-xs transition-all group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Back to Products
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 text-xs font-medium truncate max-w-xs">{product.name}</span>
        </div>

        <div className="flex flex-col gap-8 w-full ">
          
          <div className="relative aspect-video w-full  overflow-hidden  shadow-inner group flex items-center justify-center">
            {primaryImage ? (
              <>
                <Image
                  width={1400}
                  height={900}
                  src={primaryImage}
                  alt={primaryImageObj?.title || product.name}
                  className="w-full h-full object-cover transition-all duration-500"
                  priority
                />
                
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 gap-2 py-20">
                <FiLayers size={48} />
                <span className="text-sm font-semibold">No Image Preview Available</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {product.is_featured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider">
                <FiTag size={13} /> Featured Product
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight font-poppins">
              {product.name}
            </h1>
          </div>



          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {product.demo_url && (
              <a
                href={product.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-xs group"
              >
                <FiExternalLink className="group-hover:scale-105 transition-transform" size={16} />
                Launch Live Demo
              </a>
            )}
            <Link
              href={"/user/tickets"}
              className="w-full sm:w-auto px-6 py-3 bg-secondary text-white font-semibold text-xs rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <FiMessageSquare size={16} />
              {"Request Custom Implementation"}
            </Link>
          </div>

  

          {/* 6. Description */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 font-poppins">Product Overview</h2>
            {product.description ? (
              <div
                className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-poppins"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-slate-400 text-sm font-poppins">No description provided for this product.</p>
            )}
          </div>

          {/* 7. Features */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 font-poppins">Key Features &amp; Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <FiCheck size={14} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs font-poppins">{feat.name}</h4>
                      {feat.description && (
                        <p className="text-slate-500 text-[11px] mt-0.5 font-poppins leading-relaxed">{feat.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Other Images */}
          {images.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 font-poppins">Product Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="relative aspect-video rounded-xl overflow-hidden border border-slate-200/80 cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                  >
                    <Image
                      src={img.image}
                      alt={img.title || `${product.name} image ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Videos */}
          {product.videos && product.videos.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <FiVideo className="text-red-600" size={20} />
                <h2 className="text-xl font-semibold text-slate-900 font-poppins">Product Videos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.videos.map((vid, idx) => {
                  const videoUrl = typeof vid === 'string' ? vid : vid.url;
                  const youtubeId = getYouTubeId(videoUrl);
                  if (!youtubeId) return null;
                  return (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                        title={`${product.name} video ${idx + 1}`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && images[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8"
          >
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxOpen(false)} />

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-5xl w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center z-10"
            >
              <Image
                width={1600}
                height={1000}
                src={images[lightboxIndex].image}
                alt={`${product.name} preview ${lightboxIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10 cursor-pointer"
                    aria-label="Next image"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </>
              )}

              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10 cursor-pointer"
                aria-label="Close preview"
              >
                <FiX size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
