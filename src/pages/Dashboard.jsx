import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
} from '../components/ToolIcons';
import {
  User, Mail, Calendar, LogOut, Activity, BarChart3,
  LayoutDashboard, Loader2,
} from 'lucide-react';
import heroBackground from '../assets/dashboard-hero-background.svg';
import clouds from '../assets/dashboard-background.svg';
import {
  logoutUser,
  changeCurrentPassword
} from '../store/slices/authSlice';

const TOOL_META = [
  { key: 'merge', label: 'Merge PDF', icon: MergePDFIcon, path: '/merge-pdf' },
  { key: 'split', label: 'Split PDF', icon: SplitPDFIcon, path: '/split-pdf' },
  { key: 'delete', label: 'Delete Pages', icon: DeletePagesIcon, path: '/delete-pages' },
  { key: 'extract', label: 'Extract Pages', icon: ExtractPagesIcon, path: '/extract-pages' },
  { key: 'rearrange', label: 'Rearrange', icon: RearrangePagesIcon, path: '/rearrange' },
  { key: 'protect', label: 'Protect PDF', icon: ProtectPDFIcon, path: '/protect-pdf' },
  { key: 'unlock', label: 'Unlock PDF', icon: UnlockPDFIcon, path: '/unlock-pdf' },
  { key: 'pdfToPng', label: 'PDF to PNG', icon: PDFToPngIcon, path: '/pdf-to-png' },
  { key: 'pngToPdf', label: 'PNG to PDF', icon: PngToPDFIcon, path: '/png-to-pdf' },
  { key: 'pdfToJpg', label: 'PDF to JPG', icon: PDFToJpgIcon, path: '/pdf-to-jpg' },
  { key: 'JPGToPdf', label: 'JPG to PDF', icon: JpgToPDFIcon, path: '/jpg-to-pdf' },
  { key: 'compressImage', label: 'Compress Image', icon: CompressImageIcon, path: '/compress-image' },
  { key: 'cropPdf', label: 'Crop PDF', icon: CropPDFIcon, path: '/crop-pdf' },
  { key: 'rotatePdf', label: 'Rotate PDF', icon: RotatePDFIcon, path: '/rotate-pdf' },
  { key: 'imageToPdf', label: 'Image to PDF', icon: ImageToPDFIcon, path: '/image-to-pdf' },
  { key: 'imageToJPG', label: 'Convert to JPG', icon: ConvertToJPGIcon, path: '/convert-to-jpg' },
  { key: 'imageToPng', label: 'Convert to PNG', icon: ConvertToPNGIcon, path: '/convert-to-png' },
  { key: 'imageToWebp', label: 'Convert to WebP', icon: ConvertToWebPIcon, path: '/convert-to-webp' },
  { key: 'cropImage', label: 'Crop Image', icon: CropImageIcon, path: '/crop-image' },
  { key: 'rotateImage', label: 'Rotate Image', icon: RotateImageIcon, path: '/rotate-image' },
  { key: 'resizeImage', label: 'Resize Image', icon: ResizeImageIcon, path: '/resize-image' },
  { key: 'extractText', label: 'Extract Text', icon: ExtractTextIcon, path: '/extract-pdf-text' },
  { key: 'extractImages', label: 'Extract Images', icon: ExtractImagesIcon, path: '/extract-pdf-images' },
  { key: 'htmlToImage', label: 'HTML to Image', icon: HtmlToImageIcon, path: '/html-to-image' },
  { key: 'htmlToPdf', label: 'HTML to PDF', icon: HtmlToPDFIcon, path: '/html-to-pdf/' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
// ─── Dashboard Component ────────────────────────────────────────────────────

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error } =
    useSelector((state) => state.auth);
  const dailyUsage = useSelector((state) => state.usage.dailyUsage);

  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const totalUsageToday = Object.values(dailyUsage).reduce((sum, v) => sum + v, 0);

  const recentlyUsed = TOOL_META
    .filter((t) => (dailyUsage[t.key] || 0) > 0)
    .sort((a, b) => (dailyUsage[b.key] || 0) - (dailyUsage[a.key] || 0));

  const topTools = TOOL_META
    .map((t) => ({ ...t, count: dailyUsage[t.key] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(false);
    const result = await dispatch(changeCurrentPassword(passwordData));
    if (result.meta.requestStatus === 'fulfilled') {
      setPasswordSuccess(true);
      setPasswordData({ oldPassword: '', newPassword: '' });
    }
    setPasswordLoading(false);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return (
    <div className="relative min-h-screen">
      <div
        className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-linear-to-r from-[#014b80] to-[#031f33]"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white pb-3">Dashboard</h1>
            <p className="text-white font-light text-xl md:text-2xl">
              Welcome back, {user?.fullName || 'User'}!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* ── Profile Card ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-sky-600 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-linear-to-r from-sky-600 to-blue-800 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white" />
                  <h3 className="text-white text-lg">Profile</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-teal-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.15)]">
                    <span className="text-white text-3xl font-bold">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white text-xl font-semibold">{user?.fullName || 'User'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-100 text-sm">
                    <Mail className="min-w-4 min-h-4 text-teal-400" />
                    <div className="truncate line-clamp-1">{user?.email || 'N/A'}</div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-100 text-sm">
                    <Calendar className="min-w-4 min-h-4 text-teal-400" />
                    Joined{' '}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>

                {/* Change Current Password */}
                <div className="pt-4 border-t border-sky-500/30">
                  <h4 className="text-white text-sm font-medium mb-3">Update Password</h4>
                  <form onSubmit={handlePasswordChange} className="space-y-2">
                    <input
                      type="password"
                      placeholder="Current Password"
                      className="w-full p-2 text-xs bg-sky-900 border border-sky-700 rounded text-white"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      className="w-full p-2 text-xs bg-sky-900 border border-sky-700 rounded text-white"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                    <button
                      disabled={passwordLoading}
                      className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs rounded transition flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update Password'}
                    </button>
                    {passwordSuccess && <p className="text-[10px] text-green-400 text-center">Password updated!</p>}
                    {error?.message && <p className="text-[10px] text-red-400 text-center">{error.message}</p>}
                  </form>
                </div>

                {/* Logout Button */}
                <div className="space-y-2pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full max-w-70 m-auto mb-3 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-700/80 hover:bg-red-700/70 text-white transition text-sm cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── Usage Overview ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 bg-sky-600 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-linear-to-r from-sky-600 to-blue-800 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-white" />
                  <h3 className="text-white text-lg">Today's Activity</h3>
                  <span className="text-sm text-gray-100 ml-auto">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-sky-900/50 border border-sky-700 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{totalUsageToday}</p>
                    <p className="text-gray-100 text-sm mt-1">Total Actions</p>
                  </div>
                  <div className="bg-sky-900/50 border border-sky-700 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-teal-400">{recentlyUsed.length}</p>
                    <p className="text-gray-100 text-sm mt-1">Tools Used</p>
                  </div>
                  <div className="bg-sky-900/50 border border-sky-700 rounded-lg p-4 text-center col-span-2 md:col-span-1">
                    <p className="text-3xl font-bold text-yellow-400">∞</p>
                    <p className="text-gray-100 text-sm mt-1">Daily Limit</p>
                  </div>
                </div>

                {/* Top Tools Bar Chart */}
                {topTools.some((t) => t.count > 0) ? (
                  <div>
                    <h4 className="text-white text-md mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Most Used Today
                    </h4>
                    <div className="space-y-3">
                      {topTools
                        .filter((t) => t.count > 0)
                        .map((tool) => {
                          const maxCount = topTools[0]?.count || 1;
                          const pct = Math.max((tool.count / maxCount) * 100, 8);
                          const Icon = tool.icon;
                          return (
                            <div key={tool.key} className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 ${tool.color} rounded flex items-center justify-center shrink-0`}
                              >
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-white text-sm truncate">{tool.label}</p>
                                  <p className="text-white text-sm font-medium">{tool.count}</p>
                                </div>
                                <div className="w-full bg-sky-900 rounded-full h-2">
                                  <div
                                    className="bg-sky-400 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LayoutDashboard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-100">
                      No activity yet today. Start using tools to see your stats!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           QUICK ACCESS TOOLS
         ══════════════════════════════════════════════════════════════════ */}
      <div
        className="bg-[#091d33] border-t border-gray-200 px-5 bg-no-repeat py-30"
        style={{
          backgroundImage: `url(${clouds})`,
          backgroundSize: 'full',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-10">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[45px] font-light text-white text-center">
              Quick Access Tools
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {TOOL_META.map((tool) => {
                const Icon = tool.icon;
                const count = dailyUsage[tool.key] || 0;
                return (
                  <button
                    key={tool.key}
                    onClick={() => navigate(tool.path)}
                    className="bg-linear-120 from-sky-800/70 to-blue-950/70 border border-sky-800 hover:border-sky-400/60 rounded-lg px-4 py-6 flex flex-col items-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-white text-sm text-center">{tool.label}</span>
                    {count > 0 && (
                      <span className="text-[10px] bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded-full border border-teal-700">
                        {count} today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;