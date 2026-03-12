import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  FileText, Lock, Eye, EyeOff, Shield, Gift, Zap, Key, Layers, Settings2
} from "lucide-react";
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  downloadPDF,
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import PasswordModal from "../components/PasswordModal";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton, ChangeButton, RemoveButton, SelectButton } from "../components/Buttons";
import toolCTA from "/tools-cta/protect-pdf.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function ProtectPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [protectedFile, setProtectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [protectProgress, setProtectProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');

  // Password fields for protection
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [useOwnerPassword, setUseOwnerPassword] = useState(false);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isProtectLimitReached = useSelector(isUsageLimitReached('protect'));

  // SEO optimized reasons for choosing tool
  const reasons = [
    {
      icon: Shield,
      title: "Military-Grade PDF Encryption",
      description: "Protect your sensitive documents with industry-standard RC4 128-bit encryption. Your PDFs remain secure and inaccessible without the correct password.",
    },
    {
      icon: Gift,
      title: "100% Free PDF Protection",
      description: "No watermarks, no subscriptions, no hidden fees. Password-protect unlimited PDFs completely free forever.",
    },
    {
      icon: Lock,
      title: "Browser-Based Encryption",
      description: "All encryption happens locally in your browser. Your PDFs never leave your device, ensuring complete privacy and security.",
    },
    {
      icon: Zap,
      title: "Instant PDF Protection",
      description: "Add password protection to PDFs in seconds. No software installation required - secure your documents directly in your browser.",
    },
    {
      icon: Key,
      title: "Dual Password Protection",
      description: "Set both user and owner passwords for advanced security control. Restrict printing, copying, and editing capabilities.",
    },
    {
      icon: Layers,
      title: "Batch PDF Security",
      description: "Protect multiple PDF documents with consistent security settings. Perfect for businesses and organizations handling sensitive data.",
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
    title: "Free Password Protect PDF Online - Secure Document Encryption",
    description: "Add strong password protection to your PDF documents with our secure online PDF encryption tool. Protect sensitive files with military-grade RC4 128-bit encryption, user/owner passwords, and access restrictions. Perfect for businesses, legal professionals, students, and anyone needing to secure confidential documents before sharing or storing.",
    imageUrl: toolCTA,
    imageAlt: "PDF Password Protection Online Tool"
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
    if (protectedFile?.blob) {
      URL.revokeObjectURL(URL.createObjectURL(protectedFile.blob));
    }
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPdfFile(null);
    setPreview(null);
    setProtectedFile(null);
    setUploadProgress(0);
    setProtectProgress(0);
    setError('');
    setEncryptedFiles({});
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setShowUserPassword(false);
    setShowConfirmPassword(false);
    setShowOwnerPassword(false);
    setUseOwnerPassword(false);
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setModalPassword('');
    setModalPasswordError('');
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

    if (isProtectLimitReached) {
      setError("Daily PDF protection limit reached. Please log in for unlimited usage.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileProcessing(files[0]);
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

    if (isProtectLimitReached) {
      setError("Daily PDF protection limit reached. Please log in for unlimited usage.");
      return;
    }

    cleanupFileData();
    setError('');

    try {
      // Check if PDF is already encrypted
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
      setUploadProgress(50);

      setPdfFile({ file, pageCount });

      // Generate preview of first page
      const gen = await generatePDFPreview(file, 1, 0.4, "JPEG", password);
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

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isProtectLimitReached) {
      setError("Daily PDF protection limit reached. Please log in for unlimited usage.");
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

  // Validate passwords
  const validatePasswords = () => {
    if (!userPassword.trim()) {
      setError('Please enter a password');
      return false;
    }
    if (userPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return false;
    }
    if (userPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (useOwnerPassword && ownerPassword.trim() && ownerPassword.length < 4) {
      setError('Owner password must be at least 4 characters');
      return false;
    }
    return true;
  };

  const handleProtect = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;

    if (isProtectLimitReached) {
      setError("Daily PDF protection limit reached. Please log in for unlimited usage.");
      return;
    }

    if (!validatePasswords()) return;

    setIsProcessing(true);
    setProtectProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProtectProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Read file as array buffer
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // Encrypt the PDF
      const encryptedBytes = await encryptPDF(
        pdfBytes,
        userPassword,
        useOwnerPassword && ownerPassword.trim() ? ownerPassword : undefined
      );

      clearInterval(progressInterval);
      setProtectProgress(100);

      const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
      const protectedFileName = `${pdfFile.file.name.replace(".pdf", "")}_protected.pdf`;

      setProtectedFile({
        blob,
        name: protectedFileName,
        pageCount: pdfFile.pageCount,
        fileSize: blob.size,
        id: uid()
      });

      // Clean up preview
      if (preview?.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
      setPreview(null);

      dispatch(incrementUsage('protect'));

      // Auto-download
      downloadPDF(blob, protectedFileName);

      setTimeout(() => {
        setProtectProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Failed to protect PDF: ' + err.message);
      setProtectProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!protectedFile) return;
    downloadPDF(protectedFile.blob, protectedFile.name);
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

  const faqItems = [
    {
      question: "What encryption standard does the PDF protector use?",
      answer: "We use industry-standard RC4 128-bit encryption, which is supported by all major PDF readers including Adobe Acrobat, Preview, and web browsers.",
    },
    {
      question: "Are my PDF files uploaded to your servers?",
      answer: "No! All encryption happens 100% in your browser. Your sensitive documents never leave your device, ensuring complete privacy and security.",
    },
    {
      question: "What's the difference between user and owner passwords?",
      answer: "User password is required to open the PDF. Owner password (optional) provides additional control over permissions like printing, copying text, and editing.",
    },
    {
      question: "Can I protect an already encrypted PDF?",
      answer: "Yes! If your PDF is already password-protected, enter the current password first, then set new protection settings for enhanced security.",
    },
    {
      question: "What happens if I forget my PDF password?",
      answer: "We cannot recover lost passwords. Always store passwords securely. Consider using a password manager for important documents.",
    },
    {
      question: "Is there a file size limit for PDF protection?",
      answer: "You can protect PDF files up to 50MB. For enterprise needs with larger files, please contact us for custom solutions.",
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
          <div className={`${!pdfFile && !protectedFile ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !protectedFile ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Protect PDF with Password"
                description="Add strong password protection to your PDF documents"
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
              {!pdfFile && !protectedFile && (
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
                            {isProtectLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your PDF file here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isProtectLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
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

              {/* File Selected Card - Blue Theme */}
              {pdfFile && !protectedFile && (
                <div className="mb-4 sm:mb-6" >
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
                              <Lock className="w-2 h-2 sm:w-3 sm:h-3" />
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

                        {/* Password Settings Section */}
                        <div className="space-y-4 md:col-start-2">
                          <div className="bg-sky-900/50 rounded-lg border border-sky-700 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Settings2 className="w-5 h-5 text-sky-300" />
                              <h4 className="text-lg font-medium text-white">
                                Protection Settings
                              </h4>
                            </div>

                            {/* Password Inputs */}
                            <div className="space-y-4">
                              {/* User Password */}
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  Set Password *
                                </label>
                                <div className="relative">
                                  <input
                                    type={showUserPassword ? "text" : "password"}
                                    value={userPassword}
                                    onChange={(e) => setUserPassword(e.target.value)}
                                    placeholder="Enter password (minimum 4 characters)"
                                    className="w-full px-3 py-2.5 bg-sky-800 border border-sky-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowUserPassword(!showUserPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-100 hover:text-white cursor-pointer"
                                  >
                                    {showUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                              </div>

                              {/* Confirm Password */}
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  Confirm Password *
                                </label>
                                <div className="relative">
                                  <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className="w-full px-3 py-2.5 bg-sky-800 border border-sky-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-100 hover:text-white cursor-pointer"
                                  >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                                {confirmPassword && userPassword !== confirmPassword && (
                                  <p className="text-xs text-red-300 mt-1">Passwords do not match</p>
                                )}
                              </div>

                              {/* Owner Password Toggle */}
                              <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={useOwnerPassword}
                                    onChange={(e) => setUseOwnerPassword(e.target.checked)}
                                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-sky-800"
                                  />
                                  <span className="text-sm text-gray-100">Set owner password (advanced)</span>
                                </label>
                              </div>

                              {/* Owner Password */}
                              {useOwnerPassword && (
                                <div>
                                  <label className="block text-sm text-white mb-2">
                                    Owner Password
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={showOwnerPassword ? "text" : "password"}
                                      value={ownerPassword}
                                      onChange={(e) => setOwnerPassword(e.target.value)}
                                      placeholder="Enter owner password (optional)"
                                      className="w-full px-3 py-2.5 bg-sky-800 border border-sky-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white text-sm pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-100 hover:text-white cursor-pointer"
                                    >
                                      {showOwnerPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-100 mt-1">
                                    Owner password allows full control over PDF permissions
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Lock className="w-5 h-5 text-sky-300 mt-0.5" />
                              <div>
                                <p className="text-white font-medium mb-1">
                                  PDF Protection Ready
                                </p>
                                <p className="text-sm text-white">
                                  Your PDF will be encrypted with RC4 128-bit security.
                                  The protected file will download automatically.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-100">
                            * Your PDF is encrypted locally in your browser. We never upload or store your files.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Protect Button */}
              {pdfFile && !protectedFile && (
                <ActionButton
                  disabled={isProcessing || isProtectLimitReached || !userPassword || !confirmPassword || userPassword !== confirmPassword}
                  handleAction={handleProtect}
                  className={isProcessing || isProtectLimitReached || !userPassword || !confirmPassword || userPassword !== confirmPassword ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Protecting..."
                  title="Protect PDF" />
              )}

              {/* Protected Result */}
              {protectedFile && (
                <ResultSection
                  title="PDF Protected Successfully!"
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleStartOver} summaryTitle="Protection Summary"
                  summaryItems={[
                    {
                      value: protectedFile.pageCount,
                      label: protectedFile.pageCount === 1 ? "Page" : "Pages",
                      valueColor: "white"
                    },
                    {
                      value: formatFileSize(protectedFile.fileSize),
                      label: "File Size",
                      valueColor: "teal-400"
                    },
                    {
                      value: "RC4 128-bit",
                      label: "Encryption",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "✓",
                      label: "Protected",
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
                progress={protectProgress}
                title="Protecting PDF"
                description={`Encrypting PDF with RC4 128-bit security...`}
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
        title="Why choose our PDF Protection Tool"
        subtitle="Secure your sensitive documents with our feature-rich, user-friendly PDF encryption tool designed for both professionals and casual users. Add strong password protection to PDFs with ease."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section with White Background */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Password Protect PDF Online"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Enter Current Password"
          stepTwoDes="If PDF is already protected, enter password"
          stepThree="Set New Protection"
          stepThreeDes="Choose user and owner passwords"
          stepFour="Download"
          stepFourDes="Get your password-protected PDF"
        />
      </div>

      {/* FAQ Section with White Background */}
      <div className="bg-white">
        <FAQSection
          theme="light"
          faqItems={faqItems}
          title="PDF Protection FAQs"
        />
      </div>
    </div>
  );
}