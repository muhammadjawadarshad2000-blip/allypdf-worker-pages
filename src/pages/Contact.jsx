import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, User, MessageSquare, FileText, CheckCircle, AlertCircle, MapPin, Clock, } from 'lucide-react';
import FAQSection from '../components/FAQSection';
import clouds from '../assets/contactpage-background.svg'
import heroBackground from '../assets/contact-hero-background.svg'
import { contactApi } from '../api/contactApi';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Internal validation logic
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('All fields are required.');
      return;
    }

    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await contactApi.submit(formData); 
      
      setSuccess(res.message || 'Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again later.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: 'support@allypdf.com',
      description: 'We typically respond within 24 hours',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      detail: 'Mon – Fri, 9 AM – 6 PM',
      description: 'We are available during business hours',
    },
    {
      icon: MapPin,
      title: 'Location',
      detail: 'Remote Team',
      description: 'We work globally to serve you better',
    },
  ];

  const faqItems = [
    {
      question: 'How quickly will I get a response?',
      answer:
        'We aim to respond to all inquiries within 24 hours during business days.',
    },
    {
      question: 'Can I request a new feature?',
      answer:
        'Absolutely! We love hearing from our users. Use the contact form to share your feature ideas and suggestions.',
    },
    {
      question: 'Is my data safe when I contact you?',
      answer:
        'Yes. All communications are encrypted, and we never share your personal information with third parties.',
    },
    {
      question: 'Do you offer premium support?',
      answer:
        'Currently all support is free. Registered users receive priority responses.',
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Hero / Form Section */}
      <div className="px-3 md:px-4 py-3 md:py-4 transition-all duration-300 bg-no-repeat bg-linear-to-r from-[#014b80] to-[#031f33]" style={{
        backgroundImage: `url(${heroBackground})`, backgroundSize: 'cover', backgroundPosition: "center"
      }}>
        <div className="max-w-7xl mx-auto">
          {/* Advertisement Space */}
          <div className="mb-8 mx-auto h-22.5 w-full ad" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white pb-3 sm:pb-4 md:pb-5">
              Contact Us
            </h1>
            <p className="text-white font-light text-xl md:text-2xl mx-auto px-2">
              Have a question, feedback, or just want to say hello? We'd love to hear from you.
            </p>
          </motion.div>

          {/* Advertisement Space */}
          <div className="my-8 mx-auto h-22.5 w-full ad" />
        </div>
      </div>

      {/* Form Cards */}
      <div className="bg-[#091d33] border-t border-gray-200 px-5 bg-no-repeat pb-60 pt-30" style={{
        backgroundImage: `url(${clouds})`, backgroundSize: 'full',
      }} >
        <div
          className="max-w-3xl mx-auto mb-10 pb-12"
        >
          <div className="overflow-hidden">
            <div className="px-6 pb-15">
              <div className="flex items-center justify-center gap-3">
                <MessageSquare className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[45px] font-light text-white">Send Us a Message</h3>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-linear-120 from-blue-950 to-cyan-500 py-12 px-8 space-y-5 rounded-xl">
              {/* Success */}
              {success && (
                <div
                  className="flex items-center gap-2 bg-green-900/50 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm"
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {success}
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 bg-red-900/50 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name */}
              <div>
                <label className="block text-white text-lg mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-100" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-linear-120 from-blue-950 to-sky-800 border border-sky-700 text-white placeholder-gray-300 focus:outline-none focus:border-teal-400 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-white text-lg mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-100" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-linear-120 from-blue-950 to-sky-800 border border-sky-700 text-white placeholder-gray-300 focus:outline-none focus:border-teal-400 transition"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-white text-lg mb-1.5">Subject</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-100" />
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-linear-120 from-blue-950 to-sky-800 border border-sky-700 text-white placeholder-gray-300 focus:outline-none focus:border-teal-400 transition"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-white text-lg mb-1.5">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg bg-linear-120 from-blue-950 to-sky-800 border border-sky-700 text-white placeholder-gray-300 focus:outline-none focus:border-teal-400 transition resize-none"
                />
                <p className="text-gray-100 text-xs mt-1">
                  {formData.message.length}/5000 characters (min 10)
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full max-w-70 m-auto flex items-center justify-center gap-2 px-3 py-4 rounded-lg text-white font-medium bg-sky-400 hover:bg-sky-400/90 transition-all duration-200 ${isSubmitting
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="relative bg-white h-207.5 lg:h-87.5 flex items-center justify-center">
        <div className="absolute -top-40 py-15 bg-linear-to-b from-sky-100 to-white w-11/12 px-7 rounded-2xl flex flex-col gap-15">
          <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl md:font-light text-gray-800 text-center">Get in Touch</h4>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10'>
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={idx}
                  className={`text-center bg-linear-120 from-sky-800 to-blue-950 to-70% flex flex-col justify-center items-center py-7 px-5 h-full lg:w-full m-auto rounded-2xl ${idx === 0 ? "sm:w-7/10" : idx === 1 ? "sm:w-8/10" : idx === 2 ? "sm:w-9/10" : "w-full"}`}
                >
                  <div className="w-13 h-13 bg-teal-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(45,212,191,0.15)]">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-medium">{info.title}</h3>
                  <p className="text-teal-300 text-sm mb-1">{info.detail}</p>
                  <p className="text-gray-100 text-md font-light pt-2">{info.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection faqItems={faqItems} title="Contact FAQs" />
    </div>
  );
};

export default Contact;