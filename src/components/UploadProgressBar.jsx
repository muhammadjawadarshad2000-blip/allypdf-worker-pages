const { motion } = await import("framer-motion");

export default function UploadProgressBar({
  uploadProgress,
}) {
  return (
    <div className="h-1.5 overflow-hidden">
      {uploadProgress !== 0 &&
        <motion.div
          className="h-full bg-sky-400"
          initial={{ width: 0 }}
          animate={{ width: `${uploadProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      }
    </div>
  );
}