'use client'
import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'

const Identity = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <div className="w-full p-4 md:p-20 flex flex-col items-center justify-center gap-4 bg-tertiary-light overflow-hidden">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        className="w-full max-w-xs flex justify-center items-center"
      >
        <Image
          width={1000}
          height={1000}
          src="/icon.png"
          alt="disibin logo"
          className="w-full scale-200 aspect-square object-contain"
        />
      </motion.div>
    </div>
  )
}

export default Identity

