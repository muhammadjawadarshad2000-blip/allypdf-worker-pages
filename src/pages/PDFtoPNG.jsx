import PDFToImageConverter from "../components/PDFToImageConverter";
import { Shield, Gift, Zap, Stars, Key, Image } from "lucide-react";
import toolCTA from "/tools-cta/pdf-to-png.png";

export default function PDFtoPNG() {
  const faqItems = [
    {
      question: "What is the maximum file size for conversion?",
      answer: "You can convert PDF files up to 100MB. For larger files, please split them into smaller documents first."
    },
    {
      question: "Does the converter support encrypted PDFs?",
      answer: "Yes, our tool supports password-protected PDFs. You'll be prompted to enter the password when needed."
    },
    {
      question: "Will the image quality be preserved?",
      answer: "PNG uses lossless compression, so all text and graphics remain sharp and clear at your chosen resolution."
    },
    {
      question: "How many pages can I convert at once?",
      answer: "There's no limit! Convert PDFs with hundreds of pages. All pages will be included in the ZIP download."
    },
    {
      question: "Are my files secure during conversion?",
      answer: "All processing happens in your browser. Your files never leave your device and are automatically deleted after processing."
    }
  ];

  const scaleOptions = [
    { value: 1.0, label: "Low (1x)" },
    { value: 1.5, label: "Medium (1.5x)" },
    { value: 2.0, label: "High (2x)" },
    { value: 3.0, label: "Very High (3x)" },
  ];

  const qualityOptions = [
    { value: 0.7, label: "Low (70%)" },
    { value: 0.8, label: "Medium (80%)" },
    { value: 0.9, label: "High (90%)" },
    { value: 0.95, label: "Very High (95%)" },
    { value: 1.0, label: "Maximum (100%)" },
  ];

  // Add to the PDFtoPNG component
  const reasons = [
    {
      icon: Shield,
      title: "Secure PNG Conversion",
      description: "Your PDF documents never leave your browser. All PNG conversion happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "100% Free PNG Converter",
      description: "Convert PDF to PNG completely free forever. No hidden fees, no subscriptions, no watermarks. Unlimited lossless PDF to image conversion.",
    },
    {
      icon: Stars,
      title: "Lossless Quality",
      description: "PNG format preserves text clarity and image details without compression artifacts. Perfect for documents, graphics, and screenshots.",
    },
    {
      icon: Zap,
      title: "Fast Batch Processing",
      description: "Convert multiple PDF pages to PNG simultaneously. Process entire documents quickly with our optimized conversion engine.",
    },
    {
      icon: Key,
      title: "Protected PDF Support",
      description: "Convert encrypted and password-protected PDFs to PNG while maintaining security protocols and document integrity.",
    },
    {
      icon: Image,
      title: "Transparency Support",
      description: "Preserve transparent backgrounds when converting PDF to PNG. Essential for logos, graphics, and professional design work.",
    },
  ];

  const freeToolSection = {
    title: "Free Convert PDF to PNG Images Online with Live Preview",
    description: "Transform PDF documents into high-quality PNG images with lossless compression and transparency support. Our free online PDF to PNG converter preserves text clarity, maintains original formatting, and offers adjustable resolution settings. Perfect for web designers, content creators, educators, and professionals who need crystal-clear images from PDF documents.",
    imageUrl: toolCTA,
    imageAlt: "PDF to PNG conversion illustration"
  };

  return (
    <PDFToImageConverter
      title="Convert PDF to PNG"
      description="Upload a PDF file and convert each page to PNG images"
      imageFormat="PNG"
      actionType="pdfToPng"
      defaultScale={2.0}
      defaultQuality={1.0}
      scaleOptions={scaleOptions}
      qualityOptions={qualityOptions}
      faqItems={faqItems}
      howToTitle="How To Convert PDF to PNG Online for Free"
      howToSteps={{
        stepOne: "Upload PDF",
        stepOneDes: "Select or drag and drop your PDF file",
        stepTwo: "Set Options",
        stepTwoDes: "Choose PNG quality and resolution settings",
        stepThree: "Convert",
        stepThreeDes: "Click convert and wait just seconds",
        stepFour: "Download",
        stepFourDes: "Get your PNG files as ZIP instantly"
      }}
      reasons={reasons}
      freeToolSection={freeToolSection}
    />
  );
}