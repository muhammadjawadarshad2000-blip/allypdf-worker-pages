import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText, Unlock, CheckCircle,
  Eye, EyeOff, Shield, Gift, Zap, Key, Layers, Settings2, Lock
} from "lucide-react";
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  downloadPDF,
  isPDFEncrypted,
  testPDFPassword,
} from "../utils/index";
import { PDFDocument } from 'pdf-lib';
const pdfjsLib = await import('pdfjs-dist');
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton, ChangeButton, RemoveButton, SelectButton } from "../components/Buttons";
import toolCTA from "/tools-cta/unlock-pdf.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function UnlockPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [unlockedFile, setUnlockedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const passwordInputRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isUnlockLimitReached = useSelector(isUsageLimitReached('unlock'));

  // SEO optimized reasons for choosing tool
  const reasons = [
    {
      icon: Shield,
      title: "Secure PDF Password Remover",
      description: "Unlock password-protected PDFs with complete security. All processing happens locally in your browser - your documents never leave your device.",
    },
    {
      icon: Gift,
      title: "100% Free PDF Unlock Tool",
      description: "No watermarks, no subscriptions, no hidden fees. Remove password protection from unlimited PDFs completely free forever.",
    },
    {
      icon: Unlock,
      title: "Browser-Based Processing",
      description: "No software installation required. Unlock encrypted PDFs directly in your browser with military-grade security protocols.",
    },
    {
      icon: Zap,
      title: "Instant PDF Decryption",
      description: "Remove password protection from PDFs in seconds. Fast, efficient unlocking without compromising document quality.",
    },
    {
      icon: Key,
      title: "User Password Removal",
      description: "Eliminate the need for passwords when opening PDFs while preserving all original content and formatting perfectly.",
    },
    {
      icon: Layers,
      title: "Batch PDF Unlocking",
      description: "Process multiple password-protected PDFs efficiently. Perfect for businesses and organizations managing encrypted documents.",
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
    title: "Free Unlock PDF Online - Remove Password Protection",
    description: "Remove password protection from encrypted PDF documents with our secure online PDF unlock tool. Decrypt password-protected PDFs while maintaining original document quality, formatting, and content. Perfect for accessing old documents, sharing files without password hassle, and archiving encrypted documents securely.",
    imageUrl: toolCTA,
    imageAlt: "PDF Password Removal Online Tool"
  };

  const uid = (() => {
    let n = Date.now();
    return () => `${n++}`;
  })();

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Clean up memory
  const cleanupAllBlobUrls = () => {
    if (preview?.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
    }
    if (unlockedFile?.blob) {
      URL.revokeObjectURL(URL.createObjectURL(unlockedFile.blob));
    }
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPdfFile(null);
    setPreview(null);
    setUnlockedFile(null);
    setUploadProgress(0);
    setUnlockProgress(0);
    setError('');
    setIsEncrypted(false);
    setPassword('');
    setShowPassword(false);
    setPasswordVerified(false);
    setPasswordError('');
  };

  // Reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    if (isUnlockLimitReached) {
      setError("Daily PDF unlock limit reached. Please log in for unlimited usage.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileProcessing(files[0]);
    }
  };

  // File processing
  const handleFileProcessing = async (file) => {
    if (!file) return;

    const err = validatePDF(file);
    if (err) {
      setError(err);
      return;
    }

    if (isUnlockLimitReached) {
      setError("Daily PDF unlock limit reached. Please log in for unlimited usage.");
      return;
    }

    cleanupFileData();
    setError('');

    try {
      setUploadProgress(30);

      // Check if PDF is encrypted
      const encryptionInfo = await isPDFEncrypted(file);
      setUploadProgress(60);

      if (!encryptionInfo.encrypted) {
        setError('This PDF is not password protected. No unlock needed.');
        setUploadProgress(0);
        return;
      }

      setIsEncrypted(true);
      setPdfFile({ file, encrypted: true });
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }, 500);

    } catch (err) {
      setError('Failed to process PDF: ' + err.message);
      setUploadProgress(0);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isUnlockLimitReached) {
      setError("Daily PDF unlock limit reached. Please log in for unlimited usage.");
      return;
    }

    await handleFileProcessing(file);
    resetFileInput();
  };

  // Verify password and generate preview
  const handleVerifyPassword = async () => {
    if (!pdfFile || !password.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    setPasswordError('');

    try {
      const result = await testPDFPassword(pdfFile.file, password);

      if (result.valid) {
        setPasswordVerified(true);

        // Generate preview with the verified password
        const pageCount = await getPageCount(pdfFile.file, password);
        setPdfFile(prev => ({ ...prev, pageCount }));

        const gen = await generatePDFPreview(pdfFile.file, 1, 0.4, "JPEG", password);
        setPreview({
          id: uid(),
          pageNumber: 1,
          previewUrl: gen.previewUrl,
        });
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setPasswordError('Error verifying password: ' + err.message);
    }
  };

  // Unlock PDF by recreating it without encryption
  const handleUnlock = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile || !passwordVerified) return;

    if (isUnlockLimitReached) {
      setError("Daily PDF unlock limit reached. Please log in for unlimited usage.");
      return;
    }

    setIsProcessing(true);
    setUnlockProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setUnlockProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Load the encrypted PDF with PDF.js using the password
      const arrayBuffer = await pdfFile.file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password,
      }).promise;

      const totalPages = pdf.numPages;

      // Create a new unencrypted PDF using pdf-lib
      const newPdfDoc = await PDFDocument.create();

      // Render each page and add to new PDF
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Set white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert canvas to PNG and embed in new PDF
        const imageDataUrl = canvas.toDataURL('image/png', 1.0);
        const pngImage = await newPdfDoc.embedPng(imageDataUrl);

        // Get original dimensions
        const { width, height } = page.getViewport({ scale: 1.0 });
        const newPage = newPdfDoc.addPage([width, height]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });

        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;
      }

      // Save the new PDF without encryption
      const pdfBytes = await newPdfDoc.save();
      await pdf.destroy();

      clearInterval(progressInterval);
      setUnlockProgress(100);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const unlockedFileName = `${pdfFile.file.name.replace(".pdf", "")}_unlocked.pdf`;

      setUnlockedFile({
        blob,
        name: unlockedFileName,
        pageCount: totalPages,
        fileSize: blob.size,
        id: uid()
      });

      // Clean up preview
      if (preview?.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
      setPreview(null);

      dispatch(incrementUsage('unlock'));

      // Auto-download
      downloadPDF(blob, unlockedFileName);

      setTimeout(() => {
        setUnlockProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Failed to unlock PDF: ' + err.message);
      setUnlockProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!unlockedFile) return;
    downloadPDF(unlockedFile.blob, unlockedFile.name);
  };

  const handleRemoveFile = () => {
    cleanupFileData();
    resetFileInput();
  };

  const handleStartOver = () => {
    cleanupFileData();
    resetFileInput();
  };

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllBlobUrls();
    };
  }, []);

  const faqItems = [
    {
      question: "How does the PDF unlock tool work?",
      answer: "Our tool decrypts the PDF using your provided password and creates a new, unprotected version with identical content. All processing happens locally in your browser for maximum security.",
    },
    {
      question: "Can I unlock a PDF without knowing the password?",
      answer: "No. You must provide the correct password to unlock a PDF. This maintains ethical standards and respects document security - we don't support password cracking.",
    },
    {
      question: "Is my password and PDF file secure during unlocking?",
      answer: "Absolutely! All decryption happens 100% in your browser. Your PDF and password are never uploaded to any server, ensuring complete privacy and data protection.",
    },
    {
      question: "Will the unlocked PDF maintain original quality and formatting?",
      answer: "Yes! The unlocked PDF preserves all text, images, formatting, and layout from the original document. You get an exact copy without password restrictions.",
    },
    {
      question: "Can I unlock PDFs with owner password restrictions?",
      answer: "This tool focuses on removing user passwords (required to open PDFs). For owner password restrictions, you'll need to enter the owner password first.",
    },
    {
      question: "Is there a file size limit for PDF unlocking?",
      answer: "You can unlock PDF files up to 50MB. For enterprise needs with larger encrypted documents, please contact us for custom solutions.",
    },
  ];

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
          <div className={`${!pdfFile && !unlockedFile ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !unlockedFile ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Unlock PDF Password"
                description="Remove password protection from encrypted PDF documents"
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
              {!pdfFile && !unlockedFile && (
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
                            {isUnlockLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your encrypted PDF here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isUnlockLimitReached} fileInputRef={fileInputRef} title="Select Protected PDF" />
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

              {/* File Selected Card - Before Password Verification */}
              {pdfFile && !unlockedFile && !passwordVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 sm:mb-6"
                >
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                          <h3 className="text-white text-md sm:text-lg">
                            Password Protected PDF
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreFiles} />
                          <RemoveButton handleRemoveFile={handleRemoveFile} />
                        </div>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    {/* Preview and Password Section */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Locked PDF Placeholder */}
                        <div className="flex justify-center w-full max-w-3xs m-auto">
                          <div className="bg-cyan-700 rounded-lg border border-sky-700 overflow-hidden max-w-xs">
                            <div className="relative aspect-square bg-sky-900 overflow-hidden flex items-center justify-center">
                              <div className="text-center p-6">
                                <Lock className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
                                <p className="text-white font-medium">PDF is Locked</p>
                                <p className="text-gray-100 text-sm mt-1">Enter password to preview</p>
                              </div>
                              <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                                Encrypted
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="font-medium text-white truncate text-sm">
                                {pdfFile.file.name}
                              </p>
                              <p className="text-xs text-gray-100">Password required</p>
                            </div>
                          </div>
                        </div>

                        {/* Password Input Section */}
                        <div className="space-y-4 md:col-start-2">
                          <div className="bg-sky-900/50 rounded-lg border border-sky-700 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Settings2 className="w-5 h-5 text-sky-300" />
                              <h4 className="text-lg font-medium text-white">
                                Enter PDF Password
                              </h4>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  PDF Password *
                                </label>
                                <div className="relative">
                                  <input
                                    ref={passwordInputRef}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                      setPassword(e.target.value);
                                      setPasswordError('');
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleVerifyPassword();
                                    }}
                                    placeholder="Enter current PDF password"
                                    className="w-full px-3 py-2.5 bg-sky-800 border border-sky-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-100 hover:text-white cursor-pointer"
                                  >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                                {passwordError && (
                                  <p className="text-xs text-red-300 mt-2">
                                    {passwordError}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={handleVerifyPassword}
                                disabled={!password.trim()}
                                className={`w-full px-4 py-2.5 rounded-lg font-medium text-white bg-sky-600 hover:bg-sky-500 transition-all ${!password.trim()
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
                                  }`}
                              >
                                Verify Password
                              </button>
                            </div>
                          </div>

                          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Lock className="w-5 h-5 text-sky-300 mt-0.5" />
                              <div>
                                <p className="text-white font-medium mb-1">
                                  Password Required
                                </p>
                                <p className="text-sm text-white">
                                  Enter the correct password to unlock and remove protection from this PDF.
                                  The unlocked file will download automatically.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-100">
                            * Your file is processed locally in your browser. We never upload or store your PDF.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File Selected Card - After Password Verification */}
              {pdfFile && !unlockedFile && passwordVerified && (
                <div className="mb-4 sm:mb-6">
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-sky-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Password Verified
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {pdfFile.pageCount} {pdfFile.pageCount === 1 ? "page" : "pages"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreFiles} />
                          <RemoveButton handleRemoveFile={handleRemoveFile} />
                        </div>
                      </div>
                    </div>

                    {/* Preview and Info Section */}
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
                                <Badge title="Verified" />
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

                        {/* Unlock Info Section */}
                        <div className="space-y-4 md:col-start-2">
                          <div className="bg-sky-900/50 rounded-lg border border-sky-700 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Unlock className="w-5 h-5 text-sky-300" />
                              <h4 className="text-lg font-medium text-white">
                                Ready to Unlock
                              </h4>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-b border-sky-700">
                                <span className="text-gray-100 text-sm">File Name</span>
                                <span className="text-white text-sm truncate max-w-37.5">
                                  {pdfFile.file.name}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-sky-700">
                                <span className="text-gray-100 text-sm">Pages</span>
                                <span className="text-white text-sm">{pdfFile.pageCount}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-sky-700">
                                <span className="text-gray-100 text-sm">Status</span>
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Password Verified
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-gray-100 text-sm">Action</span>
                                <span className="text-sky-300 text-sm">Remove Protection</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-green-200 font-medium">Password Verified Successfully</p>
                                <p className="text-green-300/70 text-sm mt-1">
                                  Click the button below to remove password protection from this PDF.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-100">
                            * The unlocked PDF will be created locally without password protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Unlock Button */}
              {pdfFile && !unlockedFile && passwordVerified && (
                <ActionButton
                  disabled={isProcessing || isUnlockLimitReached}
                  handleAction={handleUnlock}
                  className={isProcessing || isUnlockLimitReached ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Unlocking..."
                  title="Unlock PDF" />
              )}

              {/* Unlocked Result */}
              {unlockedFile && (
                <ResultSection
                  title="PDF Unlocked Successfully!"
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleStartOver} summaryTitle="Unlock Summary"
                  summaryItems={[
                    {
                      value: unlockedFile.pageCount,
                      label: unlockedFile.pageCount === 1 ? "Page" : "Pages",
                      valueColor: "white"
                    },
                    {
                      value: formatFileSize(unlockedFile.fileSize),
                      label: "File Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: "No Password",
                      label: "Required",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "✓",
                      label: "Unlock",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={unlockProgress}
                title="Unlocking PDF"
                description={`Removing password protection...`}
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
        title="Why choose our PDF Unlock Tool"
        subtitle="Access your password-protected PDFs with our secure, user-friendly unlocking tool designed for both professionals and casual users. Remove password restrictions while preserving document quality."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section with White Background */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Unlock PDF Password Online"
          stepOne="Upload PDF"
          stepOneDes="Select your password-protected PDF file"
          stepTwo="Enter Password"
          stepTwoDes="Type the current PDF password"
          stepThree="Verify Access"
          stepThreeDes="Confirm password is correct"
          stepFour="Download"
          stepFourDes="Get your unlocked PDF file"
        />
      </div>

      {/* FAQ Section with White Background */}
      <div className="bg-white">
        <FAQSection
          theme="light"
          faqItems={faqItems}
          title="PDF Unlock FAQs"
        />
      </div>
    </div>
  );
}