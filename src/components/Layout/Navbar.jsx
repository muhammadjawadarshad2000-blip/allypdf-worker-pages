import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, User as DashboardIcon, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import {
  MergePDFIcon, SplitPDFIcon, CompressImageIcon,
  ConvertToJPGIcon, ConvertToPNGIcon, ConvertToWebPIcon,
  CropPDFIcon, CropImageIcon, DeletePagesIcon,
  ExtractPagesIcon, ExtractImagesIcon,
  ExtractTextIcon, HtmlToImageIcon,
  HtmlToPDFIcon, ImageToPDFIcon, JpgToPDFIcon,
  PDFToJpgIcon, PDFToPngIcon, PngToPDFIcon,
  ProtectPDFIcon, RearrangePagesIcon, ResizeImageIcon,
  RotatePDFIcon, RotateImageIcon, UnlockPDFIcon
} from '../ToolIcons';
import { AllyPdfLogo } from '../logo';

// --- Tool Data Dictionary ---
const tools = {
  merge: { name: "Merge PDF", desc: "Combine multiple files", icon: MergePDFIcon, path: "/merge-pdf" },
  split: { name: "Split PDF", desc: "Extract specific pages", icon: SplitPDFIcon, path: "/split-pdf" },
  rearrange: { name: "Rearrange", desc: "Reorder your pages", icon: RearrangePagesIcon, path: "/rearrange" },
  cropPdf: { name: "Crop PDF", desc: "Adjust page margins", icon: CropPDFIcon, path: "/crop-pdf" },
  rotatePdf: { name: "Rotate PDF", desc: "Fix page orientation", icon: RotatePDFIcon, path: "/rotate-pdf" },
  delete: { name: "Delete Pages", desc: "Remove unwanted pages", icon: DeletePagesIcon, path: "/delete-pages" },
  extractPages: { name: "Extract Pages", desc: "Pull out specific pages", icon: ExtractPagesIcon, path: "/extract-pages" },
  jpgToPdf: { name: "JPG to PDF", desc: "Turn JPGs to documents", icon: JpgToPDFIcon, path: "/jpg-to-pdf" },
  pngToPdf: { name: "PNG to PDF", desc: "Turn PNGs to documents", icon: PngToPDFIcon, path: "/png-to-pdf" },
  imageToPdf: { name: "Image to PDF", desc: "Any image to PDF", icon: ImageToPDFIcon, path: "/image-to-pdf" },
  htmlToPdf: { name: "HTML to PDF", desc: "Webpages to PDF", icon: HtmlToPDFIcon, path: "/html-to-pdf" },
  pdfToPng: { name: "PDF to PNG", desc: "Extract as PNG images", icon: PDFToPngIcon, path: "/pdf-to-png" },
  pdfToJpg: { name: "PDF to JPG", desc: "Extract as JPG images", icon: PDFToJpgIcon, path: "/pdf-to-jpg" },
  extractText: { name: "Extract Text", desc: "Pull raw text instantly", icon: ExtractTextIcon, path: "/extract-pdf-text" },
  extractImages: { name: "Extract Images", desc: "Rip all images out", icon: ExtractImagesIcon, path: "/extract-pdf-images" },
  protect: { name: "Protect PDF", desc: "Add 256-bit encryption", icon: ProtectPDFIcon, path: "/protect-pdf" },
  unlock: { name: "Unlock PDF", desc: "Remove passwords", icon: UnlockPDFIcon, path: "/unlock-pdf" },
  compress: { name: "Compress Image", desc: "Reduce file sizes", icon: CompressImageIcon, path: "/compress-image" },
  resize: { name: "Resize Image", desc: "Change dimensions", icon: ResizeImageIcon, path: "/resize-image" },
  cropImage: { name: "Crop Image", desc: "Trim and adjust photos", icon: CropImageIcon, path: "/crop-image" },
  rotateImage: { name: "Rotate Image", desc: "Flip and rotate visuals", icon: RotateImageIcon, path: "/rotate-image" },
  toJpeg: { name: "To JPEG", desc: "Convert to JPEG", icon: ConvertToJPGIcon, path: "/convert-to-jpg" },
  toPng: { name: "To PNG", desc: "Convert to PNG", icon: ConvertToPNGIcon, path: "/convert-to-png" },
  toWebp: { name: "To WebP", desc: "Optimize for web", icon: ConvertToWebPIcon, path: "/convert-to-webp" },
  htmlToImage: { name: "HTML to Image", desc: "Screenshot webpages fast", icon: HtmlToImageIcon, path: "/html-to-image" },
};

// --- Mega Menu Structures ---
const megaMenus = {
  allTools: [
    { title: "Organize PDF", items: [tools.merge, tools.split, tools.rearrange, tools.cropPdf, tools.rotatePdf, tools.delete, tools.extractPages] },
    { title: "Convert", items: [tools.jpgToPdf, tools.pngToPdf, tools.imageToPdf, tools.htmlToPdf, tools.pdfToPng, tools.pdfToJpg, tools.extractText, tools.extractImages] },
    { title: "Security", items: [tools.protect, tools.unlock] },
    { title: "Image Tools", items: [tools.compress, tools.resize, tools.cropImage, tools.rotateImage, tools.toJpeg, tools.toPng, tools.toWebp, tools.htmlToImage] }
  ],
  pdfTools: [
    { title: "Organize PDF", items: [tools.merge, tools.split, tools.rearrange, tools.cropPdf, tools.rotatePdf, tools.delete, tools.extractPages] },
    { title: "Convert to PDF", items: [tools.jpgToPdf, tools.pngToPdf, tools.imageToPdf, tools.htmlToPdf] },
    { title: "Convert from PDF", items: [tools.pdfToPng, tools.pdfToJpg, tools.extractText, tools.extractImages] },
    { title: "Security", items: [tools.protect, tools.unlock] }
  ],
  imageTools: [
    { title: "Optimize & Edit", items: [tools.compress, tools.resize, tools.cropImage, tools.rotateImage] },
    { title: "Convert Image", items: [tools.toJpeg, tools.toPng, tools.toWebp, tools.htmlToImage] }
  ]
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileAccordion, setActiveMobileAccordion] = useState(null);

  // New state for click-based desktop dropdowns
  const [activeDesktopMenu, setActiveDesktopMenu] = useState(null);
  const navRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Dummy Redux state for layout testing. Replace with your actual state.
  const { isAuthenticated, user } = useSelector((state) => state.auth || { isAuthenticated: false });
  console.log(user)

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveMobileAccordion(null);
    setActiveDesktopMenu(null);
  }, [location.pathname]);

  // Handle clicking outside to close the desktop mega menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDesktopMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const toggleMobileAccordion = (menu) => {
    setActiveMobileAccordion(activeMobileAccordion === menu ? null : menu);
  };

  const toggleDesktopMenu = (menu) => {
    setActiveDesktopMenu(activeDesktopMenu === menu ? null : menu);
  };

  // Reusable component for rendering the dark mega menu content
  const MegaMenuDropdown = ({ data, columns, isOpen }) => (
    <div
      className={`custom-scrollbar absolute top-15 left-0 w-full bg-[#091d33] border-t border-t-white/10 transition-all duration-300 origin-top transform cursor-default overflow-y-auto max-h-[calc(100vh-70px)]
      ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
    >
      <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-x-8 gap-y-10`}>
          {data.map((category, idx) => (
            <div key={idx} className="flex flex-col">
              <h3 className="text-teal-400 font-semibold text-sm tracking-wider uppercase mb-5 border-b border-white/10 pb-2">
                {category.title}
              </h3>
              <ul className="space-y-4">
                {category.items.map((tool, tIdx) => {
                  const Icon = tool.icon;
                  return (
                    <li key={tIdx}>
                      <Link
                        to={tool.path}
                        onClick={() => setActiveDesktopMenu(null)}
                        className="group/item flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-lg shrink-0 group-hover/item:bg-white/20 transition-colors [&>svg]:w-5 [&>svg]:h-5">
                          <Icon />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium group-hover/item:text-teal-300 transition-colors">
                            {tool.name}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {tool.desc}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMobileAccordion = (title, menuKey, data) => (
    <div className="flex flex-col border-b border-white/10 pb-2">
      <button
        onClick={() => toggleMobileAccordion(menuKey)}
        className="flex items-center justify-between text-lg text-white py-4 cursor-pointer"
      >
        {title}
        <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${activeMobileAccordion === menuKey ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {activeMobileAccordion === menuKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-6 pt-2 pb-4">
              {data.map((category, idx) => (
                <div key={idx}>
                  <h4 className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3 px-2">
                    {category.title}
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {category.items.map((tool, tIdx) => (
                      <Link
                        key={tIdx}
                        to={tool.path}
                        className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-md [&>svg]:w-4 [&>svg]:h-4">
                          <tool.icon />
                        </div>
                        <span className="text-base">{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <>
      {/* --- DESKTOP NAVBAR --- */}
      <header ref={navRef} className="sticky top-0 w-full z-50 bg-white border-b border-gray-200 transition-all duration-300">
        <div className="max-w-350 mx-auto px-4 sm:px-6">
          <div className="flex gap-10 items-center h-15">

            {/* 1. Logo (Left) */}
            <Link to="/" className="flex items-center h-10">
              <AllyPdfLogo width={150} height={30} strokeWidth={3} />
            </Link>

            {/* 2. Main Navigation Links (Center-Left) */}
            <nav className="hidden lg:flex justify-evenly max-w-175 items-center w-full gap-5 h-full">

              {/* All Tools Click Menu */}
              <div className="h-full flex items-center">
                <button
                  onClick={() => toggleDesktopMenu('allTools')}
                  className={`flex items-center gap-1.5 text-md transition-colors h-full cursor-pointer 
                  ${activeDesktopMenu === 'allTools' ? 'text-[#091d33]' : 'text-gray-600 hover:text-[#091d33]'}`}
                >
                  All Tools
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDesktopMenu === 'allTools' ? 'rotate-180' : ''}`} />
                </button>
                <MegaMenuDropdown data={megaMenus.allTools} columns="4" isOpen={activeDesktopMenu === 'allTools'} />
              </div>

              {/* PDF Tools Click Menu */}
              <div className="h-full flex items-center">
                <button
                  onClick={() => toggleDesktopMenu('pdfTools')}
                  className={`flex items-center gap-1.5 text-md transition-colors h-full cursor-pointer 
                  ${activeDesktopMenu === 'pdfTools' ? 'text-[#091d33]' : 'text-gray-600 hover:text-[#091d33]'}`}
                >
                  PDF Tools
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDesktopMenu === 'pdfTools' ? 'rotate-180' : ''}`} />
                </button>
                <MegaMenuDropdown data={megaMenus.pdfTools} columns="4" isOpen={activeDesktopMenu === 'pdfTools'} />
              </div>

              {/* Image Tools Click Menu */}
              <div className="h-full flex items-center">
                <button
                  onClick={() => toggleDesktopMenu('imageTools')}
                  className={`flex items-center gap-1.5 text-md transition-colors h-full cursor-pointer 
                  ${activeDesktopMenu === 'imageTools' ? 'text-[#091d33]' : 'text-gray-600 hover:text-[#091d33]'}`}
                >
                  Image Tools
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDesktopMenu === 'imageTools' ? 'rotate-180' : ''}`} />
                </button>
                {/* 2 Columns since Image Tools only has 2 categories */}
                <MegaMenuDropdown data={megaMenus.imageTools} columns="2" isOpen={activeDesktopMenu === 'imageTools'} />
              </div>

              {/* Standard Links */}
              <Link to="/blog" onClick={() => setActiveDesktopMenu(null)} className="text-md text-gray-600 hover:text-[#091d33] transition-colors cursor-pointer">Blog</Link>
              <Link to="/about" onClick={() => setActiveDesktopMenu(null)} className="text-md text-gray-600 hover:text-[#091d33] transition-colors cursor-pointer">About Us</Link>
              <Link to="/contact" onClick={() => setActiveDesktopMenu(null)} className="text-md text-gray-600 hover:text-[#091d33] transition-colors cursor-pointer">Contact</Link>
            </nav>

            {/* 3. Auth Buttons (Right Aligned via ml-auto) */}
            <div className="hidden lg:flex items-center gap-4 shrink-0 ml-auto">
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-semibold">
                        {user?.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* User Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user?.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                      >
                        <DashboardIcon className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    Sign up free
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Mobile Hamburger Icon */}
            <button
              onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setActiveDesktopMenu(null); }}
              className="lg:hidden p-2 text-[#091d33] hover:text-[#0d2033] transition-colors focus:outline-none ml-auto cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE FULLSCREEN MENU --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 right-0 top-15 z-40 bg-[#091d33] flex flex-col lg:hidden"
          >
            {/* Scrollable Navigation Area */}
            <div className="overflow-y-auto px-4 py-6 flex flex-col gap-2">

              {/* Render the 3 Mega Menu Accordions */}
              {renderMobileAccordion("All Tools", "allTools", megaMenus.allTools)}
              {renderMobileAccordion("PDF Tools", "pdfTools", megaMenus.pdfTools)}
              {renderMobileAccordion("Image Tools", "imageTools", megaMenus.imageTools)}

              {/* Standard Links */}
              <Link to="/blog" className="text-lg text-white py-4 border-b border-white/10 flex justify-between cursor-pointer">Blog <ChevronRight className="w-5 h-5 opacity-50" /></Link>
              <Link to="/about" className="text-lg text-white py-4 border-b border-white/10 flex justify-between cursor-pointer">About Us <ChevronRight className="w-5 h-5 opacity-50" /></Link>
              <Link to="/contact" className="text-lg text-white py-4 border-b border-white/10 flex justify-between cursor-pointer">Contact <ChevronRight className="w-5 h-5 opacity-50" /></Link>
              <div className="pt-10 pb-50">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/dashboard"
                      className="w-full flex items-center justify-center gap-2 py-4 text-lg text-white border border-white/20 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-5 h-5 text-teal-400" /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-4 text-lg text-red-400 border border-red-500/20 bg-red-500/10 rounded-full hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="w-full py-4 text-center text-lg text-white border border-white/20 rounded-full bg-[#040f1c] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="w-full py-4 text-center text-lg font-semibold text-[#091d33] bg-teal-400 rounded-full hover:bg-teal-300 transition-colors shadow-[0_0_20px_rgba(45,212,191,0.2)] cursor-pointer"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}