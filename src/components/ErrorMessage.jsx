const { motion, AnimatePresence } = await import("framer-motion");
import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ message, title = "Error" }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-900/20 border border-red-700/50 rounded-lg"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-300 mb-0.5 sm:mb-1 text-sm sm:text-base">{title}</p>
              <p className="text-red-400 text-xs sm:text-sm">{message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}