import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, HardDrive, Info, Share2, Cookie, UserCheck } from "lucide-react";

export default function PrivacyPolicy() {
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
              <ShieldCheck className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-gray-200 text-sm mt-1">
                Last updated: November 2025
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-10 text-gray-100 space-y-8">
            
            {/* Highlighted Section: Local Processing */}
            <section className="bg-sky-900/50 rounded-lg p-6 border border-sky-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-sky-400" /> 
                1. 100% Local File Processing (Zero Data Retention)
              </h2>
              <p className="mb-4 text-sm md:text-base text-gray-200 leading-relaxed">
                Your privacy is absolute. <strong>We do not store, host, or upload your files to any server.</strong> 
              </p>
              <ul className="space-y-3 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>All PDF and image manipulations (merging, splitting, converting, etc.) are executed entirely locally within your device's web browser using client-side technologies.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>Your files never leave your computer or mobile device.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span>Because we never receive your files, there is no risk of them being accessed, leaked, or stolen from our servers.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                2. Information We Do Collect
              </h2>
              <p className="mb-4 text-sm md:text-base leading-relaxed">
                Since we do not collect your files, we only collect minimal information necessary to operate your account and the platform:
              </p>
              <ul className="space-y-2 text-sm md:text-base pl-2">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span><strong>Account Information:</strong> If you choose to register, we collect your email address and name.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span><strong>Technical Information:</strong> Standard data such as IP address, browser type, and device information to ensure platform compatibility.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <span><strong>Usage Data:</strong> Anonymous analytics on which tools are used most frequently (e.g., "Merge PDF clicked 100 times"), without attaching this to your personal identity.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-sky-400" />
                3. How We Use & Share Your Information
              </h2>
              <p className="mb-4 text-sm md:text-base leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. The minimal data we collect is used strictly for:
              </p>
              <ul className="space-y-2 text-sm md:text-base pl-2">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" /> 
                  <span>Providing account-specific features like usage dashboards and histories.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" /> 
                  <span>Communicating with you about important service updates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" /> 
                  <span>Complying with legal obligations or court orders regarding your account data (remember, we never have access to your files).</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Cookie className="w-5 h-5 text-sky-400" />
                4. Cookies & Tracking
              </h2>
              <p className="text-sm md:text-base leading-relaxed">
                We use cookies and similar technologies primarily to maintain your login session and remember your theme preferences. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-400" />
                5. Your Rights
              </h2>
              <p className="mb-4 text-sm md:text-base leading-relaxed">
                You have complete control over your account data. You have the right to:
              </p>
              <ul className="space-y-2 text-sm md:text-base pl-2">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" /> 
                  <span>Access and download your personal account data.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" /> 
                  <span>Correct inaccurate personal information.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" /> 
                  <span>Request immediate deletion of your account and associated data.</span>
                </li>
              </ul>
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