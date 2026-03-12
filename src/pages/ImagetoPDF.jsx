import ImageToPDFConverter from "../components/ImageToPDFConverter";
import { Shield, Zap, FileText, Layers, Stars, Globe } from "lucide-react";
import toolCTA from "/tools-cta/image-to-pdf.png";

export default function ImageToPDF() {
  const faqItems = [
    {
      question: "What image formats can I convert to PDF?",
      answer: "Convert JPEG, JPG, PNG, WebP, GIF, BMP, and TIFF images to high-quality PDF documents with 100% format compatibility and quality preservation."
    },
    {
      question: "Can I convert multiple images into one PDF?",
      answer: "Yes! Batch process unlimited images into a single professional PDF document. Drag-and-drop reordering lets you arrange pages exactly as needed."
    },
    {
      question: "Will my image quality be preserved in the PDF?",
      answer: "Absolutely. Our advanced PDF creation maintains original image resolution and clarity while optimizing file size for easy sharing and storage."
    },
    {
      question: "Are there any file size or quantity limits?",
      answer: "No limits! Convert images of any size or quantity completely free. Process high-resolution photos or multiple image collections with ease."
    },
    {
      question: "Is my data secure during conversion?",
      answer: "100% secure. All processing happens locally in your browser with military-grade encryption. Your files never leave your device or touch our servers."
    }
  ];

  const howToSteps = {
    title: "How To Convert Images to PDF Online for Free",
    stepOne: "Upload Your Images",
    stepOneDes: "Select or drag and drop image files (JPG, PNG, WebP, GIF, BMP, TIFF)",
    stepTwo: "Arrange & Customize",
    stepTwoDes: "Reorder images and adjust PDF page settings",
    stepThree: "Convert to PDF",
    stepThreeDes: "Click once to create your PDF document",
    stepFour: "Download & Share",
    stepFourDes: "Get your professional PDF file instantly"
  };

  const seoReasons = [
    {
      icon: Shield,
      title: "Bank-Level Security Processing",
      description: "Your images convert locally in your browser with end-to-end encryption. No file uploads, no server storage - complete privacy guaranteed for sensitive documents and personal photos.",
    },
    {
      icon: Zap,
      title: "Instant PDF Creation",
      description: "Convert images to PDF in seconds with our optimized engine. Batch process multiple high-resolution images simultaneously without compromising speed or document quality.",
    },
    {
      icon: FileText,
      title: "Professional Document Output",
      description: "Create polished, print-ready PDF documents perfect for business reports, academic papers, portfolios, and professional presentations with customizable layouts.",
    },
    {
      icon: Layers,
      title: "Flexible Page Management",
      description: "Drag-and-drop image reordering, multiple page sizes (A4, Letter, Legal), portrait/landscape orientation, and adjustable margins for perfect document formatting.",
    },
    {
      icon: Stars,
      title: "Universal Format Compatibility",
      description: "Convert JPG to PDF, PNG to PDF, WebP to PDF, GIF to PDF, BMP to PDF, and TIFF to PDF with 100% format support and quality preservation.",
    },
    {
      icon: Globe,
      title: "Cross-Platform Accessibility",
      description: "Create PDFs accessible anywhere on Windows, Mac, iOS, Android, and all modern browsers. Perfect for sharing documents across different devices and operating systems.",
    }
  ];

  return (
    <ImageToPDFConverter
      title="Convert Images to PDF"
      description="Upload multiple images and convert them into professional PDF documents"
      acceptTypes=".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif"
      fileTypeName="Image"
      multipleFileTypeName="Images"
      usageKey="imageToPdf"
      faqItems={faqItems}
      howToSteps={howToSteps}
      reasons={seoReasons}
      toolCTA={toolCTA}
      defaultFileName="images_to_pdf"
    />
  );
}