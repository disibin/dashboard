'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiGlobe, FiExternalLink } from 'react-icons/fi';

const BlogCard = ({ blog, index = 0, isStaff = false, onEdit, onDelete }) => {
  const imageSrc = blog?.image;
  const targetLink = blog?.slug ? `/user/blogs/${blog.slug}` : '#';
  const formattedNumber = String(index + 1).padStart(2, '0');

  const getExcerpt = (htmlString) => {
    if (!htmlString) return '';
    const cleanText = htmlString.replace(/<[^>]+>/g, '');
    return cleanText;
  };

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
          href={targetLink}
          className="flex flex-col no-underline grow"
        >
          <div className="p-3 flex flex-col gap-4 grow">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-500 m-0">
                {formattedNumber}
              </p>
              {blog?.tenant_name && (
                <span className="text-xs text-slate-400 group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
                  <FiGlobe size={12} /> {blog.tenant_name}
                </span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors m-0 font-poppins line-clamp-2">
              {blog?.title}
            </h3>

            <p className="text-[16px] leading-normal text-gray-900 m-0 font-poppins line-clamp-3">
              {getExcerpt(blog?.description)}
            </p>
          </div>

          <div className="relative w-full overflow-hidden px-4 flex items-end bg-emerald-50 aspect-video">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={blog?.title || 'Blog Image'}
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

        {isStaff && (onEdit || onDelete) && (
          <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
            <Link
              href={`/user/blogs/${blog.slug}`}
              target="_blank"
              className="p-2 text-slate-600 hover:text-primary rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <FiExternalLink size={14} /> Preview
            </Link>

            <div className="flex items-center gap-1">
              {onEdit && (
                <Link
                  href={`/panel/blogs/${blog.id}`}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FiEdit2 size={14} /> Edit
                </Link>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(blog.id, blog.title);
                  }}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FiTrash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BlogCard;
