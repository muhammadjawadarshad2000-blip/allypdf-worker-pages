import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { registerUser, clearAuthError } from "../../store/slices/authSlice";
import ErrorMessage from "../ErrorMessage";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

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

    // Clear error for this field when user starts typing
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

    const result = await dispatch(registerUser({
      name: formData.name, // The Thunk now maps this to fullName
      email: formData.email,
      password: formData.password,
    }));

    if (result.meta.requestStatus === "fulfilled") {
      navigate("/", { replace: true });
    }
  };

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
            <h1 className="text-2xl text-white">Create Account</h1>
            <p className="text-gray-100 text-sm mt-1">
              Sign up for unlimited PDF and image tools
            </p>
          </div>

          <div className="p-6">
            <ErrorMessage
              message={error?.message}
              details={error?.details}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-100" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.name ? "border-sky-500" : "border-sky-700"}`}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>
                )}
              </div>

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
                    className={`block w-full pl-10 pr-3 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.email ? "border-sky-500" : "border-sky-700"}`}
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
                    className={`block w-full pl-10 pr-10 py-3 bg-sky-900 border rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${formErrors.password ? "border-sky-500" : "border-sky-700"}`}
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

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Confirm Password
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full max-w-70 m-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg text-white bg-sky-400 hover:bg-sky-400/90 transition-all ${loading
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Features List */}
              <div className="bg-sky-900/50 rounded-lg p-4 mt-4 border border-sky-700">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  What you get:
                </h4>
                <ul className="space-y-2 text-sm text-gray-100">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>Unlimited PDF tools usage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>Unlimited image tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>Faster processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5" />
                    <span>No daily limits</span>
                  </li>
                </ul>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-gray-100">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
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