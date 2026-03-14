import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  downloadPDF,
  applyPageEdits,
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
  getPDFPassword,
} from '../utils/index';
import {
  RotateCcw,
  RotateCw,
  Lock,
  FileText,
  Shield,
  Gift,
  Zap,
  Key,
  Layout,
  Settings,
} from 'lucide-react';
import { incrementUsage, isUsageLimitReached } from '../store/slices/usageSlice';
import ErrorMessage from '../components/ErrorMessage';
import FAQSection from "../components/FAQSection";
import HowToSection from '../components/HowToSection';
import PasswordModal from '../components/PasswordModal';
import ProcessingOverlay from '../components/ProcessingOverlay';
import WhyChooseSection from "../components/WhyChooseSection";
import { ChangeButton, RemoveButton, SelectButton, XDeleteButton, ActionButton } from "../components/Buttons";
import toolCTA from "/tools-cta/rotate-pdf.png";
import Badge from '../components/Badge';
import UploadProgressBar from '../components/UploadProgressBar';
import ResultSection from '../components/ResultSection';
import ToolHeader from '../components/ToolHeader';

const RotatePDF = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [pageRotations, setPageRotations] = useState({});
  const [rotatedBlob, setRotatedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rotateProgress, setRotateProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [rotatedPagesCount, setRotatedPagesCount] = useState(0);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);

  const dispatch = useDispatch();
  const isRotateLimitReached = useSelector(isUsageLimitReached('rotatePdf'));

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isRotateLimitReached) {
        setDragActive(true);
      }
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [isRotateLimitReached]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isRotateLimitReached) {
      setError("Daily PDF rotation limit reached. Please log in for unlimited usage.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcessing(files[0]);
    }
  }, [isRotateLimitReached]);

  useEffect(() => {
    return () => {
      cleanupAllBlobUrls();
    };
  }, []);

  const uid = (() => {
    let n = Date.now();
    return () => `${n++}`;
  })();

  const cleanupAllBlobUrls = () => {
    previews.forEach(p => {
      if (p.previewUrl) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setRotatedBlob(null);
    setPageRotations({});
    setUploadProgress(0);
    setRotateProgress(0);
    setError('');
    setEncryptedFiles({});
    setRotatedPagesCount(0);
  };

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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRotateLimitReached) {
      setError("Daily PDF rotation limit reached. Please log in for unlimited usage.");
      return;
    }

    await handleFileProcessing(file);
  };

  // RotateImage-style helpers
  const getRotation = (id) => pageRotations[id] || 0;

  const rotatePage = (id, direction) => {
    setPageRotations(prev => {
      const currentAngle = prev[id] || 0;
      const newAngle = direction === "cw"
        ? (currentAngle + 90) % 360
        : (currentAngle - 90 + 360) % 360;
      return { ...prev, [id]: newAngle };
    });
  };

  const rotateAll = (direction) => {
    setPageRotations(prev => {
      const newRotations = { ...prev };
      previews.forEach(p => {
        const currentAngle = prev[p.id] || 0;
        const newAngle = direction === "cw"
          ? (currentAngle + 90) % 360
          : (currentAngle - 90 + 360) % 360;
        newRotations[p.id] = newAngle;
      });
      return newRotations;
    });
  };

  const setPageAngle = (id, angle) => {
    setPageRotations(prev => ({ ...prev, [id]: angle }));
  };

  const handleDeletePage = (id) => {
    setPreviews(prev => {
      const next = prev.filter(p => p.id !== id);
      const removed = prev.find(p => p.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      setPageRotations(r => {
        const copy = { ...r };
        delete copy[id];
        return copy;
      });
      return next;
    });
  };

  const getRotatedCountLive = () => {
    if (!previews.length) return 0;
    return previews.filter(p => (pageRotations[p.id] || 0) !== 0).length;
  };

  const handleRotatePDF = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;

    if (isRotateLimitReached) {
      setError("Daily PDF rotation limit reached. Please log in for unlimited usage.");
      return;
    }

    setIsProcessing(true);
    setRotateProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setRotateProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
      const encryptedFile = encryptedFiles[fileId];
      const password = encryptedFile?.encrypted ? getPDFPassword(fileId) : null;

      const rotatedCount = getRotatedCountLive();
      setRotatedPagesCount(rotatedCount);

      const edits = previews.map(p => ({
        sourcePage: p.pageNumber,
        rotation: pageRotations[p.id] || 0
      }));

      const blob = await applyPageEdits(pdfFile.file, edits, password);

      clearInterval(progressInterval);
      setRotateProgress(100);

      setRotatedBlob(blob);

      previews.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPreviews([]);

      const filename = `${pdfFile.file.name.replace(/\.pdf$/i, "")}_rotated.pdf`;
      downloadPDF(blob, filename);

      dispatch(incrementUsage('rotatePdf'));

      setTimeout(() => {
        setRotateProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Failed to rotate pages: ' + err.message);
      setRotateProgress(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (rotatedBlob) {
      const filename = `${pdfFile.file.name.replace(/\.pdf$/i, "")}_rotated.pdf`;
      downloadPDF(rotatedBlob, filename);
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

  const faqItems = [
    {
      question: "Can I rotate different pages different amounts in my PDF?",
      answer: "Yes! Each page can be rotated independently. Use the per-page controls to set 0°, 90°, 180°, or 270° rotation for perfect document orientation."
    },
    {
      question: "Can I remove pages from my PDF while rotating?",
      answer: "Yes! Use the remove button (X icon) on any page to exclude it from the result, perfect for cleaning up documents while fixing orientation."
    },
    {
      question: "Will rotating pages affect PDF quality or formatting?",
      answer: "No, rotating pages preserves the original quality and formatting. Only orientation changes, all text and images remain crisp and clear."
    },
    {
      question: "Can I edit and rotate password-protected PDFs?",
      answer: "Yes. Enter the password when prompted to enable editing and rotation of encrypted PDF documents while maintaining security."
    }
  ];

  const reasons = [
    {
      icon: Shield,
      title: "Secure PDF Rotation",
      description: "Your PDF documents never leave your browser. All page rotation happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "100% Free PDF Tool",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF page rotation tool is completely free forever. Rotate PDF pages as much as you want.",
    },
    {
      icon: RotateCw,
      title: "Individual Page Control",
      description: "Rotate each page independently to 0°, 90°, 180°, or 270°. Perfect for fixing scanned documents, correcting orientation, and preparing PDFs for viewing.",
    },
    {
      icon: Zap,
      title: "Instant Browser Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration. Start rotating PDF pages in seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly rotate pages in password-protected PDFs. Our tool recognizes encrypted files and prompts for passwords, ensuring secure processing.",
    },
    {
      icon: Layout,
      title: "Visual Rotation Preview",
      description: "See live previews of rotated pages before applying changes. Watch pages rotate in real-time to ensure perfect orientation.",
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
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          <div className={`${!pdfFile ? "flex flex-col justify-center" : ""}`}>
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !rotatedBlob ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Rotate PDF Pages Online"
                description="Rotate your PDF pages with live preview and precise angle control"
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
              {!pdfFile && !rotatedBlob && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 sm:mb-6">
                  <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                    <div className="w-full px-2 sm:px-0">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="text-center w-full">
                          <p className="text-gray-100 mb-3 sm:mb-4 text-center text-sm sm:text-base">
                            {isRotateLimitReached
                              ? "Daily limit reached. Log in for unlimited usage"
                              : "Drop your PDF here or click to browse"}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isRotateLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
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
              {pdfFile && !rotatedBlob && (
                <div className="mb-4 sm:mb-6">
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

                    {/* Rotate All Controls */}
                    {pdfFile && !rotatedBlob && (
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
                          <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-sky-300" />
                            <span className="text-lg text-white">Rotate All Pages:</span>
                            <button
                              onClick={() => rotateAll("ccw")}
                              className="p-2 bg-sky-900 border border-sky-700 hover:bg-sky-400 text-white rounded-lg transition-all cursor-pointer"
                              title="Rotate all counter-clockwise"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => rotateAll("cw")}
                              className="p-2 bg-sky-900 border border-sky-700 hover:bg-sky-400 text-white rounded-lg transition-all cursor-pointer"
                              title="Rotate all clockwise"
                            >
                              <RotateCw className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-100">
                              {getRotatedCountLive()} of {previews.length} pages will be rotated
                            </span>
                          </div>
                        </div>

                        {/* Image Grid with Rotation Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-11/12 m-auto">
                          {!previews.length && (
                            [1, 2, 3, 4].map((i) => (
                              <div key={i} className="w-full bg-sky-900/50 min-h-70 rounded-lg"></div>
                            ))
                          )}
                          <AnimatePresence>
                            {previews.map((p) => (
                              <motion.div
                                key={p.id}
                                exit={{ opacity: 0, y: -20 }}
                                whileHover={{ scale: 1.02 }}
                                className="bg-cyan-700 rounded-lg border border-sky-700 hover:border-sky-500/60 overflow-hidden w-full max-w-60 m-auto">
                                <div className="relative aspect-square bg-sky-900 flex items-center justify-center overflow-hidden">
                                  <div
                                    className="transition-transform duration-300 ease-out aspect-square bg-sky-900 overflow-hidden w-full flex"
                                    style={{ transform: `rotate(${getRotation(p.id)}deg)` }}
                                  >
                                    <img
                                      src={p.previewUrl}
                                      alt={`Page ${p.pageNumber}`}
                                      className="max-w-full max-h-full object-contain m-auto"
                                      style={{
                                        maxWidth: getRotation(p.id) % 180 === 90 ? '70%' : '90%',
                                        maxHeight: getRotation(p.id) % 180 === 90 ? '70%' : '90%',
                                      }}
                                      draggable={false}
                                      onDragStart={(e) => e.preventDefault()}
                                    />
                                  </div>
                                  {/* Rotation Badge */}
                                  {getRotation(p.id) !== 0 && (
                                    <Badge title={`${getRotation(p.id)}°`} />
                                  )}
                                  {/* Remove Button (X) */}
                                  <XDeleteButton handleRemove={() => handleDeletePage(p.id)} title="Remove Page" />
                                </div>

                                {/* File Info & Controls */}
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium text-white truncate text-sm">
                                      Page {p.pageNumber}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => rotatePage(p.id, "ccw")}
                                        className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer"
                                        title="Rotate counter-clockwise"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => rotatePage(p.id, "cw")}
                                        className="p-1.5 bg-sky-400 border border-sky-500 text-white hover:bg-sky-500 rounded transition-all cursor-pointer"
                                        title="Rotate clockwise"
                                      >
                                        <RotateCw className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* Quick Angle Buttons */}
                                  <div className="flex flex-wrap items-center gap-1">
                                    {[0, 90, 180, 270].map((angle) => (
                                      <button
                                        key={angle}
                                        onClick={() => setPageAngle(p.id, angle)}
                                        className={`flex-1 px-2 py-1 text-xs rounded transition-all cursor-pointer ${getRotation(p.id) === angle
                                          ? "bg-sky-400 text-white"
                                          : "text-gray-100 bg-sky-900 border border-sky-500"
                                          }`}
                                      >
                                        {angle}°
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rotate Button */}
              {pdfFile && previews.length > 0 && !rotatedBlob && (
                <ActionButton
                  disabled={isProcessing || isRotateLimitReached || getRotatedCountLive() === 0}
                  handleAction={handleRotatePDF}
                  className={isProcessing || isRotateLimitReached || getRotatedCountLive() === 0 ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Rotating Pages..."
                  title={`Rotate Page${getRotatedCountLive() !== 1 ? "s" : ""}`} />
              )}

              {/* Results UI */}
              {rotatedBlob && (
                <ResultSection
                  title="Rotation Complete!"
                  subtitle={`• ${rotatedPagesCount} page${rotatedPagesCount === 1 ? "" : "s"} rotated`}
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleRemoveResult} summaryTitle="Rotation Summary"
                  summaryItems={[
                    {
                      value: rotatedPagesCount,
                      label: `Page${rotatedPagesCount !== 1 ? "s" : ""} Rotated`,
                      valueColor: "white"
                    },
                    {
                      value: "✓",
                      label: "Complete",
                      valueColor: "teal-400"
                    },
                    {
                      value: "4 Angles",
                      label: "Available",
                      valueColor: "yellow-400"
                    },
                    {
                      value: "100%",
                      label: "Success Rate",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

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

              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={rotateProgress}
                title={`Rotating ${getRotatedCountLive()} ${getRotatedCountLive() === 1 ? "Page" : "Pages"}`}
                description={`Applying rotation...`}
              />
            </div>
          </div>

          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* Tool Details + HowTo + FAQ */}
      <WhyChooseSection
        freeTitle="Free Rotate PDF Pages Online with Live Preview"
        description="Easily rotate pages in your PDF documents to correct orientation issues from scanned uploads or prepare documents for proper viewing. Our free online PDF rotation tool lets you rotate individual pages or all pages at once to 0°, 90°, 180°, or 270° while maintaining original quality, formatting, and security settings. Perfect for fixing sideways pages, adjusting document orientation, and preparing PDFs for printing or digital distribution."
        imageUrl={toolCTA}
        imageAlt="Rotate PDF illustration"
        title="Why choose our PDF Page Rotation Tool"
        subtitle="Experience the best PDF page rotation with our feature-rich, user-friendly tool designed for both professionals and casual users. Live preview makes orientation correction simple and accurate."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          title="How To Rotate PDF Pages Online for Free"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Set Rotation"
          stepTwoDes="Click rotation buttons or select angle"
          stepThree="Preview"
          stepThreeDes="See live preview of rotated pages"
          stepFour="Download"
          stepFourDes="Get your rotated PDF instantly"
        />
      </div>

      <FAQSection faqItems={faqItems} title="PDF Page Rotation FAQs" />
    </div>
  );
};

export default RotatePDF;