import { useState, useRef, useEffect, useCallback } from "react";
const { motion, AnimatePresence } = await import("framer-motion");
import { useSelector, useDispatch } from 'react-redux';
import {
  Crop, CheckCircle, ChevronRight, ChevronLeft,
  Square, RectangleHorizontal, Monitor, Smartphone,
  RotateCcw, X,
  Scissors, Zap, Gift, Shield, Layers, Target,
  Lock
} from "lucide-react";
import {
  validatePDF,
  getPageCount,
  generatePDFPreview,
  downloadPDF,
  cropPDF,
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
import { ActionButton, SelectButton } from "../components/Buttons";
import toolCTA from "/tools-cta/crop-pdf.png";
import UploadProgressBar from "../components/UploadProgressBar";
import ResultSection from "../components/ResultSection";
import ToolHeader from "../components/ToolHeader";

export default function CropPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [cropAreas, setCropAreas] = useState({});
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropProgress, setCropProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEncryptedFile, setCurrentEncryptedFile] = useState(null);
  const [modalPassword, setModalPassword] = useState('');
  const [modalPasswordError, setModalPasswordError] = useState('');
  const [encryptedFiles, setEncryptedFiles] = useState({});

  // Crop state matching CropImage.jsx exactly
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [aspectRatio, setAspectRatio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const modalPasswordRef = useRef(null);
  const inputKey = useRef(Date.now());

  const dispatch = useDispatch();
  const isCropLimitReached = useSelector(isUsageLimitReached('cropPdf'));

  // Aspect ratio options matching CropImage.jsx
  const aspectRatios = [
    { label: "Free", value: null, icon: Crop },
    { label: "1:1", value: "1:1", icon: Square },
    { label: "4:3", value: "4:3", icon: RectangleHorizontal },
    { label: "16:9", value: "16:9", icon: Monitor },
    { label: "3:2", value: "3:2", icon: Smartphone },
    { label: "2:3", value: "2:3", icon: Smartphone },
  ];

  // SEO optimized reasons for choosing tool
  const reasons = [
    {
      icon: Scissors,
      title: "Precision PDF Cropping Tool",
      description: "Crop PDF pages with pixel-perfect accuracy. Remove white borders, focus on specific content, or create custom layouts for professional documents.",
    },
    {
      icon: Gift,
      title: "100% Free PDF Cropping",
      description: "No watermarks, no subscriptions, no hidden fees. Crop unlimited PDF documents completely free forever with our browser-based tool.",
    },
    {
      icon: Zap,
      title: "Batch PDF Page Cropping",
      description: "Crop individual pages or apply the same crop to all pages at once. Perfect for formatting multiple documents with consistent layouts.",
    },
    {
      icon: Target,
      title: "Multi-Page PDF Editing",
      description: "Set different crop areas for each page or apply uniform cropping across your entire PDF document with one click.",
    },
    {
      icon: Shield,
      title: "Secure PDF Processing",
      description: "All PDF cropping happens locally in your browser. Your documents never leave your device, ensuring complete privacy and confidentiality.",
    },
    {
      icon: Layers,
      title: "Professional Document Formatting",
      description: "Ideal for legal documents, academic papers, business reports, and presentations requiring precise page formatting and layout control.",
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
    title: "Free Online PDF Cropper - Crop PDF Pages with Precision",
    description: "Crop PDF pages online for free with our professional PDF cropping tool. Remove unwanted margins, focus on specific content, or create custom page layouts. Perfect for legal documents, academic papers, presentations, and business reports. Supports multi-page PDF cropping with individual page customization.",
    imageUrl: toolCTA,
    imageAlt: "Online PDF Cropping Tool"
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

  const cleanupAllBlobUrls = useCallback(() => {
    previews.forEach(p => {
      if (p.previewUrl) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });

    if (croppedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(croppedBlob));
    }
  }, [previews, croppedBlob]);

  const cleanupFileData = useCallback(() => {
    cleanupAllBlobUrls();
    setPreviews([]);
    setCroppedBlob(null);
    setCropAreas({});
    setActivePage(1);
    setCropArea({ x: 50, y: 50, width: 200, height: 200 });
    setAspectRatio(null);
    setImageDisplaySize({ width: 0, height: 0 });
    setOriginalImageSize({ width: 0, height: 0 });
    setUploadProgress(0);
    setCropProgress(0);
    setError('');
    setEncryptedFiles({});
  }, [cleanupAllBlobUrls]);

  // Reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    inputKey.current = Date.now();
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (!isCropLimitReached) {
        setDragActive(true);
      }
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [isCropLimitReached]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isCropLimitReached) {
      setError("Daily PDF crop limit reached. Please log in for unlimited usage.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcessing(files[0]);
    }
  }, [isCropLimitReached]);

  const handleFileProcessing = useCallback(async (file) => {
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
        setCurrentEncryptedFile({
          file,
          encryptionInfo
        });
        setShowPasswordModal(true);
        return;
      }

      await processPDFFile(file);
    } catch (err) {
      setError('Failed to process PDF:  ' + err.message);
      setUploadProgress(0);
    }
  }, [cleanupFileData]);

  const processPDFFile = useCallback(async (file, password = null) => {
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
        const progress = 30 + Math.floor((i * 60) / pageCount);
        setUploadProgress(progress);

        const gen = await generatePDFPreview(file, i, 1.5, "JPEG", password);
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
  }, []);

  const handlePasswordSubmit = useCallback(async () => {
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
  }, [currentEncryptedFile, modalPassword, processPDFFile]);

  const handlePasswordCancel = useCallback(() => {
    setModalPassword('');
    setModalPasswordError('');
    setShowPasswordModal(false);
    setCurrentEncryptedFile(null);
    setUploadProgress(0);
    resetFileInput();
  }, []);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isCropLimitReached) {
      setError("Daily PDF crop limit reached. Please log in for unlimited usage.");
      return;
    }

    handleFileProcessing(file);
    resetFileInput();
  }, [isCropLimitReached, handleFileProcessing]);

  // Calculate actual crop coordinates (scaled to original image)
  const getActualCropCoordinates = useCallback(() => {
    if (!imageDisplaySize.width || !originalImageSize.width) return null;

    const scaleX = originalImageSize.width / imageDisplaySize.width;
    const scaleY = originalImageSize.height / imageDisplaySize.height;

    return {
      left: Math.round(cropArea.x * scaleX),
      top: Math.round(cropArea.y * scaleY),
      width: Math.round(cropArea.width * scaleX),
      height: Math.round(cropArea.height * scaleY),
      canvasWidth: originalImageSize.width,
      canvasHeight: originalImageSize.height
    };
  }, [cropArea, imageDisplaySize, originalImageSize]);

  // Convert actual coordinates back to display coordinates
  const getDisplayCropFromActual = useCallback((actualCrop, displaySize, origSize) => {
    if (!actualCrop || !displaySize.width || !origSize.width) return null;

    const scaleX = displaySize.width / origSize.width;
    const scaleY = displaySize.height / origSize.height;

    return {
      x: actualCrop.left * scaleX,
      y: actualCrop.top * scaleY,
      width: actualCrop.width * scaleX,
      height: actualCrop.height * scaleY,
    };
  }, []);

  // Save current crop area for the active page
  const saveCurrentCropArea = useCallback(() => {
    if (activePage && imageDisplaySize.width > 0 && originalImageSize.width > 0) {
      const actualCoords = getActualCropCoordinates();
      if (actualCoords) {
        setCropAreas(prev => ({
          ...prev,
          [activePage]: actualCoords
        }));
        return actualCoords;
      }
    }
    return null;
  }, [activePage, imageDisplaySize, originalImageSize, getActualCropCoordinates]);

  // Initialize crop area when image loads
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight || 500;

      // Store original image dimensions
      const origWidth = img.naturalWidth;
      const origHeight = img.naturalHeight;
      setOriginalImageSize({ width: origWidth, height: origHeight });

      // Calculate display size maintaining aspect ratio
      const imgAspect = origWidth / origHeight;
      let displayWidth, displayHeight;

      if (containerWidth / containerHeight > imgAspect) {
        displayHeight = Math.min(containerHeight, 500);
        displayWidth = displayHeight * imgAspect;
      } else {
        displayWidth = containerWidth;
        displayHeight = displayWidth / imgAspect;
      }

      setImageDisplaySize({ width: displayWidth, height: displayHeight });

      // Check if we have saved crop area for this page
      const savedCrop = cropAreas[activePage];
      if (savedCrop) {
        // Convert saved actual coordinates to display coordinates
        const displayCrop = getDisplayCropFromActual(
          savedCrop,
          { width: displayWidth, height: displayHeight },
          { width: origWidth, height: origHeight }
        );
        if (displayCrop) {
          setCropArea(displayCrop);
          return;
        }
      }

      // Set initial crop area (centered, 60% of image)
      const cropWidth = displayWidth * 0.6;
      const cropHeight = displayHeight * 0.6;
      setCropArea({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [activePage, cropAreas, getDisplayCropFromActual]);

  // Handle aspect ratio change
  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);

    if (ratio && imageDisplaySize.width > 0) {
      const [w, h] = ratio.split(":").map(Number);
      const targetRatio = w / h;

      let newWidth = cropArea.width;
      let newHeight = cropArea.width / targetRatio;

      if (newHeight > imageDisplaySize.height * 0.8) {
        newHeight = imageDisplaySize.height * 0.8;
        newWidth = newHeight * targetRatio;
      }

      if (newWidth > imageDisplaySize.width * 0.8) {
        newWidth = imageDisplaySize.width * 0.8;
        newHeight = newWidth / targetRatio;
      }

      setCropArea({
        x: (imageDisplaySize.width - newWidth) / 2,
        y: (imageDisplaySize.height - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  // Mouse handlers for crop area
  const handleMouseDown = (e, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x: x - cropArea.x, y: y - cropArea.y });

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      let newX = x - dragStart.x;
      let newY = y - dragStart.y;

      // Constrain within bounds
      newX = Math.max(0, Math.min(newX, imageDisplaySize.width - cropArea.width));
      newY = Math.max(0, Math.min(newY, imageDisplaySize.height - cropArea.height));

      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    }

    if (isResizing) {
      let newArea = { ...cropArea };
      const minSize = 50;

      switch (resizeHandle) {
        case "se":
          newArea.width = Math.max(minSize, Math.min(x - cropArea.x, imageDisplaySize.width - cropArea.x));
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            newArea.height = newArea.width / (w / h);
          } else {
            newArea.height = Math.max(minSize, Math.min(y - cropArea.y, imageDisplaySize.height - cropArea.y));
          }
          break;
        case "sw":
          const newWidthSw = Math.max(minSize, cropArea.x + cropArea.width - x);
          newArea.x = cropArea.x + cropArea.width - newWidthSw;
          newArea.width = newWidthSw;
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            newArea.height = newArea.width / (w / h);
          } else {
            newArea.height = Math.max(minSize, Math.min(y - cropArea.y, imageDisplaySize.height - cropArea.y));
          }
          break;
        case "ne":
          newArea.width = Math.max(minSize, Math.min(x - cropArea.x, imageDisplaySize.width - cropArea.x));
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            const newHeightNe = newArea.width / (w / h);
            newArea.y = cropArea.y + cropArea.height - newHeightNe;
            newArea.height = newHeightNe;
          } else {
            const newHeightNe = Math.max(minSize, cropArea.y + cropArea.height - y);
            newArea.y = cropArea.y + cropArea.height - newHeightNe;
            newArea.height = newHeightNe;
          }
          break;
        case "nw":
          const newWidthNw = Math.max(minSize, cropArea.x + cropArea.width - x);
          newArea.x = cropArea.x + cropArea.width - newWidthNw;
          newArea.width = newWidthNw;
          if (aspectRatio) {
            const [w, h] = aspectRatio.split(":").map(Number);
            const newHeightNw = newArea.width / (w / h);
            newArea.y = cropArea.y + cropArea.height - newHeightNw;
            newArea.height = newHeightNw;
          } else {
            const newHeightNw = Math.max(minSize, cropArea.y + cropArea.height - y);
            newArea.y = cropArea.y + cropArea.height - newHeightNw;
            newArea.height = newHeightNw;
          }
          break;
      }

      // Constrain within bounds
      newArea.x = Math.max(0, newArea.x);
      newArea.y = Math.max(0, newArea.y);
      newArea.width = Math.min(newArea.width, imageDisplaySize.width - newArea.x);
      newArea.height = Math.min(newArea.height, imageDisplaySize.height - newArea.y);

      setCropArea(newArea);
    }
  }, [isDragging, isResizing, dragStart, cropArea, aspectRatio, imageDisplaySize, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Handle page selection
  const handlePageSelect = useCallback((pageNumber) => {
    if (pageNumber === activePage) return;

    // Save current crop area before switching
    saveCurrentCropArea();

    // Switch to new page
    setActivePage(pageNumber);

    // Reset display size to trigger recalculation on image load
    setImageDisplaySize({ width: 0, height: 0 });
    setOriginalImageSize({ width: 0, height: 0 });
  }, [activePage, saveCurrentCropArea]);

  // Apply current crop to all pages
  const applyToAllPages = useCallback(() => {
    const currentCoords = getActualCropCoordinates();
    if (currentCoords && previews.length > 0) {
      const newCropAreas = {};
      previews.forEach(preview => {
        newCropAreas[preview.pageNumber] = { ...currentCoords };
      });
      setCropAreas(newCropAreas);
    }
  }, [previews, getActualCropCoordinates]);

  // Clear all saved crops
  const clearAllCrops = useCallback(() => {
    setCropAreas({});
    // Reset current crop area to default
    if (imageDisplaySize.width > 0) {
      const cropWidth = imageDisplaySize.width * 0.6;
      const cropHeight = imageDisplaySize.height * 0.6;
      setCropArea({
        x: (imageDisplaySize.width - cropWidth) / 2,
        y: (imageDisplaySize.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [imageDisplaySize]);

  // Reset crop area for current page
  const resetCropArea = useCallback(() => {
    // Remove saved crop for current page
    setCropAreas(prev => {
      const newAreas = { ...prev };
      delete newAreas[activePage];
      return newAreas;
    });

    // Reset to default crop area
    if (imageDisplaySize.width > 0) {
      const cropWidth = imageDisplaySize.width * 0.6;
      const cropHeight = imageDisplaySize.height * 0.6;
      setCropArea({
        x: (imageDisplaySize.width - cropWidth) / 2,
        y: (imageDisplaySize.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [activePage, imageDisplaySize]);

  // Handle crop
  const handleCrop = useCallback(async () => {
    window.scrollTo(0, 0);
    if (!pdfFile) return;

    if (isCropLimitReached) {
      setError("Daily PDF crop limit reached.  Please log in for unlimited usage.");
      return;
    }

    // Save current page's crop before processing
    const currentCoords = saveCurrentCropArea();

    const fileId = `${pdfFile.file.name}-${pdfFile.file.size}`;
    const encryptedFile = encryptedFiles[fileId];
    const password = encryptedFile?.encrypted ? getPDFPassword(fileId) : null;

    setIsProcessing(true);
    setCropProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setCropProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Get the latest crop areas including current page
      const allCropAreas = { ...cropAreas };
      if (currentCoords) {
        allCropAreas[activePage] = currentCoords;
      }

      const cropData = [];

      // Only include pages that have explicit crop areas saved
      const savedPages = Object.keys(allCropAreas);

      if (savedPages.length === 0) {
        // If no crops saved, apply current crop to current page only
        if (currentCoords && currentCoords.width > 0 && currentCoords.height > 0) {
          cropData.push({
            pageNumber: activePage,
            left: currentCoords.left,
            top: currentCoords.top,
            width: currentCoords.width,
            height: currentCoords.height,
            canvasWidth: currentCoords.canvasWidth,
            canvasHeight: currentCoords.canvasHeight
          });
        }
      } else {
        // Only crop pages that have saved crop areas
        previews.forEach(preview => {
          const pageNum = preview.pageNumber;
          const savedCrop = allCropAreas[pageNum];

          // Only add to cropData if this page has a saved crop
          if (savedCrop && savedCrop.width > 0 && savedCrop.height > 0) {
            cropData.push({
              pageNumber: pageNum,
              left: savedCrop.left,
              top: savedCrop.top,
              width: savedCrop.width,
              height: savedCrop.height,
              canvasWidth: savedCrop.canvasWidth,
              canvasHeight: savedCrop.canvasHeight
            });
          }
          // Pages without saved crops are NOT added - they remain uncropped
        });
      }

      if (cropData.length === 0) {
        throw new Error('No crop areas defined.  Please select a crop area on at least one page.');
      }

      const blob = await cropPDF(pdfFile.file, cropData, password);

      clearInterval(progressInterval);
      setCropProgress(100);

      setCroppedBlob(blob);

      const filename = pdfFile.file.name.replace(".pdf", "_cropped.pdf");
      downloadPDF(blob, filename);

      previews.forEach(p => {
        if (p.previewUrl) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      setPreviews([]);

      dispatch(incrementUsage('cropPdf'));

      setTimeout(() => {
        setCropProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setError('Failed to crop PDF: ' + err.message);
      setCropProgress(0);
      setIsProcessing(false);
    }
  }, [pdfFile, isCropLimitReached, encryptedFiles, cropAreas, activePage, previews, dispatch, getActualCropCoordinates, saveCurrentCropArea]);

  const handleDownload = useCallback(() => {
    if (croppedBlob) {
      downloadPDF(croppedBlob, pdfFile.file.name.replace(".pdf", "_cropped.pdf"));
    }
  }, [croppedBlob, pdfFile]);

  const handleRemoveFile = useCallback(() => {
    cleanupFileData();
    setPdfFile(null);
    resetFileInput();
  }, [cleanupFileData]);

  const handleRemoveResult = useCallback(() => {
    cleanupFileData();
    setPdfFile(null);
    setCroppedBlob(null);
    resetFileInput();
  }, [cleanupFileData]);

  // Add global mouse listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (showPasswordModal && modalPasswordRef.current) {
      setTimeout(() => {
        modalPasswordRef.current?.focus();
      }, 100);
    }
  }, [showPasswordModal]);

  useEffect(() => {
    return () => {
      cleanupAllBlobUrls();
    };
  }, [cleanupAllBlobUrls]);

  const faqItems = [
    {
      question: "Can I crop different areas on different pages of my PDF?",
      answer: "Yes! Our PDF cropper allows you to set unique crop areas for each page. Perfect for documents with varying layouts or content that needs different formatting on each page.",
    },
    {
      question: "How precise is the PDF crop tool?",
      answer: "The PDF crop tool offers pixel-perfect precision. You can drag to select exact areas, resize with corner handles, and see real-time pixel dimensions for maximum accuracy in document formatting.",
    },
    {
      question: "Can I apply the same crop to all pages in a PDF document?",
      answer: "Yes! Use the 'Apply to All Pages' button to copy your current crop settings to every page in your PDF document. Perfect for creating consistent layouts across multi-page documents.",
    },
    {
      question: "Will cropping affect my PDF quality or text readability?",
      answer: "No, cropping doesn't reduce PDF quality. It simply removes the areas outside your selection while maintaining the original resolution and quality of the kept content. Text remains crisp and clear.",
    },
    {
      question: "Can I crop password-protected PDFs with this tool?",
      answer: "Yes! Our PDF cropper supports encrypted PDFs. You'll be prompted to enter the password, and then you can crop the document while maintaining its security features.",
    },
    {
      question: "What file size limits apply to PDF cropping?",
      answer: "You can upload and crop PDF files up to 50MB in size for free. No registration required. For larger documents, consider breaking them into smaller files.",
    },
  ];

  const actualCoords = getActualCropCoordinates();
  const pagesWithCrops = Object.keys(cropAreas).length;

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

          <div className={`${!pdfFile && !croppedBlob ? "flex flex-col justify-center" : ""}`}>

            {/* Error Messages */}
            <ErrorMessage message={error} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 sm:mb-8 text-center ${!pdfFile && !croppedBlob ? "" : "hidden"}`}
            >
              <ToolHeader
                title="Free PDF Cropping Tool"
                description="Crop PDF pages online with pixel-perfect precision"
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
              {!pdfFile && !croppedBlob && (
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
                            {isCropLimitReached
                              ? 'Daily limit reached. Log in for unlimited usage'
                              : 'Drop your file here or click to browse'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6">
                            <SelectButton isLimitReached={isCropLimitReached} fileInputRef={fileInputRef} title="Select PDF file" />
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

              {/* Main Crop Interface */}
              {pdfFile && !croppedBlob && previews && (
                <div className="mb-4 sm:mb-6">
                  <div className="bg-sky-800 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-linear-to-r from-sky-800 to-blue-950 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Crop className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          <h3 className="font-medium text-white text-md sm:text-lg">
                            Crop PDF
                          </h3>
                          <span className="text-xs sm:text-sm text-gray-100">
                            • {pdfFile.pageCount} page{pdfFile.pageCount !== 1 ? "s" : ""} • {formatFileSize(pdfFile.file.size)}
                          </span>
                          {encryptedFiles[`${pdfFile.file.name}-${pdfFile.file.size}`]?.encrypted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="flex-1 sm:flex-none px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>

                    <UploadProgressBar uploadProgress={uploadProgress} />

                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left:  Crop Canvas Area */}
                        <div className="lg:flex-1">
                          {/* Page Navigation */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">
                                Page {activePage} of {pdfFile.pageCount}
                              </span>
                              {cropAreas[activePage] && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-sky-400/20 text-sky-300 border border-sky-600">
                                  <Crop size={10} />
                                  Custom Crop
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePageSelect(Math.max(1, activePage - 1))}
                                disabled={activePage === 1}
                                className="p-2 bg-sky-700 text-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-600 cursor-pointer"
                              >
                                <ChevronLeft size={20} />
                              </button>
                              <button
                                onClick={() => handlePageSelect(Math.min(pdfFile.pageCount, activePage + 1))}
                                disabled={activePage === pdfFile.pageCount}
                                className="p-2 bg-sky-700 text-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-600 cursor-pointer"
                              >
                                <ChevronRight size={20} />
                              </button>
                            </div>
                          </div>

                          {/* Aspect Ratio Options */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-white mb-3">
                              Aspect Ratio
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {aspectRatios.map((ratio) => (
                                <button
                                  key={ratio.label}
                                  onClick={() => handleAspectRatioChange(ratio.value)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${aspectRatio === ratio.value
                                    ? "bg-sky-400 text-white"
                                    : "bg-sky-700 text-gray-100 hover:bg-sky-600"
                                    }`}
                                >
                                  <ratio.icon className="w-4 h-4" />
                                  {ratio.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Image with Crop Overlay */}
                          {!previews.length && (
                            <div className="w-full bg-sky-900/50 min-h-100"></div>
                          )}
                          {previews.length > 0 && (
                            <div
                              ref={containerRef}
                              className="relative mx-auto bg-sky-900 rounded-lg overflow-hidden"
                              style={{
                                width: imageDisplaySize.width || "100%",
                                height: imageDisplaySize.height || "auto",
                                maxWidth: "100%",
                              }}
                            >
                              <img
                                ref={imageRef}
                                src={previews.find(p => p.pageNumber === activePage)?.previewUrl}
                                alt={`Page ${activePage}`}
                                className="block"
                                style={{
                                  width: imageDisplaySize.width || "100%",
                                  height: imageDisplaySize.height || "auto",
                                }}
                                onLoad={handleImageLoad}
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                              />

                              {/* Dark overlay outside crop area */}
                              <div
                                className="absolute inset-0 bg-sky-900/60 pointer-events-none"
                                style={{
                                  clipPath: `polygon(
                                  0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                                  ${cropArea.x}px ${cropArea.y}px,
                                  ${cropArea.x}px ${cropArea.y + cropArea.height}px,
                                  ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px,
                                  ${cropArea.x + cropArea.width}px ${cropArea.y}px,
                                  ${cropArea.x}px ${cropArea.y}px
                                )`,
                                }}
                              />

                              {/* Crop selection box */}
                              <div
                                className="absolute border-2 border-sky-400 cursor-move"
                                style={{
                                  left: cropArea.x,
                                  top: cropArea.y,
                                  width: cropArea.width,
                                  height: cropArea.height,
                                }}
                                onMouseDown={(e) => handleMouseDown(e)}
                              >
                                {/* Grid lines */}
                                <div className="absolute inset-0 pointer-events-none">
                                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-sky-400/50" />
                                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-sky-400/50" />
                                  <div className="absolute top-1/3 left-0 right-0 h-px bg-sky-400/50" />
                                  <div className="absolute top-2/3 left-0 right-0 h-px bg-sky-400/50" />
                                </div>

                                {/* Corner handles */}
                                <div
                                  className="absolute -top-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-nw-resize"
                                  onMouseDown={(e) => handleMouseDown(e, "nw")}
                                />
                                <div
                                  className="absolute -top-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-ne-resize"
                                  onMouseDown={(e) => handleMouseDown(e, "ne")}
                                />
                                <div
                                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-sw-resize"
                                  onMouseDown={(e) => handleMouseDown(e, "sw")}
                                />
                                <div
                                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-white rounded-sm cursor-se-resize"
                                  onMouseDown={(e) => handleMouseDown(e, "se")}
                                />
                              </div>
                            </div>
                          )}

                          {/* Crop Info */}
                          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                              <p className="text-xs text-gray-100 mb-1">X Position</p>
                              <p className="text-white font-medium">{actualCoords?.left || 0}px</p>
                            </div>
                            <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                              <p className="text-xs text-gray-100 mb-1">Y Position</p>
                              <p className="text-white font-medium">{actualCoords?.top || 0}px</p>
                            </div>
                            <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                              <p className="text-xs text-gray-100 mb-1">Width</p>
                              <p className="text-white font-medium">{actualCoords?.width || 0}px</p>
                            </div>
                            <div className="bg-sky-900/50 rounded-lg p-3 border border-sky-700">
                              <p className="text-xs text-gray-100 mb-1">Height</p>
                              <p className="text-white font-medium">{actualCoords?.height || 0}px</p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-4 flex flex-wrap gap-3 justify-center">
                            <button
                              onClick={resetCropArea}
                              className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-gray-100 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Reset This Page
                            </button>
                            <button
                              onClick={applyToAllPages}
                              className="px-4 py-2 bg-sky-400/20 hover:bg-sky-400/30 text-sky-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer border border-sky-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Apply to All Pages
                            </button>
                            <button
                              onClick={clearAllCrops}
                              className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                            >
                              Clear All Crops
                            </button>
                          </div>
                        </div>

                        {/* Right: Page Thumbnails Sidebar */}
                        <div className="lg:w-64 xl:w-72">
                          <div className="bg-sky-900/50 rounded-xl p-3 sm:p-4 border border-sky-700">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-white font-medium">Pages ({previews.length})</h4>
                              {pagesWithCrops > 0 && (
                                <span className="text-xs text-sky-300">{pagesWithCrops} cropped</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 max-h-125 overflow-y-auto pr-2">
                              {!previews.length && (
                                [1, 2, 3, 4].map((i) => (
                                  <div key={i} className="w-full bg-sky-900/50 min-h-30 rounded-lg"></div>
                                ))
                              )}
                              {previews.map((preview) => (
                                <motion.div
                                  key={preview.id}
                                  className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${activePage === preview.pageNumber
                                    ? 'border-sky-400 ring-2 ring-sky-400/30'
                                    : 'border-sky-700 hover:border-sky-600'
                                    }`}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => handlePageSelect(preview.pageNumber)}
                                >
                                  <img
                                    src={preview.previewUrl}
                                    alt={`Page ${preview.pageNumber}`}
                                    draggable={false}
                                    onDragStart={(e) => e.preventDefault()}
                                    className="w-full h-24 sm:h-28 lg:h-32 object-contain bg-sky-900"
                                  />
                                  <div className="absolute top-2 right-2 bg-sky-800/80 text-white text-xs px-2 py-1 rounded">
                                    {preview.pageNumber}
                                  </div>
                                  {cropAreas[preview.pageNumber] && (
                                    <div className="absolute bottom-2 left-2 bg-sky-400/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                      <Crop size={10} />
                                      <span className="hidden sm:inline">Cropped</span>
                                    </div>
                                  )}
                                  {activePage === preview.pageNumber && (
                                    <div className="absolute inset-0 border-2 border-sky-400 rounded-lg pointer-events-none" />
                                  )}
                                  <div className="absolute inset-0 bg-linear-to-t from-sky-900/60 to-transparent pointer-events-none" />
                                </motion.div>
                              ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-sky-700">
                              <div className="text-sm text-gray-100 text-center">
                                Click a page to set custom crop
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Crop Button */}
              {pdfFile && !croppedBlob && previews && (
                <ActionButton
                  disabled={isProcessing || isCropLimitReached}
                  handleAction={handleCrop}
                  className={isProcessing || isCropLimitReached ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}
                  isProcessing={isProcessing}
                  process="Cropping..."
                  title="Crop PDF"
                />
              )}


              {/* Crop Results */}
              {croppedBlob && (
                <ResultSection
                  title="PDF Cropped Successfully!"
                  onDownload={handleDownload}
                  downloadButtonText="Download PDF"
                  onStartOver={handleRemoveResult}
                  summaryTitle="Crop Summary"
                  summaryItems={[
                    {
                      value: pdfFile?.pageCount || 0,
                      label: pdfFile?.pageCount === 1 ? "Page" : "Pages",
                      valueColor: "white"
                    },
                    {
                      value: pagesWithCrops || pdfFile?.pageCount || 0,
                      label: pagesWithCrops === 1 ? "Page Cropped" : "Pages Cropped",
                      valueColor: "teal-400"
                    },
                    {
                      value: aspectRatio || "Free",
                      label: "Aspect Ratio",
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
                progress={cropProgress}
                title="Cropping PDF"
                description={`Processing ${pdfFile?.pageCount || 0} pages...`}
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
        title="Why choose our PDF Cropping Tool"
        subtitle="Format and optimize your PDF documents with our professional cropping tool designed for legal professionals, students, businesses, and anyone needing precise document layout control."
        reasons={reasons}
        iconColorClasses={iconColorClasses}
      />

      {/* How To Section */}
      <div className="relative bg-white h-275 lg:h-162.5 flex items-center justify-center">
        <HowToSection
          theme="light"
          title="How To Crop PDF Pages Online"
          stepOne="Upload PDF"
          stepOneDes="Select or drag and drop your PDF file"
          stepTwo="Select Area"
          stepTwoDes="Drag to create crop rectangle on any page"
          stepThree="Customize"
          stepThreeDes="Set different crops per page or apply to all"
          stepFour="Download"
          stepFourDes="Get your cropped PDF instantly"
        />
      </div>

      {/* FAQ Section */}
      <FAQSection
        theme="light"
        faqItems={faqItems}
        title="PDF Cropping FAQs"
      />
    </div>
  );
}