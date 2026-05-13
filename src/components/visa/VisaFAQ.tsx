import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const VisaFAQ = () => {
  const faqs = [
    {
      question: "What visa types do you assist with?",
      answer: "We specialize in Tourism (B-2) and Business (B-1) visas for the U.S., and Schengen Tourism and Business visas for the EU. Whether you're planning a leisure trip or attending a business conference, we guide you through the entire process."
    },
    {
      question: "How do I know if I qualify for a U.S. or EU visa?",
      answer: "By filling out our eligibility assessment form, we quickly assess your situation and let you know if you're eligible. Our experts will guide you through every step based on your individual circumstances."
    },
    {
      question: "How long does the visa application process take?",
      answer: "The process typically takes 4-8 weeks, depending on your destination and visa type. Our team works to ensure everything is submitted on time and correctly to avoid delays."
    },
    {
      question: "Do I need an appointment for a visa interview?",
      answer: "Yes, depending on the visa type and your location, an appointment is required. We assist in scheduling your interview and provide comprehensive preparation tips to help you succeed."
    },
    {
      question: "What documents are needed for the visa application?",
      answer: "You'll need basic documents such as passport, proof of financial support, travel itinerary, and employment verification. Our experts provide a detailed checklist based on your individual case and assist with preparation."
    },
    {
      question: "Is my information safe and confidential?",
      answer: "Absolutely. We take privacy and security very seriously. Your information is kept completely confidential and will only be used to assess your eligibility and assist you through the application process."
    },
    {
      question: "What if my visa application is denied?",
      answer: "If your visa is denied, we'll help you understand the reasons and discuss potential next steps. We offer advice on how to reapply or explore alternative options based on the specific denial reasons."
    },
    {
      question: "Can I apply for both U.S. and EU visas at the same time?",
      answer: "Yes, we can assist you in applying for both U.S. and EU visas simultaneously, depending on your travel plans and purpose. We'll coordinate the applications to ensure the best timing for both."
    },
    {
      question: "Do you guarantee visa approval?",
      answer: "While we cannot guarantee visa approval (as the final decision is made by the embassy), our 80%+ success rate speaks to our expertise and track record in successfully guiding applicants through the visa process."
    },
    {
      question: "What are the consultation fees?",
      answer: "Our consultation fee is $8,000 for U.S. visas and $4,000 for EU visas. This covers the entire end-to-end process including eligibility assessment, document preparation, application submission, interview preparation, and ongoing support. We offer flexible payment plans with no hidden costs."
    },
    {
      question: "What is included in the consultation service?",
      answer: "Our comprehensive service includes: complete eligibility assessment, personalized document preparation, application submission guidance, visa interview preparation with mock sessions, and ongoing support throughout the approval process and beyond."
    },
    {
      question: "How soon will I hear back after submitting the eligibility form?",
      answer: "We typically respond within 24 hours of receiving your eligibility form. Our team will review your information and provide an initial assessment of your visa prospects."
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm md:text-base">Everything you need to know about our visa consultation services</p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`} 
              className="border rounded-lg px-4 md:px-6"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold hover:no-underline py-4 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm md:text-base pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default VisaFAQ;
