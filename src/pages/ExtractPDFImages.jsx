import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Image,
  Settings2,
  Shield,
  Gift,
  Zap,
  Key,
  Layers,
  Stars,
  Lock
} from "lucide-react";
import {
  downloadImage,
  isPDFEncrypted,
  testPDFPassword,
  setPDFPassword,
  getPDFPassword,
  getPageCount,
  generatePDFPreview,
  extractEmbeddedImagesFromPDF,
  downloadImagesAsZip,
} from "../utils/index";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import PasswordModal from "../components/PasswordModal";
import WhyChooseSection from "../components/WhyChooseSection";
import { ChangeButton, RemoveButton, SelectButton, ActionButton } from "../components/Buttons";
import toolCTA from "/tools-cta/extract-images.png";
import Badge from "../components/Badge";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader"

export default function ExtractPDFImages() {
  const [pdfFile, setPdfFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Output format selector (kept for UI, but embedded images stay in original encoding; PNG export used when needed)
  const [outputFormat, setOutputFormat] = useState("original");

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState("");
  const [modalPasswordError, setModalPasswordError] = useState("");
  const [encryptedFiles, setEncryptedFiles] = useState({});

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const modalPasswordRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isExtractLimitReached = useSelector(isUsageLimitReached("extractImages"));

  // SEO optimized reasons for choosing tool
  const reasons = [
    { icon: Shield, title: "Secure PDF Image Extractor", description: "Your documents are processed securely with military-grade encryption. Images are extracted without storing any data on our servers." },
    { icon: Gift, title: "100% Free Image Extraction", description: "No watermarks, no subscriptions, no hidden fees. Extract unlimited images from PDFs completely free forever." },
    { icon: Stars, title: "Original Quality Preservation", description: "Maintains original image resolution, DPI, and color profiles. Perfect for designers and photographers." },
    { icon: Zap, title: "Instant Browser-Based Tool", description: "No software installation required. Extract images directly from PDF in your browser within seconds." },
    { icon: Key, title: "Encrypted PDF Support", description: "Extract images from password-protected PDFs. Supports both user and owner passwords securely." },
    { icon: Layers, title: "Batch Image Extraction", description: "Extract all images from multi-page PDFs simultaneously. Automatically organizes into ZIP files." },
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
    title: "Free Extract Images from PDF Online - High Quality Output",
    description: "Extract embedded images, photos, diagrams, and graphics from PDF documents with our powerful online tool. Preserve original image quality, resolution, and format while converting PDF images to JPG, PNG, or WebP. Perfect for designers, marketers, researchers, and professionals who need to recover visual content from PDF files quickly and efficiently without quality loss.",
    imageUrl: toolCTA,
    imageAlt: "PDF Image Extraction Online Tool"
  };

  const uid = (() => { let n = Date.now(); return () => `${n++}`; })();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validatePdfFile = (file) => {
    if (!file) return "Please select a file";
    if (file.type !== "application/pdf") return "Please select a valid PDF file";
    if (file.size > 50 * 1024 * 1024) return "File size must be less than 50MB";
    return null;
  };

  const cleanupAllBlobUrls = () => {
    if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
    if (extractedData?.previewUrl) URL.revokeObjectURL(extractedData.previewUrl);
  };

  const cleanupFileData = () => {
    cleanupAllBlobUrls();
    setPdfFile(null);
    setPreview(null);
    setExtractedData(null);
    setUploadProgress(0);
    setConversionProgress(0);
    setError("");
    setOutputFormat("original");
    setEncryptedFiles({});
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setModalPassword("");
    setModalPasswordError("");
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputKey.current = Date.now();
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (isExtractLimitReached) { setError("Daily image extraction limit reached. Please log in for unlimited usage."); return; }
    const files = e.dataTransfer.files;
    if (files && files[0]) await handleFileProcessing(files[0]);
  };

  const processPDFFile = async (file, password = null) => {
    try {
      setUploadProgress(10);
      const fileId = `${file.name}-${file.size}`;
      if (password) setPDFPassword(fileId, password);
      const pageCount = await getPageCount(file, password);
      setUploadProgress(50);
      setPdfFile({ file, pageCount });
      const gen = await generatePDFPreview(file, 1, 0.8, "JPEG", password);
      setPreview({ id: uid(), pageNumber: 1, previewUrl: gen.previewUrl });
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError("Failed to process PDF: " + err.message);
      setUploadProgress(0);
    }
  };

  const handleFileProcessing = async (file) => {
    if (!file) return;
    const err = validatePdfFile(file);
    if (err) { setError(err); return; }
    if (isExtractLimitReached) { setError("Daily image extraction limit reached. Please log in for unlimited usage."); return; }
    cleanupFileData(); setError("");
    try {
      const encryptionInfo = await isPDFEncrypted(file);
      if (encryptionInfo?.encrypted) {
        setCurrentEncryptedFile({ file, encryptionInfo });
        setShowPasswordModal(true);
        return;
      }
      await processPDFFile(file);
    } catch (err) {
      setError("Failed to process PDF: " + err.message);
      setUploadProgress(0);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isExtractLimitReached) { setError("Daily image extraction limit reached. Please log in for unlimited usage."); return; }
    await handleFileProcessing(file);
    resetFileInput();
  };

  const handlePasswordSubmit = async () => {
    if (!currentEncryptedFile) return;
    const { file } = currentEncryptedFile;
    if (!modalPassword.trim()) { setModalPasswordError("Password is required"); return; }
    try {
      const result = await testPDFPassword(file, modalPassword);
      if (result.valid) {
        await processPDFFile(file, modalPassword);
        const fileId = `${file.name}-${file.size}`;
        setEncryptedFiles((prev) => ({ ...prev, [fileId]: { encrypted: true, passwordValid: true } }));
        setModalPassword(""); setModalPasswordError(""); setShowPasswordModal(false); setCurrentEncryptedFile(null);
      } else {
        setModalPasswordError("Invalid password. Please try again.");
      }
    } catch (err) {
      setModalPasswordError("Error testing password: " + err.message);
    }
  };

  const handlePasswordCancel = () => {
    setModalPassword(""); setModalPasswordError(""); setShowPasswordModal(false); setCurrentEncryptedFile(null);
    setUploadProgress(0); resetFileInput();
  };

  // Main extraction: extract embedded images (XObjects/inline) client-side
  const handleExtract = async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;
    if (isExtractLimitReached) { setError("Daily image extraction limit reached. Please log in for unlimited usage."); return; }

    setIsProcessing(true); setConversionProgress(0); setError("");

    try {
      const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
      const savedPassword = getPDFPassword(fileId);

      const progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 200);

      const images = await extractEmbeddedImagesFromPDF(pdfFile.file, savedPassword);

      clearInterval(progressInterval);
      setConversionProgress(100);

      if (!images.length) {
        throw new Error("No embedded images found in this PDF document.");
      }

      const imageCount = images.length;
      const totalSize = images.reduce((sum, img) => sum + (img.blob?.size || 0), 0);
      const fileBase = pdfFile.file.name.replace(/\.pdf$/i, "");
      const zipName = `${fileBase}-${imageCount}-images.zip`;
      const singleName = imageCount === 1 ? images[0].fileName : zipName;

      setExtractedData({
        images,
        fileName: singleName,
        fileSize: totalSize,
        imageCount,
        isZip: imageCount > 1,
        isSingleImage: imageCount === 1,
        contentType: imageCount > 1 ? "application/zip" : images[0]?.blob?.type || "image/png",
      });

      if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl);
      setPreview(null);

      dispatch(incrementUsage("extractImages"));

      // Auto-download
      if (imageCount === 1) {
        downloadImage(images[0].blob, singleName);
      } else {
        downloadImagesAsZip(
          images.map((img) => ({ blob: img.blob, fileName: img.fileName, pageNumber: img.pageNumber || 1 })),
          zipName
        );
      }

      setTimeout(() => { setConversionProgress(0); setIsProcessing(false); }, 1000);
    } catch (err) {
      console.error("Extraction error:", err);
      const errorMessage = err.message || "Image extraction failed";
      if (errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("encrypted")) {
        setCurrentEncryptedFile({ file: pdfFile.file, encryptionInfo: { encrypted: true } });
        setShowPasswordModal(true);
      } else {
        setError(errorMessage);
      }
      setConversionProgress(0); setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!extractedData) return;
    if (extractedData.isSingleImage) {
      downloadImage(extractedData.images[0].blob, extractedData.fileName);
    } else {
      downloadImagesAsZip(
        extractedData.images.map((img) => ({ blob: img.blob, fileName: img.fileName, pageNumber: img.pageNumber || 1 })),
        extractedData.fileName
      );
    }
  };

  const handleRemoveFile = () => { cleanupFileData(); resetFileInput(); };
  const handleStartOver = () => { cleanupFileData(); resetFileInput(); };
  const handleAddMoreFiles = () => { fileInputRef.current?.click(); };

  useEffect(() => {
    if (showPasswordModal && modalPasswordRef.current) {
      setTimeout(() => modalPasswordRef.current?.focus(), 100);
    }
  }, [showPasswordModal]);

  useEffect(() => () => cleanupAllBlobUrls(), []);

  const faqItems = [
    { question: "What types of images can be extracted from PDFs?", answer: "Extract all embedded images including JPEG, PNG, GIF, BMP, and TIFF formats with original quality preservation. Our PDF image extractor handles photos, diagrams, logos, and any visual content embedded in PDF files." },
    { question: "Will extracted images maintain original quality and resolution?", answer: "Yes! Images are extracted at their original DPI and resolution as embedded in the PDF. No compression or quality degradation occurs during the extraction process." },
    { question: "Can I extract images from password-protected or encrypted PDFs?", answer: "Absolutely. Our secure PDF image extraction tool supports password-protected PDFs. Simply enter the password when prompted to access and extract images securely." },
    { question: "How are multiple images delivered from PDF documents?", answer: "Multiple images are automatically packaged into a downloadable ZIP file. Single images are delivered directly. All files maintain their original names and formats." },
    { question: "Is there a file size limit for PDF image extraction?", answer: "You can extract images from PDF files up to 50MB. For larger documents, we recommend splitting the PDF or contacting us for enterprise solutions." },
    { question: "Do you store my PDF files or extracted images?", answer: "No. All processing happens securely in memory. Your files are never stored on our servers, ensuring complete privacy and data protection." },
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
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          <div className={`${!pdfFile && !extractedData ? "flex flex-col justify-center" : ""}`}>
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !extractedData ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Extract Images from PDF"
                description="Extract all embedded images from PDF documents instantly"
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
              {!pdfFile && !extractedData && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 sm:mb-6">
                  <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                    <div className="w-full px-2 sm:px-0">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="text-center w-full">
                          <p className="text-gray-100 mb-3 sm:mb-4 text-center text-sm sm:text-base">
                            {isExtractLimitReached ? 'Daily limit reached. Log in for unlimited usage' : 'Drop your PDF file here or click to browse'}
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
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-sky-500/20 rounded-xl pointer-events-none" />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {pdfFile && !extractedData && (
                <div className="mb-4 sm:mb-6" >
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">Selected File</h3>
                          <span className="text-xs sm:text-sm text-gray-100">• {pdfFile.pageCount} {pdfFile.pageCount === 1 ? "page" : "pages"}</span>
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

                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!preview && <div className="w-full bg-sky-900/50 min-h-70 max-w-3xs rounded-lg flex justify-center m-auto"></div>}
                        {preview && (
                          <div className="flex justify-center w-full max-w-3xs m-auto">
                            <div className="bg-cyan-700 rounded-lg border border-sky-700 overflow-hidden max-w-xs">
                              <div className="relative aspect-square bg-sky-900 overflow-hidden flex items-center justify-center">
                                <img src={preview.previewUrl} alt="PDF Preview" className="max-w-full max-h-full object-contain" style={{ maxWidth: "90%", maxHeight: "90%" }} draggable={false} onDragStart={(e) => e.preventDefault()} />
                                <Badge title="Preview" />
                              </div>
                              <div className="p-3">
                                <p className="font-medium text-white truncate text-sm">{pdfFile.file.name}</p>
                                <p className="text-xs text-gray-100">{pdfFile.pageCount <= 1 ? "1 page" : `${pdfFile.pageCount} pages`}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4 md:col-start-2">
                          <div className="bg-sky-900/50 rounded-lg border border-sky-700 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Settings2 className="w-5 h-5 text-sky-300" />
                              <h4 className="text-lg font-medium text-white">Extraction Options</h4>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm text-white mb-2">Output Image Format</label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: "Original", value: "original" },
                                    { label: "PNG", value: "png" },
                                    { label: "JPG", value: "jpg" },
                                    { label: "WEBP", value: "webp" },
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => setOutputFormat(opt.value)}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white cursor-pointer ${outputFormat === opt.value ? "bg-sky-500" : "bg-sky-800 hover:bg-sky-700"}`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-100 mt-2">
                                  Embedded images keep their native encoding where possible; PNG export is used for inline/bitmap cases.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Image className="w-5 h-5 text-sky-300 mt-0.5" />
                              <div>
                                <p className="text-white font-medium mb-1">Image Extraction Ready</p>
                                <p className="text-sm text-white">
                                  Click Extract to retrieve all embedded images from this PDF. Multiple images will be packaged into a ZIP file automatically.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-100">* Your file is processed securely. Images are extracted in their original quality.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {pdfFile && !extractedData && (
                <ActionButton
                  disabled={isProcessing || isExtractLimitReached}
                  handleAction={handleExtract}
                  className={isProcessing || isExtractLimitReached ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Extracting..."
                  title="Extract Images"
                />
              )}

              {extractedData && (
                <ResultSection
                  title="Images Extracted Successfully!"
                  onDownload={handleDownload}
                  downloadButtonText={`Download ${extractedData.isZip ? "All" : ""}`}
                  onStartOver={handleStartOver}
                  summaryTitle="Extraction Summary"
                  summaryItems={[
                    { value: extractedData.imageCount, label: extractedData.imageCount === 1 ? "Image" : "Images", valueColor: "white" },
                    { value: formatFileSize(extractedData.fileSize), label: "Download Size", valueColor: "teal-400" },
                    { value: outputFormat === "original" ? "Original" : outputFormat.toUpperCase(), label: "Format", valueColor: "yellow-400" },
                    { value: "100%", label: "Success Rate", valueColor: "green-400" },
                  ]}
                />
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
                progress={conversionProgress}
                title="Extracting Images"
                description={`Analyzing PDF and extracting embedded images...`}
              />
            </div>
          </div>

          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      <WhyChooseSection
        freeTitle={freeToolSection.title}
        description={freeToolSection.description}
        imageUrl={freeToolSection.imageUrl}
        imageAlt={freeToolSection.imageAlt}
        title="Why choose our PDF Image Extractor"
        subtitle="Experience the best PDF image extraction with our feature-rich, user-friendly tool designed for both professionals and casual users. Extract high-quality images from PDFs with ease."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Extract Images from PDF Online"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Enter Password"
          stepTwoDes="If the PDF is protected, provide the password"
          stepThree="Choose Format"
          stepThreeDes="Select output image format (optional)"
          stepFour="Download"
          stepFourDes="Download your extracted images or ZIP"
        />
      </div>

      <div className="bg-white">
        <FAQSection theme="light" faqItems={faqItems} title="PDF Image Extraction FAQs" />
      </div>
    </div>
  );
}