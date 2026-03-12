import { useState, useRef, useEffect } from 'react';
const { motion, AnimatePresence } = await import("framer-motion");
import {
  mergePDFs,
  downloadPDF,
  getFileSize,
  getPageCount,
  setPDFPassword,
  getPDFPassword,
  isPDFEncrypted,
  testPDFPassword,
  generatePDFPreview,
} from '../utils/index';
import {
  Lock,
  Unlock,
  FileText,
  Zap, Shield, Move, Key, Layout, Gift,
} from 'lucide-react';
import toolCTA from "/tools-cta/merge-pdf.png";
import { useSelector, useDispatch } from 'react-redux';
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ToolHeader from '../components/ToolHeader';
import ErrorMessage from '../components/ErrorMessage';
import FAQSection from '../components/FAQSection';
import HowToSection from '../components/HowToSection';
import PasswordModal from '../components/PasswordModal';
import ProcessingOverlay from '../components/ProcessingOverlay';
import { SelectButton, ChangeButton, RemoveButton, XDeleteButton, ActionButton } from "../components/Buttons";
import WhyChooseSection from '../components/WhyChooseSection';
import Badge from '../components/Badge';
import UploadProgressBar from '../components/UploadProgressBar';
import ResultSection from '../components/ResultSection';

const MergePDF = () => {
  const [files, setFiles] = useState([]);
  const [fileKeys, setFileKeys] = useState([]);
  const uniqueCounterRef = useRef(0);
  const [mergedBlob, setMergedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pageCounts, setPageCounts] = useState({});
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Drag & reorder state (for cards)
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // One preview (first page) per file
  const [previews, setPreviews] = useState([]); // [{ fileKey, fileId, pageNumber, previewUrl }]

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);

  const dispatch = useDispatch();
  const isMergeLimitReached = useSelector(isUsageLimitReached('merge'));

  // --- External drag & drop files ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isMergeLimitReached) {
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

    const dt = e.dataTransfer;
    if (!dt) return;

    // Ignore drops coming from internal card drag
    try {
      const internal = dt.getData('application/x-merge-internal');
      if (internal === '1') {
        return;
      }
    } catch {
      // ignore
    }

    if (isMergeLimitReached) {
      setError("Daily PDF merge limit reached. Please log in for unlimited usage.");
      return;
    }

    const hasFiles =
      (dt.files && dt.files.length > 0) ||
      (dt.items && Array.from(dt.items).some(item => item.kind === 'file'));

    if (!hasFiles) {
      // likely text/HTML drop – ignore
      return;
    }

    const dtFiles = dt.files;
    if (dtFiles && dtFiles.length > 0) {
      handleFiles(dtFiles);
    }
  };

  const handleFileInput = (e) => {
    const inputFiles = e.target.files;
    if (inputFiles && inputFiles[0]) {
      if (isMergeLimitReached) {
        setError("Daily PDF merge limit reached. Please log in for unlimited usage.");
        e.target.value = '';
        return;
      }
      handleFiles(inputFiles);
      e.target.value = '';
    }
  };

  const cleanupPreviews = () => {
    previews.forEach(p => {
      if (p.previewUrl) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
    setPreviews([]);
  };

  const handleFiles = async (fileList) => {
    const allFiles = Array.from(fileList);
    if (allFiles.length === 0) return;

    const newFiles = allFiles.filter(file => file.type === 'application/pdf');

    if (newFiles.length === 0) {
      setError('Please select PDF files only.');
      return;
    }

    setError('');
    setMergedBlob(null);
    setUploadProgress(0);

    const newKeys = [];
    const newPreviews = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const fileId = `${file.name}-${file.size}`;

      const progress = Math.floor(((i + 1) * 100) / newFiles.length);
      setUploadProgress(progress);

      try {
        const encryptionInfo = await isPDFEncrypted(file);
        if (encryptionInfo.encrypted) {
          setCurrentEncryptedFile({
            file,
            fileId,
            index: files.length + i,
            encryptionInfo
          });
          setShowPasswordModal(true);
          setUploadProgress(0);
          return;
        }
      } catch (err) {
        console.error('Error checking encryption:', err);
      }

      let count = 0;
      try {
        count = await getPageCount(file);
        setPageCounts(prev => ({
          ...prev,
          [fileId]: count
        }));
      } catch (err) {
        console.error('Error getting page count:', err);
        setPageCounts(prev => ({
          ...prev,
          [fileId]: 'Error'
        }));
      }

      setEncryptedFiles(prev => ({
        ...prev,
        [fileId]: { encrypted: false, passwordValid: true }
      }));

      const key = `${fileId}-${uniqueCounterRef.current++}`;
      newKeys.push(key);

      try {
        const previewPage = 1;
        const gen = await generatePDFPreview(file, previewPage, 0.4, "JPEG");
        newPreviews.push({
          fileKey: key,
          fileId,
          pageNumber: previewPage,
          previewUrl: gen.previewUrl,
        });
      } catch (err) {
        console.error('Error generating preview:', err);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setFileKeys(prev => [...prev, ...newKeys]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }

    setTimeout(() => setUploadProgress(0), 1000);
  };

  const handlePasswordSubmit = async () => {
    if (!currentEncryptedFile) return;

    const { file, fileId } = currentEncryptedFile;

    if (!modalPassword.trim()) {
      setModalPasswordError('Password is required');
      return;
    }

    try {
      const result = await testPDFPassword(file, modalPassword);
      if (result.valid) {
        setUploadProgress(10);
        const count = await getPageCount(file, modalPassword);
        setUploadProgress(50);

        setPageCounts(prev => ({
          ...prev,
          [fileId]: count
        }));

        setPDFPassword(fileId, modalPassword);

        setEncryptedFiles(prev => ({
          ...prev,
          [fileId]: { encrypted: true, passwordValid: true, needsPassword: false }
        }));

        const key = `${fileId}-${uniqueCounterRef.current++}`;
        setFiles(prev => [...prev, file]);
        setFileKeys(prev => [...prev, key]);

        try {
          const previewPage = 1;
          const gen = await generatePDFPreview(file, previewPage, 0.4, "JPEG", modalPassword);
          setPreviews(prev => [
            ...prev,
            {
              fileKey: key,
              fileId,
              pageNumber: previewPage,
              previewUrl: gen.previewUrl,
            }
          ]);
        } catch (err) {
          console.error('Error generating preview for encrypted file:', err);
        }

        setModalPassword('');
        setModalPasswordError('');
        setShowPasswordModal(false);
        setCurrentEncryptedFile(null);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
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

  const removeFile = (index) => {
    const file = files[index];
    const fileId = `${file.name}-${file.size}`;
    const key = fileKeys[index];

    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileKeys(prev => prev.filter((_, i) => i !== index));

    setPreviews(prev => {
      prev.forEach(p => {
        if (p.fileKey === key && p.previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      return prev.filter(p => p.fileKey !== key);
    });

    setEncryptedFiles(prev => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });

    if (mergedBlob) {
      setMergedBlob(null);
    }
  };

  const reorderPreviews = (prevPreviews, orderedKeys) => {
    const map = {};
    prevPreviews.forEach(p => {
      map[p.fileKey] = p;
    });
    return orderedKeys
      .map(k => map[k])
      .filter(Boolean);
  };

  // --- Drag to reorder cards ---
  const handleCardDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // mark as internal drag so global drop can ignore
    e.dataTransfer.setData('application/x-merge-internal', '1');
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

    const newFiles = [...files];
    const newKeys = [...fileKeys];
    const draggedFile = newFiles[from];
    const draggedKey = newKeys[from];
    newFiles.splice(from, 1);
    newKeys.splice(from, 1);
    newFiles.splice(dropIndex, 0, draggedFile);
    newKeys.splice(dropIndex, 0, draggedKey);

    setFiles(newFiles);
    setFileKeys(newKeys);
    setPreviews(prev => reorderPreviews(prev, newKeys));

    setIsDragging(false);
    setHoverIndex(null);
    setDragIndex(null);

    if (mergedBlob) setMergedBlob(null);
  };

  const handleCardDragEnd = () => {
    setIsDragging(false);
    setHoverIndex(null);
    setDragIndex(null);
  };

  const mergePDFFiles = async () => {
    window.scrollTo(0, 0);
    if (isMergeLimitReached) {
      setError("Daily PDF merge limit reached. Please log in for unlimited usage.");
      return;
    }

    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }

    const encryptedFileIds = Object.keys(encryptedFiles).filter(id => encryptedFiles[id].encrypted);
    for (const fileId of encryptedFileIds) {
      const encryptedFile = encryptedFiles[fileId];
      if (encryptedFile.encrypted && !encryptedFile.passwordValid) {
        const file = files.find(f => `${f.name}-${f.size}` === fileId);
        if (file) {
          setError(`Password required for encrypted file: ${file.name}`);
          return;
        }
      }
    }

    setIsProcessing(true);
    setError('');
    setProcessingProgress(0);

    try {
      const passwords = {};
      Object.keys(encryptedFiles).forEach(fileId => {
        if (encryptedFiles[fileId].encrypted) {
          passwords[fileId] = getPDFPassword(fileId) || '';
        }
      });

      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const merged = await mergePDFs(files, passwords);
      setMergedBlob(merged);

      const fileName = `allypdf_merged.pdf`;
      downloadPDF(merged, fileName);

      clearInterval(progressInterval);
      setProcessingProgress(100);

      let total = 0;
      for (const file of files) {
        const fileId = `${file.name}-${file.size}`;
        total += pageCounts[fileId] || 0;
      }
      setTotalPages(total);

      dispatch(incrementUsage('merge'));

      setTimeout(() => {
        setProcessingProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Error merging PDFs: ' + err.message);
      setProcessingProgress(0);
      setIsProcessing(false);
    }
  };

  const downloadMergedPDF = () => {
    if (mergedBlob) {
      const fileName = `allypdf_merged.pdf`;
      downloadPDF(mergedBlob, fileName);
    }
  };

  const clearAll = () => {
    files.forEach((file, index) => {
      const key = fileKeys[index];
      previews.forEach(p => {
        if (p.fileKey === key && p.previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    });

    setFiles([]);
    setFileKeys([]);
    setMergedBlob(null);
    setError('');
    setSuccess('');
    setPageCounts({});
    setEncryptedFiles({});
    setTotalPages(0);
    cleanupPreviews();
  };

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const handleStartOver = () => {
    clearAll();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    let total = 0;
    files.forEach(file => {
      const fileId = `${file.name}-${file.size}`;
      total += pageCounts[fileId] || 0;
    });
    setTotalPages(total);
  }, [files, pageCounts]);

  useEffect(() => {
    if (showPasswordModal && modalPasswordRef.current) {
      setTimeout(() => {
        modalPasswordRef.current?.focus();
      }, 100);
    }
  }, [showPasswordModal]);

  useEffect(() => {
    return () => {
      cleanupPreviews();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqItems = [
    {
      question: "How many PDF files can I merge at once?",
      answer: "You can merge unlimited PDF files at once. There are no restrictions on file count or size."
    },
    {
      question: "Can I reorder the pages before merging?",
      answer: "Yes! You can drag and drop files to reorder them."
    },
    {
      question: "Will merging affect my PDF quality?",
      answer: "No, merging preserves the original quality of all PDF files."
    },
    {
      question: "Can I merge password-protected PDFs?",
      answer: "Yes! Our tool supports encrypted PDFs. You'll be prompted to enter passwords for any protected files before merging."
    },
    {
      question: "Is there a page limit for merged documents?",
      answer: "No, there is no page limit. You can merge documents of any size."
    }
  ];

  const mergerReasons = [
    {
      icon: Shield,
      title: "Ultra-Secure Processing",
      description: "Your documents never leave your browser. All merging happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "Completely Free Forever",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF merger is 100% free with no limitations. Use it as much as you want without ever paying.",
    },
    {
      icon: Move,
      title: "Drag & Drop Reordering",
      description: "Intuitive drag-and-drop interface lets you easily rearrange PDF files exactly as you want them before merging.",
    },
    {
      icon: Zap,
      title: "Instant Browser-Based Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration, and no waiting times. Start merging PDFs in seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly merge password-protected PDFs. Our tool recognizes encrypted files and prompts for passwords, ensuring you can combine secured documents without compromising protection.",
    },
    {
      icon: Layout,
      title: "Visual Page Previews",
      description: "See thumbnail previews of each PDF before merging. Each file displays a preview of its first page, helping you visually identify and organize documents correctly.",
    }
  ];

  const iconColorClasses = [
    "bg-sky-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-purple-500"
  ]

  return (
    <div className="relative min-h-screen">
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

          <div className={`${files.length === 0 && !mergedBlob ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${files.length === 0 && !mergedBlob ? "" : "hidden"}`}
            >
              <ToolHeader 
                title="Merge PDF Files"
                description="Combine multiple PDF files into a single document with the order you prefer"
              />
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col">
              {/* Upload Section */}
              {files.length === 0 && !mergedBlob && (
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
                            {isMergeLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your files here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isMergeLimitReached} fileInputRef={fileInputRef} title="Select PDF files" />
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

              {/* Selected Files grid with drag-to-reorder */}
              {files.length > 0 && !mergedBlob && (
                <div className="mb-4 sm:mb-6" >
                  <div className="bg-sky-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Selected Files
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {files.length} file{files.length !== 1 ? 's' : ``}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                          <ChangeButton handleAddMoreFiles={handleAddMoreFiles} title="Add More" />
                          <RemoveButton handleRemoveFile={clearAll} title="Clear All" />
                        </div>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6 px-3 sm:px-4 md:px-6">
                        <h3 className="text-lg text-white">
                          Drag cards to reorder PDF files
                        </h3>
                        <p className="text-xs sm:text-sm font-light text-gray-100">
                          The order here matches the order in the merged PDF.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto place-content-center">
                        <AnimatePresence>
                          {files.map((file, index) => {
                            const fileId = `${file.name}-${file.size}`;
                            const isEncrypted = encryptedFiles[fileId]?.encrypted;
                            const passwordValid = encryptedFiles[fileId]?.passwordValid;
                            const pageCount = isEncrypted && !passwordValid
                              ? 'Locked'
                              : (pageCounts[fileId] || '...');
                            const fileSize = getFileSize(file.size);
                            const key = fileKeys[index];
                            const preview = previews.find(p => p.fileKey === key);

                            const isDragged = isDragging && dragIndex === index;
                            const isDropTarget = hoverIndex === index && !isDragged;

                            return (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                draggable
                                onDragStart={(e) => handleCardDragStart(e, index)}
                                onDragOver={(e) => handleCardDragOver(e, index)}
                                onDrop={(e) => handleCardDrop(e, index)}
                                onDragEnd={handleCardDragEnd}
                                className={[
                                  "relative bg-cyan-700 rounded-lg border transition-all duration-150 overflow-hidden cursor-move select-none max-w-60",
                                  isDragged ? "opacity-50 ring-2 ring-sky-500 ring-offset-2 ring-offset-gray-900" : "",
                                  isDropTarget ? "border-sky-500 shadow-[0_0_0_2px_rgba(45,212,191,0.4)]" : "border-sky-700 hover:border-sky-500/60",
                                ].join(" ")}
                              >
                                <XDeleteButton handleRemove={() => removeFile(index)} title="Remove file" />

                                {/* Preview area */}
                                <motion.div
                                  className="relative aspect-square bg-sky-900 flex items-center justify-center"
                                  whileHover={{ scale: 1.01 }}
                                >
                                  {preview?.previewUrl ? (
                                    <img
                                      src={preview.previewUrl}
                                      alt={file.name}
                                      className="max-w-full max-h-full object-contain m-auto"
                                      style={{ maxWidth: '90%', maxHeight: '90%' }}
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                      <FileText className="w-8 h-8 mb-2" />
                                      <span className="text-xs">Preview</span>
                                    </div>
                                  )}
                                  <Badge title={`#${index + 1}`} />
                                </motion.div>

                                {/* Card footer info */}
                                <div className="p-3 flex flex-col gap-1">
                                  <p className="font-light text-white truncate text-sm">
                                    {file.name}
                                  </p>
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {isEncrypted && (
                                        <span
                                          className={[
                                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium",
                                            passwordValid
                                              ? "bg-green-900/50 text-green-300 border border-green-700"
                                              : "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
                                          ].join(" ")}
                                        >
                                          {passwordValid ? (
                                            <Unlock className="w-3 h-3" />
                                          ) : (
                                            <Lock className="w-3 h-3" />
                                          )}
                                          <span className="hidden xs:inline">
                                            {passwordValid ? "Unlocked" : "Locked"}
                                          </span>
                                        </span>
                                      )}
                                      <span className="text-[11px] px-1.5 py-0.5 bg-cyan-900 text-gray-100 font-light rounded">
                                        {pageCount}{" "}
                                        {typeof pageCount === "number" && pageCount <= 1 ? "page" : "pages"}
                                      </span>
                                    </div>

                                    <span className="text-[11px] font-light text-gray-100">
                                      {fileSize}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Merge Result Section */}
              {mergedBlob && (
                <ResultSection
                  title="Merge Complete!"
                  subtitle={`• ${totalPages <= 1 ? '1 page' : `${totalPages} pages`}`}
                  onDownload={downloadMergedPDF}
                  downloadButtonText="Download PDF"
                  onStartOver={handleStartOver} summaryTitle="Merge Summary"
                  summaryItems={[
                    {
                      value: files.length,
                      label: "Files Merged",
                      valueColor: "white"
                    },
                    {
                      value: "✓",
                      label: "Complete",
                      valueColor: "teal-400"
                    },
                    {
                      value: getFileSize(mergedBlob.size),
                      label: "PDF Size",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Success Rate",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Merge Button */}
              {files.length > 0 && !mergedBlob && (
                <ActionButton
                  disabled={isProcessing || isMergeLimitReached || files.length < 2}
                  handleAction={mergePDFFiles}
                  className={isProcessing || isMergeLimitReached || files.length < 2 ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Merging..."
                  title="Merge PDF" />
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
                progress={processingProgress}
                title="Merging PDFs"
                description={`Processing ${files.length} files with ${totalPages} pages...`}
              />
            </div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Combine Your Multiple PDFs into One Document"
        description="Easily merge multiple PDF files into a single document with your preferred order. Our free online tool lets you combine reports, presentations, forms, and other PDF documents while maintaining the original quality and formatting of each file."
        imageUrl={toolCTA}
        imageAlt="Merge PDF illustration"
        title="Why choose our PDF Merger"
        subtitle="Experience the best PDF Merger with our feature-rich, user-friendly tool designed for both professionals and casual users."
        reasons={mergerReasons}
        iconColorClasses={iconColorClasses}
      />

      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title="How To Merge PDF Files Online for Free"
          stepOne="Upload PDFs"
          stepOneDes="Select or drag and drop multiple PDF files"
          stepTwo="Arrange Order"
          stepTwoDes="Drag to reorder files in your preferred sequence"
          stepThree="Merge Files"
          stepThreeDes="Click merge to combine all files into one PDF"
          stepFour="Download Result"
          stepFourDes="Get your merged PDF document instantly"
        />
      </div>

      <FAQSection faqItems={faqItems} title="PDF Merging FAQs" />
    </div>
  );
};

export default MergePDF;