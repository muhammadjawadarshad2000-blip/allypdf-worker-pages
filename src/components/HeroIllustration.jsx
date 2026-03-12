import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Sparkles,
  Edit
} from "lucide-react";
import { MergePDFIcon, ProtectPDFIcon, CropImageIcon, RotatePDFIcon, ResizeImageIcon } from "./ToolIcons";

export default function HeroIllustration() {
  // Float animation for the orbiting nodes
  const float = (delay = 0, duration = 4, yOffset = 15) => ({
    y: [0, -yOffset, 0],
    transition: {
      duration: duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay,
    },
  });

  // Data flow particles moving toward the center
  const flowToCenter = (delay = 0, xStart, yStart) => ({
    x: [xStart, 0],
    y: [yStart, 0],
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.5],
    transition: { duration: 2, repeat: Infinity, delay: delay, ease: "easeIn" }
  });

  return (
    <div className="relative w-full max-w-[550px] lg:max-w-[640px] mx-auto aspect-square md:aspect-[4/3] hidden sm:flex items-center justify-center overflow-visible pointer-events-none select-none">

      {/* 1. Deep Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)]" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-[80px]"
      />

      {/* 2. Central Processing Core (PDF & Image working together) */}
      <motion.div
        animate={float(0, 6, 10)}
        className="relative z-20 flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white/5 backdrop-blur-xl opacity-90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.2)]"
      >
        {/* Inner rotating dash ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-dashed border-teal-400/30"
        />

        {/* Overlapping Central Icons */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center shadow-lg border border-white/20 -rotate-10 backdrop-blur-md">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[1.5]" />
          </div>
          <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-xl border border-white/20 rotate-10 backdrop-blur-md">
            <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[1.5]" />
          </div>
        </div>

        {/* Processing Sparkle */}
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center border-4 border-[#091d33] shadow-lg">
          <Sparkles className="w-4 h-4 text-[#091d33]" />
        </div>
      </motion.div>

      {/* 3. Orbiting Action Nodes (Representing the 20 Tools) */}

      {/* Node 1: Split / Extract / Delete (Scissors) */}
      <motion.div animate={float(0.5, 4, 15)} className="absolute top-[10%] left-[15%] z-30 flex flex-col items-center gap-2">
        <ResizeImageIcon />
      </motion.div>

      {/* Node 2: Convert / Transform (Refresh) */}
      <motion.div animate={float(1, 5, -12)} className="absolute top-[12%] right-[15%] z-10 flex flex-col items-center gap-2">
        <RotatePDFIcon />
      </motion.div>

      {/* Node 3: Protect / Unlock (Shield) */}
      <motion.div animate={float(1.5, 4.5, 10)} className="absolute top-[45%] left-[5%] z-30 flex flex-col items-center gap-2">
        <ProtectPDFIcon />
      </motion.div>

      {/* Node 4: Resize / Compress / Crop (Crop) */}
      <motion.div animate={float(2, 5.5, -15)} className="absolute top-[40%] right-[5%] z-10 flex flex-col items-center gap-2">
        <CropImageIcon />
      </motion.div>

      {/* Node 5: Merge / Rearrange (Layers) */}
      <motion.div animate={float(0.8, 4.2, 12)} className="absolute bottom-[15%] left-[20%] z-30 flex flex-col items-center gap-2">
        <MergePDFIcon />
      </motion.div>

      {/* Node 6: HTML / Web Tools (Code) */}
      <motion.div animate={float(2.2, 4.8, -10)} className="absolute bottom-[10%] right-[20%] z-10 flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(71,85,105,0.3)] border border-slate-500/50">
          <Edit className="w-6 h-6 text-white stroke-[1.5]" />
        </div>
      </motion.div>

      {/* 4. Data Streams (Connecting the tools to the core) */}
      <div className="absolute inset-0 z-30">
        <motion.div animate={flowToCenter(0, -100, -100)} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]" />
        <motion.div animate={flowToCenter(1, 100, -80)} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
        <motion.div animate={flowToCenter(0.5, -120, 0)} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <motion.div animate={flowToCenter(1.5, 120, 0)} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
        <motion.div animate={flowToCenter(0.8, -80, 100)} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
        <motion.div animate={flowToCenter(1.2, 80, 100)} className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_8px_#94a3b8]" />
      </div>

    </div>
  );
}