import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Shield,
  Zap,
  Stars,
  Globe,
  FileText,
  Layers,
} from "lucide-react";
import {
  validateImageForPDF,
  downloadPDF,
  generateImagePreview,
  convertImageToPDF
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "./ErrorMessage";
import FAQSection from "./FAQSection";
import HowToSection from "./HowToSection";
import ProcessingOverlay from "./ProcessingOverlay";
import WhyChooseSection from "./WhyChooseSection";
import { ChangeButton, RemoveButton, SelectButton, XDeleteButton, ActionButton } from "./Buttons";
import Badge from "./Badge";
import UploadProgressBar from "./UploadProgressBar";
import ResultSection from "./ResultSection";
import ToolHeader from "./ToolHeader";

export default function ImageToPDFConverter({
  title,
  description,
  acceptTypes,
  fileTypeName,
  multipleFileTypeName,
  usageKey,
  howToSteps,
  faqItems,
  reasons = [],
  toolCTA,
  defaultFileName = "images_to_pdf"
}) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageOrder, setImageOrder] = useState([]);
  const [convertedPdfBlob, setConvertedPdfBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Drag & reorder state (for cards)
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const [pdfOptions, setPdfOptions] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 20
  });

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Generate unique component ID for file upload tracking
  const componentId = useId().replace(/:/g, '-');
  const uploadIdRef = useRef(0);

  // Redux hooks for usage tracking
  const dispatch = useDispatch();
  const isConvertLimitReached = useSelector(isUsageLimitReached(usageKey));

  // Clean up memory
  const cleanupAllBlobUrls = () => {
    previews.forEach(p => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setConvertedPdfBlob(null);
    setImages([]);
    setImageOrder([]);
    setUploadProgress(0);
    setConversionProgress(0);
    setError('');
    setIsDragging(false);
    setDragIndex(null);
    setHoverIndex(null);
  };

  // Drag and drop handlers for file upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.type === "dragenter" || e.type === "dragover") && !isConvertLimitReached) {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Ignore drops coming from internal card drag
    try {
      const internal = e.dataTransfer.getData('application/x-image-internal');
      if (internal === '1') {
        return;
      }
    } catch {
      // ignore
    }

    if (isConvertLimitReached) {
      setError(`Daily ${fileTypeName} to PDF conversion limit reached. Please log in for unlimited usage.`);
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    if (files && files.length > 0) {
      handleFilesProcessing(files);
    }
  };

  // File processing
  const handleFilesProcessing = async (files) => {
    if (!files || files.length === 0) return;

    // Validate each image
    for (const file of files) {
      const err = validateImageForPDF(file, fileTypeName);
      if (err) {
        setError(err);
        return;
      }
    }

    await processImageFiles(files);
  };

  const processImageFiles = async (files) => {
    try {
      setUploadProgress(10);
      const newPreviews = [];
      const newImages = [];
      const newOrder = [];

      // Generate a unique upload session ID
      const uploadSessionId = `${componentId}-${Date.now()}-${uploadIdRef.current++}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = 10 + Math.floor((i * 90) / files.length);
        setUploadProgress(progress);

        try {
          const preview = await generateImagePreview(file);

          // Generate unique ID with session and file info
          const fileId = `${uploadSessionId}-${i}-${file.name}-${file.size}-${file.lastModified}`;

          newPreviews.push({
            id: fileId,
            previewUrl: preview.previewUrl,
            fileName: file.name,
            fileSize: file.size,
            width: preview.width,
            height: preview.height,
            format: fileTypeName,
            originalIndex: i + previews.length,
            uploadSessionId: uploadSessionId,
            file
          });

          newImages.push({
            id: fileId,
            file,
            uploadSessionId: uploadSessionId
          });

          newOrder.push(i + previews.length);
        } catch (err) {
          console.error(`Failed to process ${fileTypeName} ${file.name}:`, err);
          setError(`Failed to process ${fileTypeName} ${file.name}: ${err.message}`);
          setUploadProgress(0);
          return;
        }
      }

      const updatedPreviews = [...previews, ...newPreviews];
      const updatedImages = [...images, ...newImages];
      const updatedOrder = [...imageOrder, ...newOrder];

      setPreviews(updatedPreviews);
      setImages(updatedImages);
      setImageOrder(updatedOrder);
      setUploadProgress(100);

      // Reset file input to allow same file re-upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError(`Failed to process ${multipleFileTypeName}: ` + err.message);
      setUploadProgress(0);

      // Reset file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (isConvertLimitReached) {
      setError(`Daily ${fileTypeName} to PDF conversion limit reached. Please log in for unlimited usage.`);
      return;
    }

    handleFilesProcessing(files);
  };

  // --- Drag to reorder cards ---
  const handleCardDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Mark as internal drag so global drop can ignore
    e.dataTransfer.setData('application/x-image-internal', '1');
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleCardDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverIndex(index);
  };

  const handleCardDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    const from = Number(dragIndexStr);
    if (Number.isNaN(from) || from === dropIndex) {
      setIsDragging(false);
      setHoverIndex(null);
      setDragIndex(null);
      return;
    }

    // Reorder the imageOrder array
    const newOrder = [...imageOrder];
    const draggedItem = newOrder[from];
    newOrder.splice(from, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setImageOrder(newOrder);

    setIsDragging(false);
    setHoverIndex(null);
    setDragIndex(null);
  };

  const handleCardDragEnd = () => {
    setIsDragging(false);
    setHoverIndex(null);
    setDragIndex(null);
  };

  // Order helpers
  const hasOrderChanged = () => {
    const originalOrder = Array.from({ length: images.length }, (_, i) => i);
    return JSON.stringify(originalOrder) !== JSON.stringify(imageOrder);
  };

  const resetOrder = () => {
    if (images.length > 0) {
      setImageOrder(Array.from({ length: images.length }, (_, i) => i));
    }
  };

  const removeImage = (index) => {
    const imageId = imageOrder[index];
    const previewToRemove = previews[imageId];

    if (previewToRemove?.previewUrl) URL.revokeObjectURL(previewToRemove.previewUrl);

    setPreviews(prev => prev.filter((_, idx) => idx !== imageId));
    setImages(prev => prev.filter((_, idx) => idx !== imageId));
    setImageOrder(prev => {
      const newOrder = prev.filter(id => id !== imageId);
      return newOrder.map(id => (id > imageId ? id - 1 : id));
    });
  };

  const removeAllImages = () => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setImages([]);
    setImageOrder([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConvertToPDF = async () => {
    window.scrollTo(0, 0);
    if (images.length === 0) return;

    if (isConvertLimitReached) {
      setError(`Daily ${fileTypeName} to PDF conversion limit reached. Please log in for unlimited usage.`);
      return;
    }

    setIsProcessing(true);
    setConversionProgress(0);
    setError('');

    try {
      // Reorder images based on imageOrder
      const orderedImages = imageOrder.map(index => images[index].file);

      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const blob = await convertImageToPDF(orderedImages, pdfOptions, fileTypeName);

      clearInterval(progressInterval);
      setConversionProgress(100);

      setConvertedPdfBlob(blob);

      const filename = `${images[0].file.name.replace(/\.[^/.]+$/, "")}.pdf` || `${defaultFileName}.pdf`;
      downloadPDF(blob, filename);

      // Clean up previews since result is ready
      previews.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPreviews([]);

      dispatch(incrementUsage(usageKey));

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to convert ${fileTypeName} to PDF: ` + err.message);
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (convertedPdfBlob) {
      const filename = `${images[0].file.name.replace(/\.[^/.]+$/, "")}.pdf` || `${defaultFileName}.pdf`;
      downloadPDF(convertedPdfBlob, filename);
    }
  };

  const handleStartOver = () => {
    cleanupFileData();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMoreImages = () => {
    if (isConvertLimitReached) {
      setError(`Daily ${fileTypeName} to PDF conversion limit reached. Please log in for unlimited usage.`);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Update PDF options
  const handleOptionChange = (option, value) => {
    setPdfOptions(prev => ({ ...prev, [option]: value }));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAllBlobUrls();
  }, []);

  // Default reasons if not provided
  const defaultReasons = [
    {
      icon: Shield,
      title: "Secure Local Processing",
      description: "Your images are converted locally in your browser with end-to-end encryption. No files ever leave your device, ensuring complete privacy and security for sensitive documents.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast PDF Creation",
      description: "Convert images to PDF in seconds with our optimized conversion engine. Batch process multiple images simultaneously without compromising quality or speed.",
    },
    {
      icon: FileText,
      title: "Professional Document Output",
      description: "Create polished, professional PDF documents perfect for business, academic, or personal use. Our converter maintains image quality while optimizing file size.",
    },
    {
      icon: Layers,
      title: "Flexible Page Arrangement",
      description: "Drag-and-drop reordering, customizable page sizes, orientation options, and margin controls give you complete control over your PDF layout and presentation.",
    },
    {
      icon: Stars,
      title: "Universal Format Support",
      description: "Convert JPEG, PNG, WebP, GIF, BMP, and TIFF images to PDF with 100% format compatibility. Perfect for photos, screenshots, graphics, and documents.",
    },
    {
      icon: Globe,
      title: "Cross-Platform Accessibility",
      description: "Access your PDFs anywhere, on any device. Create documents that work seamlessly on Windows, Mac, iOS, Android, and all modern web browsers.",
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

          <div className={`${images.length === 0 ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${images.length === 0 ? "" : "hidden"}`}
            >
              <ToolHeader
                title={title}
                description={description}
              />
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              onChange={handleFileInput}
              multiple
              className="hidden"
              key={`file-input-${componentId}`}
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {images.length === 0 && !convertedPdfBlob && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 sm:mb-6">
                  <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                    <div className="w-full px-2 sm:px-0">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="text-center w-full">
                          <p className="text-gray-100 mb-3 sm:mb-4 text-center text-sm sm:text-base">
                            {isConvertLimitReached
                              ? 'Daily conversion limit reached. Log in for unlimited usage'
                              : `Drop your ${multipleFileTypeName} here or click to browse`}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isConvertLimitReached} fileInputRef={fileInputRef} title={`Select ${fileTypeName} files`} />
                          </div>
                          {acceptTypes &&
                            <p className="text-xs sm:text-sm text-gray-100 text-center px-2">
                              {acceptTypes.replace(/image\/\w+|\./g, '').toUpperCase().replace(/,/g, ', ')}
                            </p>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {dragActive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-teal-500/20 rounded-xl pointer-events-none" />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Selected Images Card with Drag & Drop Reordering */}
              {images.length > 0 && !convertedPdfBlob && (
                <div className="mb-4 sm:mb-6">
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Selected {multipleFileTypeName}
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {images.length} file{images.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreImages} title="Add More" />
                          <RemoveButton handleRemoveFile={removeAllImages} title="Clear All" />
                        </div>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    {/* Image Grid with Drag & Drop */}
                    {images.length > 0 && !convertedPdfBlob && (
                      <div className="p-4 sm:p-6">
                        {/* Order status and reset */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-3 sm:px-4 md:px-6">
                          <h3 className="text-lg text-white">Drag images to reorder them in your preferred sequence</h3>
                          {hasOrderChanged() && (
                            <button
                              onClick={resetOrder}
                              className="px-3 py-2 bg-sky-900 text-sky-300 rounded-lg text-sm font-medium hover:bg-sky-800/30 transition cursor-pointer mt-2 sm:mt-0"
                            >
                              Reset to Original Order
                            </button>
                          )}
                        </div>

                        {hasOrderChanged() && (
                          <div className="mb-4 p-3 mx-3 sm:mx-4 md:mx-6 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-300 text-sm">
                              <span>🔄</span>
                              <span>Custom order applied - images will be arranged in PDF as shown below</span>
                            </div>
                          </div>
                        )}

                        {/* Grid of draggable tiles */}
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto">
                          <AnimatePresence>
                            {imageOrder.map((imageIdx, idx) => {
                              const preview = previews[imageIdx];
                              if (!preview) return null;

                              const isDragged = isDragging && dragIndex === idx;
                              const isDropTarget = hoverIndex === idx && !isDragged;

                              return (
                                <motion.div
                                  key={preview.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  whileHover={{ scale: 1.02 }}
                                  draggable
                                  onDragStart={(e) => handleCardDragStart(e, idx)}
                                  onDragOver={(e) => handleCardDragOver(e, idx)}
                                  onDrop={(e) => handleCardDrop(e, idx)}
                                  onDragEnd={handleCardDragEnd}
                                  className={[
                                    "relative bg-cyan-700 rounded-lg border transition-all duration-150 overflow-hidden cursor-move select-none w-full max-w-60 m-auto",
                                    isDragged ? "opacity-50 ring-2 ring-sky-500 ring-offset-2 ring-offset-gray-900" : "",
                                    isDropTarget ? "border-sky-500 shadow-[0_0_0_2px_rgba(45,212,191,0.4)]" : "border-sky-700 hover:border-sky-500/60",
                                  ].join(" ")}
                                >

                                  {/* <div className="absolute top-2 left-2 px-2 py-1 bg-sky-400 text-white text-xs rounded-full cursor-move z-10">
                                    #{idx + 1}
                                  </div> */}
                                  <Badge title={`#${idx + 1}`} />

                                  <XDeleteButton handleRemove={() => removeImage(idx)} title="Remove Image" />

                                  {/* Preview area */}
                                  <div className="relative aspect-square bg-sky-900 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={preview.previewUrl}
                                      alt={`${fileTypeName} ${idx + 1}`}
                                      className="max-w-full max-h-full object-contain m-auto"
                                      style={{ maxWidth: '90%', maxHeight: '90%' }}
                                      draggable={false}
                                      onDragStart={(e) => e.preventDefault()}
                                    />
                                  </div>

                                  {/* Card footer info */}
                                  <div className="p-3">
                                    <p className="font-light text-white truncate text-sm mb-2">{preview.fileName}</p>
                                    <div className="flex items-center justify-between">
                                      <div className="text-[11px] font-light text-gray-100">
                                        {preview.width}×{preview.height} • {Math.round(preview.fileSize / 1024)}KB
                                      </div>
                                      {/* Move left/right buttons for mobile accessibility */}
                                      <div className="flex items-center gap-1 sm:hidden">
                                        <button
                                          onClick={() => {
                                            if (idx > 0) {
                                              const newOrder = [...imageOrder];
                                              [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
                                              setImageOrder(newOrder);
                                            }
                                          }}
                                          className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer"
                                          title="Move left"
                                          disabled={idx === 0}
                                        >
                                          <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (idx < imageOrder.length - 1) {
                                              const newOrder = [...imageOrder];
                                              [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
                                              setImageOrder(newOrder);
                                            }
                                          }}
                                          className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer"
                                          title="Move right"
                                          disabled={idx === imageOrder.length - 1}
                                        >
                                          <ArrowRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>

                        {/* Order summary */}
                        <div className="mt-6 text-center py-3 sm:py-4">
                          <div className="inline-block bg-sky-900/50 rounded-lg px-6 py-3 border border-sky-700">
                            <div className="text-sm text-gray-100 mb-2">Current image order in PDF:</div>
                            <div className="flex flex-wrap justify-center gap-1">
                              {imageOrder.map((_, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <div className="bg-sky-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                  </div>
                                  {index < imageOrder.length - 1 && (
                                    <span className="mx-1 text-sky-400">→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-gray-100 mt-2">
                              {hasOrderChanged() ? "Custom order applied" : "Original upload order"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PDF Options */}
              {images.length > 0 && !convertedPdfBlob && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="text-white text-md sm:text-lg">
                          PDF Document Settings
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">Page Size</label>
                          <select
                            value={pdfOptions.pageSize}
                            onChange={(e) => handleOptionChange('pageSize', e.target.value)}
                            className="w-full px-3 py-2 bg-sky-900 border border-cyan-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm cursor-pointer"
                          >
                            <option value="a4">A4 (Standard)</option>
                            <option value="letter">Letter (US)</option>
                            <option value="legal">Legal</option>
                            <option value="a3">A3</option>
                            <option value="a5">A5</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">Orientation</label>
                          <select
                            value={pdfOptions.orientation}
                            onChange={(e) => handleOptionChange('orientation', e.target.value)}
                            className="w-full px-3 py-2 bg-sky-900 border border-cyan-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm cursor-pointer"
                          >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">Margin (pixels)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={pdfOptions.margin}
                            onChange={(e) => handleOptionChange('margin', parseInt(e.target.value))}
                            className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
                          />
                          <div className="flex justify-between text-xs text-gray-100 mt-1">
                            <span>0px</span>
                            <span>{pdfOptions.margin}px</span>
                            <span>100px</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-cyan-900/50 rounded-lg p-3 border border-cyan-700 mt-4">
                        <p className="text-sm text-gray-200">
                          Customize your PDF document layout for optimal presentation. Choose between standard page sizes, portrait/landscape orientation, and adjust margins for professional formatting.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Conversion Results Section */}
              {convertedPdfBlob && (
                <ResultSection
                  title="PDF Creation Complete!"
                  subtitle={`• ${images.length} image${images.length !== 1 ? 's' : ''} converted`}
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleStartOver} summaryTitle="PDF Document Summary"
                  summaryItems={[
                    {
                      value: images.length,
                      label: "Images Converted",
                      valueColor: "white"
                    },
                    {
                      value: pdfOptions.pageSize.toUpperCase(),
                      label: "Page Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: pdfOptions.orientation,
                      label: "Orientation",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Success Rate",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Convert to PDF Button */}
              {images.length > 0 && !convertedPdfBlob && (
                <ActionButton
                  disabled={isProcessing || isConvertLimitReached}
                  handleAction={handleConvertToPDF}
                  className={isProcessing || isConvertLimitReached
                    ? "bg-gray-700 cursor-not-allowed"
                    : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Converting..."
                  title="Convert to PDF" />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title={`Creating PDF Document`}
                description={`Processing ${images.length} ${multipleFileTypeName.toLowerCase()} with your selected settings...`}
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle={`Free ${fileTypeName} to PDF Converter Online`}
        description={`Convert ${fileTypeName} images to professional PDF documents quickly and easily. Our advanced conversion algorithm maintains visual quality while creating compact, shareable PDF files perfect for business, academic, or personal use.`}
        imageUrl={toolCTA}
        imageAlt={`${fileTypeName} to PDF conversion illustration`}
        title={`Why choose our ${fileTypeName} to PDF Converter`}
        subtitle={`Experience the best image-to-PDF conversion with our feature-rich, user-friendly tool designed for both professionals and casual users.`}
        reasons={converterReasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title={howToSteps.title || `How To Convert ${fileTypeName} to PDF Online for Free`}
          stepOne={howToSteps.stepOne || "Upload Images"}
          stepOneDes={howToSteps.stepOneDes || `Select or drag and drop your ${fileTypeName} files`}
          stepTwo={howToSteps.stepTwo || "Arrange & Customize"}
          stepTwoDes={howToSteps.stepTwoDes || "Drag to reorder images and adjust PDF settings"}
          stepThree={howToSteps.stepThree || "Convert to PDF"}
          stepThreeDes={howToSteps.stepThreeDes || "Click once to create your PDF document"}
          stepFour={howToSteps.stepFour || "Download PDF"}
          stepFourDes={howToSteps.stepFourDes || "Get your professional PDF file instantly"}
        />
      </div>

      {/* FAQ Section */}
      <FAQSection
        faqItems={faqItems}
        title={`${fileTypeName} to PDF Converter FAQs`}
      />
    </div>
  );
}