import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { forgotPassword, clearAuthError } from "../../store/slices/authSlice";
import ErrorMessage from "../ErrorMessage";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { forgotPasswordLoading, forgotPasswordSuccess, error } = useSelector(
    (state) => state.auth
  );

  const validateEmail = () => {
    if (!email.trim()) {
      setFormError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setFormError("");

    if (!validateEmail()) return;

    try {
      await dispatch(forgotPassword(email));
    } catch (err) {
      console.error("Forgot password error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#014b80] to-[#031f33] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {/* Advertisement Space */}
        <div className="mb-8 h-[90px] w-full ad">
          {/* Ad space for banners or promotional content */}
        </div>

        <div className="bg-sky-800 rounded-xl overflow-hidden w-full max-w-[600px] m-auto">
          <div className="bg-gradient-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-sky-700/50 rounded-lg transition cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-gray-100" />
              </button>
              <div>
                <h1 className="text-2xl text-white">Reset Password</h1>
                <p className="text-gray-100 text-sm mt-1">
                  Enter your email to reset your password
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!forgotPasswordSuccess ? (
              <>
                <ErrorMessage 
                  message={error?.message || formError} 
                  details={error?.details}
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-100" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formError) setFormError("");
                        }}
                        className={`block w-full pl-10 pr-3 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formError ? "border-sky-500" : "border-sky-700"}`}
                        placeholder="you@example.com"
                        disabled={forgotPasswordLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className={`w-full max-w-70 m-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg text-white bg-sky-400 hover:bg-sky-400/90 transition-all ${forgotPasswordLoading
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                      }`}
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Info Box */}
                <div className="bg-sky-900/50 rounded-lg p-4 mt-6 border border-sky-700">
                  <h4 className="text-white font-medium mb-2">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-gray-100">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                      <span>We'll send a password reset link to your email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                      <span>Click the link in the email to reset your password</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                      <span>The link will expire in 1 hour for security</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Check Your Email
                </h3>
                <p className="text-gray-100 mb-6">
                  We've sent password reset instructions to{" "}
                  <span className="font-medium text-white">{email}</span>
                </p>
                <div className="bg-sky-900/50 rounded-lg p-4 mb-6 border border-sky-700">
                  <h4 className="text-white font-medium mb-2">What to do:</h4>
                  <ul className="space-y-2 text-sm text-gray-100 text-left">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span>Check your inbox for our email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span>Click the reset link in the email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span>Set a new password for your account</span>
                    </li>
                  </ul>
                </div>
                <p className="text-gray-200 text-sm mb-6">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={handleSubmit}
                    className="text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                  >
                    resend the link
                  </button>
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full max-w-70 m-auto flex items-center justify-center px-6 py-3 bg-sky-400 hover:bg-sky-400/90 text-white rounded-lg font-medium transition cursor-pointer"
                >
                  Back to Login
                </button>
              </motion.div>
            )}

            {/* Login Link */}
            {!forgotPasswordSuccess && (
              <div className="text-center pt-6 border-t border-gray-100 mt-6">
                <p className="text-gray-100">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
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