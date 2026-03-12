export default function Badge({ title = "" }) {
  return (
    <div className="absolute top-2 left-2 px-2 py-1 bg-sky-400 text-white text-xs rounded-full z-10">
      {title}
    </div>
  )
}