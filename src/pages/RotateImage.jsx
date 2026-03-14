import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Image,
  RotateCw,
  RotateCcw,
  Shield,
  Zap,
  Stars,
  Clock,
  Globe,
  Smartphone as PhoneIcon,
  Settings,
} from "lucide-react";
import { downloadImage, generateImagePreview, validateImage, fileToDataURL, getMimeType, getExtension, getFileSize, rotateImageOnCanvas, downloadImagesAsZip } from "../utils/index";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton, ChangeButton, RemoveButton, SelectButton, XDeleteButton } from "../components/Buttons";
import toolCTA from "/tools-cta/rotate-image.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function RotateImage() {
  const [files, setFiles] = useState([]);
  const [rotatedFiles, setRotatedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  // Rotation settings
  const [rotations, setRotations] = useState({}); // { fileId: angle }

  // Store final download blob/fileName for re-download

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isRotateLimitReached = useSelector(isUsageLimitReached('rotateImage'));

  const rotateReasons = [
    {
      icon: Shield,
      title: "Bank-Level Security & Privacy",
      description: "Your images are processed locally in your browser with military-grade encryption. No files are ever uploaded to our servers - your privacy is guaranteed with our free online image rotator.",
    },
    {
      icon: Zap,
      title: "Instant Live Preview Rotation",
      description: "See exactly how your image will look before downloading with real-time 90°, 180°, 270° rotation previews. Perfect for correcting sideways photos and camera orientation issues.",
    },
    {
      icon: Stars,
      title: "Intelligent Batch Processing",
      description: "Rotate multiple images simultaneously with individual angle control for each file. Our free image rotation tool handles unlimited images with lossless quality preservation.",
    },
    {
      icon: PhoneIcon,
      title: "Multi-Device Optimization",
      description: "Works flawlessly on desktop, tablet, and mobile devices. Our responsive image rotator ensures perfect rotation experience on any screen size or platform.",
    },
    {
      icon: Globe,
      title: "Universal Format Support",
      description: "Rotate JPEG, PNG, WebP, GIF, BMP, TIFF and all popular image formats with 100% accuracy. The most versatile free online image rotation tool available.",
    },
    {
      icon: Clock,
      title: "Zero Wait Time - 100% Free Forever",
      description: "No registration, no watermarks, no subscriptions. Start rotating images immediately with our completely free forever service. Unlimited image processing at no cost.",
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

  const getRotation = (fileId) => rotations[fileId] || 0;

  const rotateFile = (fileId, direction) => {
    setRotations((prev) => {
      const currentAngle = prev[fileId] || 0;
      const newAngle = direction === "cw"
        ? (currentAngle + 90) % 360
        : (currentAngle - 90 + 360) % 360;
      return { ...prev, [fileId]: newAngle };
    });
  };

  const rotateAll = (direction) => {
    setRotations((prev) => {
      const newRotations = { ...prev };
      files.forEach((file) => {
        const currentAngle = prev[file.id] || 0;
        const newAngle = direction === "cw"
          ? (currentAngle + 90) % 360
          : (currentAngle - 90 + 360) % 360;
        newRotations[file.id] = newAngle;
      });
      return newRotations;
    });
  };

  const setFileAngle = (fileId, angle) => {
    setRotations((prev) => ({ ...prev, [fileId]: angle }));
  };

  const cleanupAllFiles = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    rotatedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setRotatedFiles([]);
    setRotations({});
    setUploadProgress(0);
    setConversionProgress(0);
    setError("");
    setHasAutoDownloaded(false);
  };

  const cleanupFile = (fileId) => {
    const f = files.find((x) => x.id === fileId);
    if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
    setFiles((prev) => prev.filter((x) => x.id !== fileId));
    setRotations((prev) => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputKey.current = Date.now();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.type === "dragenter" || e.type === "dragover") && !isRotateLimitReached) setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isRotateLimitReached) {
      setError("Daily image rotation limit reached. Please log in for unlimited usage.");
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
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (isRotateLimitReached) {
      setError("Daily image rotation limit reached. Please log in for unlimited usage.");
      resetFileInput();
      return;
    }

    handleFilesProcessing(selectedFiles);
    resetFileInput();
  };

  // ===== FRONTEND ROTATE — reads each raw File as data URL first =====
  const handleRotate = async () => {
    window.scrollTo(0, 0);
    if (files.length === 0) return;

    if (isRotateLimitReached) {
      setError("Daily image rotation limit reached. Please log in for unlimited usage.");
      return;
    }

    const filesToRotate = files.filter((file) => getRotation(file.id) !== 0);
    if (filesToRotate.length === 0) {
      setError("Please rotate at least one image before processing");
      return;
    }

    setIsProcessing(true);
    setConversionProgress(0);
    setError("");
    setRotatedFiles([]);
    setHasAutoDownloaded(false);

    try {
      const results = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const fileData = files[i];
        const angle = getRotation(fileData.id);
        const mimeType = getMimeType(fileData.file.name);

        const dataURL = await fileToDataURL(fileData.file);

        const rotatedBlob = await rotateImageOnCanvas(
          dataURL,
          angle,
          mimeType,
          mimeType === "image/jpeg" ? 0.92 : undefined
        );

        const is90or270 = angle === 90 || angle === 270;
        const newWidth = is90or270 ? fileData.height : fileData.width;
        const newHeight = is90or270 ? fileData.width : fileData.height;

        results.push({
          id: fileData.id,
          originalName: fileData.fileName,
          originalSize: fileData.fileSize,
          rotatedSize: rotatedBlob.size,
          blob: rotatedBlob,
          previewUrl: fileData.previewUrl,
          angle: angle,
          width: newWidth,
          height: newHeight,
        });

        setConversionProgress(Math.round(((i + 1) / totalFiles) * 90));
      }

      setConversionProgress(95);

      setConversionProgress(100);
      setRotatedFiles(results);
      dispatch(incrementUsage("rotateImage"));

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error("Rotation error:", err);
      setError(err.message || "Rotation failed");
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownloadOne = (file) => {
    const ext = getExtension(file.originalName);
    const nameWithoutExt = file.originalName.replace(/\.[^/.]+$/, "");
    const fileName = `${nameWithoutExt}_rotated${ext}`;
    downloadImage(file.blob, fileName)
  };

  const handleDownloadAll = () => {
    if (rotatedFiles.length === 0) return;
    const zipData = rotatedFiles.map(f => ({
      blob: f.blob,
      fileName: f.originalName,
      pageNumber: f.index || 1
    }));
    if (rotatedFiles.length > 0) {
      downloadImagesAsZip(zipData, "allypdf_rotated-images.zip")
    }
  }

  useEffect(() => {
    if (rotatedFiles.length > 0 && !isProcessing && !hasAutoDownloaded) {
      setHasAutoDownloaded(true);

      const autoDownload = () => {
        if (rotatedFiles.length === 1) {
          handleDownloadOne(rotatedFiles[0]);
        } else {
          handleDownloadAll();
        }
      }

      return autoDownload;
    }
  }, [rotatedFiles, isProcessing, hasAutoDownloaded]);

  const handleRemoveFile = (fileId) => cleanupFile(fileId);

  const handleStartOver = () => {
    cleanupAllFiles();
    resetFileInput();
  };

  const handleAddMoreFiles = () => {
    if (isRotateLimitReached) {
      setError("Daily image rotation limit reached. Please log in for unlimited usage.");
      return;
    }
    fileInputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      rotatedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
  }, [files, rotatedFiles]);

  const faqItems = [
    {
      question: "What image formats can I rotate with your free online tool?",
      answer: "Our free image rotator supports all popular formats: JPEG, PNG, WebP, GIF, BMP, and TIFF. You can rotate any image format with 100% quality preservation and batch processing capability."
    },
    {
      question: "Will rotating images reduce quality or cause compression artifacts?",
      answer: "No! Our rotation algorithm is completely lossless. Your image quality will remain exactly the same, only orientation changes. No compression artifacts or quality loss at any rotation angle."
    },
    {
      question: "Can I rotate multiple images at once with different angles?",
      answer: "Yes! Our batch image rotator lets you process unlimited images simultaneously, each with individual rotation angles. Perfect for correcting camera orientation issues in photo collections."
    },
    {
      question: "What rotation angles are supported for image correction?",
      answer: "You can rotate images by 90°, 180°, or 270° clockwise or counter-clockwise. Perfect for fixing sideways photos, upside-down images, and any camera orientation problems."
    },
    {
      question: "Is there any limit to how many images I can rotate for free?",
      answer: "No limits! Our free online image rotator offers unlimited processing with no watermarks, no registration required. Rotate as many images as you need, completely free forever."
    }
  ];

  const getRotatedCount = () => files.filter((file) => getRotation(file.id) !== 0).length;

  const getRotationSavings = () => {
    if (rotatedFiles.length === 0) return { saved: 0, percentage: 0, originalTotal: 0, rotatedTotal: 0 };
    const originalTotal = rotatedFiles.reduce((t, f) => t + f.originalSize, 0);
    const rotatedTotal = rotatedFiles.reduce((t, f) => t + f.rotatedSize, 0);
    const saved = originalTotal - rotatedTotal;
    const pct = originalTotal > 0 ? ((saved / originalTotal) * 100).toFixed(1) : 0;
    return { saved, percentage: pct, originalTotal, rotatedTotal };
  };

  const savings = getRotationSavings();

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
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          <div className={`${files.length === 0 && !rotatedFiles.length ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${files.length === 0 && !rotatedFiles.length ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Free Image Rotator Online"
                description="Rotate JPEG, PNG, WebP images with live preview"
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
              {files.length === 0 && !rotatedFiles.length && (
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
                            {isRotateLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your images here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isRotateLimitReached} fileInputRef={fileInputRef} title="Select Image files" />
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
              {files.length > 0 && !rotatedFiles.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 sm:mb-6"
                >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
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

                    {/* Rotation Controls Header */}
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-sky-300" />
                          <div>
                            <h4 className="text-white text-lg">Rotation Controls</h4>
                            <p className="text-xs text-gray-100">
                              {getRotatedCount()} of {files.length} images will be rotated
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-100">Rotate All:</span>
                          <button
                            onClick={() => rotateAll("ccw")}
                            className="p-2 bg-sky-900 border border-sky-700 hover:bg-sky-400 text-white rounded-lg transition-all cursor-pointer"
                            title="Rotate all counter-clockwise"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => rotateAll("cw")}
                            className="p-2 bg-sky-900 border border-sky-700 hover:bg-sky-400 text-white rounded-lg transition-all cursor-pointer"
                            title="Rotate all clockwise"
                          >
                            <RotateCw className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Image Previews Grid with Rotation */}
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto place-content-center">
                        <AnimatePresence>
                          {files.map((file) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              whileHover={{ scale: 1.02 }}
                              className="bg-cyan-700 rounded-lg border border-sky-700 hover:border-sky-500/60 overflow-hidden w-full max-w-60 m-auto"
                            >
                              <div className="relative overflow-hidden">
                                <div
                                  className="transition-transform duration-300 ease-out aspect-square bg-sky-900 overflow-hidden w-full flex"
                                  style={{ transform: `rotate(${getRotation(file.id)}deg)` }}
                                >
                                  {file.previewUrl && (
                                    <img
                                      src={file.previewUrl}
                                      alt="Preview"
                                      className="max-w-full max-h-full object-contain m-auto"
                                      style={{
                                        maxWidth: getRotation(file.id) % 180 === 90 ? '70%' : '90%',
                                        maxHeight: getRotation(file.id) % 180 === 90 ? '70%' : '90%',
                                      }}
                                      draggable={false}
                                      onDragStart={(e) => e.preventDefault()}
                                    />
                                  )}
                                </div>
                                {getRotation(file.id) !== 0 && (
                                  <Badge title={`${getRotation(file.id)}°`} />
                                )}
                                <XDeleteButton handleRemove={() => handleRemoveFile(file.id)} title="Remove Image" />
                              </div>
                              <div className="p-3">
                                <p className="font-medium text-white truncate text-sm mb-2">{file.fileName}</p>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-100 truncate">
                                    {file.width}×{file.height}px
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => rotateFile(file.id, "ccw")}
                                      className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer"
                                      title="Rotate counter-clockwise"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => rotateFile(file.id, "cw")}
                                      className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer"
                                      title="Rotate clockwise"
                                    >
                                      <RotateCw className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-2">
                                  {[0, 90, 180, 270].map((angle) => (
                                    <button
                                      key={angle}
                                      onClick={() => setFileAngle(file.id, angle)}
                                      className={`flex-1 px-2 py-1 text-xs rounded transition-all cursor-pointer ${getRotation(file.id) === angle
                                        ? "bg-sky-400 text-white"
                                        : "text-gray-100 bg-sky-900 border border-sky-500"
                                        }`}
                                    >
                                      {angle}°
                                    </button>
                                  ))}
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

              {/* Rotation Results Section */}
              {rotatedFiles.length > 0 && (
                <ResultSection
                  title="Rotation Complete!"
                  subtitle={`• ${rotatedFiles.length} file${rotatedFiles.length !== 1 ? 's' : ''}`}
                  onDownload={rotatedFiles.length > 1 ? handleDownloadAll : () => handleDownloadOne(rotatedFiles[0])}
                  downloadButtonText={rotatedFiles.length > 1 ? "Download All" : "Download"}
                  onStartOver={handleStartOver}
                  summaryTitle="Rotation Summary"
                  summaryItems={[
                    {
                      value: rotatedFiles.length,
                      label: "Images Rotated",
                      valueColor: "white"
                    },
                    {
                      value: getFileSize(savings.originalTotal),
                      label: "Original Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: getFileSize(savings.rotatedTotal),
                      label: "Rotated Size",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Quality Preserved",
                      valueColor: "green-400"
                    },
                  ]}
                />
              )}

              {/* Rotate Button */}
              {files.length > 0 && !rotatedFiles.length && (
                <ActionButton
                  disabled={isProcessing || isRotateLimitReached || getRotatedCount() === 0}
                  handleAction={handleRotate}
                  className={isProcessing || isRotateLimitReached || getRotatedCount() === 0 ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Rotating..."
                  title={`Rotate ${getRotatedCount() === 1 ? "Image" : "Images"}`}
                />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title={`Rotating ${getRotatedCount()} ${getRotatedCount() === 1 ? "Image" : "Images"}`}
                description="Applying lossless rotation with quality preservation..."
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + WhyChoose + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Online Image Rotator - Rotate JPEG, PNG, WebP Images"
        description="Our free online image rotator offers lossless 90°, 180°, 270° rotation with live preview. Perfect for correcting sideways photos, fixing camera orientation, and adjusting image alignment for social media, websites, and documents. Batch rotate unlimited images with individual angle control and quality preservation."
        imageUrl={toolCTA}
        imageAlt="Free online image rotator tool interface"
        title="Why Choose Our Free Image Rotator"
        subtitle="Experience professional-grade image rotation with our feature-rich, user-friendly tool designed for photographers, real estate agents, designers, and casual users alike."
        reasons={rotateReasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title="How To Rotate Images Online for Free"
          stepOne="Upload Your Images"
          stepOneDes="Select or drag & drop JPEG, PNG, WebP files"
          stepTwo="Set Rotation Angles"
          stepTwoDes="Click rotation buttons or select 90°, 180°, 270°"
          stepThree="Preview & Adjust"
          stepThreeDes="See live preview and adjust angles as needed"
          stepFour="Download Results"
          stepFourDes="Get perfectly rotated images ready for use"
        />
      </div>

      {/* FAQ Section */}
      <FAQSection
        faqItems={faqItems}
        title="Free Image Rotator FAQs"
      />
    </div>
  );
}