function ToolHeader({title = '', description = ''}) {
  return (
    <>
      <h1 className="text-4xl md:text-5xl lg:text-6xl text-white pb-3 sm:pb-4 md:pb-5">
        {title}
      </h1>
      <p className="text-white font-light text-xl md:text-2xl mx-auto px-2">
        {description}
      </p>
    </>
  )
}

export default ToolHeader;