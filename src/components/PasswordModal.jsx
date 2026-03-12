import { useId } from "react";
const { motion, AnimatePresence } = await import("framer-motion");
import { Lock, AlertCircle, X } from "lucide-react";

export default function PasswordModal({
  showPasswordModal,
  currentEncryptedFile,
  modalPasswordRef,
  modalPassword,
  setModalPassword,
  handleSubmit,
  handleCancel,
  error,
  setError
}) {
  const id = useId();

  return (
    <AnimatePresence>
      {showPasswordModal && currentEncryptedFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-[4px] border-sky-700 hover:border-sky-500/60 flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-linear-120 from-sky-800 to-blue-950 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full mx-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-yellow-900/30 rounded-lg">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl text-white">Password Required</h3>
                  <p className="text-gray-100 text-xs sm:text-sm font-light">This PDF file is encrypted</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="text-white hover:text-red-400 absolute top-0 right-0 cursor-pointer"
              >
                <X size={25} />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-gray-100 mb-3 sm:mb-4 text-xs sm:text-sm">
                The PDF file <span className="text-white font-semibold text-sm sm:text-md truncate line-clamp-1">"{currentEncryptedFile.file.name}"</span> is encrypted. Please enter the password to continue.
              </p>

              <div className="space-y-2 sm:space-y-3">
                <div className="relative">
                  <input
                    id={id}
                    ref={modalPasswordRef}
                    type="password"
                    value={modalPassword}
                    onChange={(e) => {
                      setModalPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter PDF password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-950 border border-sky-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent text-white text-sm sm:text-base placeholder:text-gray-100 placeholder:font-light cursor-text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-red-400">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-800/80 hover:bg-red-800/70 text-white rounded-lg transition-colors font-semibold text-md sm:text-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-400 hover:bg-sky-400/90 text-white rounded-lg transition-all font-semibold text-md sm:text-lg cursor-pointer"
              >
                Unlock PDF
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}