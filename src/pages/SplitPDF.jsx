import React, { useState, useRef, useEffect } from "react";
const { motion, AnimatePresence } = await import("framer-motion");
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText,
  Scissors,
  Unlock,
  Shield,
  Gift,
  Zap,
  Key,
  Layout,
} from "lucide-react";
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  splitPDF,
  downloadPDFsAsZip,
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
  getPDFPassword,
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import PasswordModal from "../components/PasswordModal";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ChangeButton, RemoveButton, SelectButton, ActionButton } from "../components/Buttons";
import toolCTA from "/tools-cta/split-pdf.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function SplitPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [splitPoints, setSplitPoints] = useState([]);
  const [splitFiles, setSplitFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [splitProgress, setSplitProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);

  // Redux hooks for usage tracking
  const dispatch = useDispatch();
  const isSplitLimitReached = useSelector(isUsageLimitReached('split'));

  const uid = (() => {
    let n = Date.now();
    return () => `${n++}`;
  })();

  // Clean up memory
  const cleanupAllBlobUrls = () => {
    previews.forEach(p => {
      if (p.previewUrl) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });

    splitFiles.forEach(f => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
      if (f.blob) {
        URL.revokeObjectURL(URL.createObjectURL(f.blob));
      }
    });
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setSplitFiles([]);
    setSplitPoints([]);
    setUploadProgress(0);
    setSplitProgress(0);
    setError('');
    setEncryptedFiles({});
    setShowPasswordModal(false);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isSplitLimitReached) {
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

    if (isSplitLimitReached) {
      setError("Daily PDF split limit reached. Please log in for unlimited usage.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcessing(files[0]);
    }
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
        const progress = 30 + Math.floor((i * 60) / pageCount);
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

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isSplitLimitReached) {
      setError("Daily PDF split limit reached. Please log in for unlimited usage.");
      return;
    }

    handleFileProcessing(file);
  };

  // Split logic
  const toggleSplit = (afterPage) => {
    setSplitPoints((prev) =>
      prev.includes(afterPage)
        ? prev.filter((n) => n !== afterPage)
        : [...prev, afterPage].sort((a, b) => a - b)
    );
  };

  const selectAllSplits = () => {
    if (pdfFile && pdfFile.pageCount > 1) {
      setSplitPoints(Array.from({ length: pdfFile.pageCount - 1 }, (_, i) => i + 1));
    }
  };

  const clearSelection = () => {
    setSplitPoints([]);
  };

  const computeRanges = (count, splits) => {
    if (!splits.length) return [{ start: 1, end: count }];
    const pts = [0, ...splits, count];
    const ranges = [];
    for (let i = 0; i < pts.length - 1; i++) {
      ranges.push({ start: pts[i] + 1, end: pts[i + 1] });
    }
    return ranges;
  };

  const handleSplit = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;

    if (isSplitLimitReached) {
      setError("Daily PDF split limit reached. Please log in for unlimited usage.");
      return;
    }

    // Check if file is encrypted and has valid password
    const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
    const encryptedFile = encryptedFiles[fileId];
    const password = encryptedFile?.encrypted ? getPDFPassword(fileId) : null;

    setIsProcessing(true);
    setSplitProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setSplitProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const ranges = computeRanges(pdfFile.pageCount, splitPoints);
      const files = await splitPDF(pdfFile.file, ranges, password);

      clearInterval(progressInterval);
      setSplitProgress(100);

      const processedFiles = files.map((f, i) => ({
        ...f,
        pageCount: f.range.end - f.range.start + 1,
        id: uid(),
        name: `${pdfFile.file.name.replace(".pdf", "")}_part${i + 1}.pdf`
      }));

      setSplitFiles(processedFiles);

      downloadPDFsAsZip(processedFiles, 'allypdf_splited');

      // Clean up previews
      previews.forEach(p => {
        if (p.previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      setPreviews([]);
      setSplitPoints([]);

      dispatch(incrementUsage('split'));

      setTimeout(() => {
        setSplitProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Failed to split PDF: ' + err.message);
      setSplitProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      await downloadPDFsAsZip(splitFiles, 'allypdf_splited');
    } catch (err) {
      setError('Failed to create ZIP file: ' + err.message);
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
    setSplitFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const getSplitCount = () => splitPoints.length + 1;

  // Toggle FAQ
  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
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

  // FAQ Data for Split PDF
  const faqItems = [
    {
      question: "Can I split a PDF at multiple points?",
      answer: "Yes! You can split your PDF at as many points as you need. Just click the scissors icon between pages to add split points."
    },
    {
      question: "Will the split PDFs maintain original quality?",
      answer: "Absolutely. All split files retain the exact same quality, formatting, and resolution as the original PDF."
    },
    {
      question: "Can I split password-protected PDFs?",
      answer: "Yes, our tool fully supports encrypted PDFs. You'll be prompted to enter the password before splitting."
    },
    {
      question: "How many files can I create from a single PDF?",
      answer: "You can split a PDF into as many separate files as needed. There's no limit to the number of split points."
    },
    {
      question: "Are there any file size limitations?",
      answer: "No, there are no file size limitations. You can split PDFs of any size for free."
    }
  ];

  // Reasons for choosing our split tool
  const splitReasons = [
    {
      icon: Shield,
      title: "Ultra-Secure Processing",
      description: "Your documents never leave your browser. All splitting happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "Completely Free Forever",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF splitter is 100% free with no limitations. Use it as much as you want without ever paying.",
    },
    {
      icon: Scissors,
      title: "Precise Page Selection",
      description: "Split your PDF at exact page boundaries with visual previews. Choose specific pages or split after every page with a single click.",
    },
    {
      icon: Zap,
      title: "Instant Browser-Based Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration, and no waiting times. Start splitting PDFs in seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly split password-protected PDFs. Our tool recognizes encrypted files and prompts for passwords, ensuring you can split secured documents without compromising protection.",
    },
    {
      icon: Layout,
      title: "Visual Page Previews",
      description: "See thumbnail previews of every page before splitting. Each page displays a preview, helping you identify exact split points visually.",
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

          <div className={`${!pdfFile && !splitFiles.length ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !splitFiles.length ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Split PDF Files"
                description="Split PDF into multiple files by selecting specific pages or split points"
              />
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {!pdfFile && !splitFiles.length && (
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
                            {isSplitLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your file here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isSplitLimitReached} fileInputRef={fileInputRef} title="Select PDf file" />
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

              {/* File Selected Card */}
              {pdfFile && !splitFiles.length && (
                <div className="mb-4 sm:mb-6" >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Selected File
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {pdfFile.pageCount} page{pdfFile.pageCount !== 1 ? "s" : ""}
                          </span>
                          {encryptedFiles[`${pdfFile.file.name}-${pdfFile.file.size}`]?.encrypted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-green-900/50 text-green-300 border border-green-700">
                              <Unlock className="w-3 h-3" />
                              <span className="hidden xs:inline">Unlocked</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreFiles} title="Change File" />
                          <RemoveButton handleRemoveFile={handleRemoveFile} title="Remove" />
                        </div>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    {/* Split Points Selection */}
                    {pdfFile && !splitFiles.length && (
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
                          <h3 className="text-lg text-white">
                            Click scissors between pages to split PDF
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={selectAllSplits}
                              className="px-3 py-2 bg-sky-900 text-sky-300 rounded-lg text-sm font-medium hover:bg-sky-900/30 transition cursor-pointer"
                            >
                              Split All Pages
                            </button>
                            <button
                              onClick={clearSelection}
                              className="px-3 py-2 bg-red-900/50 hover:bg-red-700/50 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        {/* Pages grid with split controls */}
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-3 max-w-11/12 m-auto items-center">
                          {!previews.length && (
                            [1, 2, 3, 4].map((i) => (
                              <div key={i} className="w-full bg-sky-900/50 min-h-70 max-w-4/5 rounded-lg"></div>
                            ))
                          )}
                          <AnimatePresence>
                            {previews.map((p, idx) => (
                              <div key={p.id} className="flex gap-6 sm:gap-3 flex-col sm:flex-row  justify-between w-full max-w-70 self-center items-center m-auto sm:m-0">
                                <React.Fragment>
                                  <div className="bg-cyan-700 rounded-lg border border-sky-700 hover:border-sky-500/60 overflow-hidden w-4/5 sm:self-start">
                                    <motion.div
                                      className="relative aspect-square bg-sky-900 overflow-hidden transition w-full flex"
                                      whileHover={{ scale: 1.02 }}
                                      layout
                                    >
                                      <img
                                        src={p.previewUrl}
                                        alt={`Page ${p.pageNumber}`}
                                        className="max-w-full max-h-full object-contain m-auto"
                                        style={{ maxWidth: '90%', maxHeight: '90%' }}
                                        draggable={false}
                                        onDragStart={(e) => e.preventDefault()}
                                      />
                                      {/* Position badge */}
                                      <Badge title={`#${p.pageNumber}`} />
                                    </motion.div>
                                    <div className="p-3">
                                      <p className="font-medium text-white truncate text-sm mb-2">Page {p.pageNumber}</p>
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-100">
                                          PDF • {pdfFile.pageCount} pages
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Divider + scissors between pages */}
                                  {idx < previews.length - 1 && (
                                    <div className="flex sm:flex-col items-center justify-center relative w-4/5 sm:w-10">
                                      {/* Vertical line for multi-column */}
                                      <div
                                        className={`hidden sm:block md:block lg:block w-0.5 h-36 ${splitPoints.includes(p.pageNumber)
                                          ? "bg-sky-400"
                                          : "border-l-2 border-dotted border-sky-300"
                                          }`}
                                      />
                                      {/* Horizontal line for single column layout */}
                                      <div
                                        className={`block sm:hidden md:hidden lg:hidden w-full h-0.5 ${splitPoints.includes(p.pageNumber)
                                          ? "bg-sky-400"
                                          : "border-t-2 border-dotted border-sky-300"
                                          }`}
                                      />

                                      {/* Scissors in center */}
                                      <button
                                        onClick={() => toggleSplit(p.pageNumber)}
                                        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full p-2 transition ${splitPoints.includes(p.pageNumber)
                                          ? "text-sky-400 scale-110 bg-teal-100"
                                          : "bg-transparent text-sky-400 hover:text-sky-500 hover:bg-teal-100"
                                          } cursor-pointer`}
                                        title={splitPoints.includes(p.pageNumber) ? "Remove Split" : "Split Here"}
                                      >
                                        <Scissors
                                          size={18}
                                          className="block sm:hidden md:hidden lg:hidden"
                                        />
                                        <Scissors
                                          size={18}
                                          className="hidden sm:block md:block lg:block rotate-270"
                                        />
                                      </button>
                                    </div>
                                  )}
                                </React.Fragment>
                              </div>
                            ))}
                          </AnimatePresence>
                        </div>

                        <div className="text-center text-sm text-gray-100 py-8 px-3 sm:px-4">
                          {splitPoints.length} {splitPoints.length !== 1 ? "split points" : "split point"} selected • Will create {getSplitCount()} PDF file{getSplitCount() > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Split Results Section */}
              {splitFiles.length > 0 && (
                <ResultSection
                  title="Split Complete!"
                  subtitle={`• ${splitFiles.length} file${splitFiles.length !== 1 ? 's' : ''}`}
                  onDownload={handleDownloadAll}
                  downloadButtonText="Download All"
                  onStartOver={handleRemoveResult} summaryTitle="Split Summary"
                  summaryItems={[
                    {
                      value: splitFiles.length,
                      label: "Files Created",
                      valueColor: "white"
                    },
                    {
                      value: "✓",
                      label: "Complete",
                      valueColor: "teal-400"
                    },
                    {
                      value: "Zip Archive",
                      label: "Ready",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Success Rate",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Split Button */}
              {pdfFile && !splitFiles.length && (
                <ActionButton
                  disabled={isProcessing || isSplitLimitReached || splitPoints.length === 0}
                  handleAction={handleSplit}
                  className={isProcessing || isSplitLimitReached || splitPoints.length === 0 ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Splitting..."
                  title="Split PDF" />
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
                progress={splitProgress}
                title="Splitting PDF"
                description={`Creating ${getSplitCount()} files from ${pdfFile?.pageCount} pages...`}
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Split PDF Documents into Multiple Files"
        description="Easily divide large PDF files into smaller, more manageable documents. Our free online PDF splitter
        lets you split at specific pages or create separate files for each page while maintaining original
        quality, formatting, and security settings. Perfect for extracting chapters, separating forms, or organizing documents."
        imageUrl={toolCTA}
        imageAlt="Split PDF illustration"
        title="Why choose our PDF Splitter"
        subtitle="Experience the best PDF Splitter with our feature-rich, user-friendly tool designed for
        both professionals and casual users."
        reasons={splitReasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title="How To Split PDF Files Online for Free"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Select Split Points"
          stepTwoDes="Click scissors between pages to split"
          stepThree="Split PDF"
          stepThreeDes="Click split to create multiple files"
          stepFour="Download Results"
          stepFourDes="Get all split PDFs in a ZIP file"
        />
      </div>

      {/* FAQ Section */}
      <FAQSection faqItems={faqItems} title="PDF Splitting FAQs" />
    </div>
  );
}