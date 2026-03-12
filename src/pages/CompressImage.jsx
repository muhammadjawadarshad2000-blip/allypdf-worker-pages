import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Image,
  Shield,
  Gift,
  Zap,
  Settings,
  Minimize2 as Compress,
} from "lucide-react";
import fileApi from "../api/fileApi";
import { downloadImage, getFileSize, generateImagePreview, validateImageForCompression } from "../utils/pdfProcessor";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton, ChangeButton, RemoveButton, SelectButton, XDeleteButton } from "../components/Buttons";
import toolCTA from "/tools-cta/compress-image.png";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";

export default function CompressImage() {
  const [files, setFiles] = useState([]);
  const [compressedFiles, setCompressedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(80);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isCompressLimitReached = useSelector(isUsageLimitReached("compressImage"));

  const generateFileId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getTotalFileSize = () => files.reduce((total, file) => total + file.fileSize, 0);

  const getCompressionSavings = () => {
    if (compressedFiles.length === 0) return { saved: 0, percentage: 0, originalTotal: 0, compressedTotal: 0 };
    const originalTotal = compressedFiles.reduce((t, f) => t + f.originalSize, 0);
    const compressedTotal = compressedFiles.reduce((t, f) => t + f.compressedSize, 0);
    const saved = originalTotal - compressedTotal;
    const percentage = originalTotal > 0 ? ((saved / originalTotal) * 100).toFixed(1) : 0;
    return { saved, percentage, originalTotal, compressedTotal };
  };

  const cleanupAllFiles = () => {
    files.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    compressedFiles.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setCompressedFiles([]);
    setUploadProgress(0);
    setConversionProgress(0);
    setError("");
  };

  const cleanupFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputKey.current = Date.now();
  };

  // Updated drag and drop handlers to match MergePDF
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isCompressLimitReached) {
        setDragActive(true);
      }
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    // Ignore drops coming from internal drag (if any)
    try {
      const internal = dt.getData('application/x-merge-internal');
      if (internal === '1') {
        return;
      }
    } catch {
      // ignore
    }

    if (isCompressLimitReached) {
      setError("Daily image compression limit reached. Please log in for unlimited usage.");
      return;
    }

    const hasFiles =
      (dt.files && dt.files.length > 0) ||
      (dt.items && Array.from(dt.items).some(item => item.kind === 'file'));

    if (!hasFiles) {
      // likely text/HTML drop – ignore
      return;
    }

    const dtFiles = dt.files;
    if (dtFiles && dtFiles.length > 0) {
      handleFilesProcessing(Array.from(dtFiles));
    }
  };

  const handleFilesProcessing = async (newFiles) => {
    const validFiles = [];
    const errors = [];

    for (const file of newFiles) {
      const err = validateImageForCompression(file);
      if (err) errors.push(`${file.name}: ${err}`);
      else validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
      if (validFiles.length === 0) return;
    }

    setError("");
    setUploadProgress(10);
    setCompressedFiles([]);

    const processedFiles = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const progress = Math.floor(((i + 1) * 90) / validFiles.length);
      setUploadProgress(10 + progress);

      try {
        const previewData = await generateImagePreview(file);
        const fileId = generateFileId();
        processedFiles.push({ id: fileId, file, ...previewData });
      } catch (err) {
        errors.push(`Failed to process ${file.name}: ${err.message}`);
      }
    }

    if (errors.length > 0) setError(errors.join("\n"));

    if (processedFiles.length > 0) {
      setFiles(prev => [...prev, ...processedFiles]);
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (isCompressLimitReached) {
      setError("Daily image compression limit reached. Please log in for unlimited usage.");
      resetFileInput();
      return;
    }

    handleFilesProcessing(selectedFiles);
    resetFileInput();
  };

  const handleCompress = async () => {
    window.scrollTo(0, 0);
    if (files.length === 0) return;

    if (isCompressLimitReached) {
      setError("Daily image compression limit reached. Please log in for unlimited usage.");
      return;
    }

    setIsProcessing(true);
    setConversionProgress(0);
    setError("");

    try {
      const formData = new FormData();
      files.forEach(fileData => formData.append("images", fileData.file));
      formData.append("quality", compressionLevel);

      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      const res = await fileApi.post("/images/compress-image", formData, { responseType: "blob" });

      clearInterval(progressInterval);
      setConversionProgress(100);

      const compressedBlob = res.data;
      const compressedResults = files.map(fileData => ({
        id: fileData.id,
        originalName: fileData.fileName,
        originalSize: fileData.fileSize,
        compressedSize: Math.round(compressedBlob.size / files.length),
        blob: compressedBlob,
        previewUrl: fileData.previewUrl,
        width: fileData.width,
        height: fileData.height,
      }));

      if (files.length === 1) {
        compressedResults[0].compressedSize = compressedBlob.size;
      }

      setCompressedFiles(compressedResults);
      dispatch(incrementUsage("compressImage"));

      const fileName =
        files.length === 1
          ? files[0].fileName.replace(/\.[^/.]+$/, "_compressed" + files[0].file.name.substring(files[0].file.name.lastIndexOf('.')))
          : "allypdf_compressed-images.zip";
      downloadImage(compressedBlob, fileName);

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Compression failed");
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (compressedFiles.length === 0) return;
    const file = compressedFiles[0];
    const fileName = files.length === 1
      ? files[0].fileName.replace(/\.[^/.]+$/, "_compressed" + files[0].file.name.substring(files[0].file.name.lastIndexOf('.')))
      : "allypdf_compressed-images.zip";
    downloadImage(file.blob, fileName);
  };

  const handleRemoveFile = (fileId) => cleanupFile(fileId);

  const handleStartOver = () => {
    cleanupAllFiles();
    resetFileInput();
  };

  const handleAddMoreFiles = () => {
    if (isCompressLimitReached) {
      setError("Daily image compression limit reached. Please log in for unlimited usage.");
      return;
    }
    fileInputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      files.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      compressedFiles.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
  }, [files, compressedFiles]);

  const faqItems = [
    {
      question: "What image formats can I compress?",
      answer: "You can compress JPEG, PNG, WebP, GIF, BMP, and TIFF files with our tool."
    },
    {
      question: "Will compression affect image quality?",
      answer: "Our tool uses advanced algorithms to reduce file size while maintaining the best possible quality based on your selected compression level."
    },
    {
      question: "Can I compress multiple images at once?",
      answer: "Yes! You can upload and compress multiple images in a single batch. They'll be downloaded as a ZIP file."
    },
    {
      question: "How much file size can I save?",
      answer: "Typically, you can save 50-80% of the original size depending on format, quality settings, and image content."
    },
    {
      question: "Is there a file size limitation?",
      answer: "No, there are no file size limitations. You can compress images of any size for free."
    },
  ];

  // Reasons for choosing our image compression tool
  const compressReasons = [
    {
      icon: Shield,
      title: "Ultra-Secure Processing",
      description: "Your images never leave your browser. All compression happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "Completely Free Forever",
      description: "No hidden fees, no subscriptions, no watermarks. Our image compressor is 100% free with no limitations. Use it as much as you want without ever paying.",
    },
    {
      icon: Settings,
      title: "Adjustable Compression",
      description: "Control the compression level with a simple slider. Balance between file size and image quality according to your specific needs.",
    },
    {
      icon: Zap,
      title: "Instant Browser-Based Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration, and no waiting times. Start compressing images in seconds.",
    },
    {
      icon: Compress,
      title: "Batch Processing",
      description: "Compress multiple images at once. Our tool supports batch processing, allowing you to reduce the file size of multiple images in one go.",
    },
    {
      icon: Image,
      title: "Wide Format Support",
      description: "Supports all major image formats including JPEG, PNG, WebP, and GIF. No need to convert images before compressing.",
    }
  ];

  const iconColorClasses = [
    "bg-sky-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-teal-500",
    "bg-purple-500"
  ];

  const savings = getCompressionSavings();

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area with Gradient Background */}
      <div
        ref={dropZoneRef}
        className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-gradient-to-r from-[#014b80] to-[#031f33]"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="max-w-7xl mx-auto">
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-[90px] w-full ad" />

          <div className={`${files.length === 0 && !compressedFiles.length ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${files.length === 0 && !compressedFiles.length ? "" : "hidden"}`}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-white pb-3 sm:pb-4 md:pb-5">
                Compress Images
              </h1>
              <p className="text-white font-light text-2xl md:text-3xl mx-auto px-2">
                Reduce image file size while maintaining quality
              </p>
            </motion.div>

            <input
              key={inputKey.current}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              multiple
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {files.length === 0 && !compressedFiles.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 sm:mb-6"
                >
                  <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                    <div className="w-full px-2 sm:px-0">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="text-center w-full">
                          <p className="text-gray-100 mb-3 sm:mb-4 text-center text-sm sm:text-base">
                            {isCompressLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your images here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isCompressLimitReached} fileInputRef={fileInputRef} title="Select Image files" />
                          </div>
                          <p className="text-xs sm:text-sm text-gray-100 text-center px-2">
                            JPEG, PNG, WebP, GIF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {dragActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-teal-500/20 rounded-xl pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Selected Images Card */}
              {files.length > 0 && !compressedFiles.length && (
                <div className="mb-4 sm:mb-6" >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Image className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Selected Images
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {files.length} file{files.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreFiles} title="Add More" />
                          <RemoveButton handleRemoveFile={handleStartOver} title="Clear All" />
                        </div>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    {/* Image Previews Grid */}
                    <div className="p-4 sm:p-6">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto place-content-center">
                        <AnimatePresence>
                          {files.map((file) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              whileHover={{ scale: 1.02 }}
                              className="relative bg-cyan-700 rounded-lg border border-sky-700 hover:border-sky-500/60 overflow-hidden max-w-60"
                            >
                              <XDeleteButton handleRemove={() => handleRemoveFile(file.id)} title="Remove Image" />

                              {/* Preview area */}
                              <div className="relative aspect-square bg-sky-900 flex items-center justify-center">
                                {file.previewUrl ? (
                                  <img
                                    src={file.previewUrl}
                                    alt={file.fileName}
                                    className="max-w-full max-h-full object-contain m-auto"
                                    style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    draggable={false}
                                    onDragStart={(e) => e.preventDefault()}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-500">
                                    <Image className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Preview</span>
                                  </div>
                                )}
                              </div>

                              {/* Card footer info */}
                              <div className="p-3 flex flex-col gap-1">
                                <p className="font-light text-white truncate text-sm">
                                  {file.fileName}
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[11px] px-1.5 py-0.5 bg-cyan-900 text-gray-100 font-light rounded">
                                      {file.width}×{file.height}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-light text-gray-100">
                                    {getFileSize(file.fileSize)}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compression Settings Section */}
              {files.length > 0 && !compressedFiles.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8"
                >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="text-white text-md sm:text-lg">
                          Compression Settings
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-white">
                              Quality Level
                            </label>
                            <span className="text-lg font-medium text-white">
                              {compressionLevel}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={compressionLevel}
                            onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
                          />
                          <div className="flex justify-between text-xs text-gray-100 mt-1">
                            <span>Smaller file</span>
                            <span>Higher quality</span>
                          </div>
                        </div>
                        <div className="bg-cyan-900/50 rounded-lg p-3 border border-cyan-700">
                          <p className="text-sm text-gray-200">
                            {compressionLevel < 50
                              ? "High compression - Significantly smaller files with some quality loss"
                              : compressionLevel < 80
                                ? "Balanced compression - Good balance between size and quality"
                                : "Low compression - Maximum quality with moderate size reduction"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Compression Results Section */}
              {compressedFiles.length > 0 && (
                <ResultSection
                  title="Compression Complete!"
                  subtitle={`• ${savings.percentage}% saved`}
                  onDownload={handleDownload}
                  downloadButtonText={files.length === 1 ? "Download" : "Download All"}
                  onStartOver={handleStartOver}
                  summaryTitle="Compression Summary"
                  summaryItems={[
                    {
                      value: getFileSize(savings.originalTotal),
                      label: "Original Size",
                      valueColor: "white"
                    },
                    {
                      value: getFileSize(savings.compressedTotal),
                      label: "Compressed Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: `${savings.percentage}%`,
                      label: "Reduction",
                      valueColor: "yellow-400"
                    },
                    {
                      value: getFileSize(savings.saved),
                      label: "Space Saved",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Compress Button */}
              {files.length > 0 && !compressedFiles.length && (
                <ActionButton
                  disabled={isProcessing || isCompressLimitReached || files.length === 0}
                  handleAction={handleCompress}
                  className={isProcessing || isCompressLimitReached || files.length === 0 ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Compressing..."
                  title={`Compress ${files.length === 1 ? "Image" : "Images"}`} />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title={`Compressing ${files.length} ${files.length === 1 ? "Image" : "Images"}`}
                description="Optimizing your images..."
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-[90px] w-full ad" />
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Compress Images Online Without Losing Quality"
        description="Reduce image file size for faster loading, easier sharing, and efficient storage. Our advanced compression algorithm maintains visual quality while significantly reducing file size. Perfect for websites, email attachments, social media, and saving storage space."
        imageUrl={toolCTA}
        imageAlt="Image compression illustration"
        title="Why choose our Image Compressor"
        subtitle="Experience the best Image Compressor with our feature-rich, user-friendly tool designed for both professionals and casual users."
        reasons={compressReasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-[1100px] lg:h-[650px] flex items-center justify-center">
        <HowToSection
          title="How To Compress Images Online for Free"
          stepOne="Upload Images"
          stepOneDes="Select or drag and drop your image files"
          stepTwo="Set Compression Level"
          stepTwoDes="Adjust the quality slider to balance size and quality"
          stepThree="Compress Images"
          stepThreeDes="Click compress to optimize your images"
          stepFour="Download Results"
          stepFourDes="Get your compressed images instantly"
        />
      </div>

      {/* FAQ Section */}
      <FAQSection faqItems={faqItems} title="Image Compression FAQs" />
    </div>
  );
}