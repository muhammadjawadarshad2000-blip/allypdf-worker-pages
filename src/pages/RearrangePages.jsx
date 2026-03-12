import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText,
  Lock,
  ArrowLeft,
  ArrowRight,
  Shield,
  Gift,
  Zap,
  Key,
  Layout,
  Move,
  Settings,
} from "lucide-react";
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  rearrangePDFPages,
  downloadPDF,
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
import toolCTA from "/tools-cta/rearrange-pdf-pages.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function RearrangePages() {
  const [pdfFile, setPdfFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [pageOrder, setPageOrder] = useState([]);
  const [rearrangedBlob, setRearrangedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rearrangeProgress, setRearrangeProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Drag & reorder state for pages
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);

  const dispatch = useDispatch();
  const isRearrangeLimitReached = useSelector(isUsageLimitReached('rearrange'));

  const uid = (() => {
    let n = Date.now();
    return () => `${n++}`;
  })();

  // Clean up memory
  const cleanupAllBlobUrls = () => {
    previews.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    if (rearrangedBlob) URL.revokeObjectURL(URL.createObjectURL(rearrangedBlob));
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setRearrangedBlob(null);
    setPageOrder([]);
    setUploadProgress(0);
    setRearrangeProgress(0);
    setError('');
    setEncryptedFiles({});
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.type === "dragenter" || e.type === "dragover") && !isRearrangeLimitReached) setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, [isRearrangeLimitReached]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isRearrangeLimitReached) {
      setError("Daily PDF rearrange limit reached. Please log in for unlimited usage.");
      return;
    }

    // Ignore internal drag operations
    try {
      const internal = e.dataTransfer.getData('application/x-rearrange-internal');
      if (internal === '1') return;
    } catch { }

    const files = e.dataTransfer.files;
    if (files && files[0]) handleFileProcessing(files[0]);
  }, [isRearrangeLimitReached]);

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
      const encryptionInfo = await isPDFEncrypted(file);
      if (encryptionInfo.encrypted) {
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

  const processPDFFile = async (file, password = null) => {
    try {
      setUploadProgress(10);
      const fileId = `${file.name}-${file.size}`;
      if (password) setPDFPassword(fileId, password);

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
          previewUrl: gen.previewUrl
        });
      }

      setPreviews(arr);
      setPageOrder(arr.map(p => p.pageNumber));
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
        setEncryptedFiles(prev => ({ ...prev, [fileId]: { encrypted: true, passwordValid: true } }));

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRearrangeLimitReached) {
      setError("Daily PDF rearrange limit reached. Please log in for unlimited usage.");
      return;
    }

    handleFileProcessing(file);
  };

  // Drag to reorder functionality (like MergePDF)
  const handlePageDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData('application/x-rearrange-internal', '1');
    setIsDragging(true);
    setDragIndex(index);
  };

  const handlePageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverIndex(index);
  };

  const handlePageDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    const from = Number(dragIndexStr);

    if (Number.isNaN(from) || from === dropIndex) {
      setIsDragging(false);
      setHoverIndex(null);
      setDragIndex(null);
      return;
    }

    setPageOrder(prev => {
      const newOrder = [...prev];
      const [movedItem] = newOrder.splice(from, 1);
      newOrder.splice(dropIndex, 0, movedItem);
      return newOrder;
    });

    setIsDragging(false);
    setHoverIndex(null);
    setDragIndex(null);
  };

  const handlePageDragEnd = () => {
    setIsDragging(false);
    setHoverIndex(null);
    setDragIndex(null);
  };

  // Arrow controls (backup)
  const swapPages = (index1, index2) => {
    if (index1 < 0 || index2 < 0 || index1 >= pageOrder.length || index2 >= pageOrder.length) return;
    setPageOrder((prev) => {
      const newOrder = [...prev];
      [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];
      return newOrder;
    });
  };

  const movePageLeft = (index) => {
    if (index <= 0) return;
    swapPages(index, index - 1);
  };

  const movePageRight = (index) => {
    if (index >= pageOrder.length - 1) return;
    swapPages(index, index + 1);
  };

  const resetOrder = () => {
    if (pdfFile) setPageOrder(Array.from({ length: pdfFile.pageCount }, (_, i) => i + 1));
  };

  const hasOrderChanged = () => {
    if (!pdfFile) return false;
    const originalOrder = Array.from({ length: pdfFile.pageCount }, (_, i) => i + 1);
    return JSON.stringify(originalOrder) !== JSON.stringify(pageOrder);
  };

  const handleRearrange = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile || !hasOrderChanged()) return;

    if (isRearrangeLimitReached) {
      setError("Daily PDF rearrange limit reached. Please log in for unlimited usage.");
      return;
    }

    const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
    const encryptedFile = encryptedFiles[fileId];
    const password = encryptedFile?.encrypted ? getPDFPassword(fileId) : null;

    setIsProcessing(true);
    setRearrangeProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setRearrangeProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const blob = await rearrangePDFPages(pdfFile.file, pageOrder, password);

      clearInterval(progressInterval);
      setRearrangeProgress(100);

      setRearrangedBlob(blob);

      const filename = `${pdfFile.file.name.replace(/\.pdf$/i, "")}_rearranged.pdf`;
      downloadPDF(blob, filename);

      previews.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPreviews([]);

      dispatch(incrementUsage('rearrange'));

      setTimeout(() => {
        setRearrangeProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Failed to rearrange pages: ' + err.message);
      setRearrangeProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (rearrangedBlob) {
      const filename = `${pdfFile.file.name.replace(/\.pdf$/i, "")}_rearranged.pdf`;
      downloadPDF(rearrangedBlob, filename);
    }
  };

  const handleRemoveFile = () => {
    cleanupFileData();
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveResult = () => {
    cleanupFileData();
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMoreFiles = () => fileInputRef.current?.click();

  const toggleFaq = (index) => setExpandedFaq(expandedFaq === index ? null : index);

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal && modalPasswordRef.current) {
      setTimeout(() => modalPasswordRef.current?.focus(), 100);
    }
  }, [showPasswordModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAllBlobUrls();
  }, []);

  // Reasons for choosing our tool (SEO optimized)
  const reasons = [
    {
      icon: Shield,
      title: "Secure PDF Page Reordering",
      description: "Your PDF documents never leave your browser. All page rearrangement happens locally on your device, ensuring complete privacy and security for sensitive documents.",
    },
    {
      icon: Gift,
      title: "100% Free PDF Organizer Tool",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF page reordering tool is completely free forever. Rearrange PDF pages unlimited times without restrictions.",
    },
    {
      icon: Move,
      title: "Intuitive Drag-and-Drop Interface",
      description: "Easily drag and drop pages to reorder them visually. Intuitive interface for quick and accurate page reorganization of scanned documents, reports, and presentations.",
    },
    {
      icon: Zap,
      title: "Instant Browser-Based Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration required. Start rearranging PDF pages in seconds from any device.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly rearrange pages in password-protected PDFs. Our tool recognizes encrypted files and prompts for passwords, ensuring secure processing of confidential documents.",
    },
    {
      icon: Layout,
      title: "Visual Page Previews & Thumbnails",
      description: "See live previews of all pages with clear thumbnails. Watch the page order update in real-time as you drag and drop, ensuring perfect document structure.",
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

  const faqItems = [
    {
      question: "How do I reorder PDF pages in any sequence?",
      answer: "Simply drag and drop page thumbnails to your desired order, or use arrow buttons on each page to move pages left/right. You can arrange pages in any sequence you need for documents, presentations, or reports."
    },
    {
      question: "Will the page quality be preserved when rearranging?",
      answer: "Yes. Our PDF page reordering tool maintains the exact same quality, resolution, and formatting as the original. All text, images, and vector graphics remain crisp and clear."
    },
    {
      question: "Can I rearrange pages in password-protected PDFs?",
      answer: "Yes! Our tool supports encrypted PDF documents. Enter the password when prompted and you'll be able to reorder pages while maintaining document security and encryption."
    },
    {
      question: "Can I undo changes or restore original order?",
      answer: "Use the 'Reset Order' button anytime to restore the original page sequence. You can also manually drag pages back to their original positions if needed."
    }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area with Blue linear Background */}
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

          <div className={`${!pdfFile && !rearrangedBlob ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !rearrangedBlob ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Rearrange PDF Pages Online"
                description="Drag and drop pages to reorder your PDF document visually"
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
              {!pdfFile && !rearrangedBlob && (
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
                            {isRearrangeLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your PDF here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isRearrangeLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
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
              {pdfFile && !rearrangedBlob && (
                <div className="mb-4 sm:mb-6" >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">Selected File</h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {pdfFile.pageCount} page{pdfFile.pageCount !== 1 ? "s" : ""}
                          </span>
                          {encryptedFiles[`${pdfFile.file.name}-${pdfFile.file.size}`]?.encrypted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-green-900/50 text-green-300 border border-green-700">
                              <Lock className="w-3 h-3" />
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

                    {/* Page Reordering Area with Drag & Drop */}
                    {pdfFile && !rearrangedBlob && (
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
                          <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-sky-300" />
                            <span className="text-lg text-white">Drag pages to reorder:</span>
                            <button
                              onClick={resetOrder}
                              className="px-4 py-2 bg-sky-900 border border-sky-700 hover:bg-sky-400 text-white rounded-lg transition-all cursor-pointer text-sm"
                              title="Reset to original order"
                            >
                              Reset Order
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-100">
                              {hasOrderChanged() ? "Order modified" : "Original order"}
                            </span>
                          </div>
                        </div>

                        {/* Drag & Drop Page Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto">
                          {!previews.length && (
                            [1, 2, 3, 4].map((i) => (
                              <div key={i} className="w-full bg-sky-900/50 min-h-70 rounded-lg"></div>
                            ))
                          )}
                          {pageOrder.map((pageNum, idx) => {
                            const page = previews.find((p) => p.pageNumber === pageNum);
                            if (!page) return null;

                            const isDragged = isDragging && dragIndex === idx;
                            const isDropTarget = hoverIndex === idx && !isDragged;

                            return (
                              <motion.div
                                key={page.id}
                                exit={{ opacity: 0, y: -20 }}
                                whileHover={{ scale: 1.02 }}
                                draggable
                                onDragStart={(e) => handlePageDragStart(e, idx)}
                                onDragOver={(e) => handlePageDragOver(e, idx)}
                                onDrop={(e) => handlePageDrop(e, idx)}
                                onDragEnd={handlePageDragEnd}
                                className={[
                                  "relative bg-cyan-700 rounded-lg border transition-all duration-150 overflow-hidden cursor-move select-none w-full max-w-60 m-auto",
                                  isDragged ? "opacity-50 ring-2 ring-sky-500 ring-offset-2 ring-offset-gray-900" : "",
                                  isDropTarget ? "border-sky-500 shadow-[0_0_0_2px_rgba(45,212,191,0.4)]" : "border-sky-700 hover:border-sky-500/60",
                                ].join(" ")}
                              >

                                {/* Position Badge */}
                                <Badge title={`#${idx + 1}`} />

                                {/* Preview Image */}
                                <div className="relative aspect-square bg-sky-900 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={page.previewUrl}
                                    alt={`Page ${pageNum}`}
                                    className="max-w-full max-h-full object-contain m-auto"
                                    style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    draggable={false}
                                    onDragStart={(e) => e.preventDefault()}
                                  />
                                </div>

                                {/* Page Info & Controls */}
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium text-white truncate text-sm">
                                      Page {pageNum}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => movePageLeft(idx)}
                                        disabled={idx === 0}
                                        className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Move left"
                                      >
                                        <ArrowLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => movePageRight(idx)}
                                        disabled={idx >= pageOrder.length - 1}
                                        className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Move right"
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-8 text-center">
                          <div className="inline-block bg-sky-900/50 rounded-xl px-6 py-4 border border-sky-700">
                            <div className="text-sm text-gray-100 mb-3">Current page sequence:</div>
                            <div className="flex flex-wrap justify-center gap-2">
                              {pageOrder.map((num, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="bg-sky-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                                    {num}
                                  </div>
                                  {index < pageOrder.length - 1 && (
                                    <span className="mx-1 text-sky-400">→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-gray-100 mt-3">
                              {hasOrderChanged()
                                ? `${pageOrder.length} pages reordered from original sequence`
                                : "Pages in original order"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rearrange Button */}
              {pdfFile && previews.length > 0 && !rearrangedBlob && (
                <ActionButton
                  disabled={isProcessing || isRearrangeLimitReached || !hasOrderChanged()}
                  handleAction={handleRearrange}
                  className={isProcessing || isRearrangeLimitReached || !hasOrderChanged() ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Rearranging..."
                  title="Apply New Order" />
              )}

              {/* Results Section */}
              {rearrangedBlob && (
                <ResultSection
                  title="Rearrangement Complete!"
                  subtitle={`• ${pdfFile?.pageCount || 0} page${pdfFile?.pageCount !== 1 ? "s" : ""}`}
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleRemoveResult} summaryTitle="Rearrangement Summary"
                  summaryItems={[
                    {
                      value: pdfFile?.pageCount || 0,
                      label: "Pages Rearranged",
                      valueColor: "white"
                    },
                    {
                      value: "✓",
                      label: "Complete",
                      valueColor: "teal-400"
                    },
                    {
                      value: "Drag & Drop",
                      label: "Interface",
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
                progress={rearrangeProgress}
                title="Applying New Page Order"
                description={`Reordering ${pdfFile?.pageCount} pages in your PDF document...`}
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Reorder PDF Pages Online with Drag & Drop"
        description="Easily rearrange pages in your PDF documents to fix scanning errors, reorganize content for presentations, or optimize document flow before sharing or printing. Our free online PDF page organizer tool lets you drag and drop pages to any sequence while maintaining original quality, formatting, and security settings. Perfect for reorganizing reports, presentations, scanned documents, and multi-page PDF files with visual page previews and intuitive controls."
        imageUrl={toolCTA}
        imageAlt="Rearrange PDF pages illustration"
        title="Why Choose Our PDF Page Rearrangement Tool"
        subtitle="Experience the best PDF page reordering with our feature-rich, user-friendly tool designed for both professionals and casual users. Drag-and-drop interface makes reorganizing documents simple and efficient."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title="How To Rearrange PDF Pages Online for Free"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Drag to Reorder"
          stepTwoDes="Drag pages to rearrange in preferred sequence"
          stepThree="Apply Changes"
          stepThreeDes="Click apply to save the new page order"
          stepFour="Download Result"
          stepFourDes="Get your reorganized PDF instantly"
        />
      </div>

      <FAQSection faqItems={faqItems} title="PDF Page Rearrangement FAQs" />
    </div>
  );
}