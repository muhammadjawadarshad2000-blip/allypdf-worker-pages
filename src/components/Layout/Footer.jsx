import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AllyPdfLogo } from '../logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Categorized Directory Links
  const footerLinks = {
    pdfTools: [
      { name: "Merge PDF", path: "/merge-pdf" },
      { name: "Split PDF", path: "/split-pdf" },
      { name: "Rearrange Pages", path: "/rearrange" },
      { name: "Protect PDF", path: "/protect-pdf" },
      { name: "Unlock PDF", path: "/unlock-pdf" },
    ],
    imageTools: [
      { name: "Compress Image", path: "/compress-image" },
      { name: "Resize Image", path: "/resize-image" },
      { name: "Convert to WebP", path: "/convert-to-webp" },
      { name: "HTML to Image", path: "/html-to-image" },
      { name: "Crop Image", path: "/crop-image" },
    ],
    resources: [
      { name: "Blog", path: "/blog" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "Login", path: "/login" },
      { name: "Sign Up", path: "/signup" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Contact Support", path: "/contact" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
    ]
  };

  return (
    <footer className="bg-[#040f1c] border-t border-white/10 pt-16 pb-8 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-12 mb-16">
          
          {/* Brand & Info Column (Spans 2 cols on lg screens) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col pr-4 lg:pr-12">
            <Link to="/" className="flex items-center h-10 mb-6 w-fit">
              <AllyPdfLogo width={150} height={30} strokeWidth={3} fill='#ffffff' />
            </Link>
            
            <p className="text-gray-400 font-light leading-relaxed mb-8 max-w-sm">
              The ultimate media processing engine. Transform, optimize, and secure your files instantly directly within your browser. 
            </p>

            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium w-fit backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <span>256-bit Encrypted Processing</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold tracking-wider mb-5">PDF Tools</h4>
            <ul className="space-y-3">
              {footerLinks.pdfTools.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-gray-400 hover:text-teal-400 text-sm font-medium transition-colors hover:translate-x-1 inline-block transform duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold tracking-wider mb-5">Image Tools</h4>
            <ul className="space-y-3">
              {footerLinks.imageTools.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-gray-400 hover:text-teal-400 text-sm font-medium transition-colors hover:translate-x-1 inline-block transform duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold tracking-wider mb-5">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-gray-400 hover:text-teal-400 text-sm font-medium transition-colors hover:translate-x-1 inline-block transform duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold tracking-wider mb-5">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-gray-400 hover:text-teal-400 text-sm font-medium transition-colors hover:translate-x-1 inline-block transform duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar Section */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <p className="text-gray-500 text-sm text-center md:text-left">
            &copy; {currentYear} Allypdf. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {/* System Status Indicator */}
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="relative flex items-center justify-center w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </div>
              <span className="text-sm text-gray-400 group-hover:text-teal-400 transition-colors font-medium">
                All systems operational
              </span>
            </div>

          </div>

        </div>

      </div>
    </footer>
  );
}