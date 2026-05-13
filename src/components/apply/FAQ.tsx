import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "When can I apply?",
      answer: "Applications are approved and processed on a rolling basis throughout the year to give delegates enough time for visa processing."
    },
    {
      question: "When will I hear back about my application?",
      answer: "Applications are reviewed on a rolling basis. Selected candidates will be notified via email with further instructions."
    },
    {
      question: "How does the $8,000 payment work?",
      answer: "Once selected, the $8,000 participation fee is payable in full in advance to confirm your seat in the program."
    },
    {
      question: "What is included in the participation fee?",
      answer: "The participation fee covers all program activities including company visits, networking sessions, workshops, bootcamp attendance, and program materials."
    },
    {
      question: "Are travel and accommodation included?",
      answer: "No, the participation fee does not include flights, accommodation, meals, or personal expenses. Participants are responsible for their own travel arrangements and stay."
    },
    {
      question: "Is there an age requirement?",
      answer: "No, there is no age limit. We welcome applications from professionals at all career stages who meet the eligibility criteria."
    },
    {
      question: "Do I need a US visa to apply?",
      answer: "You do not need a visa at the time of application. However, if selected, you will need to obtain a B1/B2 visa for travel to the USA. We provide support documentation for your visa application."
    },
    {
      question: "Can I attend if I'm not a startup founder?",
      answer: "Absolutely! The program is open to tech professionals, corporate leaders, students, government officials, and anyone interested in innovation and Silicon Valley ecosystems."
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm md:text-base">Everything you need to know about the program</p>
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

export default FAQ;
