import clouds from '../assets/background-image.svg'

const WhyChooseSection = ({
  freeTitle, 
  description, 
  imageUrl,
  imageAlt = "Tool illustration",
  title,
  subtitle,
  reasons = [],
  iconColorClasses = []
}) => {
  return (
    <div className="bg-[#091d33] border-t border-gray-200 px-2 bg-no-repeat pb-50" style={{
      backgroundImage: `url(${clouds})`, backgroundSize: 'full',
    }}>
      <div className="mx-auto px-4 py-12">
        <div className="md:flex justify-center gap-7">
          <div className='mx-auto hidden md:flex md:min-w-40 ad'></div>

          <div className="grid gap-12 my-12 md:max-w-full">
            {/* Free Tool Section */}
            <div className='flex flex-col justify-center items-center lg:flex-row gap-5 p-10 my-20 bg-linear-120 from-blue-950 to-cyan-500 rounded-2xl'>
              <div className='flex flex-col flex-1 lg:flex-1/2'>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl text-white">{freeTitle}</h3>
                </div>
                <p className="text-md font-light text-white my-3">
                  {description}
                </p>
              </div>

              <div className='flex flex-col flex-1 lg:flex-1/2'>
                <img src={imageUrl} alt={imageAlt} className="w-full h-auto" />
              </div>
            </div>

            {/* Why to choose our Tool Section */}
            <div className='pb-15'>
              <div className="flex flex-col justify-center items-center gap-5 py-19">
                <h3 className="text-3xl md:text-4xl lg:text-[45px] font-light text-white text-center">
                  {title}
                </h3>
                <p className="text-[18px] md:text-xl lg:text-[23px] font-light text-white text-center">
                  {subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
                {reasons.map((reason, index) => {
                  const Icon = reason.icon;
                  const colorClass = iconColorClasses[index] || "bg-sky-500";

                  return (
                    <div key={index} className="flex flex-col items-center gap-6">
                      <div className="max-w-20 max-h-20 flex items-center justify-center">
                        <div className={`rounded-md ${colorClass} w-16 h-16 flex items-center justify-center`}>
                          <Icon className="w-11 h-11 text-white" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center">
                        <h4 className="text-white text-xl md:text-2xl font-semibold mb-2">
                          {reason.title}
                        </h4>
                        <p className="text-gray-100 text-md md:text-[16px]">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='mx-auto hidden md:flex md:min-w-40 ad'></div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseSection;