import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText,
  Image,
  Settings2,
  Shield,
  Gift,
  Zap,
  Key,
  Cpu,
  Clock,
  Lock,
} from "lucide-react";
import {
  getFileSize,
  validatePDF,
  generatePDFPreview,
  getPageCount,
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
  getPDFPassword,
  downloadImage,
  convertPDFToImage,
  downloadImagesAsZip
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "./ErrorMessage";
import FAQSection from "./FAQSection";
import HowToSection from "./HowToSection";
import PasswordModal from "./PasswordModal";
import ProcessingOverlay from "./ProcessingOverlay";
import WhyChooseSection from "./WhyChooseSection";
import { ActionButton, ChangeButton, RemoveButton, SelectButton } from "./Buttons";
import toolCTA from "/tools-cta/pdf-to-jpg.png";
import Badge from "./Badge";
import UploadProgressBar from "./UploadProgressBar";
import ResultSection from "./ResultSection";
import ToolHeader from "./ToolHeader";

export default function PDFToImageConverter({
  // Configuration props
  title = "Convert to Image",
  description = "Upload a PDF file and convert each page to images",
  imageFormat = "PNG",
  actionType = "pdfToPng",
  faqItems = [],
  howToTitle = "How To Convert PDF to Image Online for Free",
  howToSteps = {
    stepOne: "Upload PDF",
    stepOneDes: "Select or drag and drop your PDF file",
    stepTwo: "Set Options",
    stepTwoDes: "Choose image quality and resolution settings",
    stepThree: "Convert",
    stepThreeDes: "Click convert and wait just seconds",
    stepFour: "Download",
    stepFourDes: "Get your image files as ZIP instantly",
  },
  freeToolSection = {
    title: "Free Convert PDF to Images Online with Live Preview",
    description: "Easily transform PDF documents into high-quality image formats (PNG, JPG) for web use, presentations, and digital content. Our free online PDF to image converter preserves text clarity, image quality, and formatting while offering adjustable resolution and compression settings. Perfect for designers, marketers, students, and professionals who need to convert PDF pages to images quickly and efficiently.",
    imageUrl: toolCTA,
    imageAlt: "PDF to Image conversion illustration"
  },
  reasons = [
    {
      icon: Shield,
      title: "Secure PDF Processing",
      description: "Your PDF documents never leave your browser. All image conversion happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "100% Free Image Converter",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF to image tool is completely free forever. Convert unlimited PDF pages to images.",
    },
    {
      icon: Cpu,
      title: "High-Quality Conversion",
      description: "Preserve text clarity and image resolution with adjustable DPI settings. Convert PDF to crystal-clear images suitable for printing and digital use.",
    },
    {
      icon: Zap,
      title: "Instant Browser Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration. Start converting PDF to images in seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly convert password-protected PDFs to images. Our tool recognizes encrypted files and prompts for passwords, ensuring secure processing.",
    },
    {
      icon: Clock,
      title: "Batch Page Conversion",
      description: "Convert multiple PDF pages to images simultaneously. Save time by processing entire documents with a single click.",
    },
  ],
  iconColorClasses = [
    "bg-sky-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-teal-500",
    "bg-purple-500"
  ],
  // Default conversion options
  defaultScale = 2.0,
  defaultQuality = 1.0,
  scaleOptions = [
    { value: 1.0, label: "Low (1x)" },
    { value: 1.5, label: "Medium (1.5x)" },
    { value: 2.0, label: "High (2x)" },
    { value: 3.0, label: "Very High (3x)" },
  ],
  qualityOptions = [
    { value: 0.7, label: "Low (70%)" },
    { value: 0.8, label: "Medium (80%)" },
    { value: 0.9, label: "High (90%)" },
    { value: 0.95, label: "Very High (95%)" },
    { value: 1.0, label: "Maximum (100%)" },
  ],
}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [convertedImages, setConvertedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [conversionOptions, setConversionOptions] = useState({
    scale: defaultScale,
    quality: defaultQuality,
    pageRange: 'all'
  });
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);
  const inputKey = useRef(Date.now());

  // Redux hooks for usage tracking
  const dispatch = useDispatch();
  const isConvertLimitReached = useSelector(isUsageLimitReached(actionType));

  // Unique ID generator
  const uid = (() => {
    let n = Date.now();
    return () => `${n++}`;
  })();

  // Clean up memory
  const cleanupAllBlobUrls = () => {
    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    convertedImages.forEach(image => image.previewUrl && URL.revokeObjectURL(image.previewUrl));
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPreview(null);
    setConvertedImages([]);
    setPdfFile(null);
    setUploadProgress(0);
    setConversionProgress(0);
    setError('');
    setEncryptedFiles({});
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setModalPassword('');
    setModalPasswordError('');
    setHasAutoDownloaded(false);
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
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isConvertLimitReached) {
      setError(`Daily PDF to ${imageFormat} limit reached. Please log in for unlimited usage.`);
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileProcessing(files[0]);
    }
  };

  // Process PDF file (generate preview)
  const processPDFFile = async (file, password = null) => {
    try {
      setUploadProgress(10);
      const fileId = `${file.name}-${file.size}`;

      if (password) setPDFPassword(fileId, password);

      const pageCount = await getPageCount(file, password);
      setUploadProgress(50);

      setPdfFile({ file, pageCount });

      const gen = await generatePDFPreview(file, 1, 0.4, imageFormat, password);
      setPreview({
        id: uid(),
        pageNumber: 1,
        previewUrl: gen.previewUrl,
      });

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError('Failed to process PDF: ' + err.message);
      setUploadProgress(0);
    }
  };

  // File processing with encryption detection
  const handleFileProcessing = async (file) => {
    if (!file) return;

    const err = validatePDF(file);
    if (err) {
      setError(err);
      return;
    }

    cleanupFileData();
    setError('');

    try {
      const encryptionInfo = await isPDFEncrypted(file);
      if (encryptionInfo?.encrypted) {
        setCurrentEncryptedFile({ file, encryptionInfo });
        setShowPasswordModal(true);
        return;
      }

      await processPDFFile(file);
    } catch (err) {
      setError('Failed to process PDF: ' + err.message);
      setUploadProgress(0);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isConvertLimitReached) {
      setError(`Daily PDF to ${imageFormat} limit reached. Please log in for unlimited usage.`);
      return;
    }

    await handleFileProcessing(file);
    resetFileInput();
  };

  // Password modal handlers
  const handlePasswordSubmit = async () => {
    if (!currentEncryptedFile) return;

    const { file } = currentEncryptedFile;

    if (!modalPassword.trim()) {
      setModalPasswordError('Password is required');
      return;
    }

    try {
      const result = await testPDFPassword(file, modalPassword);
      if (result.valid) {
        await processPDFFile(file, modalPassword);

        const fileId = `${file.name}-${file.size}`;
        setEncryptedFiles(prev => ({
          ...prev,
          [fileId]: { encrypted: true, passwordValid: true }
        }));

        setModalPassword('');
        setModalPasswordError('');
        setShowPasswordModal(false);
        setCurrentEncryptedFile(null);
      } else {
        setModalPasswordError('Invalid password. Please try again.');
      }
    } catch (err) {
      setModalPasswordError('Error testing password: ' + err.message);
    }
  };

  const handlePasswordCancel = () => {
    setModalPassword('');
    setModalPasswordError('');
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setUploadProgress(0);
    resetFileInput();
  };

  const handleConvertToImage = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;

    if (isConvertLimitReached) {
      setError(`Daily PDF to ${imageFormat} limit reached. Please log in for unlimited usage.`);
      return;
    }

    const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
    const encryptedFile = encryptedFiles[fileId];
    const password = encryptedFile?.encrypted ? getPDFPassword(fileId) : null;

    setIsProcessing(true);
    setConversionProgress(0);
    setError('');
    setConvertedImages([]);
    setHasAutoDownloaded(false);

    try {
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const imageBlobs = await convertPDFToImage(
        pdfFile.file,
        {
          scale: conversionOptions.scale,
          quality: conversionOptions.quality,
          pageNumbers: conversionOptions.pageRange === 'all' ? 'all'
            : Array.from({ length: pdfFile.pageCount }, (_, i) => i + 1)
        },
        imageFormat,
        password
      );

      clearInterval(progressInterval);
      setConversionProgress(100);

      const imagesWithPreview = imageBlobs.map((image, index) => ({
        ...image,
        previewUrl: URL.createObjectURL(image.blob),
        id: `${imageFormat.toLowerCase()}-${index}-${Date.now()}`,
        pageNumber: index + 1,
        fileName: image.fileName || `${pdfFile.file.name.replace(/\.pdf$/i, '')}_page_${index + 1}.${imageFormat.toLowerCase()}`
      }));

      setConvertedImages(imagesWithPreview);

      if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
      setPreview(null);

      dispatch(incrementUsage(actionType));

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to convert PDF to ${imageFormat}: ` + err.message);
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (convertedImages.length > 0) {
      await downloadImagesAsZip(convertedImages, `allypdf_converted-pdf-to-${imageFormat.toLowerCase()}`);
    }
  };

  // Download a single image
  const handleDownloadOne = (img) => {
    downloadImage(img.blob, `${pdfFile?.file?.name?.replace(/\.pdf$/i, '')}.${imageFormat.toLowerCase()}`);
  };

  useEffect(() => {
    if (convertedImages.length > 0 && !isProcessing && !hasAutoDownloaded) {
      setHasAutoDownloaded(true);

      const autoDownload = () => {
        if (convertedImages.length === 1) {
          handleDownloadOne(convertedImages[0]);
        } else {
          handleDownloadAll();
        }
      }

      return autoDownload;
    }
  }, [convertedImages, isProcessing, hasAutoDownloaded]);

  const handleRemoveFile = () => {
    cleanupFileData();
    resetFileInput();
  };

  const handleStartOver = () => {
    cleanupFileData();
    resetFileInput();
  };

  const handleAddMoreFiles = () => fileInputRef.current?.click();

  // Update conversion options
  const handleOptionChange = (option, value) => {
    setConversionOptions(prev => ({ ...prev, [option]: value }));
  };

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal && modalPasswordRef.current) {
      setTimeout(() => {
        modalPasswordRef.current?.focus();
      }, 100);
    }
  }, [showPasswordModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllBlobUrls();
    };
  }, []);

  // Calculate total file size
  const calculateTotalSize = () => {
    return convertedImages.reduce((total, img) => total + (img.blob?.size || 0), 0);
  };

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area with linear Background */}
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
          <div className={`${!pdfFile && convertedImages.length === 0 ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && convertedImages.length === 0 ? "" : "hidden"}`}
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
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {!pdfFile && convertedImages.length === 0 && (
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
                              : 'Drop your PDF file here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isConvertLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
                          </div>
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

              {/* File Selected Card - Blue theme */}
              {pdfFile && convertedImages.length === 0 && (
                <div className="mb-4 sm:mb-6">
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Selected File
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {pdfFile.pageCount} {pdfFile.pageCount === 1 ? "page" : "pages"}
                          </span>
                          {encryptedFiles[`${pdfFile.file.name}-${pdfFile.file.size}`]?.encrypted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                              <Lock className="w-3 h-3" />
                              <span className="hidden xs:inline">Encrypted</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreFiles} />
                          <RemoveButton handleRemoveFile={handleRemoveFile} />
                        </div>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    {/* Preview and Options Section */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PDF Preview */}
                        {!preview && (
                          <div className="w-full bg-sky-900/50 min-h-70 max-w-3xs rounded-lg flex justify-center m-auto"></div>
                        )}
                        {preview && (
                          <div className="flex justify-center w-full max-w-3xs m-auto">
                            <div className="bg-cyan-700 rounded-lg border border-sky-700 overflow-hidden max-w-xs">
                              <div className="relative aspect-square bg-sky-900 overflow-hidden flex items-center justify-center">
                                <img
                                  src={preview.previewUrl}
                                  alt="PDF Preview"
                                  className="max-w-full max-h-full object-contain"
                                  style={{ maxWidth: "90%", maxHeight: "90%" }}
                                  draggable={false}
                                  onDragStart={(e) => e.preventDefault()}
                                />
                                <Badge title="Preview" />
                              </div>
                              <div className="p-3">
                                <p className="font-medium text-white truncate text-sm">
                                  {pdfFile.file.name}
                                </p>
                                <p className="text-xs text-gray-100">
                                  {pdfFile.pageCount <= 1 ? "1 page" : `${pdfFile.pageCount} pages`}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Options Section */}
                        <div className="space-y-4">
                          <div className="bg-sky-900/50 rounded-lg border border-sky-700 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Settings2 className="w-5 h-5 text-sky-300" />
                              <h4 className="text-lg font-medium text-white">
                                Conversion Settings
                              </h4>
                            </div>

                            {/* Scale selector */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  Scale (Quality)
                                </label>
                                <select
                                  value={conversionOptions.scale}
                                  onChange={(e) => handleOptionChange('scale', parseFloat(e.target.value))}
                                  className="cursor-pointer w-full px-3 py-2 bg-sky-800 border border-sky-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm"
                                >
                                  {scaleOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Quality selector */}
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  {imageFormat} Quality
                                </label>
                                <select
                                  value={conversionOptions.quality}
                                  onChange={(e) => handleOptionChange('quality', parseFloat(e.target.value))}
                                  className="cursor-pointer w-full px-3 py-2 bg-sky-800 border border-sky-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm"
                                >
                                  {qualityOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Pages selector */}
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  Pages to Convert
                                </label>
                                <select
                                  value={conversionOptions.pageRange}
                                  onChange={(e) => handleOptionChange('pageRange', e.target.value)}
                                  className="cursor-pointer w-full px-3 py-2 bg-sky-800 border border-sky-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm"
                                >
                                  <option value="all">All Pages</option>
                                  <option value="first">First 10 Pages</option>
                                  <option value="custom">Custom Range</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Image className="w-5 h-5 text-sky-300 mt-0.5" />
                              <div>
                                <p className="text-white font-medium mb-1">
                                  {imageFormat} Conversion Ready
                                </p>
                                <p className="text-sm text-white">
                                  Converting {pdfFile?.pageCount || 0} page{pdfFile.pageCount !== 1 ? "s" : ""} will create {pdfFile?.pageCount || 0} {imageFormat} file{pdfFile.pageCount !== 1 ? "s" : ""}.
                                  Higher scale = better quality but larger file size.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-100">
                            * Your file is processed securely. Images are converted in high quality.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Convert Button */}
              {pdfFile && convertedImages.length === 0 && (
                <ActionButton
                  disabled={isProcessing || isConvertLimitReached}
                  handleAction={handleConvertToImage}
                  className={isProcessing || isConvertLimitReached ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Converting..."
                  title={`Convert to ${imageFormat}`} />
              )}

              {/* Conversion Results */}
              {convertedImages.length > 0 && (
                <ResultSection
                  title="Conversion Complete!"
                  onDownload={convertedImages.length > 1 ? handleDownloadAll : () => handleDownloadOne(convertedImages[0])}
                  downloadButtonText={`${convertedImages.length > 1 ? "Download All" : "Download"}`}
                  onStartOver={handleStartOver} summaryTitle="Conversion Summary"
                  summaryItems={[
                    {
                      value: convertedImages.length,
                      label: `${convertedImages.length === 1 ? "Image" : "Images"}`,
                      valueColor: "white"
                    },
                    {
                      value: getFileSize(calculateTotalSize()),
                      label: "Total Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: imageFormat,
                      label: "Format",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Success Rate",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Password Modal */}
              <PasswordModal
                showPasswordModal={showPasswordModal}
                currentEncryptedFile={currentEncryptedFile}
                modalPasswordRef={modalPasswordRef}
                modalPassword={modalPassword}
                setModalPassword={setModalPassword}
                handleSubmit={handlePasswordSubmit}
                handleCancel={handlePasswordCancel}
                error={modalPasswordError}
                setError={setModalPasswordError}
              />

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title={`Converting PDF to ${imageFormat}`}
                description={`Processing ${pdfFile?.pageCount} PDF pages...`}
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
        title={`Why choose our PDF to ${imageFormat} Converter`}
        subtitle="Experience the best PDF to image conversion with our feature-rich, user-friendly tool designed for both professionals and casual users. Live preview makes conversion simple and accurate."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section with White Background */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title={howToTitle}
          stepOne={howToSteps.stepOne}
          stepOneDes={howToSteps.stepOneDes}
          stepTwo={howToSteps.stepTwo}
          stepTwoDes={howToSteps.stepTwoDes}
          stepThree={howToSteps.stepThree}
          stepThreeDes={howToSteps.stepThreeDes}
          stepFour={howToSteps.stepFour}
          stepFourDes={howToSteps.stepFourDes}
        />
      </div>

      {/* FAQ Section with White Background */}
      <div className="bg-white">
        <FAQSection
          theme="light"
          faqItems={faqItems}
          title={`PDF to ${imageFormat} FAQs`}
        />
      </div>
    </div>
  );
}