import { useState, useRef, useEffect, useCallback } from "react";
const { motion, AnimatePresence } = await import("framer-motion");
import { useSelector, useDispatch } from 'react-redux';
import { FileText, Lock } from "lucide-react";
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  downloadPDF,
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
  getPDFPassword,
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "./ErrorMessage";
import FAQSection from "./FAQSection";
import HowToSection from "./HowToSection";
import PasswordModal from "./PasswordModal";
import ProcessingOverlay from "./ProcessingOverlay";
import WhyChooseSection from "./WhyChooseSection";
import { ChangeButton, RemoveButton, SelectButton, ActionButton } from "./Buttons";
import Badge from "./Badge";
import UploadProgressBar from "./UploadProgressBar";
import ResultSection from "./ResultSection";
import ToolHeader from "./ToolHeader";

export default function PDFPageEditor({
  actionType = 'extract', // 'extract' or 'delete'
  title = "PDF Page Editor",
  description = "Edit your PDF pages",
  processFunction,
  resultFileNameSuffix = "_processed",
  faqItems = [],
  howToTitle = "How To Edit Pages from PDF Online for Free",
  howToSteps = {
    stepOne: "Upload PDF",
    stepOneDes: "Select or drag and drop your PDF file",
    stepTwo: "Select Pages",
    stepTwoDes: "Click on pages you want to edit",
    stepThree: "Process Pages",
    stepThreeDes: "Click to process selected pages",
    stepFour: "Download Result",
    stepFourDes: "Get your processed PDF instantly",
  },
  toolDetails = {
    mainTitle: "Edit PDF Documents",
    mainDescription: "Edit your PDF files.",
    features: [],
    useCases: [],
    featuresGrid: []
  },
  // Component customization
  selectionIcon: SelectionIcon,
  actionVerb = "Process",
  validateSelection = () => null,
  showRemainingCount = false,
  // New props for SplitPDF theme
  reasons = [],
  iconColorClasses = [],
  primaryColor = "sky",
  toolCTA,
  toolImageAlt = "PDF tool illustration",
}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);

  // Redux hooks for usage tracking
  const dispatch = useDispatch();
  const isLimitReached = useSelector(isUsageLimitReached(actionType));

  // Drag and drop event handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isLimitReached) {
        setDragActive(true);
      }
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [isLimitReached]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isLimitReached) {
      setError(`Daily PDF ${actionType} limit reached. Please log in for unlimited usage.`);
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcessing(files[0]);
    }
  }, [isLimitReached, actionType]);

  // Clean up memory when component unmounts
  useEffect(() => {
    return () => {
      cleanupAllBlobUrls();
    };
  }, []);

  const uid = (() => {
    let n = Date.now();
    return () => `${n++}`;
  })();

  // Comprehensive memory cleanup function
  const cleanupAllBlobUrls = () => {
    previews.forEach(p => {
      if (p.previewUrl) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });

    if (processedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(processedBlob));
    }
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setSelectedPages([]);
    setProcessedBlob(null);
    setUploadProgress(0);
    setProcessProgress(0);
    setError('');
    setEncryptedFiles({});
  };

  // File processing with encrypted PDF support
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
      // Check if PDF is encrypted
      const encryptionInfo = await isPDFEncrypted(file);
      if (encryptionInfo.encrypted) {
        setCurrentEncryptedFile({
          file,
          encryptionInfo
        });
        setShowPasswordModal(true);
        return;
      }

      // If not encrypted, process normally
      await processPDFFile(file);
    } catch (err) {
      setError('Failed to process PDF: ' + err.message);
      setUploadProgress(0);
    }
  };

  const processPDFFile = async (file, password = null) => {
    try {
      setUploadProgress(10);
      const fileId = `${file.name}-${file.size}`;

      // Store password if provided
      if (password) {
        setPDFPassword(fileId, password);
      }

      const pageCount = await getPageCount(file, password);
      setUploadProgress(30);

      setPdfFile({ file, pageCount });

      const arr = [];
      for (let i = 1; i <= pageCount; i++) {
        const progress = 30 + Math.floor((i / pageCount) * 60);
        setUploadProgress(progress);

        const gen = await generatePDFPreview(file, i, 0.4, "JPEG", password);
        arr.push({
          id: uid(),
          pageNumber: i,
          previewUrl: gen.previewUrl,
        });
      }

      setPreviews(arr);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError('Failed to process PDF: ' + err.message);
      setUploadProgress(0);
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File input handler
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLimitReached) {
      setError(`Daily PDF ${actionType} limit reached. Please log in for unlimited usage.`);
      return;
    }

    await handleFileProcessing(file);
  };

  // ---------- Page selection logic ----------
  const togglePage = (pageNum) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((n) => n !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const selectAllPages = () => {
    if (pdfFile) {
      setSelectedPages(Array.from({ length: pdfFile.pageCount }, (_, i) => i + 1));
    }
  };

  const clearSelection = () => {
    setSelectedPages([]);
  };

  // ---------- Process logic ----------
  const handleProcess = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile || selectedPages.length === 0) return;

    // Check usage limits
    if (isLimitReached) {
      setError(`Daily PDF ${actionType} limit reached. Please log in for unlimited usage.`);
      return;
    }

    // Custom validation
    const validationError = validateSelection(selectedPages, pdfFile.pageCount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setProcessProgress(0);
    setError('');

    try {
      // Simulate progress during processing
      const progressInterval = setInterval(() => {
        setProcessProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Check if file is encrypted and has valid password
      const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
      const encryptedFile = encryptedFiles[fileId];
      const password = encryptedFile?.encrypted ? getPDFPassword(fileId) : null;

      const blob = await processFunction(pdfFile.file, selectedPages, password);

      clearInterval(progressInterval);
      setProcessProgress(100);

      setProcessedBlob(blob);
      const filename = pdfFile.file.name.replace(".pdf", `${resultFileNameSuffix}.pdf`);
      downloadPDF(blob, filename);

      // Clear original previews to free memory
      previews.forEach(p => {
        if (p.previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      setPreviews([]);

      // Increment usage counter
      dispatch(incrementUsage(actionType));

      setTimeout(() => {
        setProcessProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError(`Failed to ${actionType} pages: ` + err.message);
      setProcessProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedBlob) {
      const filename = `${pdfFile.file.name.replace(".pdf", "")}${resultFileNameSuffix}.pdf`;
      downloadPDF(processedBlob, filename);
    }
  };

  const handleRemoveFile = () => {
    cleanupFileData();
    setPdfFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveResult = () => {
    cleanupFileData();
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const getRemainingPageCount = () => {
    if (!pdfFile) return 0;
    return pdfFile.pageCount - selectedPages.length;
  };

  // Count selected
  const selectedCount = selectedPages.length;

  // Get color classes based on primaryColor
  const getColorClasses = () => {
    const colors = {
      sky: {
        bg: 'bg-sky-400',
        hover: 'hover:bg-sky-400/90',
        dark: 'bg-sky-800',
        linearFrom: 'from-sky-800',
        linearTo: 'to-blue-950',
        border: 'border-sky-700 hover:border-sky-500/60',
      },
    };

    return colors[primaryColor] || colors.sky;
  };

  const colorClasses = getColorClasses();

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
          <div className={`${!pdfFile && !processedBlob ? "flex flex-col justify-center" : ""}`}>
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !processedBlob ? "" : "hidden"}`}
            >
              <ToolHeader
                title={title}
                description={description}
              />
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {!pdfFile && !processedBlob && (
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
                            {isLimitReached
                              ? "Daily limit reached. Log in for unlimited usage"
                              : "Drop your file here or click to browse"}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
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
                        className="absolute inset-0 bg-teal-500/20 rounded-xl pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Selected File Card */}
              {pdfFile && !processedBlob && (
                <div className="mb-4 sm:mb-6">
                  <div className={`${colorClasses.dark} rounded-xl shadow-lg overflow-hidden`}>
                    <div className={`bg-linear-to-r ${colorClasses.linearFrom} ${colorClasses.linearTo} px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Selected File
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {pdfFile.pageCount} page{pdfFile.pageCount !== 1 ? 's' : ''}
                          </span>
                          {encryptedFiles[`${pdfFile.file.name}-${pdfFile.file.size}`]?.encrypted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-green-900/50 text-green-300 border border-green-700">
                              <Lock className="w-3 h-3" />
                              <span className="hidden xs:inline">Unlocked</span>
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

                    {/* Page Thumbnails */}
                    {/* Controls bar (Select All / Clear All) */}
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 px-3 sm:px-4 md:px-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <h3 className="text-white text-lg">
                            Select Pages to {actionVerb}
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • Click pages to toggle selection
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={selectAllPages}
                            className="px-4 py-2 bg-sky-900 text-white rounded-lg text-sm font-medium hover:bg-sky-500 border border-sky-700 transition cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            onClick={clearSelection}
                            className="px-4 py-2 bg-red-800/80 hover:bg-red-700/80 border border-red-700/50 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto">
                        {!previews.length && (
                          [1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-full bg-sky-900/50 min-h-70 max-w-60 m-auto rounded-lg"></div>
                          ))
                        )}
                        {previews.map((p) => {
                          const isSelected = selectedPages.includes(p.pageNumber);
                          return (
                            <motion.div
                              key={p.id}
                              className={`bg-cyan-700 rounded-lg border ${colorClasses.border} overflow-hidden w-full max-w-60 m-auto sm:m-0 cursor-pointer`}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => togglePage(p.pageNumber)}
                              layout
                            >
                              {/* Preview container */}
                              <div className="relative aspect-square bg-sky-900 flex items-center justify-center w-full overflow-hidden">
                                {p.previewUrl && (
                                  <img
                                    src={p.previewUrl}
                                    alt={`Page ${p.pageNumber}`}
                                    className="max-w-full max-h-full object-contain m-auto"
                                    style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    draggable={false}
                                    onDragStart={(e) => e.preventDefault()}
                                  />
                                )}

                                {/* Selection badge */}
                                {isSelected && (
                                  <Badge title="Selected" />
                                )}

                                {/* Icon pill top-right */}
                                <div className={`absolute top-1.5 right-1.5 z-10 p-1 rounded-full text-white transition-colors cursor-pointer ${!isSelected ? "bg-gray-800/80" : actionType === "delete" ? "bg-red-600" : "bg-cyan-500"} ${actionType === "delete" ? "hover:bg-red-500" : "hover:bg-cyan-500"}`}>
                                  <SelectionIcon size={14} />
                                </div>

                                {/* Selection Overlay */}
                                {isSelected && (
                                  <div className={`absolute inset-0 pointer-events-none ${actionType === "delete" ? "bg-red-500/30" : "bg-green-500/30"}`} />
                                )}
                              </div>
                              <div className="p-3">
                                <p className="font-medium text-white truncate text-sm mb-2">Page {p.pageNumber}</p>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-100">
                                    PDF • {pdfFile.pageCount} pages
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      <div className="mt-6 text-center text-sm text-gray-100">
                        {selectedCount} page{selectedCount !== 1 ? 's' : ''} selected for {actionType.toLowerCase()}
                        {showRemainingCount && ` • ${getRemainingPageCount()} ${getRemainingPageCount() === 1 ? "page" : "pages"} will remain`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Process Button */}
              {pdfFile && !processedBlob && (
                <ActionButton
                  disabled={isProcessing || isLimitReached || selectedPages.length === 0}
                  handleAction={handleProcess}
                  className={isProcessing || isLimitReached || selectedPages.length === 0 ? "cursor-not-allowed" : `cursor-pointer`}
                  isProcessing={isProcessing}
                  process={`${actionVerb}ing...`}
                  title={`${actionVerb} Page${selectedPages.length !== 1 ? 's' : ''}`} />
              )}

              {/* Processed Result Card */}
              {processedBlob && (
                <ResultSection
                  title="PDF Successfully Modified!"
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleRemoveResult} summaryTitle={`${actionType === 'extract' ? 'Extraction Summary' : actionType === 'delete' ? 'Deletion Summary' : 'Processing Summary'}`}
                  summaryItems={[
                    {
                      value: selectedPages.length,
                      label: `Page${selectedPages.length !== 1 ? 's' : ''} ${actionType === 'extract' ? 'Extracted' : actionType === 'delete' ? 'Removed' : 'Processed'}`,
                      valueColor: "white"
                    },
                    {
                      value: "✓",
                      label: "Complete",
                      valueColor: "teal-400"
                    },
                    {
                      value: getRemainingPageCount(),
                      label: `Page${getRemainingPageCount() !== 1 ? 's' : ''} ${actionType === 'extract' ? 'Removed' : actionType === 'delete' ? 'Remaining' : 'Remaining'}`,
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
                progress={processProgress}
                title={`${actionVerb}ing PDF Pages`}
                description={`${actionVerb}ing ${selectedPages.length} pages...`}
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle={toolDetails.mainTitle}
        description={toolDetails.mainDescription}
        imageUrl={toolCTA}
        imageAlt={toolImageAlt}
        title={`Why choose our PDF ${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} Tool`}
        subtitle="Experience the best PDF editing with our feature-rich, user-friendly tool designed for both professionals and casual users."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
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

      {/* FAQ Section */}
      <FAQSection faqItems={faqItems} title={`PDF ${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} FAQs`} />
    </div>
  );
}