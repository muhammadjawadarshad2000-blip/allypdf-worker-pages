import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, CheckCircle } from "lucide-react";
import { loginUser, clearAuthError, clearVerificationState } from "../../store/slices/authSlice";
import ErrorMessage from "../ErrorMessage";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, requiresVerification, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Clear any leftover verification state on mount
  useEffect(() => {
    dispatch(clearVerificationState());
  }, [dispatch]);

  // Redirect to OTP page when verification is required
  useEffect(() => {
    if (requiresVerification) {
      navigate("/verify-device", { state: { from: location.state?.from } });
    }
  }, [requiresVerification, navigate, location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      errors.password = "Password is required";
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

    const result = await dispatch(
      loginUser({
        email: formData.email,
        password: formData.password,
        // Pass browser info as deviceName if desired
        deviceName: navigator.userAgent.split(') ')[1]?.split(' ')[0] || "Web Browser"
      })
    );

    if (result.meta.requestStatus === "fulfilled") {
      // If backend returned 202 (requiresVerification), the slice updates state.
      // The existing useEffect for [requiresVerification] will trigger the navigate.
      if (!result.payload.statusCode === 202) {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-[#014b80] to-[#031f33] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {/* Ad Space */}
        <div className="mb-8 h-22.5 w-full ad" />

        <div className="bg-sky-800 rounded-xl overflow-hidden w-full max-w-150 m-auto">
          <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-100">
            <h1 className="text-2xl text-white">Welcome Back</h1>
            <p className="text-gray-100 text-sm mt-1">
              Sign in to access unlimited tools
            </p>
          </div>

          <div className="p-6">
            <ErrorMessage
              message={error?.message}
              details={error?.details}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.email ? "border-sky-500" : "border-sky-700"
                      }`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Password
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
                    className={`block w-full pl-10 pr-10 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.password ? "border-sky-500" : "border-sky-700"
                      }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
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

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-red-400 hover:text-red-300 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full max-w-70 m-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg text-white bg-sky-400 hover:bg-sky-400/90 transition-all ${loading ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Logging In...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Features List */}
              <div className="bg-sky-900/50 rounded-lg p-4 mt-4 border border-sky-700">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Login to unlock:
                </h4>
                <ul className="space-y-2 text-sm text-gray-100">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>Unlimited PDF processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>Unlimited image compression</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>No daily usage limits</span>
                  </li>
                </ul>
              </div>

              {/* Signup Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-gray-100">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Ad Space */}
        <div className="mt-8 h-22.5 w-full ad" />
      </motion.div>
    </div>
  );
}