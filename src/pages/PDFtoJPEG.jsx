import PDFToImageConverter from "../components/PDFToImageConverter";
import { Shield, Gift, Zap, Stars, Key, Minimize2 } from "lucide-react";
import toolCTA from "/tools-cta/pdf-to-jpg.png";

export default function PDFtoJPEG() {
  const faqItems = [
    {
      question: "What's the difference between PNG and JPG?",
      answer: "PNG is lossless with transparency support, ideal for text and graphics. JPG is compressed, smaller in size, and perfect for photos."
    },
    {
      question: "Can I convert multiple pages at once?",
      answer: "Yes! All pages will be converted and included in a single ZIP file for easy download."
    },
    {
      question: "What quality settings should I use?",
      answer: "For web use, 80-90% quality is recommended. For printing, use 90-100% for best results."
    },
    {
      question: "Are there any file size limits?",
      answer: "You can convert PDFs up to 100MB. The resulting JPGs will be compressed according to your quality settings."
    },
    {
      question: "Is this conversion free?",
      answer: "Yes, completely free! No registration required. Convert as many PDFs as you need."
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

  const reasons = [
    {
      icon: Shield,
      title: "Secure JPG Conversion",
      description: "Your PDF documents never leave your browser. All JPG conversion happens locally on your device, ensuring complete privacy and security.",
    },
    {
      icon: Gift,
      title: "100% Free JPG Converter",
      description: "Convert PDF to JPG completely free forever. No hidden fees, no subscriptions, no watermarks. Unlimited PDF to image conversion.",
    },
    {
      icon: Minimize2,
      title: "Optimized Compression",
      description: "Intelligent JPG compression balances file size and quality. Perfect for web use, email attachments, and digital sharing.",
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Convert PDF pages to JPG images in seconds. No software installation required—works directly in your browser.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Convert password-protected PDFs to JPG securely. Our tool handles encrypted files with proper authentication.",
    },
    {
      icon: Stars,
      title: "Quality Control",
      description: "Adjustable quality settings from 70% to 100%. Choose the perfect balance between file size and image clarity.",
    },
  ];

  const freeToolSection = {
    title: "Free Convert PDF to JPG Images Online with Live Preview",
    description: "Transform PDF documents into high-quality JPG images optimized for web use, social media, and digital content. Our free online PDF to JPG converter offers adjustable compression, maintains image quality, and processes files locally for maximum security. Perfect for photographers, designers, marketers, and anyone needing to convert PDF documents to shareable image formats.",
    imageUrl: toolCTA,
    imageAlt: "PDF to JPG conversion illustration"
  };

  return (
    <PDFToImageConverter
      title="Convert PDF to JPG"
      description="Upload a PDF file and convert each page to JPG images"
      imageFormat="JPG"
      actionType="pdfToJpg"
      defaultScale={2.0}
      defaultQuality={0.92}
      scaleOptions={scaleOptions}
      qualityOptions={qualityOptions}
      faqItems={faqItems}
      howToTitle="How To Convert PDF to JPG Online for Free"
      howToSteps={{
        stepOne: "Upload PDF",
        stepOneDes: "Select or drag and drop your PDF file",
        stepTwo: "Set Options",
        stepTwoDes: "Choose JPG quality and resolution settings",
        stepThree: "Convert",
        stepThreeDes: "Click convert and wait just seconds",
        stepFour: "Download",
        stepFourDes: "Get your JPG files as ZIP instantly"
      }}
      reasons={reasons}
      freeToolSection={freeToolSection}
    />
  );
}