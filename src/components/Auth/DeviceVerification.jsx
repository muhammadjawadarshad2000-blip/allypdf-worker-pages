import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { ShieldCheck, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import {
  verifyDeviceOTP,
  resendDeviceOTP,
  clearAuthError,
  clearVerificationState,
} from "../../store/slices/authSlice";
import ErrorMessage from "../ErrorMessage";

export default function DeviceVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    verificationEmail,
    deviceHash,
    requiresVerification,
    verifyLoading,
    verifyError,
    resendLoading,
    resendSuccess,
    resendError,
  } = useSelector((state) => state.auth);

  // Redirect if no verification pending
  useEffect(() => {
    if (!requiresVerification || !verificationEmail || !deviceHash) {
      navigate("/login", { replace: true });
    }
  }, [requiresVerification, verificationEmail, deviceHash, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Set initial cooldown on mount
  useEffect(() => {
    setCooldown(60);
  }, []);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const code = newOtp.join("");
      if (code.length === 6) {
        handleSubmit(code);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if all 6 digits pasted
    if (pasted.length === 6) {
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (code = null) => {
    dispatch(clearAuthError());
    const verificationCode = code || otp.join("");

    if (verificationCode.length !== 6) return;

    try {
      const result = await dispatch(
        verifyDeviceOTP({
          email: verificationEmail,
          code: verificationCode,
          deviceHash,
        })
      );

      if (result.meta.requestStatus === "fulfilled") {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    dispatch(clearAuthError());

    try {
      const result = await dispatch(
        resendDeviceOTP({
          email: verificationEmail,
          deviceHash,
        })
      );

      if (result.meta.requestStatus === "fulfilled") {
        setCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Resend error:", err);
    }
  };

  const handleBack = () => {
    dispatch(clearVerificationState());
    navigate("/login", { replace: true });
  };

  const maskedEmail = verificationEmail
    ? verificationEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "";

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
          {/* Header */}
          <div className="bg-linear-to-r from-sky-800 to-blue-950 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-sky-700/50 rounded-lg transition cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-gray-100" />
              </button>
              <div>
                <h1 className="text-2xl text-white flex items-center gap-2">
                  <ShieldCheck className="w-7 h-7 text-teal-400" />
                  Verify Your Device
                </h1>
                <p className="text-gray-100 text-sm mt-1">
                  Looks like you are logging in from a new device — enter the code sent to your email to confirm it's you.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <ErrorMessage
              message={verifyError?.message || resendError?.message}
              details={verifyError?.details || resendError?.details}
            />

            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm text-center">
                  ✅ A new verification code has been sent to your email.
                </p>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-9 w-9 text-teal-400" />
              </div>
              <p className="text-gray-100 text-sm">
                We sent a 6-digit code to{" "}
                <span className="text-white font-medium">{maskedEmail}</span>
              </p>
            </div>

            {/* OTP Inputs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-6"
            >
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={verifyLoading}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 bg-sky-900 text-white outline-none transition-all
                      ${digit ? "border-teal-400" : "border-sky-700"}
                      focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30
                      disabled:opacity-50`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={verifyLoading || otp.join("").length !== 6}
                className={`w-full max-w-70 m-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg text-white transition-all
                  ${
                    otp.join("").length === 6
                      ? "bg-teal-500 hover:bg-teal-600 cursor-pointer"
                      : "bg-sky-700 cursor-not-allowed"
                  }
                  ${verifyLoading ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="text-center mt-6">
              <p className="text-gray-100 text-sm">
                Didn't receive the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-sky-400">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-teal-400 hover:text-teal-300 font-medium cursor-pointer inline-flex items-center gap-1"
                  >
                    {resendLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Resend Code
                  </button>
                )}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-sky-900/50 rounded-lg p-4 mt-6 border border-sky-700">
              <h4 className="text-white font-medium mb-2">Why am I seeing this?</h4>
              <ul className="space-y-2 text-sm text-gray-100">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                  <span>We detected a login from a new or unrecognized device</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                  <span>A 6-digit code was emailed to verify it's you</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                  <span>Once verified, this device will be trusted for future logins</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                  <span>The code expires in 10 minutes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ad Space */}
        <div className="mt-8 h-22.5 w-full ad" />
      </motion.div>
    </div>
  );
}