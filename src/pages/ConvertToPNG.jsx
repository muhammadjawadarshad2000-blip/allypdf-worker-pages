import ImageConverter from "../components/ImageConverter";
import { Shield, Zap, Smartphone, Globe, Stars, Clock } from "lucide-react";
import toolCTA from "/tools-cta/convert-to-png.png";

export default function ConvertToPNG() {
  
  const pngReasons = [
    {
      icon: Shield,
      title: "Secure PNG Processing",
      description: "All conversion happens locally in your browser. Your images never leave your device, ensuring complete privacy and security for sensitive files.",
    },
    {
      icon: Stars,
      title: "Lossless Quality Guarantee",
      description: "PNG format preserves every pixel perfectly. Convert without quality loss, maintaining sharp details and vibrant colors.",
    },
    {
      icon: Zap,
      title: "Fast Transparency Support",
      description: "Convert images with transparency instantly. Preserve alpha channels for logos, graphics, and designs with transparent backgrounds.",
    },
    {
      icon: Smartphone,
      title: "Cross-Platform Ready",
      description: "Create PNGs that work perfectly across all devices and operating systems. From mobile to desktop, your PNGs will display correctly everywhere.",
    },
    {
      icon: Globe,
      title: "Professional PNG Format",
      description: "PNG is the professional choice for graphics, logos, and web design. Convert to industry-standard format with confidence.",
    },
    {
      icon: Clock,
      title: "Instant Conversion",
      description: "No waiting, no registration. Convert images to PNG in seconds with our completely free, browser-based tool.",
    }
  ];

  return (
    <ImageConverter
      title="Convert to PNG"
      description="Upload any image and convert it to PNG format with lossless quality and transparency support"
      format="imageToPng"
      type="PNG"
      initialOptions={{ quality: 1.0, preserveTransparency: true }}
      faqItems={[
        {
          question: "What image formats can I convert to PNG?",
          answer: "Convert JPEG, WebP, GIF, BMP, TIFF, and SVG files to PNG format with perfect quality preservation. Our tool handles all major formats seamlessly."
        },
        {
          question: "Does PNG conversion maintain image quality?",
          answer: "Yes! PNG uses lossless compression, preserving 100% of original image quality. Every pixel and color detail remains intact after conversion."
        },
        {
          question: "How does PNG transparency work?",
          answer: "PNG supports full alpha channel transparency, perfect for logos, icons, and graphics. Transparent backgrounds are preserved during conversion."
        },
        {
          question: "What is PNG best used for?",
          answer: "PNG excels for logos, graphics, screenshots, and images requiring transparency. It's the professional choice for web design and digital artwork."
        },
        {
          question: "Is PNG conversion secure?",
          answer: "Absolutely secure. All processing happens locally in your browser with enterprise-grade security. Your files never leave your computer."
        }
      ]}
      howToTitle="How To Convert Images to PNG Online for Free"
      howToSteps={{
        stepOne: "Upload Images",
        stepOneDes: "Select or drag and drop your image files",
        stepTwo: "Set PNG Options",
        stepTwoDes: "Choose compression level and transparency settings",
        stepThree: "Convert to PNG",
        stepThreeDes: "Click convert to process with lossless quality",
        stepFour: "Download Results",
        stepFourDes: "Get your professional PNG files instantly"
      }}
      formatFeatures={[
        "Lossless compression preserves quality",
        "Full transparency support (alpha channel)",
        "Ideal for logos, icons, and graphics",
        "Professional standard for web design"
      ]}
      formatBestFor={["Logos", "Graphics", "Screenshots", "Web Design"]}
      acceptedFormatsText="JPEG, PNG, WebP, GIF, BMP, AVIF"
      toolCTA={toolCTA}
      reasons={pngReasons}
    />
  );
}