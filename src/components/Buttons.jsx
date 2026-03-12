import { Download, Trash2, X, Loader2, CircleArrowRight } from "lucide-react"

function SelectButton({
  title = "Select files",
  isLimitReached,
  fileInputRef,
}) {
  return (
    <button
      onClick={() => !isLimitReached && fileInputRef.current?.click()}
      disabled={isLimitReached}
      className={`w-full max-w-70 px-3 py-4 text-white rounded-lg text-xl md:text-2xl font-semibold bg-sky-400 hover:bg-sky-400/90 transition-all ${isLimitReached
        ? 'cursor-not-allowed'
        : 'cursor-pointer'
        }`}
    >
      {title}
    </button>
  )
}

function ChangeButton({ handleAddMoreFiles, title = "Change File" }) {
  return (
    <button
      onClick={handleAddMoreFiles}
      className="flex-1 sm:flex-none px-4 py-2 bg-sky-400 hover:bg-sky-400/90 text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm cursor-pointer"
    >
      {title}
    </button>
  )
}

function RemoveButton({ handleRemoveFile, title = "Remove" }) {
  return (
    <button
      onClick={handleRemoveFile}
      className="flex-1 sm:flex-none px-4 py-2 bg-red-800/80 hover:bg-red-800/70 text-white rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-2 text-sm cursor-pointer"
    >
      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
      {title}
    </button>
  )
}

function XDeleteButton({ handleRemove, title = "Remove" }) {
  return (
    <button
      onClick={handleRemove}
      className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-gray-800/80 hover:bg-red-500 text-white transition-colors cursor-pointer"
      title={title}
      type="button"
    >
      <X className="w-4 h-4" />
    </button>
  )
}

function ActionButton({
  disabled,
  handleAction,
  className,
  isProcessing,
  process = "Processing...",
  title = "Process"
}) {
  return (
      <button
        disabled={disabled}
        onClick={handleAction}
        className={`fixed bottom-2 self-center flex items-center justify-center gap-2 w-full max-w-70 p-3 rounded-xl font-semibold bg-sky-400 hover:bg-sky-400/90 text-xl md:text-2xl text-white transition-all mx-auto z-20 ${className}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{process}</span>
          </>
        ) : (
          <>
            <span>{title}</span>
            <CircleArrowRight className='w-5 h-5 sm:w-6 sm:h-6' />
          </>
        )}
      </button>
  )
}

function DownloadButton({
  title = "Download",
  handleDownload,
}) {
  return (
    <button
      onClick={handleDownload}
      className="flex px-3 sm:px-5 py-2 bg-linear-120 from-sky-600 to-green-600 w-full max-w-50 hover:to-bg-green-500 hover:from-sky-500 text-white rounded-lg font-medium transition-all items-center justify-center gap-1 sm:gap-2 text-md cursor-pointer"
    >
      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
      {title}
    </button>
  )
}

function StartOverButton({ handleRemoveResult }) {
  return (
    <button
      onClick={handleRemoveResult}
      className="flex px-3 sm:px-5 py-2 bg-cyan-700 hover:bg-cyan-600 w-full max-w-45 text-white rounded-lg font-medium transition-all items-center justify-center gap-1 sm:gap-2 text-md cursor-pointer"
    >
      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
      Start Over
    </button>
  )
}


export {
  SelectButton,
  ChangeButton,
  RemoveButton,
  XDeleteButton,
  ActionButton,
  DownloadButton,
  StartOverButton
}