'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiChevronLeft, FiChevronRight, FiPlay, FiVideo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// Helper to extract YouTube Video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/api/public/product');
      if (res.data.success && Array.isArray(res.data.data)) {
        const extractedVideos = [];
        res.data.data.forEach((product) => {
          if (Array.isArray(product.videos) && product.videos.length > 0) {
            product.videos.forEach((vid) => {
              const videoUrl = typeof vid === 'string' ? vid : vid.url;
              const youtubeId = getYouTubeId(videoUrl);
              if (youtubeId) {
                extractedVideos.push({
                  id: vid.id || Math.random(),
                  url: videoUrl,
                  youtubeId,
                  productName: product.name,
                  productSlug: product.slug,
                  thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
                  embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`
                });
              }
            });
          }
        });
        setVideos(extractedVideos);
      }
    } catch (err) {
      console.error('Failed to load videos', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (index) => {
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const nextVideo = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const prevVideo = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) => (prev - 1 + videos.length) % videos.length);
    }
  };

  return (
    <div className="min-h-screen pb-16 pt-24 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight font-poppins">
          Product Videos
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-poppins">
          Watch interactive video demonstrations and product showcases.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-video bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FiVideo size={24} />
          </div>
          <p className="text-slate-500 font-medium text-sm">No videos available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid, idx) => (
            <div
              key={vid.id || idx}
              onClick={() => openLightbox(idx)}
              className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={vid.thumbnail}
                  alt={vid.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
                    <FiPlay size={20} className="ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 flex items-center justify-between border-t border-slate-100">
                <span className="font-poppins font-semibold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">
                  {vid.productName}
                </span>
                <Link
                  href={`/products/${vid.productSlug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] font-semibold text-primary hover:underline shrink-0 font-poppins"
                >
                  View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Video Player Modal */}
      <AnimatePresence>
        {activeLightboxIndex !== null && videos[activeLightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer z-50"
              aria-label="Close video"
            >
              <FiX size={24} />
            </button>

            {/* Prev Button */}
            {videos.length > 1 && (
              <button
                onClick={prevVideo}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer z-50"
                aria-label="Previous video"
              >
                <FiChevronLeft size={24} />
              </button>
            )}

            {/* Next Button */}
            {videos.length > 1 && (
              <button
                onClick={nextVideo}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer z-50"
                aria-label="Next video"
              >
                <FiChevronRight size={24} />
              </button>
            )}

            {/* Main Video Embed */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-4xl space-y-4"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                <iframe
                  src={videos[activeLightboxIndex].embedUrl}
                  title={videos[activeLightboxIndex].productName}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-between text-white px-2">
                <h3 className="text-lg font-semibold font-poppins">
                  {videos[activeLightboxIndex].productName}
                </h3>
                <Link
                  href={`/products/${videos[activeLightboxIndex].productSlug}`}
                  className="text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors font-poppins"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
