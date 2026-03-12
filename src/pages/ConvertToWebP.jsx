import ImageConverter from "../components/ImageConverter";
import { Shield, Zap, Smartphone, Globe, Stars, Clock } from "lucide-react";
import toolCTA from "/tools-cta/convert-to-webp.png";

export default function ConvertToWebP() {
  
  const webpReasons = [
    {
      icon: Shield,
      title: "Secure WebP Processing",
      description: "Your images are converted locally in your browser with military-grade security. No server uploads, ensuring complete data privacy.",
    },
    {
      icon: Zap,
      title: "Ultra-Fast Web Performance",
      description: "WebP loads 25-35% faster than JPG. Convert for lightning-fast websites and improved Core Web Vitals scores.",
    },
    {
      icon: Stars,
      title: "Smart Compression Technology",
      description: "Get superior compression without quality loss. WebP delivers smaller files with identical visual quality to JPG and PNG.",
    },
    {
      icon: Smartphone,
      title: "Modern Browser Support",
      description: "WebP works on 95%+ of modern browsers including Chrome, Firefox, Edge, and Safari. Perfect for modern web development.",
    },
    {
      icon: Globe,
      title: "Future-Proof Format",
      description: "WebP is the modern standard for web images. Convert today and stay ahead with Google's recommended image format.",
    },
    {
      icon: Clock,
      title: "Instant Web Optimization",
      description: "Optimize images for web in seconds. No complex software or coding required - get web-ready images instantly.",
    }
  ];

  return (
    <ImageConverter
      title="Convert to WebP"
      description="Upload any image and convert it to modern WebP format for faster loading websites"
      format="imageToWebp"
      type="WebP"
      initialOptions={{ quality: 0.80, preserveTransparency: false }}
      faqItems={[
        {
          question: "What image formats can I convert to WebP?",
          answer: "Convert JPEG, PNG, GIF, BMP, TIFF, and SVG files to WebP format. Our tool handles all popular formats with perfect quality conversion."
        },
        {
          question: "How much smaller are WebP files than JPG?",
          answer: "WebP files are 25-35% smaller than equivalent quality JPG files. This means faster loading websites and reduced bandwidth usage."
        },
        {
          question: "Does WebP support transparency?",
          answer: "Yes! WebP supports full transparency (alpha channel) like PNG, making it perfect for logos and graphics with transparent backgrounds."
        },
        {
          question: "Is WebP supported by all browsers?",
          answer: "WebP is supported by 95%+ of modern browsers including Chrome, Firefox, Edge, and Safari. For older browsers, simple fallback solutions are available."
        },
        {
          question: "Why should I use WebP for my website?",
          answer: "WebP improves page load speed, reduces bandwidth costs, and boosts SEO rankings. It's Google's recommended format for modern web performance."
        }
      ]}
      howToTitle="How To Convert Images to WebP Online"
      howToSteps={{
        stepOne: "Upload Images",
        stepOneDes: "Select or drag and drop your image files",
        stepTwo: "Adjust WebP Settings",
        stepTwoDes: "Set quality level and optimization options",
        stepThree: "Convert to WebP",
        stepThreeDes: "Click convert for modern web optimization",
        stepFour: "Download Results",
        stepFourDes: "Get your web-optimized images instantly"
      }}
      formatFeatures={[
        "25-35% smaller than JPG at same quality",
        "Supports both lossy and lossless compression",
        "Full transparency and animation support",
        "Google's recommended web format",
        "Supported by 95%+ of modern browsers"
      ]}
      formatBestFor={["Websites", "Mobile Apps", "SEO Optimization", "Fast Loading"]}
      acceptedFormatsText="JPEG, PNG, WebP, GIF, BMP, AVIF"
      toolCTA={toolCTA}
      reasons={webpReasons}
    />
  );
}