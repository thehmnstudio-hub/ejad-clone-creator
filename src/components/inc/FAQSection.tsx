import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How long does incorporation take?",
      answer: "Depending on the state, the time can take anywhere from 30 mins to 1 week."
    },
    {
      question: "Do I need to travel to the US?",
      answer: "No, the entire process can be completed remotely from Pakistan. We handle all paperwork."
    },
    {
      question: "What's included in the package?",
      answer: "Company formation, EIN registration, registered agent service (1 year), and bank account setup (physical or WISE)."
    },
    {
      question: "Can I accept international payments?",
      answer: "Yes! Accept payments via Stripe, PayPal, wire transfers, and other international methods."
    },
    {
      question: "What are the ongoing costs?",
      answer: "Registered agent service ($100-150/year) and annual state filing fees as required."
    },
    {
      question: "What states do you incorporate in?",
      answer: "We primarily work with Delaware and Wyoming for their business-friendly regulations and tax benefits."
    },
    {
      question: "What is BOIR?",
      answer: "BOIR (Beneficial Ownership Information Report) is a filing requirement under the Corporate Transparency Act. We help you complete this filing."
    }
  ];

  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Everything you need to know
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 md:px-6 bg-card">
                <AccordionTrigger className="text-left text-sm md:text-base font-semibold hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
