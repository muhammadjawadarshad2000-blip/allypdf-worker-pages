import { useState } from "react";

export default function FAQSection({ faqItems, title = "FAQs" }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="bg-gray-100 py-22">
      <h3 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl md:font-light text-gray-800 mb-6 text-center">{title}</h3>
      <div className="space-y-4 w-11/12 md:max-w-10/12 mx-auto pt-6 md:pt-10">
        {faqItems.map((faq, index) => (
          <div key={index} className="bg-indigo-100 p-7 gap-5">
            <div className="text-xl md:text-2xl font-light text-gray-800">{faq.question}</div>
            <p className="text-md md:text-lg font-light text-gray-700">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}