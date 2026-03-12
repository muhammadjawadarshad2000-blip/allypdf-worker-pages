import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  Image,
  Shield,
  Settings,
  Zap,
  Smartphone,
  Globe,
  Stars,
  Clock,
} from "lucide-react";
import {
  getFileSize,
  validateImage,
  generateImagePreview,
  downloadImagesAsZip,
  downloadImage,
  convertBetweenImages
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "./ErrorMessage";
import FAQSection from "./FAQSection";
import HowToSection from "./HowToSection";
import ProcessingOverlay from "./ProcessingOverlay";
import WhyChooseSection from "./WhyChooseSection";
import { SelectButton, ChangeButton, RemoveButton, ActionButton, XDeleteButton } from "./Buttons";
import UploadProgressBar from "./UploadProgressBar";
import ResultSection from "./ResultSection";
import ToolHeader from "./ToolHeader";

export default function ImageConverter({
  title,
  description,
  format,
  type,
  faqItems = [],
  howToTitle = "",
  initialOptions = {},
  acceptedFormatsText = "JPEG, PNG, WebP, GIF, BMP, AVIF",
  reasons = [],
  toolCTA,
}) {
  const [files, setFiles] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [conversionOptions, setConversionOptions] = useState(initialOptions);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isConvertLimitReached = useSelector(isUsageLimitReached(format));

  const generateFileId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const cleanupAllFiles = () => {
    files.forEach(file => file.previewUrl && URL.revokeObjectURL(file.previewUrl));
    convertedFiles.forEach(file => file.previewUrl && URL.revokeObjectURL(file.previewUrl));
    setFiles([]);
    setConvertedFiles([]);
    setUploadProgress(0);
    setConversionProgress(0);
    setError('');
    setHasAutoDownloaded(false);
  };

  const cleanupFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    const convertedFile = convertedFiles.find(f => f.id === fileId);
    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
    if (convertedFile?.previewUrl) URL.revokeObjectURL(convertedFile.previewUrl);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setConvertedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    inputKey.current = Date.now();
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if ((e.type === "dragenter" || e.type === "dragover") && !isConvertLimitReached) {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);

    if (isConvertLimitReached) {
      setError(`Daily ${format} conversion limit reached. Please log in for unlimited usage.`);
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
      setError(errors.join('\n'));
      if (validFiles.length === 0) return;
    }

    setError('');
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

    if (errors.length > 0) setError(errors.join('\n'));

    setFiles(prev => [...prev, ...processedFiles]);
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (isConvertLimitReached) {
      setError(`Daily ${format} conversion limit reached. Please log in for unlimited usage.`);
      return;
    }

    handleFilesProcessing(selectedFiles);
    resetFileInput();
  };

  const handleConvert = async () => {
    window.scrollTo(0, 0);
    if (files.length === 0 || !convertBetweenImages) return;

    if (isConvertLimitReached) {
      setError(`Daily ${format} conversion limit reached. Please log in for unlimited usage.`);
      return;
    }

    setIsProcessing(true);
    setConversionProgress(0);
    setError('');
    setConvertedFiles([]);
    setHasAutoDownloaded(false);

    try {
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + (90 / Math.max(files.length, 1));
        });
      }, 200);

      const convertedResults = await Promise.all(
        files.map(async (fileData, index) => {
          const convertedData = await convertBetweenImages(fileData.file, conversionOptions, type);
          setConversionProgress(prev => Math.min(prev + (90 / Math.max(files.length, 1)), 90));
          dispatch(incrementUsage(format));
          return {
            ...convertedData,
            previewUrl: URL.createObjectURL(convertedData.blob),
            id: fileData.id,
            originalName: fileData.file.name,
            fileName: convertedData.fileName,
            index: index + 1
          };
        })
      );

      clearInterval(progressInterval);
      setConversionProgress(100);
      setConvertedFiles(convertedResults);

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to convert images to ${format.replace('imageTo', '').toUpperCase()}: ${err.message}`);
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  // Single file download
  const handleDownload = (file) => {
    downloadImage(file.blob, file.fileName);
  };

  // Download all (ZIP when supported, else sequential)
  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) return;

    const zipData = convertedFiles.map(f => ({
      blob: f.blob,
      fileName: f.fileName,
      pageNumber: f.index || 1
    }));

    switch (format) {
      case 'imageToPng': return downloadImagesAsZip(zipData, 'allypdf_converted');
      case 'imageToJPG': return downloadImagesAsZip(zipData, 'allypdf_converted');
      case 'imageToWebp': return downloadImagesAsZip(zipData, 'allypdf_converted');
      default:
        for (let i = 0; i < convertedFiles.length; i++) {
          handleDownload(convertedFiles[i]);
          if (i < convertedFiles.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
    }
  };

  // Auto-download effect - triggers once when conversion completes
  useEffect(() => {
    if (convertedFiles.length > 0 && !isProcessing && !hasAutoDownloaded) {
      setHasAutoDownloaded(true);

      const autoDownload = () => {
        if (convertedFiles.length === 1) {
          handleDownload(convertedFiles[0]);
        } else {
          handleDownloadAll();
        }
      }

      return autoDownload;
    }
  }, [convertedFiles, isProcessing, hasAutoDownloaded]);

  const handleRemoveFile = (fileId) => cleanupFile(fileId);

  const handleStartOver = () => {
    cleanupAllFiles();
    resetFileInput();
  };

  const handleAddMoreFiles = () => fileInputRef.current?.click();

  const handleOptionChange = (option, value) => {
    setConversionOptions(prev => ({ ...prev, [option]: value }));
  };

  const toggleFaq = (index) => setExpandedFaq(expandedFaq === index ? null : index);

  useEffect(() => {
    return () => {
      files.forEach(file => file.previewUrl && URL.revokeObjectURL(file.previewUrl));
      convertedFiles.forEach(file => file.previewUrl && URL.revokeObjectURL(file.previewUrl));
    };
  }, [files, convertedFiles]);

  const getTotalFileSize = () => files.reduce((total, file) => total + file.fileSize, 0);
  const getTotalConvertedSize = () => convertedFiles.reduce((total, file) => total + (file.blob?.size || 0), 0);

  const getOutputFormatName = () => {
    switch (format) {
      case 'imageToPng': return 'PNG';
      case 'imageToJPG': return 'JPG';
      case 'imageToWebp': return 'WebP';
      default: return format.replace('imageTo', '').toUpperCase();
    }
  };

  // Default reasons if not provided
  const defaultReasons = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your images are processed locally in your browser with military-grade encryption. No files are ever uploaded to our servers - your privacy is guaranteed.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast Conversion",
      description: "Convert images in seconds with our optimized processing engine. Experience instant results without compromising on quality or performance.",
    },
    {
      icon: Stars,
      title: "Smart Quality Optimization",
      description: "Our intelligent algorithms automatically adjust settings for optimal results. Get perfectly balanced images that maintain quality while reducing file size.",
    },
    {
      icon: Smartphone,
      title: "Multi-Device Ready",
      description: "Works flawlessly on desktop, tablet, and mobile. Responsive design ensures perfect conversion experience on any device.",
    },
    {
      icon: Globe,
      title: "Universal Format Support",
      description: "Convert between all popular image formats with 100% accuracy. Supports JPEG, PNG, WebP, GIF, BMP, TIFF and more.",
    },
    {
      icon: Clock,
      title: "Zero Wait Time",
      description: "No registration, no watermarks, no subscriptions. Start converting immediately with our completely free forever service.",
    }
  ];

  const converterReasons = reasons && reasons.length > 0 ? reasons : defaultReasons;

  const iconColorClasses = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-indigo-500"
  ];

  const renderOptionsPanel = () => {
    const formatName = getOutputFormatName();

    switch (format) {
      case 'imageToPng':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-white">
                  PNG Compression Level
                </label>
                <span className="text-lg font-medium text-white">
                  {((conversionOptions.quality || 1.0) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={(conversionOptions.quality || 1.0) * 100}
                onChange={(e) => handleOptionChange('quality', parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
              />
              <div className="flex justify-between text-xs text-gray-100 mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conversionOptions.preserveTransparency !== false}
                  onChange={(e) => handleOptionChange('preserveTransparency', e.target.checked)}
                  className="w-4 h-4 rounded accent-sky-400"
                />
                <span className="text-sm text-white">Preserve Transparency</span>
              </label>
              <p className="text-xs text-gray-100 mt-1">
                Keep transparent backgrounds (recommended for logos and graphics)
              </p>
            </div>
          </div>
        );
      case 'imageToJPG':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-white">
                  JPG Quality Level
                </label>
                <span className="text-lg font-medium text-white">
                  {((conversionOptions.quality || 0.92) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={(conversionOptions.quality || 0.92) * 100}
                onChange={(e) => handleOptionChange('quality', parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
              />
              <div className="flex justify-between text-xs text-gray-100 mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>
          </div>
        );
      case 'imageToWebp':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-white">
                  WebP Quality Level
                </label>
                <span className="text-lg font-medium text-white">
                  {((conversionOptions.quality || 0.80) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={(conversionOptions.quality || 0.80) * 100}
                onChange={(e) => handleOptionChange('quality', parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
              />
              <div className="flex justify-between text-xs text-gray-100 mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const defaultFAQ = [
    {
      question: `What image formats can I convert to ${getOutputFormatName()}?`,
      answer: `You can convert JPEG, PNG, WebP, GIF, BMP, and TIFF files to ${getOutputFormatName()} format with 100% accuracy and quality preservation.`
    },
    {
      question: `Will my images lose quality during conversion?`,
      answer: `No. Our advanced conversion algorithm maintains maximum quality while optimizing file size. You can adjust quality settings to your preference.`
    },
    {
      question: `How many images can I convert at once?`,
      answer: `Convert unlimited images simultaneously! Our batch processing handles multiple files efficiently, saving you time.`
    },
    {
      question: `Is there any file size limit?`,
      answer: `No limits! Convert images of any size, from small icons to high-resolution photos, completely free.`
    },
    {
      question: `Are my images secure during conversion?`,
      answer: `Absolutely. All processing happens locally in your browser with enterprise-grade security. Your files never leave your device.`
    },
  ];

  const defaultHowToSteps = {
    stepOne: "Upload Your Images",
    stepOneDes: "Drag & drop or click to select image files",
    stepTwo: "Customize Settings",
    stepTwoDes: "Adjust quality, format, and other preferences",
    stepThree: `Convert to ${getOutputFormatName()}`,
    stepThreeDes: "Click once to process all images instantly",
    stepFour: "Download Results",
    stepFourDes: "Get optimized images ready for use"
  };

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

          <div className={`${files.length === 0 && !convertedFiles.length ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${files.length === 0 && !convertedFiles.length ? "" : "hidden"}`}
            >
              <ToolHeader
                title={title}
                description={description}
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
              {files.length === 0 && !convertedFiles.length && (
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
                            {isConvertLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your images here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isConvertLimitReached} fileInputRef={fileInputRef} title="Select Image files" />
                          </div>
                          <p className="text-xs sm:text-sm text-gray-100 text-center px-2">
                            {acceptedFormatsText}
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
              {files.length > 0 && !convertedFiles.length && (
                <div className="mb-4 sm:mb-6" >
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
                              draggable={true}
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

              {/* Conversion Settings Section */}
              {files.length > 0 && !convertedFiles.length && (
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
                          {getOutputFormatName()} Conversion Settings
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {renderOptionsPanel()}
                        <div className="bg-cyan-900/50 rounded-lg p-3 border border-cyan-700">
                          <p className="text-sm text-gray-200">
                            {format === 'imageToPng'
                              ? "PNG offers lossless compression with transparency support - perfect for logos, graphics, and screenshots."
                              : format === 'imageToJPG'
                                ? "JPG provides excellent compression for photographs while maintaining visual quality - ideal for web and print."
                                : "WebP delivers superior compression (25-35% smaller than JPG) with modern browser support - optimal for websites and apps."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Conversion Results Section */}
              {convertedFiles.length > 0 && (
                <ResultSection
                  title="Conversion Complete!"
                  subtitle={`• ${convertedFiles.length} file${convertedFiles.length !== 1 ? 's' : ''}`}
                  onDownload={convertedFiles.length > 1 ? handleDownloadAll : () => handleDownload(convertedFiles[0])}
                  downloadButtonText={convertedFiles.length > 1 ? "Download All" : "Download"}
                  onStartOver={handleStartOver} summaryTitle="Conversion Summary"
                  summaryItems={[
                    {
                      value: convertedFiles.length,
                      label: "Images Converted",
                      valueColor: "white"
                    },
                    {
                      value: getFileSize(getTotalFileSize()),
                      label: "Original Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: getFileSize(getTotalConvertedSize()),
                      label: "Converted Size",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Success Rate",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Convert Button */}
              {files.length > 0 && !convertedFiles.length && (
                <ActionButton
                  disabled={isProcessing || isConvertLimitReached || files.length === 0}
                  handleAction={handleConvert}
                  className={isProcessing || isConvertLimitReached || files.length === 0
                    ? "cursor-not-allowed"
                    : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Converting..."
                  title={`Convert to ${getOutputFormatName()}`} />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title={`Converting ${files.length} ${files.length === 1 ? "Image" : "Images"}`}
                description={`Transforming your images to ${getOutputFormatName()} format...`}
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle={`Free ${getOutputFormatName()} Image Converter Online`}
        description={`Convert any image format to ${getOutputFormatName()} quickly and easily. Our advanced conversion algorithm maintains visual quality while ensuring compatibility with all devices and platforms. Perfect for web use, printing, sharing, and storage.`}
        imageUrl={toolCTA}
        imageAlt={`Image to ${getOutputFormatName()} conversion illustration`}
        title={`Why choose our ${getOutputFormatName()} Converter`}
        subtitle={`Experience the best image conversion with our feature-rich, user-friendly tool designed for both professionals and casual users.`}
        reasons={converterReasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title={howToTitle || `How To Convert Images to ${getOutputFormatName()} Online for Free`}
          stepOne={defaultHowToSteps.stepOne}
          stepOneDes={defaultHowToSteps.stepOneDes}
          stepTwo={defaultHowToSteps.stepTwo}
          stepTwoDes={defaultHowToSteps.stepTwoDes}
          stepThree={defaultHowToSteps.stepThree}
          stepThreeDes={defaultHowToSteps.stepThreeDes}
          stepFour={defaultHowToSteps.stepFour}
          stepFourDes={defaultHowToSteps.stepFourDes}
        />
      </div>

      {/* FAQ Section */}
      <FAQSection
        faqItems={faqItems.length > 0 ? faqItems : defaultFAQ}
        title={`${getOutputFormatName()} Image Converter FAQs`}
      />
    </div>
  );
}