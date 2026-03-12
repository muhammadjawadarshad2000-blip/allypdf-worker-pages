import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { DownloadButton, StartOverButton } from "./Buttons";

export default function ResultSection({
  title = "Process Complete!",
  subtitle = null,
  summaryItems = [],
  summaryTitle = "Process Summary",
  onDownload,
  onStartOver,
  downloadButtonText = "Download",
  startOverButtonText = "Start Over",
  theme = "blue",
  icon: Icon = CheckCircle,
  iconColor = "text-green-400",
}) {
  // Theme colors mapping
  const themeConfig = {
    blue: {
      bg: "bg-sky-800",
      gradientFrom: "from-sky-800",
      gradientTo: "to-blue-950",
      border: "border-gray-200",
    },
    // Add more themes as needed
  };

  const currentTheme = themeConfig[theme] || themeConfig.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6"
    >
      <div className={`${currentTheme.bg} rounded-xl shadow-lg overflow-hidden`}>
        {/* Header Section */}
        <div
          className={`bg-gradient-to-r ${currentTheme.gradientFrom} ${currentTheme.gradientTo} px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b ${currentTheme.border}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {Icon && <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />}
              <h3 className="text-white text-lg sm:text-xl">
                {title}
              </h3>
              {subtitle && (
                <span className="text-xs sm:text-sm text-gray-100">
                  {subtitle}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center md:justify-end sm:min-w-110 sm:gap-4 mt-2 sm:mt-0">
              <DownloadButton
                handleDownload={onDownload}
                title={downloadButtonText}
              />
              <StartOverButton
                handleRemoveResult={onStartOver}
                text={startOverButtonText}
              />
            </div>
          </div>
        </div>

        {/* Summary Content */}
        <div className="p-4 sm:py-10 sm:px-4">
          <div className="">
            <h4 className="text-xl sm:text-2xl font-light text-white mb-8 text-center">
              {summaryTitle}
            </h4>
            <div className="flex flex-wrap justify-between gap-4">
              {summaryItems.map((item, index) => (
                <div
                  key={index}
                  className="text-center flex-1 min-w-[150px] max-w-[200px] m-auto"
                >
                  <p
                    className={`text-lg sm:text-xl font-medium text-${item.valueColor}`}
                  >
                    {item.value}
                  </p>
                  <p className="text-md text-gray-100">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}