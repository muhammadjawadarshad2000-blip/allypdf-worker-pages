import React, { useEffect, useMemo, lazy, Suspense, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer'
import SEOHead from './components/SEO/SEOHead';
import { Loader } from 'lucide-react';
import './index.css';

// Progressive loading component
const ProgressiveLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader strokeWidth={2} className="relative w-8 h-8 sm:w-12 sm:h-12 text-blue-500 animate-spin" />
    </div>
  </div>
);

// Lazy load components
const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Auth/Login'));
const Signup = lazy(() => import('./components/Auth/Signup'));
const DeviceVerification = lazy(() => import('./components/Auth/DeviceVerification'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/Legal/TermsOfService'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const AdminBlog = lazy(() => import('./pages/AdminBlog'));

import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

// Lazy load PDF tools
const MergePDF = lazy(() => import('./pages/MergePDF'));
const SplitPDF = lazy(() => import('./pages/SplitPDF'));
const DeletePages = lazy(() => import('./pages/DeletePages'));
const ExtractPages = lazy(() => import('./pages/ExtractPages'));
const RearrangePages = lazy(() => import('./pages/RearrangePages'));
const ProtectPDF = lazy(() => import('./pages/ProtectPDF'));
const UnlockPDF = lazy(() => import('./pages/UnlockPDF'));

// Lazy load converters
const PDFtoPNG = lazy(() => import('./pages/PDFtoPNG'));
const PNGtoPDF = lazy(() => import('./pages/PNGtoPDF'));
const PDFtoJPEG = lazy(() => import('./pages/PDFtoJPEG'));
const JPEGtoPDF = lazy(() => import('./pages/JPEGtoPDF'));
const ImageCompressor = lazy(() => import('./pages/CompressImage'));
const CropPdf = lazy(() => import('./pages/CropPdf'));
const RotatePDF = lazy(() => import('./pages/RotatePDF'));
const ImagetoPDF = lazy(() => import('./pages/ImagetoPDF'));
const ConvertToJPEG = lazy(() => import('./pages/ConvertToJPEG'));
const ConvertToPNG = lazy(() => import('./pages/ConvertToPNG'));
const ConvertToWebP = lazy(() => import('./pages/ConvertToWebP'));
const CropImage = lazy(() => import('./pages/CropImage'));
const RotateImage = lazy(() => import('./pages/RotateImage'));
const ResizeImage = lazy(() => import('./pages/ResizeImage'));
const HtmlToImage = lazy(() => import('./pages/HtmlToImage'));
const HtmlToPdf = lazy(() => import('./pages/HtmlToPdf'));
const ExtractPDFImages = lazy(() => import('./pages/ExtractPDFImages'));
const ExtractPDFText = lazy(() => import('./pages/ExtractPDFText'));

// SEO configuration
const seoConfig = {
  '/': {
    title: 'Allypdf - Free Online PDF & Image Tools | Merge, Split, Convert',
    description: 'Free online PDF tools to merge, split, convert, and edit PDF files. Convert images between formats, compress files, and manipulate documents with our easy-to-use tools.',
    keywords: 'PDF tools, Merge PDF, split PDF, combine PDF, extract PDF, compress PDF, convert PDF, delete, organize PDF, rotate, PDF to JPG, JPG to PDF, PDF to PNG, PNG to PDF, compress Image',
    canonical: 'https://allypdf.com'
  },
  '/login': {
    title: 'Login - Allypdf | Access Your PDF Tools Account',
    description: 'Login to your Allypdf account to access your files, conversion history, and premium features. Secure and easy access to all PDF tools.',
    keywords: 'login, PDF tools account, Allypdf login, secure login, PDF tools access',
    canonical: 'https://allypdf.com/login',
    robots: 'noindex, follow'
  },
  '/signup': {
    title: 'Sign Up - Allypdf | Create Free Account for PDF Tools',
    description: 'Create your free Allypdf account to save files, access conversion history, and use advanced PDF tools. No credit card required.',
    keywords: 'sign up, register, create account, PDF tools, free account, Allypdf registration',
    canonical: 'https://allypdf.com/signup',
    robots: 'noindex, follow'
  },
  '/verify-device': {
    title: 'Verify Device - Allypdf | Confirm Your Identity',
    description: 'Enter the verification code sent to your email to confirm your identity on this new device.',
    keywords: 'device verification, OTP, security, Allypdf',
    canonical: 'https://allypdf.com/verify-device',
    robots: 'noindex, nofollow'
  },
  '/privacy': {
    title: 'Privacy Policy - Allypdf | Data Protection & Privacy',
    description: 'Read Allypdf privacy policy to understand how we protect your data and ensure your privacy while using our PDF and image conversion tools.',
    keywords: 'privacy policy, data protection, privacy, Allypdf privacy, PDF tools privacy',
    canonical: 'https://allypdf.com/privacy'
  },
  '/terms': {
    title: 'Terms of Service - Allypdf | User Agreement & Policies',
    description: 'Review Allypdf terms of service to understand the user agreement, policies, and guidelines for using our free PDF and image conversion tools.',
    keywords: 'terms of service, user agreement, policies, Allypdf terms, PDF tools terms',
    canonical: 'https://allypdf.com/terms'
  },
  '/forgot-password': {
    title: 'Forgot Password - Allypdf | Reset Your Account Password',
    description: 'Reset your Allypdf account password. Enter your email to receive password reset instructions and regain access to your PDF tools.',
    keywords: 'forgot password, reset password, password recovery, Allypdf password',
    canonical: 'https://allypdf.com/forgot-password',
    robots: 'noindex, follow'
  },
  '/reset-password/:token': {
    title: 'Reset Password - Allypdf | Create New Password',
    description: 'Create a new password for your Allypdf account. Secure your access to PDF conversion and editing tools with a strong password.',
    keywords: 'reset password, new password, password change, Allypdf security',
    canonical: 'https://allypdf.com/reset-password',
    robots: 'noindex, follow'
  },
  '/merge-pdf': {
    title: 'Merge PDF Files Online - Combine Multiple PDFs into One Document',
    description: 'Free online PDF merger tool. Combine multiple PDF files into a single document quickly and easily. No registration required, no watermarks.',
    keywords: 'merge PDF, combine PDF, PDF merger, join PDF files, online PDF tools, PDF combiner',
    canonical: 'https://allypdf.com/merge-pdf'
  },
  '/split-pdf': {
    title: 'Split PDF Files Online - Extract Pages from PDF Documents',
    description: 'Split PDF documents into multiple files or extract specific pages. Free online PDF splitter tool with no watermarks.',
    keywords: 'split PDF, extract PDF pages, PDF splitter, divide PDF, PDF tools, PDF separator',
    canonical: 'https://allypdf.com/split-pdf'
  },
  '/delete-pages': {
    title: 'Delete PDF Pages Online - Remove Pages from PDF Documents',
    description: 'Remove unwanted pages from your PDF documents. Free online tool to delete specific pages from PDF files quickly and easily.',
    keywords: 'delete PDF pages, delete PDF, remove PDF pages, PDF editor, PDF page removal, PDF tools',
    canonical: 'https://allypdf.com/delete-pages'
  },
  '/extract-pages': {
    title: 'Extract PDF Pages Online - Save Specific Pages as New PDF',
    description: 'Extract specific pages from PDF documents and save them as new PDF files. Free online PDF page extraction tool.',
    keywords: 'extract PDF pages, PDF page extraction, save PDF pages, PDF tools, page selector',
    canonical: 'https://allypdf.com/extract-pages'
  },
  '/rearrange': {
    title: 'Rearrange PDF Pages Online - Reorder Pages in PDF Documents',
    description: 'Change the order of pages in your PDF documents. Free online tool to rearrange, reorder, and organize PDF pages.',
    keywords: 'rearrange PDF pages, reorder PDF, PDF organizer, PDF page order, PDF tools',
    canonical: 'https://allypdf.com/rearrange'
  },
  '/pdf-to-png': {
    title: 'PDF to PNG Converter Online - Convert PDF Pages to PNG Images',
    description: 'Convert PDF files to high-quality PNG images. Free online PDF to PNG converter.',
    keywords: 'PDF to PNG, convert PDF to PNG, PDF converter, PNG images',
    canonical: 'https://allypdf.com/pdf-to-png'
  },
  '/png-to-pdf': {
    title: 'PNG to PDF Converter Online - Convert PNG Images to PDF',
    description: 'Convert PNG images to PDF documents. Free online tool to create PDF files from PNG images.',
    keywords: 'PNG to PDF, convert PNG to PDF, image to PDF, PDF creator',
    canonical: 'https://allypdf.com/png-to-pdf'
  },
  '/pdf-to-jpg': {
    title: 'PDF to JPEG Converter Online - Convert PDF to JPG Images',
    description: 'Convert PDF files to JPEG/JPG images with high quality.',
    keywords: 'PDF to JPEG, PDF to JPG, convert PDF to JPEG, PDF converter',
    canonical: 'https://allypdf.com/pdf-to-jpg'
  },
  '/jpg-to-pdf': {
    title: 'JPEG to PDF Converter Online - Convert JPG Images to PDF',
    description: 'Convert JPEG/JPG images to PDF documents.',
    keywords: 'JPEG to PDF, JPG to PDF, convert JPEG to PDF, image to PDF',
    canonical: 'https://allypdf.com/jpg-to-pdf'
  },
  '/compress-image': {
    title: 'Image Compressor Online - Reduce Image File Size',
    description: 'Compress images to reduce file size without significant quality loss.',
    keywords: 'image compressor, compress images, reduce image size, image optimization',
    canonical: 'https://allypdf.com/compress-image'
  },
  '/crop-pdf': {
    title: 'Crop PDF Online - Adjust PDF Page Margins and Size',
    description: 'Crop PDF pages to adjust margins, remove unwanted content, or change page size.',
    keywords: 'crop PDF, PDF cropper, adjust PDF margins, PDF editor',
    canonical: 'https://allypdf.com/crop-pdf'
  },
  '/rotate-pdf': {
    title: 'Rotate PDF Pages Online - Fix PDF Page Orientation',
    description: 'Rotate PDF pages to correct orientation.',
    keywords: 'rotate PDF, PDF rotation, fix PDF orientation, PDF editor',
    canonical: 'https://allypdf.com/rotate-pdf'
  },
  '/image-to-pdf': {
    title: 'Image to PDF Converter Online - Convert Images to PDF',
    description: 'Convert multiple images to PDF documents.',
    keywords: 'image to PDF, convert images to PDF, JPG to PDF, PNG to PDF',
    canonical: 'https://allypdf.com/image-to-pdf'
  },
  '/convert-to-jpg': {
    title: 'Image to JPEG Converter Online - Convert Any Image to JPG Format',
    description: 'Convert any image format to JPEG/JPG.',
    keywords: 'image to JPEG, convert image to JPG, PNG to JPEG, WebP to JPEG',
    canonical: 'https://allypdf.com/convert-to-jpg'
  },
  '/convert-to-png': {
    title: 'Image to PNG Converter Online - Convert Any Image to PNG Format',
    description: 'Convert any image format to PNG with transparency support.',
    keywords: 'image to PNG, convert image to PNG, JPEG to PNG, WebP to PNG',
    canonical: 'https://allypdf.com/convert-to-png'
  },
  '/convert-to-webp': {
    title: 'Image to WebP Converter Online - Convert Any Image to WebP Format',
    description: 'Convert any image format to modern WebP format.',
    keywords: 'image to WebP, convert image to WebP, JPEG to WebP, PNG to WebP',
    canonical: 'https://allypdf.com/convert-to-webp'
  },
  '/dashboard': {
    title: 'Dashboard - Allypdf | Your Account',
    description: 'Manage your Allypdf account, view recent tools and conversion history.',
    keywords: 'dashboard, account, PDF tools, conversion history',
    canonical: 'https://allypdf.com/dashboard',
    robots: 'noindex, follow'
  },
  '/contact': {
    title: 'Contact Us - Allypdf | Get in Touch',
    description: 'Contact Allypdf support team for help, feedback, or questions about our PDF and image tools.',
    keywords: 'contact, support, help, feedback, Allypdf',
    canonical: 'https://allypdf.com/contact'
  },
  '/about': {
    title: 'About Us - Allypdf | Our Mission & Team',
    description: 'Learn about Allypdf, our mission to make PDF tools free and private.',
    keywords: 'about allypdf, PDF tools team, free PDF tools, privacy-first PDF',
    canonical: 'https://allypdf.com/about'
  },
  '/blog': {
    title: 'Blog - AllyPdf | Guides, Tips & Tutorials for PDF Tools',
    description: 'Explore guides, tips, and tutorials on merging, splitting, converting PDFs and more.',
    keywords: 'blog, PDF guides, image tools tips, tutorials, AllyPdf',
    canonical: 'https://allypdf.com/blog'
  },
};

const SEOLinks = React.memo(() => {
  const allRoutes = [
    '/', '/merge-pdf', '/split-pdf', '/rotate-pdf', '/delete-pages', '/extract-pages',
    '/rearrange', '/protect-pdf', '/unlock-pdf',
    '/pdf-to-png', '/png-to-pdf', '/pdf-to-jpg', '/jpg-to-pdf', '/html-to-pdf',
    '/html-to-image', '/extract-pdf-images', '/extract-pdf-text', '/crop-image',
    '/rotate-image', '/resize-image', '/compress-image', '/crop-pdf', '/image-to-pdf',
    '/convert-to-jpg', '/convert-to-png', '/convert-to-webp',
    '/login', '/signup', '/privacy', '/terms', '/contact', '/about', '/blog'
  ];

  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      {allRoutes.map(route => (
        <a key={route} href={route}>
          {route === '/' ? 'Home' : route.slice(1).replace(/-/g, ' ')}
        </a>
      ))}
    </div>
  );
});

const AppContent = React.memo(function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-JS2TSSY2P2", {
        page_path: location.pathname,
      });
    }
  }, [location.pathname]);

  const currentPath = location.pathname;
  const isDynamicBlogPost = currentPath.startsWith('/blog/') && currentPath !== '/blog';

  const currentSeo = useMemo(() =>
    seoConfig[currentPath] || seoConfig['/'],
    [currentPath]
  );

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser && isAuthenticated) {
        startTransition(() => {
          dispatch(fetchCurrentUser());
        });
      }
    };
    initAuth();
  }, [dispatch, isAuthenticated]);

  const usageState = useSelector((state) => state.usage);

  useEffect(() => {
    localStorage.setItem('pdf_usage_data', JSON.stringify(usageState));
  }, [usageState]);

  return (
    <div className="h-auto">
      {!isDynamicBlogPost && <SEOHead {...currentSeo} />}
      <SEOLinks />
      <Navbar />
      <main className="">
        <Suspense fallback={<ProgressiveLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-device" element={<DeviceVerification />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/admin/blog" element={
              <AdminRoute>
                <AdminBlog />
              </AdminRoute>
            } />
            <Route path="/merge-pdf" element={<MergePDF />} />
            <Route path="/split-pdf" element={<SplitPDF />} />
            <Route path="/delete-pages" element={<DeletePages />} />
            <Route path="/extract-pages" element={<ExtractPages />} />
            <Route path="/rearrange" element={<RearrangePages />} />
            <Route path="/protect-pdf" element={<ProtectPDF />} />
            <Route path="/unlock-pdf" element={<UnlockPDF />} />
            <Route path="/pdf-to-png" element={<PDFtoPNG />} />
            <Route path="/png-to-pdf" element={<PNGtoPDF />} />
            <Route path="/pdf-to-jpg" element={<PDFtoJPEG />} />
            <Route path="/jpg-to-pdf" element={<JPEGtoPDF />} />
            <Route path="/compress-image" element={<ImageCompressor />} />
            <Route path="/crop-pdf" element={<CropPdf />} />
            <Route path="/rotate-pdf" element={<RotatePDF />} />
            <Route path="/image-to-pdf" element={<ImagetoPDF />} />
            <Route path="/convert-to-jpg" element={<ConvertToJPEG />} />
            <Route path="/convert-to-png" element={<ConvertToPNG />} />
            <Route path="/convert-to-webp" element={<ConvertToWebP />} />
            <Route path="/crop-image" element={<CropImage />} />
            <Route path="/rotate-image" element={<RotateImage />} />
            <Route path="/resize-image" element={<ResizeImage />} />
            <Route path="/html-to-image" element={<HtmlToImage />} />
            <Route path="/html-to-pdf" element={<HtmlToPdf />} />
            <Route path="/extract-pdf-images" element={<ExtractPDFImages />} />
            <Route path="/extract-pdf-text" element={<ExtractPDFText />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
});

AppContent.displayName = 'AppContent';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default React.memo(App);