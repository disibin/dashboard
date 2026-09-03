'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiBox, FiBriefcase } from 'react-icons/fi';

const ProjectCard = ({ project, index = 0, onOpenDiscussion }) => {
  const imageSrc = project?.image || project?.thumbnail;
  const formattedNumber = String(index + 1).padStart(2, '0');

  const getExcerpt = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/<[^>]+>/g, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="group flex flex-col justify-between bg-white rounded-xl overflow-hidden box-border h-full border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative">
        <div className="flex flex-col grow">
          <div className="p-3 flex flex-col gap-3 grow">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-500 m-0">
                {formattedNumber}
              </p>

              <div className="flex items-center gap-1.5">
                {project?.project_type && (
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    project.project_type === 'package' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                  }`}>
                    {project.project_type === 'package' ? <FiBox className="inline mr-1" /> : <FiBriefcase className="inline mr-1" />}
                    {project.project_type}
                  </span>
                )}
                {project?.project_status && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {project.project_status}
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors m-0 font-poppins line-clamp-2">
              {project?.project_title || 'Client Project'}
            </h3>

            <p className="text-sm leading-normal text-gray-700 m-0 font-poppins line-clamp-3">
              {getExcerpt(project?.description)}
            </p>
          </div>

          <div className="relative w-full overflow-hidden px-4 flex items-end bg-emerald-50 aspect-video">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={project?.project_title || 'Project Image'}
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
        </div>

        <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-900">${project?.net_price || 0}</span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Payment: {project?.payment_status || 'due'}
            </span>
          </div>

          {onOpenDiscussion && (
            <button
              type="button"
              onClick={() => onOpenDiscussion(project)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
            >
              <FiMessageSquare size={14} /> Project Chat
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
