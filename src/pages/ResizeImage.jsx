import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Image as ImageIcon,
  Link,
  Unlink,
  Percent,
  Maximize2,
  Monitor,
  Smartphone,
  Square,
  Shield,
  Zap,
  Stars,
  Clock,
  Globe,
  Smartphone as PhoneIcon,
  Settings,
} from "lucide-react";
import { downloadImage, generateImagePreview, validateImage, getFileSize, fileToDataURL, getMimeType, getExtension, resizeImageOnCanvas, downloadImagesAsZip } from "../utils/index";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton, ChangeButton, RemoveButton, SelectButton, XDeleteButton } from "../components/Buttons";
import toolCTA from "/tools-cta/resize-image.png";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function ResizeImage() {
  const [files, setFiles] = useState([]);
  const [resizedFiles, setResizedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  // Resize options
  const [resizeMode, setResizeMode] = useState("pixels");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [percentage, setPercentage] = useState(50);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isResizeLimitReached = useSelector(isUsageLimitReached("resizeImage"));

  // Preset sizes
  const presets = [
    { name: "Instagram Post", width: 1080, height: 1080, icon: Square },
    { name: "Instagram Story", width: 1080, height: 1920, icon: Smartphone },
    { name: "Facebook Cover", width: 820, height: 312, icon: Monitor },
    { name: "Twitter Header", width: 1500, height: 500, icon: Monitor },
    { name: "YouTube Thumbnail", width: 1280, height: 720, icon: Monitor },
    { name: "LinkedIn Banner", width: 1584, height: 396, icon: Monitor },
    { name: "HD 720p", width: 1280, height: 720, icon: Monitor },
    { name: "Full HD 1080p", width: 1920, height: 1080, icon: Monitor },
    { name: "4K UHD", width: 3840, height: 2160, icon: Maximize2 },
  ];

  const resizeReasons = [
    {
      icon: Shield,
      title: "Bank-Level Security & Privacy",
      description: "Your images are processed locally in your browser with military-grade encryption. No files are ever uploaded to our servers - your privacy is guaranteed with our free online image resizer.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast Resizing Engine",
      description: "Resize hundreds of images in seconds with our optimized batch processing. Experience instant results for social media optimization, web graphics, and print-ready files.",
    },
    {
      icon: Stars,
      title: "Intelligent Dimension Control",
      description: "Smart aspect ratio preservation, pixel-perfect precision, and social media presets ensure perfect dimensions every time. Best free image resizer for Instagram, Facebook, and professional use.",
    },
    {
      icon: PhoneIcon,
      title: "Multi-Platform Optimization",
      description: "Perfectly optimized for all social media platforms, websites, mobile apps, and print. Our responsive image resizer works flawlessly on all devices and screen sizes.",
    },
    {
      icon: Globe,
      title: "Universal Format Support",
      description: "Resize JPEG, PNG, WebP, GIF, BMP, TIFF and all popular image formats with 100% quality preservation. The most versatile online image size converter available.",
    },
    {
      icon: Clock,
      title: "Zero Wait Time - 100% Free Forever",
      description: "No registration, no watermarks, no subscriptions. Start resizing images immediately with our completely free forever service. Unlimited image processing at no cost.",
    }
  ];

  const iconColorClasses = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-indigo-500"
  ];

  const generateFileId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getTargetDimensions = (originalWidth, originalHeight) => {
    if (resizeMode === "percentage") {
      return {
        width: Math.round(originalWidth * (percentage / 100)),
        height: Math.round(originalHeight * (percentage / 100)),
      };
    } else if (resizeMode === "preset" && selectedPreset) {
      return {
        width: selectedPreset.width,
        height: selectedPreset.height,
      };
    } else {
      return {
        width: parseInt(width) || originalWidth,
        height: parseInt(height) || originalHeight,
      };
    }
  };

  const handleWidthChange = (newWidth) => {
    setWidth(newWidth);
    if (maintainAspectRatio && files.length > 0 && newWidth) {
      const ar = files[0].width / files[0].height;
      setHeight(Math.round(parseInt(newWidth) / ar).toString());
    }
  };

  const handleHeightChange = (newHeight) => {
    setHeight(newHeight);
    if (maintainAspectRatio && files.length > 0 && newHeight) {
      const ar = files[0].width / files[0].height;
      setWidth(Math.round(parseInt(newHeight) * ar).toString());
    }
  };

  const cleanupAllFiles = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    resizedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setResizedFiles([]);
    setUploadProgress(0);
    setConversionProgress(0);
    setError("");
    setWidth("");
    setHeight("");
    setPercentage(50);
    setSelectedPreset(null);
    setResizeMode("pixels");
    setHasAutoDownloaded(false);
  };

  const cleanupFile = (fileId) => {
    const f = files.find((x) => x.id === fileId);
    if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
    setFiles((prev) => prev.filter((x) => x.id !== fileId));
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputKey.current = Date.now();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isResizeLimitReached) setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isResizeLimitReached) {
      setError("Daily image resize limit reached. Please log in for unlimited usage.");
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) handleFilesProcessing(droppedFiles);
  };

  const handleFilesProcessing = async (newFiles) => {
    const validFiles = [];
    const errors = [];

    for (const file of newFiles) {
      const err = validateImage(file);
      if (err) errors.push(`${file.name}: ${err}`);
      else validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
      if (validFiles.length === 0) return;
    }

    setError("");
    setUploadProgress(30);

    const processedFiles = [];
    for (const file of validFiles) {
      try {
        const previewData = await generateImagePreview(file);
        const fileId = generateFileId();
        processedFiles.push({ id: fileId, file, ...previewData });
      } catch (err) {
        errors.push(`Failed to process ${file.name}: ${err.message}`);
      }
    }

    if (errors.length > 0) setError(errors.join("\n"));

    setFiles((prev) => [...prev, ...processedFiles]);

    if (processedFiles.length > 0 && !width && !height) {
      setWidth(processedFiles[0].width.toString());
      setHeight(processedFiles[0].height.toString());
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (isResizeLimitReached) {
      setError("Daily image resize limit reached. Please log in for unlimited usage.");
      resetFileInput();
      return;
    }

    handleFilesProcessing(selectedFiles);
    resetFileInput();
  };

  // ===== FRONTEND RESIZE — reads each raw File as data URL first =====
  const handleResize = async () => {
    window.scrollTo(0, 0);
    if (files.length === 0) return;

    if (isResizeLimitReached) {
      setError("Daily image resize limit reached. Please log in for unlimited usage.");
      return;
    }

    const firstFile = files[0];
    const targetDims = getTargetDimensions(firstFile.width, firstFile.height);

    if (!targetDims.width || !targetDims.height) {
      setError("Please specify width and height");
      return;
    }

    setIsProcessing(true);
    setConversionProgress(0);
    setError("");
    setResizedFiles([]);
    setHasAutoDownloaded(false);

    try {
      const results = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const fileData = files[i];
        const dims = getTargetDimensions(fileData.width, fileData.height);
        const mimeType = getMimeType(fileData.file.name);

        const dataURL = await fileToDataURL(fileData.file);

        const resizedBlob = await resizeImageOnCanvas(
          dataURL,
          dims.width,
          dims.height,
          mimeType,
          mimeType === "image/jpeg" ? 0.92 : undefined
        );

        results.push({
          id: fileData.id,
          originalName: fileData.fileName,
          originalSize: fileData.fileSize,
          compressedSize: resizedBlob.size,
          blob: resizedBlob,
          previewUrl: fileData.previewUrl,
          width: dims.width,
          height: dims.height,
        });

        setConversionProgress(Math.round(((i + 1) / totalFiles) * 90));
      }

      setConversionProgress(95);

      setConversionProgress(100);
      setResizedFiles(results);
      dispatch(incrementUsage("resizeImage"));

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Resize failed");
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownloadOne = (file) => {
    const ext = getExtension(file.originalName);
    const nameWithoutExt = file.originalName.replace(/\.[^/.]+$/, "");
    const fileName = `${nameWithoutExt}$_resized${ext}`;
    downloadImage(file.blob, fileName)
  };

  const handleDownloadAll = () => {
    if (resizedFiles.length === 0 ) return;
    const zipData = resizedFiles.map(f => ({
      blob: f.blob,
      fileName: f.originalName,
      pageNumber: f.index || 1
    }));
    if (resizedFiles.length > 0) {
      downloadImagesAsZip(zipData, "allypdf_resized-images.zip")
    }
  }

  useEffect(() => {
    if (resizedFiles.length > 0 && !isProcessing && !hasAutoDownloaded) {
      setHasAutoDownloaded(true);

      const autoDownload = () => {
        if (resizedFiles.length === 1) {
          handleDownloadOne(resizedFiles[0]);
        } else {
          handleDownloadAll();
        }
      }

      return autoDownload;
    }
  }, [resizedFiles, isProcessing, hasAutoDownloaded]);


  const handleRemoveFile = (fileId) => cleanupFile(fileId);

  const handleStartOver = () => {
    cleanupAllFiles();
    resetFileInput();
  };

  const handleAddMoreFiles = () => {
    if (isResizeLimitReached) {
      setError("Daily image resize limit reached. Please log in for unlimited usage.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setResizeMode("preset");
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      resizedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
  }, [files, resizedFiles]);

  const faqItems = [
    {
      question: "What image formats can I resize with your free online tool?",
      answer: "Our free image resizer supports all popular formats: JPEG, PNG, WebP, GIF, BMP, and TIFF. You can resize any image format with 100% quality preservation and batch processing capability."
    },
    {
      question: "Will resizing images reduce quality or cause pixelation?",
      answer: "Our intelligent resizing algorithm maintains maximum quality while optimizing dimensions. For enlarging, we use advanced interpolation, and for shrinking, we use smart downsampling to prevent pixelation."
    },
    {
      question: "Can I resize multiple images at once for different social media platforms?",
      answer: "Yes! Our batch image resizer lets you process unlimited images simultaneously. Use our social media presets for Instagram, Facebook, Twitter, LinkedIn, and YouTube in one click."
    },
    {
      question: "How does the aspect ratio lock feature work?",
      answer: "When enabled, changing width automatically adjusts height (and vice versa) to maintain original proportions. This prevents image distortion and ensures perfect scaling for profile pictures, banners, and covers."
    },
    {
      question: "Is there any limit to how many images I can resize for free?",
      answer: "No limits! Our free online image resizer offers unlimited processing with no watermarks, no registration required. Resize as many images as you need, completely free forever."
    }
  ];

  const getPreviewInfo = () => {
    if (files.length === 0) return null;
    const firstFile = files[0];
    const targetDims = getTargetDimensions(firstFile.width, firstFile.height);
    const scalePercent = (((targetDims.width * targetDims.height) / (firstFile.width * firstFile.height)) * 100).toFixed(0);
    return { ...targetDims, scalePercent };
  };

  const getResizeSavings = () => {
    if (resizedFiles.length === 0) return { saved: 0, percentage: 0, originalTotal: 0, resizedTotal: 0 };
    const originalTotal = resizedFiles.reduce((t, f) => t + f.originalSize, 0);
    const resizedTotal = resizedFiles.reduce((t, f) => t + f.compressedSize, 0);
    const saved = originalTotal - resizedTotal;
    const pct = originalTotal > 0 ? ((saved / originalTotal) * 100).toFixed(1) : 0;
    return { saved, percentage: pct, originalTotal, resizedTotal };
  };

  const previewInfo = getPreviewInfo();
  const savings = getResizeSavings();

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area with linear Background */}
      <div
        ref={dropZoneRef}
        className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-linear-to-r from-[#014b80] to-[#031f33]"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          <div className={`${files.length === 0 && !resizedFiles.length ? "flex flex-col justify-center" : ""}`}>
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${files.length === 0 && !resizedFiles.length ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Free Image Resizer Online"
                description="Resize JPEG, PNG, WebP images with pixel-perfect precision"
              />
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
              {files.length === 0 && !resizedFiles.length && (
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
                            {isResizeLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your images here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isResizeLimitReached} fileInputRef={fileInputRef} title="Select Image files" />
                          </div>
                          <p className="text-xs sm:text-sm text-gray-100 text-center px-2">
                            JPEG, PNG, WebP, GIF, BMP, AVIF
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
              {files.length > 0 && !resizedFiles.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 sm:mb-6"
                >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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

                    <div className="p-4 sm:p-6">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto place-content-center">
                        <AnimatePresence>
                          {files.map((file) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="relative bg-cyan-700 rounded-lg border border-sky-700 hover:border-sky-500/60 overflow-hidden max-w-60"
                              draggable={true}
                            >
                              <XDeleteButton handleRemove={() => handleRemoveFile(file.id)} title="Remove Image" />
                              <div className="relative aspect-square bg-sky-900 flex items-center justify-center">
                                {file.previewUrl ? (
                                  <img
                                    src={file.previewUrl}
                                    alt={file.fileName}
                                    className="max-w-full max-h-full object-contain m-auto"
                                    style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    draggable={false}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-500">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs">Preview</span>
                                  </div>
                                )}
                              </div>
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
                </motion.div>
              )}

              {/* Resize Settings Section */}
              {files.length > 0 && !resizedFiles.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8"
                >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="text-white text-md sm:text-lg">
                          Image Resizing Settings
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {/* Resize Mode Tabs */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <button
                          onClick={() => setResizeMode("pixels")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 text-white border cursor-pointer ${resizeMode === "pixels" ? "border-sky-500 bg-sky-500/10" : "border-sky-700 bg-sky-900"}`}
                        >
                          <Maximize2 className="w-4 h-4" />
                          By Pixels
                        </button>
                        <button
                          onClick={() => setResizeMode("percentage")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 text-white border cursor-pointer ${resizeMode === "percentage" ? "border-sky-500 bg-sky-500/10" : "border-sky-700 bg-sky-900"}`}
                        >
                          <Percent className="w-4 h-4" />
                          By Percentage
                        </button>
                        <button
                          onClick={() => setResizeMode("preset")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 text-white border cursor-pointer ${resizeMode === "preset" ? "border-sky-500 bg-sky-500/10" : "border-sky-700 bg-sky-900"}`}
                        >
                          <Monitor className="w-4 h-4" />
                          Social Media Presets
                        </button>
                      </div>

                      {/* Pixel Resize Options */}
                      {resizeMode === "pixels" && (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-white mb-2">Width (px)</label>
                              <input
                                type="number"
                                value={width}
                                onChange={(e) => handleWidthChange(e.target.value)}
                                placeholder="Width"
                                className="w-full px-4 py-3 bg-sky-900 border border-sky-700 rounded-lg text-white placeholder-gray-500 focus:outline-1 focus:outline-sky-500"
                              />
                            </div>
                            <button
                              onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                              className={`p-3 rounded-lg transition-all text-white border cursor-pointer ${maintainAspectRatio ? "border-sky-500 bg-sky-500/10" : "border-sky-700 bg-sky-900"}`}
                              title={maintainAspectRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                            >
                              {maintainAspectRatio ? <Link className="w-5 h-5" /> : <Unlink className="w-5 h-5" />}
                            </button>
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-white mb-2">Height (px)</label>
                              <input
                                type="number"
                                value={height}
                                onChange={(e) => handleHeightChange(e.target.value)}
                                placeholder="Height"
                                className="w-full px-4 py-3 bg-sky-900 border border-sky-700 rounded-lg text-white placeholder-gray-500 focus:outline-1 focus:outline-sky-500"
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-100">
                            {maintainAspectRatio
                              ? "Aspect ratio is locked. Width and height will adjust together to maintain original proportions."
                              : "Aspect ratio is unlocked. Set any dimensions independently."}
                          </p>
                        </div>
                      )}

                      {/* Percentage Resize Options */}
                      {resizeMode === "percentage" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Scale: {percentage}%</label>
                            <input
                              type="range"
                              min="10"
                              max="200"
                              value={percentage}
                              onChange={(e) => setPercentage(parseInt(e.target.value))}
                              className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
                            />
                            <div className="flex justify-between text-xs text-gray-100 mt-1">
                              <span>10%</span>
                              <span>100%</span>
                              <span>200%</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[25, 50, 75, 100, 150, 200].map((p) => (
                              <button
                                key={p}
                                onClick={() => setPercentage(p)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-all text-white border cursor-pointer ${percentage === p ? "border-sky-500 bg-sky-500/10" : "border-sky-700 bg-sky-900"}`}
                              >
                                {p}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preset Options */}
                      {resizeMode === "preset" && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {presets.map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => handlePresetSelect(preset)}
                              className={`p-3 rounded-lg text-left text-white border-2 transition-all cursor-pointer ${selectedPreset?.name === preset.name
                                ? "border-sky-500 bg-sky-500/10"
                                : "border-sky-700 bg-sky-900"
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <preset.icon className="w-4 h-4" />
                                <span className="font-medium text-sm">{preset.name}</span>
                              </div>
                              <p className={`text-xs ${selectedPreset?.name === preset.name ? "text-sky-100" : "text-gray-400"}`}>
                                {preset.width} × {preset.height}px
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Preview Info */}
                      {previewInfo && (
                        <div className="mt-6 bg-cyan-900/50 rounded-lg p-4 border border-cyan-700">
                          <h4 className="text-sm font-medium text-white mb-3">Resize Preview</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-100">Original Size</p>
                              <p className="text-white font-medium">
                                {files[0]?.width}×{files[0]?.height}px
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-100">New Size</p>
                              <p className="text-sky-400 font-medium">
                                {previewInfo.width}×{previewInfo.height}px
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-100">Scale Factor</p>
                              <p className={`font-medium ${parseInt(previewInfo.scalePercent) > 100 ? "text-yellow-400" : "text-green-400"}`}>
                                {previewInfo.scalePercent}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-100">Total Images</p>
                              <p className="text-white font-medium">
                                {files.length} image{files.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Resize Results Section */}
              {resizedFiles.length > 0 && (
                <ResultSection
                  title="Resize Complete!"
                  subtitle={`• ${resizedFiles.length} file${resizedFiles.length !== 1 ? 's' : ''}`}
                  onDownload={resizedFiles.length > 1 ? handleDownloadAll : () => handleDownloadOne(resizedFiles[0])}
                  downloadButtonText={resizedFiles.length > 1 ? "Download All" : "Download"}
                  onStartOver={handleStartOver}
                  summaryTitle="Resize Summary"
                  summaryItems={[
                    { value: resizedFiles.length, label: "Images Resized", valueColor: "white" },
                    { value: getFileSize(savings.originalTotal), label: "Original Size", valueColor: "teal-400" },
                    { value: getFileSize(savings.resizedTotal), label: "Resized Size", valueColor: "yellow-400" },
                    { value: `${savings.percentage}%`, label: "Size Change", valueColor: "green-400" },
                  ]}
                />
              )}

              {/* Resize Button */}
              {files.length > 0 && !resizedFiles.length && (
                <ActionButton
                  disabled={isProcessing || isResizeLimitReached || files.length === 0}
                  handleAction={handleResize}
                  className={isProcessing || isResizeLimitReached || files.length === 0 ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Resizing..."
                  title={`Resize ${files.length === 1 ? "Image" : "Images"}`}
                />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title={`Resizing ${files.length} ${files.length === 1 ? "Image" : "Images"}`}
                description="Adjusting image dimensions with precision control..."
              />
            </div>
          </div>

          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + WhyChoose + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Online Image Resizer - Resize JPEG, PNG, WebP Images"
        description="Our free online image resizer offers pixel-perfect dimension control for all your image needs. Resize JPEG, PNG, WebP, GIF, BMP, and TIFF files with intelligent quality preservation. Perfect for social media optimization, website graphics, print materials, and mobile apps. Batch process unlimited images with smart aspect ratio locking and social media presets."
        imageUrl={toolCTA}
        imageAlt="Free online image resizer tool interface"
        title="Why Choose Our Free Image Resizer"
        subtitle="Experience professional-grade image resizing with our feature-rich, user-friendly tool designed for photographers, designers, marketers, and casual users alike."
        reasons={resizeReasons}
        iconColorClasses={iconColorClasses}
      />

      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title="How To Resize Images Online for Free"
          stepOne="Upload Your Images"
          stepOneDes="Select or drag & drop JPEG, PNG, WebP files"
          stepTwo="Set Dimensions"
          stepTwoDes="Choose pixels, percentage, or social media presets"
          stepThree="Resize & Optimize"
          stepThreeDes="Click once to process all images instantly"
          stepFour="Download Results"
          stepFourDes="Get perfectly resized images ready for use"
        />
      </div>

      <FAQSection
        faqItems={faqItems}
        title="Free Image Resizer FAQs"
      />
    </div>
  );
}