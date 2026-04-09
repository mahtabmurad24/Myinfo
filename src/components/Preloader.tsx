import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

interface PreloaderProps {
  key?: string;
  logoUrl?: string;
}

export default function Preloader({ logoUrl }: PreloaderProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
    >
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-t-2 border-b-2 border-blue-500 rounded-full flex items-center justify-center"
        />
        
        {/* Inner pulsing glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-blue-500 rounded-full blur-2xl"
        />

        {/* Logo/Icon in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-16 h-16 rounded-2xl object-cover shadow-2xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white text-3xl font-black">M</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 flex flex-col items-center"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-black font-display tracking-tighter text-white">
            MyInfo<span className="text-blue-500">Pro</span>
          </h1>
        </div>
        <div className="h-1 w-12 bg-blue-500 rounded-full mt-4 overflow-hidden">
          <motion.div 
            animate={{ x: [-48, 48] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-full bg-white"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
