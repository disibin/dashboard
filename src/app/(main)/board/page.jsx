'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Image from 'next/image';

const TeamPage = () => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get('/api/public/board');
        if (res.data.success) {
          setMembers(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch board members', err);
      }
    };
    fetchMembers();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  return (
    <div className="w-full relative overflow-hidden pb-10 pt-24 min-h-screen flex flex-col items-center">
    
      <div className="flex flex-col items-center justify-center  px-4 text-center mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-5xl font-semibold mb-4 text-slate-900 tracking-tight">
          Meet Our <span className="text-primary font-semibold">Board & Executive Team</span>
        </h1>
        <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-poppins ">
          A collective of specialized systems architects, advisors, and executive leaders committed to building high-performance systems and digital experiences.
        </p>
      </div>

      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        { members.length === 0 ? (
          <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-200/80 max-w-xl mx-auto flex flex-col items-center gap-4 px-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FiUser className="text-primary" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 font-poppins">No Board Members Added Yet</h3>
            <p className="text-slate-500 text-sm">
              Our board member profiles are currently being updated. Please check back later.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 relative"
          >
            {members.map((m) => (
              <motion.div
                key={m.id || m.member_id}
                variants={cardVariants}
                className="flex flex-col justify-start text-left group w-full gap-3 relative overflow-hidden bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all"
              >
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
                  {m.image ? (
                    <Image
                      width={500}
                      height={500}
                      src={m.image}
                      alt={m.name}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-4xl select-none font-poppins">
                      {m.name?.charAt(0) || 'B'}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-slate-900 text-base">{m.name}</p>
                  <p className="text-xs font-semibold text-primary">{m.post}</p>
                  {m.bio && (
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed line-clamp-3 font-poppins" title={m.bio}>
                      {m.bio}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;

