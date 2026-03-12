import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Settings, ShieldAlert, Copyright, AlertCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#014b80] to-[#031f33] py-16 px-4 flex items-center justify-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Advertisement Space */}
        <div className="mb-8 h-[90px] w-full ad">
          {/* Ad space for banners or promotional content */}
        </div>

        <div className="bg-sky-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-800 to-blue-950 px-6 md:px-10 py-8 border-b border-sky-700/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-sky-900/50 rounded-lg border border-sky-700">
              <FileText className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Terms of Service
              </h1>
              <p className="text-gray-200 text-sm mt-1">
                Last updated: November 2025
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-10 text-gray-100 space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-sm md:text-base leading-relaxed">
                By accessing and using Allypdf ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            {/* Highlighted Section: Local Processing */}
            <section className="bg-sky-900/50 rounded-lg p-6 border border-sky-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" /> 
                2. Local Client-Side Execution
              </h2>
              <p className="mb-4 text-sm md:text-base text-gray-200 leading-relaxed">
                Allypdf operates uniquely compared to traditional cloud tools:
              </p>
              <ul className="space-y-3 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>The Service provides software tools that run strictly in your web browser.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>We do not upload, host, transmit, or store the files you process. All processing power is drawn from your local device.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>Because execution is local, the speed and capability of the Service are directly dependent on your hardware and browser capabilities.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Copyright className="w-5 h-5 text-sky-400" />
                3. Intellectual Property & Content Ownership
              </h2>
              <p className="mb-4 text-sm md:text-base leading-relaxed">
                <strong>You retain 100% complete ownership of your files.</strong> Because files are processed entirely locally on your device, we never receive access to them. Therefore, we do not require, ask for, nor claim any license to use, reproduce, modify, or distribute your content.
              </p>
              <p className="text-sm md:text-base leading-relaxed">
                Allypdf's code, trademarks, logos, and service layouts are our property and may not be copied or reverse-engineered without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-sky-400" />
                4. User Accounts & Acceptable Use
              </h2>
              <p className="mb-4 text-sm md:text-base leading-relaxed">
                When you create an account with us to track usage or access premium limits, you must provide accurate information. You agree not to use the Service to:
              </p>
              <ul className="space-y-2 text-sm md:text-base pl-2">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>Attempt to gain unauthorized access to our authentication servers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>Automate excessive requests to our APIs that may impact service performance for other users.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>Reverse engineer or attempt to extract the source code of our local processing engine.</span>
                </li>
              </ul>
            </section>

            <section className="bg-blue-950/40 rounded-lg p-5 border border-sky-800">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-sky-400" />
                5. Disclaimer of Warranties
              </h2>
              <p className="text-sm uppercase tracking-wide font-medium text-gray-300 leading-relaxed">
                The service is provided "as is" and "as available" without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section className="bg-blue-950/40 rounded-lg p-5 border border-sky-800">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-sky-400" />
                6. Limitation of Liability
              </h2>
              <p className="text-sm uppercase tracking-wide font-medium text-gray-300 leading-relaxed">
                To the fullest extent permitted by law, Allypdf shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">
                7. Termination & Changes to Terms
              </h2>
              <p className="mb-4 text-sm md:text-base leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
              <p className="text-sm md:text-base leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
              </p>
            </section>

            {/* Back to Home Link */}
            <div className="text-center pt-6 border-t border-sky-700/50 mt-10">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
            
          </div>
        </div>

        {/* Advertisement Space */}
        <div className="mt-8 h-[90px] w-full ad">
          {/* Ad space for banners or promotional content */}
        </div>
      </motion.div>
    </div>
  );
}