import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { resetPassword, clearAuthError } from "../../store/slices/authSlice";
import ErrorMessage from "../ErrorMessage";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [tokenValid, setTokenValid] = useState(true);

  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { resetPasswordLoading, resetPasswordSuccess, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const validateForm = () => {
    const errors = {};

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!token) {
      setTokenValid(false);
      return;
    }

    try {
      const result = await dispatch(
        resetPassword({
          token,
          newPassword: formData.password,
        })
      );

      if (result.meta.requestStatus === "fulfilled") {
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      if (err?.status === 400 || err?.status === 410) {
        setTokenValid(false);
      }
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-linear-to-r from-[#014b80] to-[#031f33] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="bg-sky-800 rounded-xl overflow-hidden w-full max-w-150 m-auto">
            <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-100">
              <h1 className="text-2xl text-white">
                Invalid or Expired Link
              </h1>
            </div>
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-sky-900/50 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-10 w-10 text-sky-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Reset Link Invalid
              </h3>
              <p className="text-gray-100 mb-6">
                This password reset link is invalid or has expired. Please request a new reset link.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block px-6 py-3 bg-sky-400 hover:bg-sky-400/90 text-white rounded-lg font-medium transition cursor-pointer"
              >
                Request New Link
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-[#014b80] to-[#031f33] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {/* Advertisement Space */}
        <div className="mb-8 h-22.5 w-full ad">
          {/* Ad space for banners or promotional content */}
        </div>

        <div className="bg-sky-800 rounded-xl overflow-hidden w-full max-w-150 m-auto">
          <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-100">
            <h1 className="text-2xl text-white">
              Set New Password
            </h1>
            <p className="text-gray-100 text-sm mt-1">
              Create a new password for your account
            </p>
          </div>

          <div className="p-6">
            {!resetPasswordSuccess ? (
              <>
                <ErrorMessage 
                  message={error?.message} 
                  details={error?.details}
                />

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-100" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.password ? "border-sky-500" : "border-sky-700"}`}
                        placeholder="••••••••"
                        disabled={resetPasswordLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={resetPasswordLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-100 hover:text-gray-300 cursor-pointer" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-100 hover:text-gray-300 cursor-pointer" />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-400">{formErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-100" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.confirmPassword ? "border-sky-500" : "border-sky-700"}`}
                        placeholder="••••••••"
                        disabled={resetPasswordLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={resetPasswordLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-100 hover:text-gray-300 cursor-pointer" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-100 hover:text-gray-300 cursor-pointer" />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{formErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-sky-900/50 rounded-lg p-4 border border-sky-700">
                    <h4 className="text-white font-medium mb-2 text-sm">
                      Password Requirements:
                    </h4>
                    <ul className="space-y-1 text-xs text-gray-100">
                      <li className={`flex items-center gap-2 ${formData.password.length >= 6 ? "text-green-400" : ""}`}>
                        <div className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? "bg-green-400" : "bg-sky-700"}`} />
                        <span>At least 6 characters</span>
                      </li>
                      <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? "text-green-400" : ""}`}>
                        <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? "bg-green-400" : "bg-sky-700"}`} />
                        <span>One uppercase letter</span>
                      </li>
                      <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? "text-green-400" : ""}`}>
                        <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(formData.password) ? "bg-green-400" : "bg-sky-700"}`} />
                        <span>One lowercase letter</span>
                      </li>
                      <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? "text-green-400" : ""}`}>
                        <div className={`w-2 h-2 rounded-full ${/\d/.test(formData.password) ? "bg-green-400" : "bg-sky-700"}`} />
                        <span>One number</span>
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={resetPasswordLoading}
                    className={`w-full max-w-70 m-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg text-white bg-sky-400 hover:bg-sky-400/90 transition-all ${resetPasswordLoading
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                      }`}
                  >
                    {resetPasswordLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Resetting...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
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
                  Password Reset!
                </h3>
                <p className="text-gray-100 mb-6">
                  Your password has been successfully reset. You will be redirected to login in a few seconds.
                </p>
                <div className="bg-sky-900/50 rounded-lg p-4 mb-6 border border-sky-700">
                  <h4 className="text-white font-medium mb-2">Next Steps:</h4>
                  <ul className="space-y-2 text-sm text-gray-100 text-left">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span>Use your new password to sign in</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span>All your tools and settings are preserved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span>Continue using unlimited PDF and image tools</span>
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login"
                  className="w-full max-w-70 m-auto flex items-center justify-center px-6 py-3 bg-sky-400 hover:bg-sky-400/90 text-white rounded-lg font-medium transition cursor-pointer"
                >
                  Go to Login
                </Link>
              </motion.div>
            )}

            {/* Back to Login Link */}
            {!resetPasswordSuccess && (
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
        <div className="mt-8 h-22.5 w-full ad">
          {/* Ad space for banners or promotional content */}
        </div>
      </motion.div>
    </div>
  );
}