import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  FileText,
  ExternalLink,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Settings2,
  Maximize2,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  Layout,
  Image as ImageIcon,
  Type,
  RectangleHorizontal,
  RectangleVertical,
  X,
  Shield,
  Gift,
  Zap,
  Printer,
  Layers
} from "lucide-react";
import { setMetadata } from "../utils";
import { converterApi } from "../api/converterApi";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton } from "../components/Buttons";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import toolCTA from "/tools-cta/html-to-pdf.png";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function HtmlToPdf() {
  const [showInputContainer, setShowInputContainer] = useState(false);
  const [url, setUrl] = useState("");
  const [convertedFile, setConvertedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [pdfInfo, setPdfInfo] = useState({
    size: 0,
    pages: 1,
  });
  const [websitePreview, setWebsitePreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // PDF Options State
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [margins, setMargins] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  const [marginPreset, setMarginPreset] = useState("none");
  const [fullPage, setFullPage] = useState(true);
  const [scale, setScale] = useState(100);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [printMedia, setPrintMedia] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [viewportPreset, setViewportPreset] = useState("desktop");

  const urlInputRef = useRef(null);
  const containerRef = useRef(null);

  const dispatch = useDispatch();
  const isLimitReached = useSelector(isUsageLimitReached('htmlToPdf'));

  // Page size options
  const pageSizes = [
    { id: "A4", name: "A4", description: "Standard" },
    { id: "Letter", name: "Letter", description: "US Standard" },
    { id: "Legal", name: "Legal", description: "Legal" },
    { id: "A3", name: "A3", description: "Large" },
    { id: "A5", name: "A5", description: "Small" },
    { id: "Tabloid", name: "Tabloid", description: "Tabloid" },
  ];

  // Margin presets
  const marginPresets = [
    { id: "none", name: "No Margins", top: 0, right: 0, bottom: 0, left: 0 },
    { id: "narrow", name: "Narrow", top: 5, right: 5, bottom: 5, left: 5 },
    { id: "normal", name: "Normal", top: 10, right: 10, bottom: 10, left: 10 },
    { id: "wide", name: "Wide", top: 20, right: 20, bottom: 20, left: 20 },
  ];

  // Viewport presets
  const viewportPresets = [
    { id: "desktop", name: "Desktop", width: 1280, icon: Monitor },
    { id: "tablet", name: "Tablet", width: 768, icon: Tablet },
    { id: "mobile", name: "Mobile", width: 375, icon: Smartphone },
    { id: "wide", name: "Wide", width: 1920, icon: Maximize2 },
  ];

  // Why choose reasons
  const reasons = [
    {
      icon: Printer,
      title: "High-Quality PDF Generation",
      description: "Convert webpages to print-ready PDFs with professional formatting. Preserve all images, fonts, and layouts exactly as they appear online.",
    },
    {
      icon: Gift,
      title: "100% Free HTML to PDF Converter",
      description: "Convert unlimited webpages to PDF without watermarks, subscriptions, or file size limits. Our free online tool works directly in your browser.",
    },
    {
      icon: Zap,
      title: "Multi-Page PDF Creation",
      description: "Automatically split long webpages into multiple PDF pages. Perfect for converting articles, documentation, and blog posts to printable PDFs.",
    },
    {
      icon: Shield,
      title: "Secure Cloud Processing",
      description: "All PDF conversion happens in secure cloud infrastructure. Your browsing history and sensitive data remain completely private and protected.",
    },
    {
      icon: FileText,
      title: "Professional Page Formatting",
      description: "Choose from A4, Letter, Legal, A3, A5, and Tabloid page sizes with portrait or landscape orientation. Add custom margins and scaling.",
    },
    {
      icon: Layers,
      title: "Advanced PDF Customization",
      description: "Control PDF margins, scale content (10%-200%), include/exclude backgrounds, enable print media styles, and set responsive viewports.",
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
    title: "Free HTML to PDF Converter - Save Webpages as PDF Online",
    description: "Convert any webpage to high-quality PDF documents with our free online HTML to PDF converter. Save articles, blog posts, documentation, and web content as printable PDF files with customizable page sizes, margins, and formatting options. Perfect for archiving, sharing, and offline reading.",
    imageUrl: toolCTA,
    imageAlt: "HTML to PDF Converter Online Tool"
  };

  // Clean up
  const cleanup = () => {
    if (convertedFile?.downloadUrl) {
      URL.revokeObjectURL(convertedFile.downloadUrl);
    }
    if (websitePreview?.previewUrl) {
      URL.revokeObjectURL(websitePreview.previewUrl);
    }
    setConvertedFile(null);
    setConversionProgress(0);
    setError("");
    setWebsitePreview(null);
    setPdfInfo({
      size: 0,
      pages: 1,
    });
  };

  // Validate URL
  const isValidUrl = (urlString) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  // Handle URL change
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    setError("");
    if (websitePreview?.previewUrl) {
      URL.revokeObjectURL(websitePreview.previewUrl);
      setWebsitePreview(null);
    }
  };

  // Handle margin preset change
  const handleMarginPresetChange = (presetId) => {
    setMarginPreset(presetId);
    const preset = marginPresets.find((p) => p.id === presetId);
    if (preset && presetId !== "custom") {
      setMargins({
        top: preset.top,
        right: preset.right,
        bottom: preset.bottom,
        left: preset.left,
      });
    }
  };

  // Handle individual margin change
  const handleMarginChange = (side, value) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    setMargins((prev) => ({ ...prev, [side]: numValue }));
    setMarginPreset("custom");
  };

  // Handle viewport preset change
  const handleViewportPresetChange = (presetId) => {
    setViewportPreset(presetId);
    const preset = viewportPresets.find((p) => p.id === presetId);
    if (preset) {
      setViewportWidth(preset.width);
    }
  };

  // Reset all settings to defaults
  const resetSettings = () => {
    setPageSize("A4");
    setOrientation("portrait");
    setMargins({ top: 0, right: 0, bottom: 0, left: 0 });
    setMarginPreset("none");
    setScale(100);
    setIncludeBackground(true);
    setPrintMedia(false);
    setViewportWidth(1280);
    setViewportPreset("desktop");
    setFullPage(true);
  };

  // Generate website preview
  const generateWebsitePreview = async () => {
    if (!url.trim() || !isValidUrl(url)) {
      setError("Please enter a valid URL first");
      return;
    }

    setIsGeneratingPreview(true);
    setError("");

    try {
      const response = await converterApi.htmlToImage({
        url,
        format: "jpg",
      });

      const blob = response.data || response;

      if (!(blob instanceof Blob)) {
        throw new Error("Response is not a valid image blob");
      }

      const previewUrl = URL.createObjectURL(blob);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load preview"));
        img.src = previewUrl;
      });

      setWebsitePreview({
        previewUrl,
        width: img.width,
        height: img.height,
        url,
      });
    } catch (err) {
      console.warn("Could not generate preview:", err);
      setError("Could not generate preview. The website might be blocking screenshots.");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // handle convert
  const handleConvert = async () => {
    if (!url.trim()) {
      setError("Please enter a website URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    if (isLimitReached) {
      setError("Daily HTML-to-PDF limit reached. Please log in for unlimited usage.");
      return;
    }

    window.scrollTo(0, 0);
    setIsProcessing(true);
    setConversionProgress(0);
    setError("");

    try {
      const progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      const conversionOptions = {
        url,
        pageSize,
        orientation,
        margins,
        scale: scale / 100,
        includeBackground,
        printMedia,
        viewportWidth,
        fullPage,
      };

      const response = await converterApi.htmlToPdf(conversionOptions);

      clearInterval(progressInterval);
      setConversionProgress(100);

      const arrayBuffer = await response.arrayBuffer();
      const { modifiedBlob, downloadUrl } = await setMetadata(arrayBuffer, url);
      const fileName = `${url.split("/").pop().replace(".", "_") || "website"}.pdf`;

      setConvertedFile({
        blob: modifiedBlob,
        downloadUrl,
        fileName,
        size: modifiedBlob.size,
        format: "pdf",
        url,
      });

      setPdfInfo({
        size: modifiedBlob.size,
        pages: 1,
      });

      dispatch(incrementUsage('htmlToPdf'));
      downloadFile(modifiedBlob, fileName);

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to convert website to PDF. Please try again.");
      setConversionProgress(0);
      setIsProcessing(false);
    }
  };

  const downloadFile = (blob, fileName) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  const handleDownload = () => {
    if (convertedFile) {
      downloadFile(convertedFile.blob, convertedFile.fileName);
    }
  };

  const handleCancel = () => {
    cleanup();
    setUrl("");
    setShowInputContainer(false);
  };

  const handleRemoveResult = () => {
    cleanup();
    setUrl("");
    setShowInputContainer(false);
    setConvertedFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get current page size info
  const getCurrentPageSize = () => {
    return pageSizes.find((p) => p.id === pageSize) || pageSizes[0];
  };

  // Example URLs
  const exampleUrls = [
    { url: "https://example.com", name: "Example.com" },
    { url: "https://allypdf.com", name: "Allypdf" },
    { url: "https://wikipedia.org", name: "Wikipedia" },
  ];

  const faqItems = [
    {
      question: "What types of websites can I convert to PDF with this free tool?",
      answer: "Convert any publicly accessible webpage including articles, blog posts, documentation, e-commerce pages, and portfolios. Perfect for saving online content for offline reading.",
    },
    {
      question: "Does the PDF preserve the original website layout and formatting?",
      answer: "Yes! Our advanced PDF rendering engine preserves all CSS styles, fonts, images, and layouts exactly as they appear in modern web browsers, including responsive designs.",
    },
    {
      question: "What page size options are available in this HTML to PDF converter?",
      answer: "Choose from standard page sizes: A4 (International), Letter (US), Legal, A3, A5, and Tabloid. All page sizes support both portrait and landscape orientations.",
    },
    {
      question: "Can I customize margins and scaling for professional PDF output?",
      answer: "Yes! Set custom margins (top, right, bottom, left) or use presets (none, narrow, normal, wide). Scale content from 10% to 200% for optimal PDF layout.",
    },
    {
      question: "Are images, backgrounds, and JavaScript content included in the PDF?",
      answer: "Yes! By default, all images, CSS backgrounds, and JavaScript-rendered content are captured. You can optionally disable backgrounds for cleaner PDF output.",
    },
    {
      question: "Can I convert password-protected or login-required websites to PDF?",
      answer: "Our tool can only access publicly available content. Websites requiring login or with strict access controls cannot be converted without proper authentication.",
    },
  ];

  const hasValidUrl = url.trim() && isValidUrl(url);

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area with Blue linear Background */}
      <div
        className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-linear-to-r from-[#014b80] to-[#031f33]"
      >
        <div className="max-w-7xl mx-auto">
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          <div className={`${!showInputContainer && !convertedFile ? "flex flex-col justify-center" : ""}`}>
            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!showInputContainer && !convertedFile ? "" : "hidden"}`}
            >
              <ToolHeader
                title="HTML to PDF Converter"
                description="Convert any webpage to high-quality PDF documents"
              />
            </motion.div>

            <div className="flex flex-col">
              {/* Initial Add HTML Button */}
              {!showInputContainer && !convertedFile && (
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
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Enter a website URL to convert it to PDF'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <button
                              onClick={() => !isLimitReached && setShowInputContainer(true)}
                              disabled={isLimitReached}
                              className={`w-full max-w-70 px-3 py-4 text-white rounded-lg text-base sm:text-lg md:text-2xl font-semibold transition-all ${isLimitReached
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-sky-400 hover:bg-sky-400/90 shadow-[0_0_30px_rgba(45,212,191,0.15)] cursor-pointer'
                                }`}
                            >
                              Add HTML
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Main Conversion Interface - Blue Theme Card */}
              {showInputContainer && !convertedFile && (
                <div className="mb-4 sm:mb-6">
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Website to PDF Converter
                          </h3>
                          {hasValidUrl && (
                            <span className="text-xs sm:text-sm text-gray-100 truncate max-w-50">
                              • {url}
                            </span>
                          )}
                        </div>
                        <button
                          className="flex-1 sm:flex-none px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm cursor-pointer"
                          onClick={handleCancel}>
                          <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          Cancle
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Main Content Area */}
                        <div className="lg:flex-1">
                          {/* URL Input */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Website URL
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-3 text-gray-100">
                                <Globe className="w-5 h-5" />
                              </div>
                              <input
                                ref={urlInputRef}
                                type="url"
                                value={url}
                                onChange={handleUrlChange}
                                placeholder="https://example.com"
                                className="w-full pl-12 pr-32 py-3 bg-sky-900 border border-sky-700 rounded-lg text-white placeholder-gray-300 focus-visible:outline-4 focus-visible:outline-sky-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />
                              <button
                                onClick={generateWebsitePreview}
                                disabled={isGeneratingPreview || !hasValidUrl}
                                className={`absolute right-2 top-2 px-4 py-1.5 rounded-md text-sm font-medium bg-sky-400 hover:bg-sky-400/90 text-white transition ${!hasValidUrl
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer"
                                  }`}
                              >
                                {isGeneratingPreview ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 inline mr-1" />
                                    Preview
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="mt-2 text-sm text-gray-100">Enter full URL including https://</p>
                          </div>

                          {/* Quick Example URLs */}
                          <div className="mb-6">
                            <p className="text-sm text-gray-100 mb-2">Try these examples:</p>
                            <div className="flex flex-wrap gap-2">
                              {exampleUrls.map((example, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setUrl(example.url);
                                    if (websitePreview?.previewUrl) {
                                      URL.revokeObjectURL(websitePreview.previewUrl);
                                    }
                                    setWebsitePreview(null);
                                  }}
                                  className="px-3 py-1.5 bg-sky-900/50 hover:bg-sky-900 border border-sky-700 rounded text-sm text-gray-100 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <ExternalLink className="w-3 h-3 text-sky-400" />
                                  {example.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Website Preview Area */}
                          <div ref={containerRef} className="relative bg-sky-900 rounded-lg overflow-hidden mb-6">
                            {websitePreview ? (
                              <div className="relative w-full">
                                <div className="w-full max-h-100 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                  <img
                                    src={websitePreview.previewUrl}
                                    alt={`Preview of ${websitePreview.url}`}
                                    className="w-full h-auto"
                                  />
                                </div>
                                <div className="absolute top-2 left-2 bg-sky-900/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                                  <Eye className="w-3 h-3" />
                                  Full Page Preview
                                </div>
                                <div className="absolute top-2 right-2 text-xs text-white bg-sky-900/90 px-2 py-1 rounded backdrop-blur-sm">
                                  {websitePreview.width}×{websitePreview.height}px
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center" style={{ minHeight: "200px" }}>
                                <div className="text-center p-4 sm:p-6">
                                  <Globe className="w-8 h-8 sm:w-12 sm:h-12 text-sky-400 mx-auto mb-2 sm:mb-3" />
                                  <p className="text-white font-medium mb-1 text-sm sm:text-base">Website Preview</p>
                                  <p className="text-gray-100 text-xs sm:text-sm">
                                    Click "Preview" to see the webpage
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Page Size Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Page Size
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {pageSizes.map((size) => (
                                <button
                                  key={size.id}
                                  onClick={() => setPageSize(size.id)}
                                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${pageSize === size.id
                                    ? "border-sky-500 bg-sky-500/10 text-white"
                                    : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                    }`}
                                >
                                  <div className="text-center">
                                    <div className="font-medium text-sm">{size.name}</div>
                                    <div className="text-xs text-gray-100 mt-1">{size.description}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Orientation Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Orientation
                            </label>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setOrientation("portrait")}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${orientation === "portrait"
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <RectangleVertical className="w-6 h-6" />
                                <span className="font-medium">Portrait</span>
                              </button>
                              <button
                                onClick={() => setOrientation("landscape")}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${orientation === "landscape"
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <RectangleHorizontal className="w-6 h-6" />
                                <span className="font-medium">Landscape</span>
                              </button>
                            </div>
                          </div>

                          {/* Page Mode */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Page Mode
                            </label>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setFullPage(true)}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${fullPage
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <Maximize2 className="w-6 h-6" />
                                <span className="font-medium">Full Page</span>
                                <span className="text-xs text-gray-100">Single continuous page</span>
                              </button>
                              <button
                                onClick={() => setFullPage(false)}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${!fullPage
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <Layout className="w-6 h-6" />
                                <span className="font-medium">Paginated</span>
                                <span className="text-xs text-gray-100">Multiple pages</span>
                              </button>
                            </div>
                          </div>

                          {/* Margin Presets */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Margins
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                              {marginPresets.map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => handleMarginPresetChange(preset.id)}
                                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${marginPreset === preset.id
                                    ? "border-sky-500 bg-sky-500/10 text-white"
                                    : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                    }`}
                                >
                                  <div className="text-center">
                                    <div className="font-medium text-sm">{preset.name}</div>
                                    <div className="text-xs text-gray-100 mt-1">{preset.top}mm</div>
                                  </div>
                                </button>
                              ))}
                              <button
                                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${marginPreset === "custom"
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <div className="text-center">
                                  <SlidersHorizontal className="w-4 h-4 mx-auto mb-1" />
                                  <div className="font-medium text-sm">Custom</div>
                                </div>
                              </button>
                            </div>

                            {/* Custom Margin Inputs */}
                            <AnimatePresence>
                              {(showAdvancedSettings || marginPreset === "custom") && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-sky-900 rounded-lg border border-sky-700">
                                    {["top", "right", "bottom", "left"].map((side) => (
                                      <div key={side}>
                                        <label className="block text-xs text-gray-100 mb-1 capitalize">{side}</label>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={margins[side]}
                                            onChange={(e) => handleMarginChange(side, e.target.value)}
                                            className="w-full px-3 py-2 bg-sky-800 border border-sky-600 rounded text-white text-sm focus:border-sky-500"
                                          />
                                          <span className="absolute right-3 top-2 text-xs text-gray-100">mm</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Viewport Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Viewport
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {viewportPresets.map((preset) => {
                                const Icon = preset.icon;
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() => handleViewportPresetChange(preset.id)}
                                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${viewportPreset === preset.id
                                      ? "border-sky-500 bg-sky-500/10 text-white"
                                      : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                      }`}
                                  >
                                    <div className="text-center">
                                      <Icon className="w-5 h-5 mx-auto mb-1" />
                                      <div className="font-medium text-sm">{preset.name}</div>
                                      <div className="text-xs text-gray-100">{preset.width}px</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Scale Slider */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Scale: {scale}%
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                min="10"
                                max="200"
                                value={scale}
                                onChange={(e) => setScale(parseInt(e.target.value))}
                                className="w-full h-2 bg-sky-950 rounded-full cursor-pointer accent-sky-400 inset-ring-1 inset-ring-sky-500"
                              />
                              <input
                                type="number"
                                min="10"
                                max="200"
                                value={scale}
                                onChange={(e) => setScale(Math.max(10, Math.min(200, parseInt(e.target.value) || 100)))}
                                className="w-20 px-3 py-2 bg-sky-900 border border-sky-700 rounded text-white text-sm text-center focus:outline-1 focus:outline-sky-500"
                              />
                            </div>
                          </div>

                          {/* Toggle Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div
                              onClick={() => setIncludeBackground(!includeBackground)}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${includeBackground
                                ? "border-sky-500 bg-sky-500/10"
                                : "border-sky-700 bg-sky-900"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <ImageIcon className={`w-5 h-5 ${includeBackground ? "text-sky-400" : "text-gray-100"}`} />
                                <div>
                                  <div className={`font-medium ${includeBackground ? "text-white" : "text-gray-100"}`}>
                                    Include Background
                                  </div>
                                  <div className="text-xs text-gray-100">CSS backgrounds & images</div>
                                </div>
                              </div>
                              <div
                                className={`w-10 h-6 rounded-full transition-colors ${includeBackground ? "bg-sky-500" : "bg-sky-600"
                                  }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform mt-1 ${includeBackground ? "translate-x-5" : "translate-x-1"
                                    }`}
                                />
                              </div>
                            </div>

                            <div
                              onClick={() => setPrintMedia(!printMedia)}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${printMedia
                                ? "border-sky-500 bg-sky-500/10"
                                : "border-sky-700 bg-sky-900"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <Type className={`w-5 h-5 ${printMedia ? "text-sky-400" : "text-gray-100"}`} />
                                <div>
                                  <div className={`font-medium ${printMedia ? "text-white" : "text-gray-100"}`}>
                                    Print Media Styles
                                  </div>
                                  <div className="text-xs text-gray-100">Use @media print CSS</div>
                                </div>
                              </div>
                              <div
                                className={`w-10 h-6 rounded-full transition-colors ${printMedia ? "bg-sky-500" : "bg-sky-600"
                                  }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform mt-1 ${printMedia ? "translate-x-5" : "translate-x-1"
                                    }`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-center">
                            <button
                              onClick={resetSettings}
                              className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-gray-100 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Reset Settings
                            </button>
                          </div>
                        </div>

                        {/* Right: Settings Summary Sidebar */}
                        <div className="lg:w-64 xl:w-72">
                          <div className="bg-sky-900/50 rounded-xl p-3 sm:p-4 border border-sky-700 sticky top-6">
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                              <Settings2 className="w-4 h-4 text-sky-300" />
                              Conversion Summary
                            </h4>

                            <div className="space-y-3 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Page Size</span>
                                <span className="text-white font-medium">{getCurrentPageSize().name}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Orientation</span>
                                <span className="text-white font-medium capitalize">{orientation}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Page Mode</span>
                                <span className="text-white font-medium">{fullPage ? "Full Page" : "Paginated"}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Margins</span>
                                <span className="text-white font-medium">
                                  {marginPreset === "custom"
                                    ? `${margins.top}mm`
                                    : marginPresets.find((p) => p.id === marginPreset)?.name}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Viewport</span>
                                <span className="text-white font-medium">{viewportWidth}px</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Scale</span>
                                <span className="text-white font-medium">{scale}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Background</span>
                                <span className={`font-medium ${includeBackground ? "text-green-400" : "text-gray-100"}`}>
                                  {includeBackground ? "Included" : "Excluded"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Print Styles</span>
                                <span className={`font-medium ${printMedia ? "text-green-400" : "text-gray-100"}`}>
                                  {printMedia ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-sky-700">
                              <div className="text-sm text-gray-100 mb-2 text-center">
                                {websitePreview ? (
                                  <span className="text-green-400">✓ Preview loaded</span>
                                ) : hasValidUrl ? (
                                  "Ready to convert"
                                ) : (
                                  "Enter a valid URL"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Fixed Bottom Convert Button */}
              {showInputContainer && !convertedFile && (
                <ActionButton
                  disabled={isProcessing || !hasValidUrl || isLimitReached}
                  handleAction={handleConvert}
                  className={isProcessing || !hasValidUrl || isLimitReached ? "cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Converting..."
                  title="Convert to PDF"
                />
              )}

              {/* Conversion Results */}
              {convertedFile && (
                <ResultSection
                  title="Conversion Complete!"
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleRemoveResult} summaryTitle="Conversion Summary"
                  summaryItems={[
                    {
                      value: getCurrentPageSize().name,
                      label: "Page Size",
                      valueColor: "white"
                    },
                    {
                      value: orientation,
                      label: "Orientation",
                      valueColor: "teal-400"
                    },
                    {
                      value: formatFileSize(pdfInfo.size),
                      label: "File Size",
                      valueColor: "yellow-400"
                    },
                    {
                      value: fullPage ? "Full Page" : "Paginated",
                      label: "Mode",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title="Converting Website to PDF"
                description="Loading page, applying settings, and generating PDF..."
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
        title="Why Choose Our HTML to PDF Converter"
        subtitle="Transform webpages into professional PDF documents with our advanced conversion tool. Perfect for students, researchers, professionals, and anyone needing to save web content for offline use."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section with White Background */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Convert HTML to PDF Online"
          stepOne="Enter Website URL"
          stepOneDes="Paste any webpage address you want to convert"
          stepTwo="Configure PDF Settings"
          stepTwoDes="Choose page size, margins, orientation & format"
          stepThree="Preview & Generate"
          stepThreeDes="Preview the page and create PDF document"
          stepFour="Download PDF"
          stepFourDes="Get high-quality printable PDF instantly"
        />
      </div>

      {/* FAQ Section with White Background */}
      <div className="bg-white">
        <FAQSection
          theme="light"
          faqItems={faqItems}
          title="HTML to PDF Converter FAQs"
        />
      </div>
    </div>
  );
}