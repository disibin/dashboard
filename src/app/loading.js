'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * Global Loading Component & Next.js App Router fallback.
 * Located in `src/app/loading.js`
 *
 * @param {Object} props
 * @param {boolean} [props.fullScreen=false] - Fullscreen backdrop overlay if true, section/container bounded if false
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Size variant of the loader logo
 * @param {boolean} [props.blur=true] - Apply backdrop blur in fullscreen mode
 * @param {string} [props.className=''] - Extra container classes
 * @param {string} [props.iconSrc='/icon.png'] - Public icon path (default: /icon.png)
 */
export default function Loading({
  fullScreen = true,
  size = 'md',
  blur = true,
  className = '',
  iconSrc = '/icon.png',
} = {}) {
  const sizeMap = {
    sm: { container: 'w-10 h-10', icon: 28, ring: 'w-14 h-14' },
    md: { container: 'w-20 h-20', icon: 56, ring: 'w-28 h-28' },
    lg: { container: 'w-28 h-28', icon: 80, ring: 'w-36 h-36' },
    xl: { container: 'w-36 h-36', icon: 112, ring: 'w-48 h-48' },
  }

  const selectedSize = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`flex flex-col items-center justify-center ${className} `}>
      <div className="relative flex items-center justify-center">
        <motion.div
          className={`absolute rounded-full border-2 border-transparent border-t-teal-600 border-r-teal-400 ${selectedSize.ring}`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div
          className={`absolute rounded-full border border-teal-600/20 ${selectedSize.ring}`}
        />

        <motion.div
          className={`relative z-10 flex items-center justify-center p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 ${selectedSize.container}`}
          animate={{
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Image
            src={iconSrc}
            alt="Loading..."
            width={selectedSize.icon}
            height={selectedSize.icon}
            priority
            className="object-contain"
          />
        </motion.div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/40 ${
          blur ? 'backdrop-blur-md' : ''
        }`}
      >
        {content}
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center w-full">
      {content}
    </div>
  )
}

export { Loading }
