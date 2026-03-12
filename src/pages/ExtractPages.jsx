import { Check } from "lucide-react";
import { extractPDFPages } from "../utils/index";
import PDFPageEditor from "../components/PDFPageEditor";
import { Shield, Gift, SquareArrowUpRight, Zap, Key, Layout } from "lucide-react";
import toolCTA from "/tools-cta/extract-pdf-pages.png";

export default function ExtractPages() {
  const faqItems = [
    {
      question: "Can I extract non-consecutive pages from a PDF?",
      answer: "Yes! You can select any combination of pages, whether they're consecutive or scattered throughout the document. Perfect for creating custom PDF documents from larger files."
    },
    {
      question: "Will the extracted pages maintain their original quality and formatting?",
      answer: "Absolutely. The extracted pages are identical to the original in quality, resolution, and formatting. All text, images, and layout elements are preserved perfectly."
    },
    {
      question: "Can I extract a single page from a large PDF document?",
      answer: "Yes, you can extract just one page or multiple pages. There's no minimum or maximum limit on extraction, making it perfect for all PDF editing needs."
    },
    {
      question: "What if my PDF is password protected or encrypted?",
      answer: "Our PDF extraction tool fully supports encrypted PDFs. You'll be prompted to enter the password before selecting pages to extract, ensuring secure document processing."
    },
    {
      question: "Is there a limit to how many pages I can extract from a PDF?",
      answer: "You can extract any number of pages from a PDF. The tool handles documents of all sizes efficiently, making it perfect for professional PDF document management."
    }
  ];

  const toolDetails = {
    mainTitle: "Extract Specific Pages from PDF Documents Online",
    mainDescription: "Create custom PDF files by extracting only the pages you need. Our free online PDF extraction tool lets you select individual or multiple pages from any PDF and save them as a separate document while preserving the original quality and formatting. Perfect for document customization and selective sharing."
  };

  const reasons = [
    {
      icon: Shield,
      title: "Secure PDF Extraction",
      description: "Your PDF documents never leave your browser. All page extraction happens locally on your device, ensuring complete privacy and security for sensitive information.",
    },
    {
      icon: Gift,
      title: "100% Free PDF Tool",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF page extraction tool is completely free forever. Extract pages from PDFs as much as you want.",
    },
    {
      icon: SquareArrowUpRight,
      title: "Precise Page Selection",
      description: "Select specific pages to extract with visual previews. Perfect for creating custom documents, extracting chapters, or isolating important sections from large PDFs.",
    },
    {
      icon: Zap,
      title: "Instant Browser Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration, and no waiting times. Start extracting PDF pages in seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly extract pages from password-protected PDFs. Our tool recognizes encrypted files and prompts for passwords, ensuring secure document processing.",
    },
    {
      icon: Layout,
      title: "Visual Page Previews",
      description: "See thumbnail previews of every page before extraction. Each page displays a preview, helping you identify exactly which pages to extract from your PDF.",
    }
  ];

  const iconColorClasses = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-cyan-500"
  ];

  return (
    <div className="relative min-h-screen">
      <PDFPageEditor
        actionType="extract"
        title="Extract PDF Pages Online"
        description="Select specific pages from your PDF and extract them into a new, high-quality file"
        processFunction={extractPDFPages}
        selectionIcon={Check}
        actionVerb="Extract"
        resultFileNameSuffix="_extracted"
        faqItems={faqItems}
        howToTitle="How To Extract Pages from PDF Online for Free"
        howToSteps={{
          stepOne: "Upload PDF",
          stepOneDes: "Select or drag and drop your PDF file",
          stepTwo: "Select Pages",
          stepTwoDes: "Click on pages you want to extract",
          stepThree: "Extract Pages",
          stepThreeDes: "Click extract to create new PDF",
          stepFour: "Download Result",
          stepFourDes: "Get your extracted PDF instantly"
        }}
        toolCTA={toolCTA}
        toolDetails={toolDetails}
        reasons={reasons}
        iconColorClasses={iconColorClasses}
        primaryColor="blue"
        seoKeywords={["extract PDF pages", "PDF page extraction", "split PDF pages", "create PDF from pages", "PDF document extraction", "select PDF pages"]}
      />
    </div>
  );
}