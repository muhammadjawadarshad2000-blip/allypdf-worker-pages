import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Shield, FileOutput, Layers, ChevronRight } from 'lucide-react';
import heroBackground from '../assets/homepage-hero-background.svg';
import clouds from '../assets/homepage-background.svg';
import finalCTABackground from '../assets/final-cta-background.svg';
import HeroIllustration from '../components/HeroIllustration';
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
} from './ToolIcons';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('All');

  const categories = ['All', 'Organize PDF', 'Convert', 'Image Optimization', 'Security'];

  const allTools = [
    { name: "Merge PDF", category: "Organize PDF", desc: "Combine multiple PDFs seamlessly.", icon: MergePDFIcon, link: "/merge-pdf" },
    { name: "Split PDF", category: "Organize PDF", desc: "Extract pages or split files.", icon: SplitPDFIcon, link: "/split-pdf" },
    { name: "Delete Pages", category: "Organize PDF", desc: "Remove unwanted pages.", icon: DeletePagesIcon, link: "/delete-pages" },
    { name: "Extract Pages", category: "Organize PDF", desc: "Pull out specific pages.", icon: ExtractPagesIcon, link: "/extract-pages" },
    { name: "Rearrange", category: "Organize PDF", desc: "Reorder pages instantly.", icon: RearrangePagesIcon, link: "/rearrange" },
    { name: "Crop PDF", category: "Organize PDF", desc: "Adjust margins and sizing.", icon: CropPDFIcon, link: "/crop-pdf" },
    { name: "Rotate PDF", category: "Organize PDF", desc: "Fix page orientation.", icon: RotatePDFIcon, link: "/rotate-pdf" },
    { name: "JPG to PDF", category: "Convert", desc: "Turn JPGs into PDF docs.", icon: JpgToPDFIcon, link: "/jpg-to-pdf" },
    { name: "PNG to PDF", category: "Convert", desc: "Turn PNGs into PDF docs.", icon: PngToPDFIcon, link: "/png-to-pdf" },
    { name: "Image to PDF", category: "Convert", desc: "Convert any image format.", icon: ImageToPDFIcon, link: "/image-to-pdf" },
    { name: "HTML to PDF", category: "Convert", desc: "Capture webpages as PDFs.", icon: HtmlToPDFIcon, link: "/html-to-pdf" },
    { name: "PDF to PNG", category: "Convert", desc: "Extract high-quality PNGs.", icon: PDFToPngIcon, link: "/pdf-to-png" },
    { name: "PDF to JPG", category: "Convert", desc: "Extract high-quality JPGs.", icon: PDFToJpgIcon, link: "/pdf-to-jpg" },
    { name: "Extract Text", category: "Convert", desc: "Pull raw text from PDFs.", icon: ExtractTextIcon, link: "/extract-pdf-text" },
    { name: "Extract Images", category: "Convert", desc: "Rip all images from a PDF.", icon: ExtractImagesIcon, link: "/extract-pdf-images" },
    { name: "Convert To JPEG", category: "Convert", desc: "Convert images to JPEG.", icon: ConvertToJPGIcon, link: "/convert-to-jpg" },
    { name: "Convert To PNG", category: "Convert", desc: "Convert images to PNG.", icon: ConvertToPNGIcon, link: "/convert-to-png" },
    { name: "Convert To WebP", category: "Convert", desc: "Optimize for web performance.", icon: ConvertToWebPIcon, link: "/convert-to-webp" },
    { name: "HTML to Image", category: "Convert", desc: "Screenshot webpages fast.", icon: HtmlToImageIcon, link: "/html-to-image" },
    { name: "Compress Image", category: "Image Optimization", desc: "Reduce size, keep quality.", icon: CompressImageIcon, link: "/compress-image" },
    { name: "Crop Image", category: "Image Optimization", desc: "Trim and adjust photos.", icon: CropImageIcon, link: "/crop-image" },
    { name: "Rotate Image", category: "Image Optimization", desc: "Flip and rotate visuals.", icon: RotateImageIcon, link: "/rotate-image" },
    { name: "Resize Image", category: "Image Optimization", desc: "Change dimensions precisely.", icon: ResizeImageIcon, link: "/resize-image" },
    { name: "Protect PDF", category: "Security", desc: "Encrypt with a password.", icon: ProtectPDFIcon, link: "/protect-pdf" },
    { name: "Unlock PDF", category: "Security", desc: "Remove PDF passwords.", icon: UnlockPDFIcon, link: "/unlock-pdf" }
  ];

  const filteredTools = activeTab === 'All' ? allTools : allTools.filter(t => t.category === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#014b80] to-[#031f33]">
      {/* Hero Section */}
      <section className="overflow-hidden" style={{
        backgroundImage: `url(${heroBackground})`, backgroundSize: 'cover', backgroundPosition: "top"
      }}>
        <div className="grid lg:grid-cols-2 gap-10 px-4 pt-25 lg:pt-13 pb-10 sm:pb-13 relative z-10">

          <div className="z-10 w-full max-w-5xl pl-4 flex flex-col items-center lg:items-start justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 text-sm font-semibold mb-8 uppercase tracking-widest"
            >
              <Zap className="w-4 h-4" /> The Ultimate Media Processing Engine
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.05] mb-8"
            >
              Transform files at <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500">
                the speed of thought.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-xl text-gray-100 font-extralight max-w-2xl leading-relaxed mb-10"
            >
              A programmable, unthrottled suite of 25+ tools to merge, convert, optimize, and secure your PDFs and Images directly in your browser.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <a href="#directory" className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-[#091d33] bg-teal-400 rounded-full hover:bg-teal-300 transition-all duration-300 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)] hover:-translate-y-1">
                Open Directory
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>

          {/* Floating Hero Illustration pushed to the bottom to act as a stage */}
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
            className="relative mt-16 lg:my-auto pointer-events-none"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      {/* 2. SLEEK DIRECTORY (List style, highly scannable, breaks away from bulky cards) */}
      <section id="directory" className="bg-[#091d33] bg-no-repeat py-38 scroll-mt-10" style={{
        backgroundImage: `url(${clouds})`, backgroundSize: 'full',
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 pb-6">
            <div className="text-center md:text-left mb-5">
              <h2 className="text-3xl md:text-4xl text-white">Complete API Directory</h2>
              <p className="text-gray-100 font-light mt-2">Access all 25 endpoints and tools directly.</p>
            </div>

            {/* Clean Tab Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === category
                    ? 'bg-[#091d33] text-white'
                    : 'bg-white text-[#091d33] hover:bg-gray-100'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Scannable List View (Not Big Grid Cards) */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <motion.a
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    href={tool.link}
                    key={tool.name}
                    className="group flex items-center justify-between p-4 rounded-2xl hover:bg-linear-120 transition-colors hover:from-sky-500/50 hover:to-purple-500/50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-2 flex items-center justify-center bg-linear-120 from-sky-500/20 to-purple-500/20 rounded-lg [&>svg]:w-9 [&>svg]:h-9">
                        <Icon />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white group-hover:text-sky-200 transition-colors">
                          {tool.name}
                        </h4>
                        <p className="text-sm text-gray-100 font-light">
                          {tool.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-sky-500 transition-colors transform group-hover:translate-x-1" />
                  </motion.a>
                )
              })}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>

      {/* 3. BENTO GRID */}
      <section className="py-34 bg-gradient-to-b from-sky-50 to-white">
        <div className="mx-auto px-4">
          <div className="text-center mb-21">
            <h2 className="text-3xl md:text-5xl text-[#091d33] tracking-tight mb-4">Unmatched Capabilities</h2>
            <p className="text-lg text-gray-700">Powerful workflows designed for professionals, free for everyone.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bento Card 1: PDF Mastery (Spans 2 columns) */}
            <div className="w-14/16 sm:w-full sm:row-span-2 lg:col-span-2 lg:row-span-1 bg-linear-120 from-black to-slate-950 rounded-xl overflow-hidden p-4 md:p-8 hover:shadow-xl hover:shadow-gray-300 transition-shadow m-auto">
              <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col justify-between gap-2 items-center text-center transition-all">
                <div>
                  <Layers className="w-10 h-10 text-white mb-6 mx-auto" />
                  <h3 className="text-3xl font-semibold text-white mb-2">Document Mastery</h3>
                  <p className="text-gray-100 text-lg">Merge hundreds of pages, split chapters, rotate, crop, rearrange pages and extract data with zero quality loss.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8 [&>div>svg]:w-9 [&>div>svg]:h-9">
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><MergePDFIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><SplitPDFIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><RotatePDFIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><CropPDFIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><RearrangePagesIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><ExtractPagesIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><ExtractImagesIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><ExtractTextIcon /></div>
                </div>
              </motion.div>
            </div>

            {/* Bento Card 2: Image Optimization */}
            <div className="w-15/16 sm:w-full bg-linear-120 from-blue-300 to-orange-300/30 rounded-3xl overflow-hidden p-4 md:p-8 items-center group hover:shadow-xl hover:shadow-gray-300 transition-shadow m-auto">
               <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col justify-between gap-2 items-center text-center transition-all">
                <div>
                  <Zap className="w-10 h-10 text-blue-800 mb-6 mx-auto" />
                  <h3 className="text-3xl font-semibold text-black mb-2">Pixel Perfect</h3>
                  <p className="text-gray-800 text-lg">Compress and resize media perfectly for the web.</p>
                </div>
                <div className="flex flex-wrap gap-4 mt-8 [&>div>svg]:w-9 [&>div>svg]:h-9">
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><CompressImageIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><ResizeImageIcon /></div>
                </div>
              </motion.div>
            </div>

            {/* Bento Card 3: Security */}
            <div className="w-13/16 sm:w-full row-start-1 sm:row-start-3 lg:row-start-2 bg-linear-120 from-gray-300 to-cyan-200 rounded-xl overflow-hidden p-4 md:p-8 group hover:shadow-xl transition-all m-auto">
               <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col justify-between gap-2 items-center text-center transition-all">
                <div>
                  <Shield className="w-10 h-10 text-indigo-800 mb-6 mx-auto" />
                  <h3 className="text-3xl font-semibold text-black mb-2">Ironclad Security</h3>
                  <p className="text-gray-800 text-lg">Lock down sensitive data with 256-bit encryption.</p>
                </div>
                <div className="flex flex-wrap gap-4 mt-8 [&>div>svg]:w-9 [&>div>svg]:h-9">
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><ProtectPDFIcon /></div>
                </div>
              </motion.div>
            </div>

            {/* Bento Card 4: Universal Conversion (Spans 2 columns) */}
             <div className="sm:row-start-2 sm:row-span-2 lg:col-start-2 lg:col-span-2 lg:row-span-1  bg-slate-950 rounded-3xl overflow-hidden p-4 md:p-8 group hover:shadow-xl hover:shadow-gray-300 transition-shadow">
              <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col justify-between gap-2 items-center text-center transition-all">
                <div>
                  <FileOutput className="w-10 h-10 text-blue-100 mb-6 mx-auto" />
                  <h3 className="text-3xl font-semibold text-white mb-2">Universal Conversion</h3>
                  <p className="text-gray-100 text-lg">Translate formats instantly. From HTML to PDF, WebP to JPG, we handle the complex encodings.</p>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4 mt-8 [&>div>svg]:w-9 [&>div>svg]:h-9">
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><HtmlToPDFIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><PDFToPngIcon /></div>
                  <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center"><ConvertToWebPIcon /></div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Final CTA Section */}
      <section className="py-34 relative overflow-hidden bg-[#02034b]" style={{
        backgroundImage: `url(${finalCTABackground})`, backgroundSize: 'cover', backgroundPosition: "bottom"
      }}>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl text-white mb-6 tracking-tight"
          >
            Ready to streamline your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">document workflow?</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-100 mb-10 max-w-2xl mx-auto font-light"
          >
            Join thousands of users processing their files securely. Create a free account to save your history and access premium features.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <a 
              href="/signup" 
              className="inline-flex items-center gap-2 px-10 py-4 text-lg font-bold text-white bg-teal-500 rounded-full hover:bg-teal-400 transition-all duration-300 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] hover:-translate-y-1"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-6 text-sm text-gray-200">No credit card required • Instant access</p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}