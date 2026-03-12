import ImageToPDFConverter from "../components/ImageToPDFConverter";
import { Shield, Zap, FileText, Layers, Globe, Camera, Image as ImageIcon } from "lucide-react";
import toolCTA from "/tools-cta/jpg-to-pdf.png";


export default function JPEGtoPDF() {
  const faqItems = [
    {
      question: "What's the advantage of converting JPG to PDF?",
      answer: "PDF provides better compression, universal compatibility, and professional formatting. Convert JPG to PDF for easier sharing, printing, and document organization while maintaining photo quality."
    },
    {
      question: "Can I convert multiple JPG images at once?",
      answer: "Yes! Batch convert unlimited JPG photos into a single PDF document. Perfect for creating photo albums, document collections, or multi-image presentations from your JPG files."
    },
    {
      question: "Will JPG photo quality be preserved?",
      answer: "Our JPG to PDF converter maintains original photo resolution and color accuracy. Images appear crisp and clear in the PDF, perfect for both digital viewing and professional printing."
    },
    {
      question: "What page size should I use for JPG to PDF?",
      answer: "A4 is standard for documents, Letter for North America, or choose custom sizes. Our converter automatically optimizes JPG images for your selected page layout."
    },
    {
      question: "Is JPG to PDF conversion free?",
      answer: "Completely free! Convert unlimited JPG to PDF without watermarks, registration, or subscriptions. Professional PDF creation accessible to everyone."
    }
  ];

  const howToSteps = {
    title: "How To Convert JPG to PDF Online for Free",
    stepOne: "Upload JPG Files",
    stepOneDes: "Select or drag and drop your JPG/JPEG photo files",
    stepTwo: "Arrange JPG Order",
    stepTwoDes: "Reorder images for perfect PDF layout",
    stepThree: "Convert JPG to PDF",
    stepThreeDes: "Create professional PDF from JPG images",
    stepFour: "Download PDF Document",
    stepFourDes: "Get your JPG photos in PDF format instantly"
  };

  const seoReasons = [
    {
      icon: Camera,
      title: "JPG Photo Quality Preservation",
      description: "Our specialized JPG to PDF converter maintains original photo resolution, color accuracy, and image clarity. Perfect for preserving photo albums, digital memories, and professional photography.",
    },
    {
      icon: Zap,
      title: "Fast JPG Batch Processing",
      description: "Convert multiple JPG images to PDF simultaneously in seconds. Process entire photo collections, document scans, or image batches with lightning speed and efficiency.",
    },
    {
      icon: FileText,
      title: "Professional PDF Documents",
      description: "Transform JPG photos into polished PDF documents suitable for business presentations, academic submissions, portfolio collections, and professional documentation.",
    },
    {
      icon: Layers,
      title: "Flexible JPG Arrangement",
      description: "Drag-and-drop reordering of JPG images, customizable page layouts, multiple orientation options, and adjustable margins for perfect photo presentation.",
    },
    {
      icon: Shield,
      title: "Secure JPG Processing",
      description: "Your JPG photos convert locally in your browser. No file uploads, no cloud storage - complete privacy for personal photos, sensitive documents, and confidential images.",
    },
    {
      icon: Globe,
      title: "Universal JPG Compatibility",
      description: "Convert any JPG/JPEG file to PDF regardless of size, resolution, or source. Works with photos from cameras, smartphones, scanners, and all digital devices.",
    }
  ];

  return (
    <ImageToPDFConverter
      title="Convert JPG to PDF"
      description="Upload JPG images and create professional PDF documents"
      fileTypeName={"JPG" || "JPEG"}
      multipleFileTypeName="JPGs"
      usageKey="JPGToPdf"
      faqItems={faqItems}
      howToSteps={howToSteps}
      reasons={seoReasons}
      toolCTA={toolCTA}
      defaultFileName="jpg_to_pdf"
    />
  );
}