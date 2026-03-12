import ImageToPDFConverter from "../components/ImageToPDFConverter";
import { Shield, Zap, FileText, Layers, Globe, Image as ImageIcon } from "lucide-react";
import toolCTA from "/tools-cta/png-to-pdf.png";

export default function PNGtoPDF() {
  const faqItems = [
    {
      question: "What's special about PNG to PDF conversion?",
      answer: "PNG to PDF preserves transparency (alpha channel), lossless quality, and sharp edges. Perfect for logos, graphics, screenshots, and images with transparent backgrounds converting to professional PDF documents."
    },
    {
      question: "Can I convert multiple PNG images at once?",
      answer: "Yes! Batch convert unlimited PNG files into a single PDF document. Create professional graphics collections, logo sheets, or transparent image documents from your PNG files."
    },
    {
      question: "Will PNG transparency be preserved in PDF?",
      answer: "Absolutely. Our PNG to PDF converter maintains transparency layers and alpha channels, ensuring logos, graphics, and images with transparent backgrounds appear perfectly in your PDF document."
    },
    {
      question: "What's the advantage of PNG over JPG for PDF?",
      answer: "PNG offers lossless compression with transparency support - ideal for graphics, logos, text images, and screenshots. JPG is better for photos but doesn't support transparency."
    },
    {
      question: "Is PNG to PDF conversion free?",
      answer: "Completely free! Convert unlimited PNG to PDF without watermarks, registration, or limitations. Professional graphics-to-PDF conversion accessible to everyone."
    }
  ];

  const howToSteps = {
    title: "How To Convert PNG to PDF Online for Free",
    stepOne: "Upload PNG Files",
    stepOneDes: "Select or drag and drop your PNG image files",
    stepTwo: "Arrange PNG Order",
    stepTwoDes: "Reorder graphics for perfect PDF layout",
    stepThree: "Convert PNG to PDF",
    stepThreeDes: "Create professional PDF from PNG images",
    stepFour: "Download PDF Document",
    stepFourDes: "Get your PNG graphics in PDF format with transparency preserved"
  };

  const seoReasons = [
    {
      icon: ImageIcon,
      title: "PNG Transparency Preservation",
      description: "Our specialized PNG to PDF converter maintains transparency layers, alpha channels, and clear backgrounds. Perfect for logos, graphics, icons, and images requiring transparent PDF output.",
    },
    {
      icon: Zap,
      title: "Lossless PNG Conversion",
      description: "Convert PNG to PDF without quality loss. Preserve sharp edges, clear text, and graphic details with our optimized lossless compression technology.",
    },
    {
      icon: FileText,
      title: "Professional Graphics PDFs",
      description: "Transform PNG graphics into professional PDF documents suitable for branding materials, logo sheets, graphic portfolios, and design presentations.",
    },
    {
      icon: Layers,
      title: "Advanced PNG Management",
      description: "Drag-and-drop arrangement of PNG files, transparent background preservation, multiple page layouts, and perfect graphic scaling for professional results.",
    },
    {
      icon: Shield,
      title: "Secure PNG Processing",
      description: "Your PNG graphics convert locally in your browser. No uploads to external servers, protecting your logos, designs, and proprietary graphics.",
    },
    {
      icon: Globe,
      title: "Universal PNG Support",
      description: "Convert any PNG file to PDF regardless of complexity, transparency layers, or color depth. Works with graphics from all design software and image editors.",
    }
  ];

  return (
    <ImageToPDFConverter
      title="Convert PNG to PDF"
      description="Upload PNG images with transparency and create professional PDF documents"
      fileTypeName="PNG"
      multipleFileTypeName="PNGs"
      usageKey="pngToPdf"
      faqItems={faqItems}
      howToSteps={howToSteps}
      reasons={seoReasons}
      toolCTA={toolCTA}
      defaultFileName="png_to_pdf"
    />
  );
}