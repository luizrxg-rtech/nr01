'use client';

import {motion} from "framer-motion";

export default function LoadingScreen() {

  return (
    <div className="min-h-screen absolute right-0 top-0 w-full h-full flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-8 border-brand-blue border-t-white rounded-full mx-auto"
        />
        <p className="text-gray-600 font-bold mt-2">Carregando...</p>
      </motion.div>
    </div>
  )
}