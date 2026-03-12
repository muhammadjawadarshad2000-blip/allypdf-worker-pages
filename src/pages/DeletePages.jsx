import { Gift, Key, Layout, Shield, XSquare, X, Zap } from "lucide-react";
import { deletePDFPages } from "../utils/index";
import PDFPageEditor from "../components/PDFPageEditor";
import toolCTA from "/tools-cta/delete-pdf-pages.png";

export default function DeletePages() {
  const faqItems = [
    {
      question: "Can I delete multiple pages at once from my PDF?",
      answer: "Yes! You can select multiple pages by clicking on them, and delete all selected pages in one operation. This makes removing unwanted content from your PDF document quick and efficient."
    },
    {
      question: "Will deleting pages affect the quality of my remaining PDF pages?",
      answer: "No, the PDF quality remains unchanged. We only remove the selected pages while preserving the original quality, resolution, and formatting of all remaining pages in your document."
    },
    {
      question: "Can I delete all pages from a PDF document?",
      answer: "No, you must keep at least one page in the PDF document. Our tool prevents deleting all pages to ensure you always have a valid PDF file that can be opened and shared."
    },
    {
      question: "What if my PDF is password protected or encrypted?",
      answer: "Our PDF page removal tool fully supports encrypted PDFs. You'll be prompted to enter the password before selecting and deleting pages, ensuring secure document processing."
    },
    {
      question: "Is there a limit to how many pages I can delete from a PDF?",
      answer: "You can delete any number of pages as long as at least one page remains. There's no limit on the number of deletions per document, making it perfect for cleaning large PDF files."
    }
  ];

  const toolDetails = {
    mainTitle: "Remove Unwanted Pages from PDF Documents Online",
    mainDescription: "Easily clean up your PDF files by removing unnecessary pages. Our free online PDF page deletion tool lets you select and delete specific pages from any PDF document while maintaining the original quality of the remaining content. Perfect for document cleanup, privacy protection, and PDF size reduction."
  };

  const reasons = [
    {
      icon: Shield,
      title: "Ultra-Secure Page Removal",
      description: "Your PDF documents never leave your browser. All page deletion happens locally on your device, ensuring complete privacy and security for sensitive documents.",
    },
    {
      icon: Gift,
      title: "Completely Free PDF Editing",
      description: "No hidden fees, no subscriptions, no watermarks. Our PDF page deletion tool is 100% free with no limitations. Remove pages from PDFs as much as you want.",
    },
    {
      icon: XSquare,
      title: "Precise Page Selection",
      description: "Select specific pages to delete with visual previews. Perfect for removing unwanted content, confidential pages, or blank pages from any PDF document.",
    },
    {
      icon: Zap,
      title: "Instant Browser-Based Operation",
      description: "Zero installation required—works directly in your browser. No software downloads, no registration, and no waiting times. Start deleting PDF pages in seconds.",
    },
    {
      icon: Key,
      title: "Encrypted PDF Support",
      description: "Seamlessly delete pages from password-protected PDFs. Our tool recognizes encrypted files and prompts for passwords, ensuring secure document editing.",
    },
    {
      icon: Layout,
      title: "Visual Page Previews",
      description: "See thumbnail previews of every page before deletion. Each page displays a preview, helping you identify exactly which pages to remove from your PDF.",
    }
  ];

  const iconColorClasses = [
    "bg-blue-500",
    "bg-pink-500",
    "bg-red-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-purple-500"
  ];

  const validateSelection = (selectedPages, pageCount) => {
    if (selectedPages.length >= pageCount) {
      return "Cannot delete all pages from a PDF document. At least one page must remain.";
    }
    return null;
  };

  return (
    <div className="relative min-h-screen">
      <PDFPageEditor
        actionType="delete"
        title="Delete PDF Pages Online"
        description="Select and delete unwanted pages from your PDF and instantly download a clean, corrected version"
        processFunction={deletePDFPages}
        selectionIcon={X}
        actionVerb="Delete"
        resultFileNameSuffix="_cleaned"
        faqItems={faqItems}
        howToTitle="How To Delete Pages from PDF Online for Free"
        howToSteps={{
          stepOne: "Upload PDF",
          stepOneDes: "Select or drag and drop your PDF file",
          stepTwo: "Select Pages",
          stepTwoDes: "Click on pages you want to remove",
          stepThree: "Delete Pages",
          stepThreeDes: "Click delete to remove selected pages",
          stepFour: "Download Result",
          stepFourDes: "Get your cleaned PDF instantly"
        }}
        toolCTA={toolCTA}
        toolDetails={toolDetails}
        validateSelection={validateSelection}
        showRemainingCount={true}
        reasons={reasons}
        iconColorClasses={iconColorClasses}
        primaryColor="sky"
        seoKeywords={["delete PDF pages", "remove pages from PDF", "PDF page deletion", "clean PDF documents", "PDF editing online", "remove unwanted pages"]}
      />
    </div>
  );
}