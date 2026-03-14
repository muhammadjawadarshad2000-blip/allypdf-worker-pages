import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  Globe,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Settings2,
  Maximize2,
  RotateCcw,
  Eye,
  X,
  Shield,
  Gift,
  Zap,
  Camera,
  Layers
} from "lucide-react";
import { converterApi } from "../api/converterApi";
import ErrorMessage from "../components/ErrorMessage";
import FAQSection from "../components/FAQSection";
import HowToSection from "../components/HowToSection";
import ProcessingOverlay from "../components/ProcessingOverlay";
import WhyChooseSection from "../components/WhyChooseSection";
import { ActionButton } from "../components/Buttons";
import { incrementUsage, isUsageLimitReached } from "../store/slices/usageSlice";
import toolCTA from "/tools-cta/html-to-image.png";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function HtmlToImage() {
  const [showInputContainer, setShowInputContainer] = useState(false);
  const [url, setUrl] = useState("");
  const [convertedFile, setConvertedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState("");
  const [screenshotInfo, setScreenshotInfo] = useState({
    width: 0,
    height: 0,
    size: 0,
  });
  const [websitePreview, setWebsitePreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Image Options State
  const [imageFormat, setImageFormat] = useState("png");
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewportPreset, setViewportPreset] = useState("desktop");
  const [deviceScaleFactor, setDeviceScaleFactor] = useState(2);
  const [fullPage, setFullPage] = useState(true);

  const urlInputRef = useRef(null);
  const containerRef = useRef(null);

  const dispatch = useDispatch();
  const isLimitReached = useSelector(isUsageLimitReached('htmlToImage'));

  // Viewport presets
  const viewportPresets = [
    { id: "desktop", name: "Desktop", width: 1440, icon: Monitor },
    { id: "tablet", name: "Tablet", width: 768, icon: Tablet },
    { id: "mobile", name: "Mobile", width: 375, icon: Smartphone },
    { id: "wide", name: "Wide", width: 1920, icon: Maximize2 },
  ];

  // Scale factor options
  const scaleFactors = [
    { id: 1, name: "1x", description: "Standard" },
    { id: 2, name: "2x", description: "High DPI" },
    { id: 3, name: "3x", description: "Ultra HD" },
  ];

  // Why choose reasons
  const reasons = [
    {
      icon: Camera,
      title: "Full-Page Screenshot Capture",
      description: "Capture entire webpages including below-the-fold content with automatic scrolling. Perfect for documenting long articles, documentation pages, and responsive designs.",
    },
    {
      icon: Gift,
      title: "100% Free HTML to Image Tool",
      description: "Convert unlimited webpages to images without watermarks, subscriptions, or hidden fees. Our free HTML screenshot tool works directly in your browser.",
    },
    {
      icon: Zap,
      title: "Multi-Device Viewport Support",
      description: "Capture responsive designs in desktop, tablet, and mobile viewports. Perfect for testing responsive websites and creating device-specific screenshots.",
    },
    {
      icon: Shield,
      title: "Secure Browser-Based Processing",
      description: "All screenshot generation happens in secure cloud infrastructure. Your browsing history and sensitive data remain completely private.",
    },
    {
      icon: Globe,
      title: "JavaScript & Dynamic Content Support",
      description: "Capture modern websites with JavaScript, CSS animations, lazy-loaded images, and dynamic content. Get pixel-perfect screenshots every time.",
    },
    {
      icon: Layers,
      title: "Professional Image Export Options",
      description: "Save as high-quality PNG (lossless) or optimized JPG with customizable resolution scaling (1x, 2x, 3x DPI) for print-ready screenshots.",
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
    title: "Free HTML to Image Converter - Capture Websites as Images Online",
    description: "Convert any webpage to high-quality PNG or JPG images with our free online HTML to image converter. Capture full-page screenshots, responsive designs, and dynamic content with multiple viewport options. Perfect for documentation, design reviews, portfolio creation, and visual content generation.",
    imageUrl: toolCTA,
    imageAlt: "HTML to Image Converter Online Tool"
  };

  // Clean up
  const cleanup = () => {
    if (convertedFile?.previewUrl) {
      URL.revokeObjectURL(convertedFile.previewUrl);
    }
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
    setScreenshotInfo({
      width: 0,
      height: 0,
      size: 0,
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
    setImageFormat("png");
    setViewportWidth(1440);
    setViewportPreset("desktop");
    setDeviceScaleFactor(2);
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
        size: blob.size,
        url,
      });
    } catch (err) {
      console.warn("Could not generate preview:", err);
      setError("Could not generate preview. The website might be blocking screenshots.");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Handle convert and download
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
      setError("Daily HTML-to-Image limit reached. Please log in for unlimited usage.");
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

      const response = await converterApi.htmlToImage(
        {
          url,
          format: imageFormat,
          viewportWidth,
          deviceScaleFactor,
          fullPage,
        }
      );

      clearInterval(progressInterval);
      setConversionProgress(100);

      // FIX: Extract the data which contains the actual Blob
      const blob = response.data || response;

      if (!(blob instanceof Blob)) {
        throw new Error("Conversion failed to return a valid file");
      }

      const downloadUrl = URL.createObjectURL(blob);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = downloadUrl;
      });

      const fileName = `${url.split("/").pop().replace(".", "_") || "website"}.${imageFormat}`;

      setConvertedFile({
        blob: blob,
        downloadUrl,
        previewUrl: downloadUrl,
        fileName,
        size: blob.size,
        format: imageFormat,
        url,
      });

      setScreenshotInfo({
        width: img.width,
        height: img.height,
      });

      dispatch(incrementUsage('htmlToImage'));
      downloadFile(blob, fileName);

      setTimeout(() => {
        setConversionProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error("Conversion error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to convert website to image. Please check the URL and try again."
      );
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

  // Example URLs
  const exampleUrls = [
    { url: "https://example.com", name: "Example.com" },
    { url: "https://allypdf.com", name: "Allypdf" },
    { url: "https://wikipedia.org", name: "Wikipedia" },
  ];

  const faqItems = [
    {
      question: "What websites can I convert to images with this free HTML to image converter?",
      answer: "Convert any publicly accessible website including blogs, e-commerce sites, portfolios, and documentation. Some websites with strict security headers may require alternative capture methods.",
    },
    {
      question: "What image formats are available in this webpage to image converter?",
      answer: "Convert HTML to PNG (lossless quality for graphics) or JPG (compressed for photos). PNG supports transparency while JPG offers smaller file sizes for web use.",
    },
    {
      question: "How does the full-page screenshot feature work?",
      answer: "Our HTML screenshot tool automatically scrolls through the entire webpage, capturing all content including below-the-fold sections, and stitches them into a single high-quality image.",
    },
    {
      question: "Are JavaScript-heavy websites supported by this web capture tool?",
      answer: "Yes! Our advanced rendering engine executes JavaScript, loads lazy images, and waits for animations to complete before capturing, ensuring accurate screenshots of modern web applications.",
    },
    {
      question: "What viewport options are available for responsive design testing?",
      answer: "Capture websites in Desktop (1440px), Tablet (768px), Mobile (375px), or Wide (1920px) viewports. Perfect for testing responsive websites and creating device mockups.",
    },
    {
      question: "Can I use this HTML to image API for automated screenshots?",
      answer: "While this is a web-based tool, the underlying technology supports API access for businesses needing automated website screenshot generation at scale.",
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
                title="HTML to Image Converter"
                description="Convert any webpage to high-quality PNG or JPG images"
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
                              : 'Enter a website URL to convert it to an image'}
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
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="text-white text-md sm:text-lg">
                            Website to Image Converter
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

                          {/* Image Format Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Image Format
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setImageFormat("png")}
                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${imageFormat === "png"
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <div className="text-center">
                                  <div className="font-medium text-lg">PNG</div>
                                  <div className="text-xs text-gray-100 mt-1">Lossless • Best Quality</div>
                                </div>
                              </button>
                              <button
                                onClick={() => setImageFormat("jpg")}
                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${imageFormat === "jpg"
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <div className="text-center">
                                  <div className="font-medium text-lg">JPG</div>
                                  <div className="text-xs text-gray-100 mt-1">Compressed • Smaller Size</div>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Capture Mode */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Capture Mode
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
                                <span className="text-xs text-gray-100">Entire webpage</span>
                              </button>
                              <button
                                onClick={() => setFullPage(false)}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center gap-2 ${!fullPage
                                  ? "border-sky-500 bg-sky-500/10 text-white"
                                  : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                  }`}
                              >
                                <Monitor className="w-6 h-6" />
                                <span className="font-medium">Viewport Only</span>
                                <span className="text-xs text-gray-100">Above the fold</span>
                              </button>
                            </div>
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

                          {/* DPI Scale Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Resolution Scale (DPI)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {scaleFactors.map((scale) => (
                                <button
                                  key={scale.id}
                                  onClick={() => setDeviceScaleFactor(scale.id)}
                                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${deviceScaleFactor === scale.id
                                    ? "border-sky-500 bg-sky-500/10 text-white"
                                    : "border-sky-700 bg-sky-900 text-gray-100 hover:border-sky-600"
                                    }`}
                                >
                                  <div className="text-center">
                                    <div className="font-medium text-lg">{scale.name}</div>
                                    <div className="text-xs text-gray-100 mt-1">{scale.description}</div>
                                  </div>
                                </button>
                              ))}
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
                                <span className="text-gray-100">Format</span>
                                <span className="text-white font-medium">{imageFormat.toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Capture</span>
                                <span className="text-white font-medium">{fullPage ? "Full Page" : "Viewport"}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Viewport</span>
                                <span className="text-white font-medium">{viewportWidth}px</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Resolution</span>
                                <span className="text-white font-medium">{deviceScaleFactor}x DPI</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-100">Quality</span>
                                <span className={`font-medium ${imageFormat === "png" ? "text-green-400" : "text-yellow-400"}`}>
                                  {imageFormat === "png" ? "Lossless" : "Compressed"}
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
                  title={`Convert to ${imageFormat.toUpperCase()}`}
                />
              )}

              {/* Conversion Results */}
              {convertedFile && (
                <ResultSection
                  title="Conversion Complete!"
                  onDownload={handleDownload}
                  onStartOver={handleRemoveResult} summaryTitle="Conversion Summary"
                  summaryItems={[
                    {
                      value: `${screenshotInfo.width}×${screenshotInfo.height}`,
                      label: "Dimensions",
                      valueColor: "white"
                    },
                    {
                      value: convertedFile.format.toUpperCase(),
                      label: "Format",
                      valueColor: "teal-400"
                    },
                    {
                      value: formatFileSize(convertedFile.size),
                      label: "File Size",
                      valueColor: "yellow-400"
                    },
                    {
                      value: `${deviceScaleFactor}x`,
                      label: "Resolution",
                      valueColor: "green-400"
                    },
                  ]} />
              )}

              {/* Processing Overlay */}
              <ProcessingOverlay
                isProcessing={isProcessing}
                progress={conversionProgress}
                title="Converting Website to Image"
                description="Loading page, scrolling, and capturing screenshot..."
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
        title="Why Choose Our HTML to Image Converter"
        subtitle="Transform webpages into high-quality images with our advanced screenshot tool. Perfect for designers, developers, marketers, and content creators needing visual web content."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section with White Background */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Convert HTML to Images Online"
          stepOne="Enter Website URL"
          stepOneDes="Paste any webpage address you want to capture"
          stepTwo="Configure Settings"
          stepTwoDes="Choose format, viewport, resolution & capture mode"
          stepThree="Preview & Capture"
          stepThreeDes="Preview the page and generate screenshot"
          stepFour="Download Image"
          stepFourDes="Get high-quality PNG or JPG instantly"
        />
      </div>

      {/* FAQ Section with White Background */}
      <div className="bg-white">
        <FAQSection
          theme="light"
          faqItems={faqItems}
          title="HTML to Image Converter FAQs"
        />
      </div>
    </div>
  );
}