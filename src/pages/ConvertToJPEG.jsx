import ImageConverter from "../components/ImageConverter";
import { Shield, Zap, Smartphone, Globe, Stars, Clock } from "lucide-react";
import toolCTA from "/tools-cta/convert-to-jpg.png";

export default function ConvertToJPEG() {
  
  const jpegReasons = [
    {
      icon: Shield,
      title: "Ultra-Secure JPG Conversion",
      description: "Your images are processed 100% locally in your browser. No files uploaded to servers, ensuring complete privacy and data protection.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast Processing",
      description: "Convert images to JPG in seconds with our optimized engine. Experience instant results without compromising on visual quality.",
    },
    {
      icon: Stars,
      title: "Smart Quality Optimization",
      description: "Our intelligent algorithms balance quality and file size automatically. Get perfect JPGs for web, print, and social media.",
    },
    {
      icon: Smartphone,
      title: "Multi-Device Ready",
      description: "Works flawlessly on desktop, tablet, and mobile. Convert JPGs on any device with our responsive, touch-friendly interface.",
    },
    {
      icon: Globe,
      title: "Universal JPG Compatibility",
      description: "JPG is supported by 100% of devices worldwide. Convert with confidence knowing your images will work everywhere.",
    },
    {
      icon: Clock,
      title: "Zero Wait Time",
      description: "No registration, no watermarks, no subscriptions. Start converting to JPG immediately with our completely free service.",
    }
  ];

  return (
    <ImageConverter
      title="Convert to JPG"
      description="Upload any image and convert it to universal JPG format with adjustable quality settings"
      format="imageToJPG"
      type="JPEG"
      initialOptions={{ quality: 0.92 }}
      faqItems={[
        {
          question: "What image formats can I convert to JPG?",
          answer: "Convert PNG, WebP, GIF, BMP, TIFF, and SVG files to JPG format instantly. Our tool supports all popular image formats with 100% accuracy."
        },
        {
          question: "Will JPG conversion reduce image quality?",
          answer: "Our intelligent conversion maintains maximum visual quality while optimizing file size. You control the quality level to balance between file size and image clarity."
        },
        {
          question: "Does JPG support transparent backgrounds?",
          answer: "JPG doesn't support transparency. During conversion, transparent areas are automatically filled with a white background for clean, professional results."
        },
        {
          question: "What's the best JPG quality setting for web use?",
          answer: "For websites and social media, 75-85% quality provides excellent results with fast loading. For printing and archiving, use 90-100% quality for maximum detail."
        },
        {
          question: "Is there a limit on how many images I can convert?",
          answer: "No limits! Convert unlimited images completely free. Batch processing handles multiple files simultaneously, saving you time and effort."
        }
      ]}
      howToTitle="How To Convert Images to JPG Online for Free"
      howToSteps={{
        stepOne: "Upload Images",
        stepOneDes: "Select or drag and drop your image files",
        stepTwo: "Adjust Quality Settings",
        stepTwoDes: "Set JPG quality level for optimal results",
        stepThree: "Convert to JPG",
        stepThreeDes: "Click convert to process all images instantly",
        stepFour: "Download Results",
        stepFourDes: "Get your optimized JPG files ready to use"
      }}
      formatFeatures={[
        "100% device and browser compatibility",
        "Ideal for photographs and detailed images",
        "Optimized for web loading speed",
        "Perfect for social media and sharing"
      ]}
      formatBestFor={["Photography", "Websites", "Social Media", "Printing"]}
      acceptedFormatsText="JPEG, PNG, WebP, GIF, BMP, AVIF"
      toolCTA={toolCTA}
      reasons={jpegReasons}
    />
  );
}