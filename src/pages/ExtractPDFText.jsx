import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle,
  FileText,
  Copy,
  Search,
  AlignLeft,
  CopyCheck,
  Text,
  ChevronDown,
  ChevronUp,
  Info,
  Settings2,
  Shield,
  Gift,
  Zap,
  Key,
  BookOpen,
  Lock,
} from "lucide-react";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import PasswordModal from "../components/PasswordModal";
import WhyChooseSection from "../components/WhyChooseSection";
import {
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
  getPDFPassword,
  getPageCount,
  generatePDFPreview,
  extractTextFromPDF,
} from "../utils/index";
import { ChangeButton, RemoveButton, StartOverButton, DownloadButton, SelectButton, ActionButton } from "../components/Buttons";
import toolCTA from "/tools-cta/extract-text.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ToolHeader from "../components/ToolHeader";

export default function ExtractPDFText() {
  const [pdfFile, setPdfFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDocInfo, setShowDocInfo] = useState(false);

  // Output format selector
  const [outputFormat, setOutputFormat] = useState("txt");

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState("");
  const [modalPasswordError, setModalPasswordError] = useState("");
  const [encryptedFiles, setEncryptedFiles] = useState({});

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const textAreaRef = useRef(null);
  const modalPasswordRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isExtractLimitReached = useSelector(isUsageLimitReached("extractText"));

  // SEO optimized reasons for choosing tool
  const reasons = [
    {
      icon: Shield,
      title: "Secure PDF Text Extractor",
      description: "Your documents remain private with end-to-end encryption. Text extraction happens securely without storing any data on our servers.",
    },
    {
      icon: Gift,
      title: "100% Free Text Extraction",
      description: "No watermarks, no subscriptions, no hidden fees. Extract unlimited text from PDFs completely free forever.",
    },
    {
      icon: FileText,
      title: "High-Accuracy Text Recognition",
      description: "Advanced algorithms preserve text formatting, paragraph structure, and special characters with 99% accuracy.",
    },
    {
      icon: Zap,
      title: "Instant Browser-Based Extraction",
      description: "No software installation required. Extract text directly from PDF in your browser within seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Extract text from password-protected PDFs. Supports both user and owner passwords with complete security.",
    },
    {
      icon: BookOpen,
      title: "Multi-Format Output",
      description: "Export as plain text (TXT) or structured JSON with metadata. Perfect for developers and data analysis.",
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
    title: "Free Extract Text from PDF Online - Accurate Text Extraction",
    description: "Extract text content from PDF documents with our advanced online PDF text extractor. Convert PDF to text while preserving formatting, paragraphs, and special characters. Perfect for researchers, students, developers, and professionals who need to extract, copy, or analyze text from PDF files quickly and accurately.",
    imageUrl: toolCTA,
    imageAlt: "PDF Text Extraction Online Tool"
  };

  // Unique ID generator
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

  // Validate PDF file
  const validatePdfFile = (file) => {
    if (!file) return "Please select a file";
    if (file.type !== "application/pdf") {
      return "Please select a valid PDF file";
    }
    if (file.size > 50 * 1024 * 1024) {
      return "File size must be less than 50MB";
    }
    return null;
  };

  // Clean up memory
  const cleanupAllBlobUrls = () => {
    if (preview?.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
    }
  };

  // Clean up all state
  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPdfFile(null);
    setPreview(null);
    setExtractedData(null);
    setUploadProgress(0);
    setConversionProgress(0);
    setError("");
    setCopied(false);
    setShowFullText(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowDocInfo(false);
    setOutputFormat("txt");
    setEncryptedFiles({});
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setModalPassword("");
    setModalPasswordError("");
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

    if (isExtractLimitReached) {
      setError("Daily text extraction limit reached. Please log in for unlimited usage.");
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
      setError("Failed to process PDF: " + err.message);
      setUploadProgress(0);
    }
  };

  // File processing with encryption detection
  const handleFileProcessing = async (file) => {
    if (!file) return;

    const err = validatePdfFile(file);
    if (err) {
      setError(err);
      return;
    }

    if (isExtractLimitReached) {
      setError("Daily text extraction limit reached. Please log in for unlimited usage.");
      return;
    }

    cleanupFileData();
    setError("");

    try {
      // Check if PDF is encrypted
      const encryptionInfo = await isPDFEncrypted(file);
      if (encryptionInfo?.encrypted) {
        setCurrentEncryptedFile({ file, encryptionInfo });
        setShowPasswordModal(true);
        return;
      }

      // If not encrypted, process normally
      await processPDFFile(file);
    } catch (err) {
      setError("Failed to process PDF: " + err.message);
      setUploadProgress(0);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isExtractLimitReached) {
      setError("Daily text extraction limit reached. Please log in for unlimited usage.");
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
      setModalPasswordError("Password is required");
      return;
    }

    try {
      const result = await testPDFPassword(file, modalPassword);
      if (result.valid) {
        await processPDFFile(file, modalPassword);

        const fileId = `${file.name}-${file.size}`;
        setEncryptedFiles((prev) => ({
          ...prev,
          [fileId]: { encrypted: true, passwordValid: true },
        }));

        setModalPassword("");
        setModalPasswordError("");
        setShowPasswordModal(false);
        setCurrentEncryptedFile(null);
      } else {
        setModalPasswordError("Invalid password. Please try again.");
      }
    } catch (err) {
      setModalPasswordError("Error testing password: " + err.message);
    }
  };

  const handlePasswordCancel = () => {
    setModalPassword("");
    setModalPasswordError("");
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setUploadProgress(0);
    resetFileInput();
  };

  /**
   * Properly encode text to UTF-8 bytes using TextEncoder
   */
  const encodeTextToUTF8 = (text) => {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  };

  /**
   * Download text as TXT file with proper UTF-8 encoding
   */
  const downloadAsTxt = (text, fileName) => {
    if (!text) return;

    const utf8Bytes = encodeTextToUTF8(text);

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

    const combined = new Uint8Array(bom.length + utf8Bytes.length);
    combined.set(bom, 0);
    combined.set(utf8Bytes, bom.length);

    const blob = new Blob([combined], { type: "text/plain;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Download data as JSON file with proper UTF-8 encoding
   */
  const downloadAsJson = (data, fileName) => {
    if (!data) return;

    const jsonString = JSON.stringify(data, null, 2);

    const utf8Bytes = encodeTextToUTF8(jsonString);

    const blob = new Blob([utf8Bytes], { type: "application/json;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Handle auto-download based on selected format
   */
  const autoDownload = (extractedText, numPages, info, wordCount, charCount, creationDate, modDate) => {
    if (!pdfFile) return;

    const baseFileName = pdfFile.file.name.replace(/\.pdf$/i, "");

    if (outputFormat === "json") {
      const jsonData = {
        fileName: pdfFile.file.name,
        text: extractedText,
        numPages: numPages,
        wordCount: wordCount,
        charCount: charCount,
        info: info || {},
        creationDate: creationDate,
        modificationDate: modDate,
        extractedAt: new Date().toISOString(),
      };
      downloadAsJson(jsonData, `${baseFileName}_extracted.json`);
    } else {
      downloadAsTxt(extractedText, `${baseFileName}_extracted.txt`);
    }
  };

  /**
   * Handle manual download button click
   */
  const handleDownload = () => {
    if (!extractedData || !pdfFile) return;

    const baseFileName = pdfFile.file.name.replace(/\.pdf$/i, "");

    if (outputFormat === "json") {
      const jsonData = {
        fileName: pdfFile.file.name,
        text: extractedData.text,
        numPages: extractedData.numPages,
        wordCount: extractedData.wordCount,
        charCount: extractedData.charCount,
        info: extractedData.info || {},
        creationDate: extractedData.creationDate,
        modificationDate: extractedData.modDate,
        extractedAt: new Date().toISOString(),
      };
      downloadAsJson(jsonData, `${baseFileName}_extracted.json`);
    } else {
      downloadAsTxt(extractedData.text, `${baseFileName}_extracted.txt`);
    }
  };

  /**
   * Handle text extraction from PDF (client-side)
   */
  const handleExtract = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;

    if (isExtractLimitReached) {
      setError("Daily text extraction limit reached. Please log in for unlimited usage.");
      return;
    }

    setIsProcessing(true);
    setConversionProgress(0);
    setError("");

    try {
      const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
      const savedPassword = getPDFPassword(fileId);

      const progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { text, numPages, info, creationDate, modDate } = await extractTextFromPDF(
        pdfFile.file,
        savedPassword
      );

      clearInterval(progressInterval);
      setConversionProgress(100);

      const extractedText = String(text || "");
      const wordCount = extractedText.trim()
        ? extractedText.split(/\s+/).filter(Boolean).length
        : 0;
      const charCount = extractedText.length;

      setExtractedData({
        text: extractedText,
        numPages: numPages || 1,
        info: info || {},
        wordCount,
        charCount,
        creationDate,
        modDate
      });

      // Clean up preview
      if (preview?.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
      setPreview(null);

      dispatch(incrementUsage("extractText"));

      // Auto-download based on selected format
      autoDownload(extractedText, numPages || 1, info, wordCount, charCount, creationDate, modDate);

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error("Extraction error:", err);
      let errorMessage = err.message || "Text extraction failed";

      if (errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("encrypted")) {
        setCurrentEncryptedFile({ file: pdfFile.file, encryptionInfo: { encrypted: true } });
        setShowPasswordModal(true);
      } else {
        setError(errorMessage);
      }

      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  /**
   * Copy text to clipboard with proper encoding
   */
  const handleCopyToClipboard = async () => {
    if (!extractedData?.text) return;

    const text = extractedData.text;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error("Clipboard API not available");
    } catch (_) {
      try {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        temp.setSelectionRange(0, 999999999);
        const ok = document.execCommand("copy");
        document.body.removeChild(temp);
        if (!ok) throw new Error("execCommand copy failed");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Copy fallback failed:", err);
        setError("Failed to copy to clipboard");
      }
    }
  };

  /**
   * Search within extracted text
   */
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim() || !extractedData?.text) {
      setSearchResults([]);
      return;
    }

    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuery, "gi");
      const matches = [];
      let match;

      while ((match = regex.exec(extractedData.text)) !== null && matches.length < 100) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(extractedData.text.length, match.index + query.length + 50);
        matches.push({
          index: match.index,
          context: extractedData.text.slice(start, end),
          matchStart: match.index - start,
          matchLength: query.length,
        });
      }
      setSearchResults(matches);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    }
  };

  /**
   * Highlight search results in context
   */
  const highlightText = (context, matchStart, matchLength) => {
    const before = context.slice(0, matchStart);
    const match = context.slice(matchStart, matchStart + matchLength);
    const after = context.slice(matchStart + matchLength);

    return (
      <span>
        {before}
        <span className="bg-yellow-400/50 text-yellow-200 px-1 rounded">
          {match}
        </span>
        {after}
      </span>
    );
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
      question: "What types of PDFs can I extract text from?",
      answer: "Extract text from all PDF types including digital PDFs, searchable PDFs, and PDFs with embedded text. Our advanced PDF text extractor handles complex layouts and formatting.",
    },
    {
      question: "Will extracted text maintain original formatting and structure?",
      answer: "Yes! Our tool preserves paragraphs, line breaks, and text structure. Complex formatting like tables and columns are intelligently processed for optimal readability.",
    },
    {
      question: "Can I extract text from password-protected or encrypted PDFs?",
      answer: "Absolutely. Our secure PDF text extraction tool supports password-protected PDFs. Simply enter the password when prompted to access and extract text securely.",
    },
    {
      question: "What output formats are available for extracted text?",
      answer: "Export as plain text (TXT) with UTF-8 encoding or structured JSON with metadata including word count, character count, and document information.",
    },
    {
      question: "Is there a file size limit for PDF text extraction?",
      answer: "Extract text from PDF files up to 50MB. For larger documents, we recommend splitting the PDF or contacting us for enterprise solutions.",
    },
    {
      question: "Do you store my PDF files or extracted text?",
      answer: "No. All processing happens securely in memory. Your files and extracted text are never stored on our servers, ensuring complete privacy.",
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
          <div className={`${!pdfFile && !extractedData ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !extractedData ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Extract Text from PDF"
                description="Extract all text content from PDF documents instantly"
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
              {!pdfFile && !extractedData && (
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
                            {isExtractLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your PDF file here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isExtractLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
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

              {/* File Selected Card */}
              {pdfFile && !extractedData && (
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
                                  {pdfFile.pageCount <= 1 ? "1 page" : `${pdfFile.pageCount} pages`} • {formatFileSize(pdfFile.file.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Options Section */}
                        <div className="space-y-4 md:col-start-2">
                          <div className="bg-sky-900/50 rounded-lg border border-sky-700 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Settings2 className="w-5 h-5 text-sky-300" />
                              <h4 className="text-lg font-medium text-white">
                                Extraction Options
                              </h4>
                            </div>

                            {/* Output format selector */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm text-white mb-2">
                                  Output Format
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: "Plain Text (TXT)", value: "txt", desc: "Simple text file" },
                                    { label: "JSON", value: "json", desc: "With metadata" },
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => setOutputFormat(opt.value)}
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-white cursor-pointer flex flex-col items-start ${outputFormat === opt.value
                                        ? "bg-sky-500"
                                        : "bg-sky-800 hover:bg-sky-700"
                                        }`}
                                    >
                                      <span>{opt.label}</span>
                                      <span className={`text-xs ${outputFormat === opt.value ? "text-white" : "text-gray-100"}`}>
                                        {opt.desc}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-100 mt-2">
                                  {outputFormat === "json"
                                    ? "JSON includes text, page count, word count, and document metadata."
                                    : "TXT contains only the extracted text content with UTF-8 encoding."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlignLeft className="w-5 h-5 text-sky-300 mt-0.5" />
                              <div>
                                <p className="text-white font-medium mb-1">
                                  Text Extraction Ready
                                </p>
                                <p className="text-sm text-white">
                                  Click Extract to retrieve all text content from this PDF.
                                  The file will automatically download as {outputFormat.toUpperCase()}.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-100">
                            * Your file is processed securely. Text is extracted with proper UTF-8 encoding.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Extract Button */}
              {pdfFile && !extractedData && (
                <ActionButton
                  disabled={isProcessing || isExtractLimitReached}
                  handleAction={handleExtract}
                  className={isProcessing || isExtractLimitReached ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Extracting..."
                  title="Extract Text" />
              )}

              {/* Extraction Results */}
              {extractedData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 sm:mb-6"
                >
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                          <h3 className="text-white text-lg sm:text-xl">
                            Text Extracted Successfully!
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0 flex-1 justify-center md:justify-end w-full flex-wrap">
                          <button
                            onClick={handleCopyToClipboard}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <CopyCheck className="w-4 h-4 text-green-400" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                          <DownloadButton handleDownload={handleDownload} title="Download" />
                          <StartOverButton handleRemoveResult={handleStartOver} />
                        </div>
                      </div>
                    </div>

                    {/* Result Body */}
                    <div className="p-4 sm:p-6">
                      {/* Statistics Summary */}
                      <div className="bg-linear-to-r from-sky-900/30 to-blue-900/30 rounded-xl p-6 border border-sky-700/50 mb-6">
                        <h4 className="text-xl sm:text-2xl font-light text-white mb-8 text-center">
                          Extraction Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-medium text-white">
                              {extractedData.numPages}
                            </p>
                            <p className="text-md text-gray-100">
                              {extractedData.numPages === 1 ? "Page" : "Pages"}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-medium text-teal-400">
                              {extractedData.wordCount.toLocaleString()}
                            </p>
                            <p className="text-md text-gray-100">Words</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-medium text-yellow-300">
                              {extractedData.charCount.toLocaleString()}
                            </p>
                            <p className="text-md text-gray-100">Characters</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg sm:text-xl font-medium text-green-400">
                              {outputFormat.toUpperCase()}
                            </p>
                            <p className="text-md text-gray-100">Format</p>
                          </div>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-100" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search within extracted text..."
                            className="w-full pl-12 pr-4 py-3 bg-sky-900/50 border border-sky-700 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-sky-500 transition-colors"
                          />
                          {searchQuery && (
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-300">
                              {searchResults.length} {searchResults.length === 1 ? "match" : "matches"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mb-6 bg-sky-900/50 rounded-lg border border-sky-700 max-h-48 overflow-y-auto">
                          <div className="p-3 border-b border-sky-700 sticky top-0 bg-sky-900">
                            <p className="text-sm font-medium text-sky-100">
                              Search Results ({searchResults.length})
                            </p>
                          </div>
                          <div className="divide-y divide-sky-700">
                            {searchResults.slice(0, 10).map((result, index) => (
                              <div key={index} className="p-3 hover:bg-sky-800/50">
                                <p className="text-sm text-gray-100 wrap-break-word">
                                  ... {highlightText(result.context, result.matchStart, result.matchLength)} ...
                                </p>
                              </div>
                            ))}
                            {searchResults.length > 10 && (
                              <div className="p-3 text-center">
                                <p className="text-sm text-gray-100">
                                  And {searchResults.length - 10} more matches...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Extracted Text Preview */}
                      <div className="bg-sky-900/50 rounded-lg border border-sky-700">
                        <div className="p-4 border-b border-sky-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Text className="w-5 h-5 text-sky-100" />
                            <h5 className="font-medium text-white">Extracted Text</h5>
                          </div>
                          <button
                            onClick={() => setShowFullText(!showFullText)}
                            className="text-sm text-sky-100 hover:text-sky-50 flex items-center gap-1 cursor-pointer"
                          >
                            {showFullText ? (
                              <>
                                Show Less <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Show All <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                        <div
                          ref={textAreaRef}
                          className={`p-4 text-gray-100 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word overflow-y-auto ${showFullText ? "max-h-150" : "max-h-50"
                            }`}
                        >
                          {extractedData.text || (
                            <span className="text-gray-100 italic">
                              No text content found in this PDF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document Info */}
                      {extractedData.info && Object.keys(extractedData.info).length > 0 && (
                        <div className="mt-6">
                          <button
                            className="w-full p-4 bg-sky-900/50 rounded-lg border border-sky-700 text-left cursor-pointer"
                            onClick={() => setShowDocInfo(!showDocInfo)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-sky-100" />
                                <span className="font-medium text-white">Document Information</span>
                              </div>
                              {showDocInfo ? (
                                <ChevronUp className="w-5 h-5 text-gray-100" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-100" />
                              )}
                            </div>
                          </button>
                          {showDocInfo && (
                            <div className="mt-2 p-4 bg-sky-900/30 rounded-lg border border-sky-700">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {extractedData.info.Title && (
                                  <div>
                                    <p className="text-xs text-gray-100">Title</p>
                                    <p className="text-sm text-white">{extractedData.info.Title}</p>
                                  </div>
                                )
                                }
                                {extractedData.info.Author && (
                                  <div>
                                    <p className="text-xs text-gray-100">Author</p>
                                    <p className="text-sm text-white">{extractedData.info.Author}</p>
                                  </div>
                                )
                                }
                                {extractedData.info.Creator && (
                                  <div>
                                    <p className="text-xs text-gray-100">Creator</p>
                                    <p className="text-sm text-white">{extractedData.info.Creator}</p>
                                  </div>
                                )
                                }
                                {extractedData.info.Producer && (
                                  <div>
                                    <p className="text-xs text-gray-100">Producer</p>
                                    <p className="text-sm text-white">{extractedData.info.Producer}</p>
                                  </div>
                                )
                                }
                                {extractedData.creationDate && (
                                  <div>
                                    <p className="text-xs text-gray-100">Created</p>
                                    <p className="text-sm text-white">{(extractedData.creationDate)}</p>
                                  </div>
                                )}
                                {extractedData.modDate && (
                                  <div>
                                    <p className="text-xs text-gray-100">Modified</p>
                                    <p className="text-sm text-white">{(extractedData.modDate)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
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
                title="Extracting Text"
                description="Analyzing PDF and extracting text content..."
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
        title="Why choose our PDF Text Extractor"
        subtitle="Experience the best PDF text extraction with our feature-rich, user-friendly tool designed for both professionals and casual users. Extract text from PDFs with advanced accuracy and features."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section with White Background */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Extract Text from PDF Online"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Enter Password"
          stepTwoDes="If the PDF is protected, provide the password"
          stepThree="Choose Format"
          stepThreeDes="Select output format (TXT or JSON)"
          stepFour="Download"
          stepFourDes="Download or copy your extracted text"
        />
      </div>

      {/* FAQ Section with White Background */}
      <div className="bg-white">
        <FAQSection
          theme="light"
          faqItems={faqItems}
          title="PDF Text Extraction FAQs"
        />
      </div>
    </div>
  );
}