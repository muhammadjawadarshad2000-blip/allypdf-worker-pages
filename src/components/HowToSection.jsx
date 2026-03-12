import { motion } from "framer-motion"

export default function HowToSection({
  title = '',
  stepOne = '',
  stepOneDes = '',
  stepTwo = '',
  stepTwoDes = '',
  stepThree = '',
  stepThreeDes = '',
  stepFour = '',
  stepFourDes = ''
}) {
  const steps = [
    {
      step: stepOne,
      des: stepOneDes
    }, {
      step: stepTwo,
      des: stepTwoDes
    }, {
      step: stepThree,
      des: stepThreeDes
    }, {
      step: stepFour,
      des: stepFourDes
    }
  ]
  return (
    <div className="absolute -top-40 py-15 bg-gradient-to-b from-sky-100 to-white w-11/12 md:max-w-10/12 px-7 md:px-12 rounded-2xl flex flex-col gap-15">
      <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl md:font-light text-gray-800 text-center">{title}</h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {steps && steps.map((step, index) => {
          return (
            <motion.div
              key={index}
              className={`text-center bg-linear-120 from-sky-800 to-blue-950 to-70% flex flex-col justify-center items-center py-7 px-5 h-full lg:w-full m-auto rounded-2xl ${index === 0 ? "sm:w-7/10" : index === 1 ? "sm:w-8/10" : index === 2 ? "sm:w-9/10" : "w-full"}`}
            >
              <div className="w-13 h-13 bg-teal-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(45,212,191,0.15)]">
                <span className="text-white text-2xl font-extrabold">{index + 1}</span>
              </div>
              <p className="text-white text-xl font-medium pt-8">{step.step}</p>
              <p className="text-gray-100 text-md font-light pt-2">{step.des}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}