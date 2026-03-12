const { motion, AnimatePresence } = await import("framer-motion");
import { Loader2 } from "lucide-react";

export default function ProcessingOverlay({
  isProcessing,
  progress = 0,
  title = "Processing",
  description,
  message = "Please don't close this window",
  showProgress = true
}) {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-[4px] flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-linear-120 from-sky-800 to-blue-950 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-4"
          >
            <div className="text-center mb-4 sm:mb-6">
              <div className="relative inline-block mb-3 sm:mb-4">
                <div className="absolute -inset-1 sm:-inset-2 bg-sky-500 rounded-full blur opacity-30"></div>
                <Loader2 strokeWidth={1.5} className="relative w-12 h-12 sm:w-16 sm:h-16 text-sky-300 animate-spin" />
              </div>
              <h3 className="text-xl sm:text-2xl text-white mb-1 sm:mb-2">
                {title}
              </h3>
              <p className="text-white text-md sm:text-lg font-light">
                {description}
              </p>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between text-xs sm:text-sm font-light text-gray-100 mb-1.5 sm:mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-blue-950 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sky-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <p className="text-center text-xs sm:text-sm text-gray-100 font-light">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}