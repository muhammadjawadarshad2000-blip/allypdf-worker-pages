import { motion } from 'framer-motion';
import {
  Shield, Zap, Heart, Globe, Users, Target, Award, Code,
} from 'lucide-react';
import FAQSection from '../components/FAQSection';
import heroBackground from '../assets/about-hero-background.svg';
import clouds from '../assets/aboutpage-background.svg';

const About = () => {
  const stats = [
    { value: '1M+', label: 'PDFs Processed', icon: Award },
    { value: '100K+', label: 'Happy Users', icon: Users },
    { value: '25+', label: 'Free Tools', icon: Code },
    { value: '99.9%', label: 'Uptime', icon: Zap },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Privacy First',
      description:
        'Your files are processed locally in your browser. We never store, read, or share your documents. Your privacy is our top priority.',
      color: 'bg-sky-500',
    },
    {
      icon: Heart,
      title: 'Free Forever',
      description:
        'We believe powerful PDF tools should be accessible to everyone. No hidden fees, no subscriptions, no watermarks — ever.',
      color: 'bg-pink-500',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Browser-based processing means zero uploads to slow servers. Your files are converted and merged in seconds, right on your device.',
      color: 'bg-yellow-500',
    },
    {
      icon: Globe,
      title: 'Accessible Anywhere',
      description:
        'Works on any device with a modern browser — desktop, tablet, or mobile. No software installation required.',
      color: 'bg-emerald-500',
    },
    {
      icon: Target,
      title: 'User-Focused',
      description:
        'Every feature is designed with you in mind. Clean interfaces, intuitive workflows, and tools that solve real problems.',
      color: 'bg-violet-500',
    },
    {
      icon: Code,
      title: 'Always Improving',
      description:
        'We continuously add new tools and refine existing ones based on your feedback. Your suggestions drive our roadmap.',
      color: 'bg-cyan-500',
    },
  ];

  const teamHighlights = [
    'Passionate about open and free web tools',
    'Dedicated to user privacy and data security',
    'Committed to building the best PDF toolkit',
    'Responsive to community feedback and feature requests',
  ];

  const faqItems = [
    {
      question: 'Is Allypdf really free?',
      answer:
        'Yes! Allypdf is completely free to use. There are no hidden charges, premium tiers, or watermarks. All tools are available to everyone.',
    },
    {
      question: 'Do you store my files?',
      answer:
        'No. All file processing happens directly in your browser. Your files never leave your device, ensuring complete privacy and security.',
    },
    {
      question: 'How can I suggest a new feature?',
      answer:
        'We love hearing from our users! Head over to our Contact page and send us your ideas. We review every suggestion.',
    },
    {
      question: 'What technologies power Allypdf?',
      answer:
        'Allypdf is built with React, modern JavaScript, and browser-native PDF processing libraries. All heavy lifting happens client-side for speed and privacy.',
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <div className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-linear-to-r from-[#014b80] to-[#031f33]" style={{
        backgroundImage: `url(${heroBackground})`, backgroundSize: 'cover', backgroundPosition: "top"
      }}>
        <div className="max-w-7xl mx-auto">
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-22.5 w-full ad"></div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white pb-3 sm:pb-4 md:pb-5">
              About Allypdf
            </h1>
            <p className="text-white font-light text-xl md:text-2xl mx-auto px-2 max-w-3xl">
              We're on a mission to make PDF and image tools free, private, and accessible to everyone.
            </p>
          </motion.div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad"></div>
        </div>
      </div>

      <div className="bg-[#091d33] border-t border-gray-200 px-2 bg-no-repeat pt-30 pb-60" style={{
        backgroundImage: `url(${clouds})`, backgroundSize: 'full', backgroundPositionY: '-5px'
      }}>
        <div className='w-full flex flex-col gap-40'>
          {/* Our Story */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:max-w-2/3 md:self-start"
          >
            <div className="overflow-hidden text-center">
              <div className="px-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Heart className="w-5 h-5 sm:w-9 sm:h-9 text-white" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[45px] font-light text-white">Our Story</h3>
                </div>
              </div>
              <div className="px-6 md:px-8 space-y-4">
                <p className="text-gray-100 text-[16px] font-light leading-relaxed">
                  Allypdf was born from a simple frustration — most online PDF tools are slow, riddled with ads, and upload your private documents to unknown servers. We knew there had to be a better way.
                </p>
                <p className="text-gray-100 text-[16px] font-light leading-relaxed">
                  By leveraging modern browser capabilities, we built a suite of tools that process everything locally on your device. No uploads. No waiting. No privacy concerns. Just fast, reliable PDF and image tools that work.
                </p>
                <p className="text-gray-100 text-[16px] font-light leading-relaxed">
                  Today, Allypdf serves hundreds of thousands of users worldwide with 25+ free tools — from merging and splitting PDFs to converting images and extracting content. And we're just getting started.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Team Highlights */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:max-w-2/3 md:self-end"
          >
            <div className="overflow-hidden text-center">
              <div className="px-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Users className="w-5 h-5 sm:w-9 sm:h-9 text-white" />
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[45px] font-light text-white">Our Team</h3>
                </div>
              </div>
              <div className="px-6 md:px-8">
                <p className="text-gray-100 text-[16px] font-light leading-relaxed mb-6">
                  We're a small, remote team of developers, designers, and PDF enthusiasts who are:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamHighlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-sky-900/50 border border-sky-700 rounded-lg px-4 py-3"
                    >
                      <div className="w-2 h-2 bg-teal-400 rounded-full shrink-0" />
                      <p className="text-gray-100 text-[14px]">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values Grid */}
        <div className='pt-20 max-w-6xl mx-auto px-6'>
          <div className="flex flex-col justify-center items-center gap-25 py-19">
            <h3 className="text-3xl md:text-4xl lg:text-[45px] font-light text-white text-center">
              What We Stand For
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
              {values.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className={`w-14 h-14 ${value.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-white text-xl md:text-2xl font-semibold mb-2">{value.title}</h4>
                    <p className="text-gray-100 text-md md:text-[16px]">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative bg-white h-262.5 sm:h-150 lg:h-82.5 flex items-center justify-center">
        <div className="absolute -top-40 py-15 bg-linear-to-b from-sky-100 to-white w-11/12 px-7 rounded-2xl flex flex-col gap-15">
          <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl md:font-light text-gray-800 text-center">Our Impact in Numbers</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={`text-center bg-linear-120 from-sky-800 to-blue-950 to-70% flex flex-col justify-center items-center py-7 px-5 h-full sm:w-full m-auto rounded-2xl ${idx === 0 ? "w-7/10" : idx === 1 ? "w-8/10" : idx === 2 ? "w-9/10" : "w-full"}`}
                >
                  <div className="w-13 h-13 bg-teal-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(45,212,191,0.15)]">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-white text-xl font-medium pt-8">{stat.value}</p>
                  <p className="text-gray-100 text-md font-light pt-2">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection faqItems={faqItems} title="About Allypdf — FAQs" />
    </div>
  );
};

export default About;