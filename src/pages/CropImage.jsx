import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  Crop,
  Square,
  RectangleHorizontal,
  Smartphone,
  Monitor,
  RotateCcw,
  Scissors,
  Zap,
  Gift,
  Shield,
  Layers,
  Target,
} from "lucide-react";
import { downloadImage, getFileSize, generateImagePreview, validateImage } from "../utils/index";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton, SelectButton } from "../components/Buttons";
import toolCTA from "/tools-cta/crop-image.png";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

// --- Frontend crop utility ---
function cropImageOnCanvas(imageSrc, cropCoords, mimeType = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropCoords.width;
      canvas.height = cropCoords.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        img,
        cropCoords.left,
        cropCoords.top,
        cropCoords.width,
        cropCoords.height,
        0,
        0,
        cropCoords.width,
        cropCoords.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for cropping"));
    img.src = imageSrc;
  });
}

function getMimeType(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  const map = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
    tif: "image/tiff",
  };
  return map[ext] || "image/png";
}

export default function CropImage() {
  const [file, setFile] = useState(null);
  const [croppedFile, setCroppedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Crop state
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [aspectRatio, setAspectRatio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isCropLimitReached = useSelector(isUsageLimitReached('cropImage'));

  // Aspect ratio options
  const aspectRatios = [
    { label: "Free", value: null, icon: Crop },
    { label: "1:1", value: "1:1", icon: Square },
    { label: "4:3", value: "4:3", icon: RectangleHorizontal },
    { label: "16:9", value: "16:9", icon: Monitor },
    { label: "3:2", value: "3:2", icon: Smartphone },
    { label: "2:3", value: "2:3", icon: Smartphone },
  ];

  // SEO optimized reasons for choosing tool
  const reasons = [
    {
      icon: Scissors,
      title: "Precision Image Cropping Tool",
      description: "Crop images with pixel-perfect accuracy using our intuitive drag-and-resize interface. Perfect for social media, websites, and professional projects.",
    },
    {
      icon: Gift,
      title: "100% Free Image Cropping",
      description: "No watermarks, no subscriptions, no hidden fees. Crop unlimited images completely free forever with our browser-based tool.",
    },
    {
      icon: Zap,
      title: "Instant Image Processing",
      description: "Crop and download images in seconds. No software installation required - process images directly in your browser.",
    },
    {
      icon: Target,
      title: "Multiple Aspect Ratio Presets",
      description: "Choose from popular ratios like 1:1 (Instagram), 16:9 (YouTube), 4:3 (traditional), or use free-form cropping for custom dimensions.",
    },
    {
      icon: Shield,
      title: "Privacy-First Processing",
      description: "All cropping happens locally in your browser. Your images never leave your device, ensuring complete privacy and security.",
    },
    {
      icon: Layers,
      title: "Batch Image Optimization",
      description: "Perfect for photographers, social media managers, and businesses needing consistent cropping across multiple images.",
    },
  ];

  const iconColorClasses = [
    "bg-sky-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-teal-500",
    "bg-purple-500"
  ];

  // Free tool section SEO content
  const freeToolSection = {
    title: "Free Online Image Cropper - Crop Photos & Images Instantly",
    description: "Crop images online for free with our precision image cropping tool. Perfect for social media posts, profile pictures, website banners, and professional projects. Support for JPEG, PNG, WebP, GIF, BMP, and TIFF formats with pixel-perfect accuracy and multiple aspect ratio presets.",
    imageUrl: toolCTA,
    imageAlt: "Online Image Cropping Tool"
  };

  // Clean up
  const cleanupAllFiles = () => {
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    if (croppedFile?.previewUrl) {
      URL.revokeObjectURL(croppedFile.previewUrl);
    }
    setFile(null);
    setCroppedFile(null);
    setUploadProgress(0);
    setConversionProgress(0);
    setError("");
    setCropArea({ x: 50, y: 50, width: 200, height: 200 });
    setAspectRatio(null);
  };

  // Reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    inputKey.current = Date.now();
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isCropLimitReached) setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isCropLimitReached) {
      setError("Daily image crop limit reached. Please log in for unlimited usage.");
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileProcessing(droppedFiles[0]);
    }
  };

  // File processing
  const handleFileProcessing = async (newFile) => {
    const err = validateImage(newFile);
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setUploadProgress(30);

    try {
      const previewData = await generateImagePreview(newFile);
      setFile({
        file: newFile,
        ...previewData,
      });
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError(`Failed to process ${newFile.name}: ${err.message}`);
    }
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (isCropLimitReached) {
      setError("Daily image crop limit reached. Please log in for unlimited usage.");
      resetFileInput();
      return;
    }

    handleFileProcessing(selectedFile);
    resetFileInput();
  };

  // Initialize crop area when image loads
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight || 500;

      // Calculate display size maintaining aspect ratio
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let displayWidth, displayHeight;

      if (containerWidth / containerHeight > imgAspect) {
        displayHeight = Math.min(containerHeight, 500);
        displayWidth = displayHeight * imgAspect;
      } else {
        displayWidth = containerWidth;
        displayHeight = displayWidth / imgAspect;
      }

      setImageDisplaySize({ width: displayWidth, height: displayHeight });

      // Set initial crop area (centered, 60% of image)
      const cropWidth = displayWidth * 0.6;
      const cropHeight = displayHeight * 0.6;
      setCropArea({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, []);

  // Handle aspect ratio change
  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);

    if (ratio && imageDisplaySize.width > 0) {
      const [w, h] = ratio.split(":").map(Number);
      const targetRatio = w / h;

      let newWidth = cropArea.width;
      let newHeight = cropArea.width / targetRatio;

      if (newHeight > imageDisplaySize.height * 0.8) {
        newHeight = imageDisplaySize.height * 0.8;
        newWidth = newHeight * targetRatio;
      }

      if (newWidth > imageDisplaySize.width * 0.8) {
        newWidth = imageDisplaySize.width * 0.8;
        newHeight = newWidth / targetRatio;
      }

      setCropArea({
        x: (imageDisplaySize.width - newWidth) / 2,
        y: (imageDisplaySize.height - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  // Mouse handlers for crop area
  const handleMouseDown = (e, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x: x - cropArea.x, y: y - cropArea.y });

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      let newX = x - dragStart.x;
      let newY = y - dragStart.y;

      // Constrain within bounds
      newX = Math.max(0, Math.min(newX, imageDisplaySize.width - cropArea.width));
      newY = Math.max(0, Math.min(newY, imageDisplaySize.height - cropArea.height));

      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    }

    if (isResizing) {
      let newArea = { ...cropArea };
      const minSize = 50;

      switch (resizeHandle) {
        case "se":
          newArea.width = Math.max(minSize, Math.min(x - cropArea.x, imageDisplaySize.width - cropArea.x));
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            newArea.height = newArea.width / (w / h);
          } else {
            newArea.height = Math.max(minSize, Math.min(y - cropArea.y, imageDisplaySize.height - cropArea.y));
          }
          break;
        case "sw":
          const newWidthSw = Math.max(minSize, cropArea.x + cropArea.width - x);
          newArea.x = cropArea.x + cropArea.width - newWidthSw;
          newArea.width = newWidthSw;
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            newArea.height = newArea.width / (w / h);
          } else {
            newArea.height = Math.max(minSize, Math.min(y - cropArea.y, imageDisplaySize.height - cropArea.y));
          }
          break;
        case "ne":
          newArea.width = Math.max(minSize, Math.min(x - cropArea.x, imageDisplaySize.width - cropArea.x));
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            const newHeightNe = newArea.width / (w / h);
            newArea.y = cropArea.y + cropArea.height - newHeightNe;
            newArea.height = newHeightNe;
          } else {
            const newHeightNe = Math.max(minSize, cropArea.y + cropArea.height - y);
            newArea.y = cropArea.y + cropArea.height - newHeightNe;
            newArea.height = newHeightNe;
          }
          break;
        case "nw":
          const newWidthNw = Math.max(minSize, cropArea.x + cropArea.width - x);
          newArea.x = cropArea.x + cropArea.width - newWidthNw;
          newArea.width = newWidthNw;
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            const newHeightNw = newArea.width / (w / h);
            newArea.y = cropArea.y + cropArea.height - newHeightNw;
            newArea.height = newHeightNw;
          } else {
            const newHeightNw = Math.max(minSize, cropArea.y + cropArea.height - y);
            newArea.y = cropArea.y + cropArea.height - newHeightNw;
            newArea.height = newHeightNw;
          }
          break;
      }

      // Constrain within bounds
      newArea.x = Math.max(0, newArea.x);
      newArea.y = Math.max(0, newArea.y);
      newArea.width = Math.min(newArea.width, imageDisplaySize.width - newArea.x);
      newArea.height = Math.min(newArea.height, imageDisplaySize.height - newArea.y);

      setCropArea(newArea);
    }
  }, [isDragging, isResizing, dragStart, cropArea, aspectRatio, imageDisplaySize, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add global mouse listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Calculate actual crop coordinates (scaled to original image)
  const getActualCropCoordinates = () => {
    if (!file || !imageDisplaySize.width) return null;

    const scaleX = file.width / imageDisplaySize.width;
    const scaleY = file.height / imageDisplaySize.height;

    return {
      left: Math.round(cropArea.x * scaleX),
      top: Math.round(cropArea.y * scaleY),
      width: Math.round(cropArea.width * scaleX),
      height: Math.round(cropArea.height * scaleY),
    };
  };

  // Handle crop — now fully on the frontend
  const handleCrop = async () => {
    window.scrollTo(0, 0);
    if (!file) return;

    if (isCropLimitReached) {
      setError("Daily image crop limit reached. Please log in for unlimited usage.");
      return;
    }

    const coords = getActualCropCoordinates();
    if (!coords) return;

    setIsProcessing(true);
    setConversionProgress(0);
    setError("");

    try {
      setConversionProgress(20);

      const mimeType = getMimeType(file.file.name);
      const croppedBlob = await cropImageOnCanvas(
        file.previewUrl,
        coords,
        mimeType,
        mimeType === "image/jpeg" ? 0.92 : undefined
      );

      setConversionProgress(80);

      const croppedPreviewUrl = URL.createObjectURL(croppedBlob);

      setCroppedFile({
        blob: croppedBlob,
        previewUrl: croppedPreviewUrl,
        width: coords.width,
        height: coords.height,
        size: croppedBlob.size,
      });

      setConversionProgress(100);

      dispatch(incrementUsage("cropImage"));

      // Auto-download
      const fileName = file.fileName.replace(/\.[^/.]+$/, "_cropped" + file.file.name.substring(file.file.name.lastIndexOf('.')));
      downloadImage(croppedBlob, fileName);

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Crop failed");
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!croppedFile) return;
    const fileName = file.fileName.replace(/\.[^/.]+$/, "_cropped" + file.file.name.substring(file.file.name.lastIndexOf('.')));
    downloadImage(croppedFile.blob, fileName);
  };

  const handleStartOver = () => {
    cleanupAllFiles();
    resetFileInput();
    window.location.reload();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      if (croppedFile?.previewUrl) {
        URL.revokeObjectURL(croppedFile.previewUrl);
      }
    };
  }, [file, croppedFile]);

  const faqItems = [
    {
      question: "What image formats can I crop?",
      answer: "You can crop JPEG, PNG, WebP, GIF, BMP, and TIFF files with our free online image cropper.",
    },
    {
      question: "Can I set a specific aspect ratio for social media?",
      answer: "Yes! Choose from preset ratios like 1:1 (Instagram square), 4:3, 16:9 (YouTube), 9:16 (Instagram Stories), or use free-form cropping for custom dimensions.",
    },
    {
      question: "Will cropping reduce image quality?",
      answer: "No, our image cropper maintains the original image quality. The cropped area retains the full resolution of your original image.",
    },
    {
      question: "Can I crop to exact pixel dimensions?",
      answer: "Yes, you can manually input exact pixel values or use our visual cropping tool for pixel-perfect precision cropping.",
    },
    {
      question: "Is there a file size limit for cropping images?",
      answer: "You can upload and crop images up to 50MB in size for free. No registration required.",
    },
    {
      question: "Are my images stored on your servers?",
      answer: "No! All image cropping happens locally in your browser. Your images never leave your device, ensuring complete privacy.",
    },
  ];

  const actualCoords = getActualCropCoordinates();

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area with Blue linear Background */}
      <div
        className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-linear-to-r from-[#014b80] to-[#031f33]"
        ref={dropZoneRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="max-w-7xl mx-auto">
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          {/* Header */}
          <div className={`${!file ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!file ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Free Image Cropping Tool"
                description="Crop images online with pixel-perfect precision"
              />
            </motion.div>

            <input
              key={inputKey.current}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {!file && (
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
                            {isCropLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your image here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isCropLimitReached} fileInputRef={fileInputRef} title="Select Image file" />
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
                        className="absolute inset-0 bg-sky-500/20 rounded-xl pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Crop Editor */}
              {file && !croppedFile && (
                <div className="mb-4 sm:mb-6"
                >
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Crop className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="font-medium text-white text-md sm:text-lg">
                            Crop Image
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {file.width}×{file.height}px • {getFileSize(file.fileSize)}
                          </span>
                        </div>
                        <button
                          onClick={handleStartOver}
                          className="flex-1 sm:flex-none px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    {/* Crop Area */}
                    <div className="p-4 sm:p-6">
                      {/* Aspect Ratio Options */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-3">
                          Aspect Ratio
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {aspectRatios.map((ratio) => (
                            <button
                              key={ratio.label}
                              onClick={() => handleAspectRatioChange(ratio.value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${aspectRatio === ratio.value
                                ? "bg-sky-400 text-white"
                                : "bg-sky-700 text-gray-100 hover:bg-sky-600"
                                }`}
                            >
                              <ratio.icon className="w-4 h-4" />
                              {ratio.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image with Crop Overlay */}
                      <div
                        ref={containerRef}
                        className="relative mx-auto bg-sky-900 rounded-lg overflow-hidden"
                        style={{
                          width: imageDisplaySize.width || "100%",
                          height: imageDisplaySize.height || "auto",
                          maxWidth: "100%",
                        }}
                      >
                        <img
                          ref={imageRef}
                          src={file.previewUrl}
                          alt="Crop preview"
                          className="block"
                          style={{
                            width: imageDisplaySize.width || "100%",
                            height: imageDisplaySize.height || "auto",
                          }}
                          onLoad={handleImageLoad}
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                        />

                        {/* Dark overlay outside crop area */}
                        <div
                          className="absolute inset-0 bg-black/60 pointer-events-none"
                          style={{
                            clipPath: `polygon(
                              0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                              ${cropArea.x}px ${cropArea.y}px,
                              ${cropArea.x}px ${cropArea.y + cropArea.height}px,
                              ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px,
                              ${cropArea.x + cropArea.width}px ${cropArea.y}px,
                              ${cropArea.x}px ${cropArea.y}px
                            )`,
                          }}
                        />

                        {/* Crop selection box */}
                        <div
                          className="absolute border-2 border-sky-400 cursor-move"
                          style={{
                            left: cropArea.x,
                            top: cropArea.y,
                            width: cropArea.width,
                            height: cropArea.height,
                          }}
                          onMouseDown={(e) => handleMouseDown(e)}
                        >
                          {/* Grid lines */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-sky-400/50" />
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-sky-400/50" />
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-sky-400/50" />
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-sky-400/50" />
                          </div>

                          {/* Corner handles */}
                          <div
                            className="absolute -top-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-nw-resize"
                            onMouseDown={(e) => handleMouseDown(e, "nw")}
                          />
                          <div
                            className="absolute -top-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-ne-resize"
                            onMouseDown={(e) => handleMouseDown(e, "ne")}
                          />
                          <div
                            className="absolute -bottom-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-sw-resize"
                            onMouseDown={(e) => handleMouseDown(e, "sw")}
                          />
                          <div
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-se-resize"
                            onMouseDown={(e) => handleMouseDown(e, "se")}
                          />
                        </div>
                      </div>

                      {/* Crop Info */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                          <p className="text-xs text-gray-100 mb-1">X Position</p>
                          <p className="text-white font-medium">{actualCoords?.left || 0}px</p>
                        </div>
                        <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                          <p className="text-xs text-gray-100 mb-1">Y Position</p>
                          <p className="text-white font-medium">{actualCoords?.top || 0}px</p>
                        </div>
                        <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                          <p className="text-xs text-gray-100 mb-1">Width</p>
                          <p className="text-white font-medium">{actualCoords?.width || 0}px</p>
                        </div>
                        <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                          <p className="text-xs text-gray-100 mb-1">Height</p>
                          <p className="text-white font-medium">{actualCoords?.height || 0}px</p>
                        </div>
                      </div>

                      {/* Reset button */}
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => handleImageLoad()}
                          className="px-3 py-2 bg-sky-900/30 text-sky-300 rounded-lg text-sm font-medium hover:bg-sky-800/30 transition cursor-pointer flex gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset Crop Area
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Crop Button */}
              {file && !croppedFile && (
                <ActionButton
                  disabled={isProcessing || isCropLimitReached}
                  handleAction={handleCrop}
                  className={isProcessing || isCropLimitReached ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Cropping..."
                  title="Crop Image"
                />
              )}

              {/* Crop Results */}
              {croppedFile && (
                <ResultSection
                  title="Image Cropped Successfully!"
                  onDownload={handleDownload}
                  onStartOver={handleStartOver} summaryTitle="Crop Summary"
                  summaryItems={[
                    {
                      value: `${file?.width}×${file?.height}`,
                      label: "Original Size",
                      valueColor: "white"
                    },
                    {
                      value: `${croppedFile.width}×${croppedFile.height}`,
                      label: "Cropped Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: aspectRatio || "Free",
                      label: "Aspect Ratio",
                      valueColor: "yellow-400"
                    },
                    {
                      value: getFileSize(croppedFile.size),
                      label: "File Size",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title="Cropping Image"
                description="Processing your image..."
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details Section with Blue Theme */}
      <WhyChooseSection
        freeTitle={freeToolSection.title}
        description={freeToolSection.description}
        imageUrl={freeToolSection.imageUrl}
        imageAlt={freeToolSection.imageAlt}
        title="Why choose our Image Cropping Tool"
        subtitle="Perfect your images with our user-friendly cropping tool designed for photographers, social media managers, bloggers, and businesses. Create perfectly cropped images for any platform."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Crop Images Online"
          stepOne="Upload Image"
          stepOneDes="Select or drag and drop your image file"
          stepTwo="Select Area"
          stepTwoDes="Drag and resize the crop selection"
          stepThree="Choose Ratio"
          stepThreeDes="Select an aspect ratio or use free-form"
          stepFour="Download"
          stepFourDes="Get your cropped image instantly"
        />
      </div>

      {/* FAQ Section */}
      <FAQSection
        theme="light"
        faqItems={faqItems}
        title="Image Cropping FAQs"
      />
    </div>
  );
}