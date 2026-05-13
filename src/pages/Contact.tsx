import { useState } from "react";
import { z } from "zod";
import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedFooter from "@/components/UnifiedFooter";
import { Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTracking } from "@/hooks/use-tracking";

const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const ContactForm = () => {
  const { toast } = useToast();
  const tracking = useTracking();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: String(fd.get("fullName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
    };
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      toast({
        title: "Please check the form",
        description: parsed.error.issues[0]?.message ?? "Some fields are invalid.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await fetch("https://pobuisklmptthlqscbaw.supabase.co/functions/v1/submit-to-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          city: "",
          natureOfBusiness: parsed.data.subject,
          services: [
            `Subject: ${parsed.data.subject}`,
            `Message: ${parsed.data.message}`,
          ],
          action: "Contact",
          sheetName: "Contact Us",
          ...tracking,
        }),
      });
      setSubmitted(true);
      toast({ title: "Message sent", description: "We'll get back to you shortly." });
    } catch (err) {
      console.error("Contact submit error:", err);
      toast({
        title: "Submission failed",
        description: "Please try again or email hello@ejadlabs.com.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Thank you!</h3>
          <p className="text-muted-foreground">
            We've received your message and will get back to you within 1 business day.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" name="fullName" required maxLength={100} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" type="tel" required maxLength={30} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input id="subject" name="subject" required maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" name="message" rows={6} required maxLength={2000} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      
      <main>
        {/* Hero Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Info */}
            <div className="space-y-8">
              {/* Contact Details */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Mail className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <a 
                          href="mailto:hello@ejadlabs.com" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          hello@ejadlabs.com
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Phone className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <a 
                          href="tel:+923041111055" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          +92 304 111 1055
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-start gap-4">
                      <svg className="w-5 h-5 text-primary mt-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <div>
                        <h3 className="font-semibold mb-1">WhatsApp</h3>
                        <a 
                          href="https://wa.me/924232300134" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          0423 230 0134
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Offices */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Our Offices</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Registered Office</p>
                          <h3 className="font-semibold">United States</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground pl-8">
                        124 Broadkill Rd #601<br />
                        Milton, DE 19968<br />
                        United States
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Regional Office</p>
                          <h3 className="font-semibold">Pakistan</h3>
                        </div>
                      </div>
                      <a
                        href="https://maps.app.goo.gl/EbLJmNi2yuMfSubWA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors pl-8 block"
                      >
                        19-D/1, Gulberg III<br />
                        Lahore, Pakistan
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Team Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Leadership Team</h2>
                <div className="space-y-4">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src="/images/team/arzish-azam.jpeg"
                          alt="Arzish Azam"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Arzish Azam</h3>
                          <p className="text-sm text-muted-foreground">Founder</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href="https://www.linkedin.com/in/arzishazam/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          <img 
                            src="/images/team/shahroz-malik.jpg"
                            alt="Shahroz Malik"
                            className="w-full h-full object-cover object-top scale-150"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Shahroz Malik</h3>
                          <p className="text-sm text-muted-foreground">CEO</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href="https://www.linkedin.com/in/shahroz-malik22/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </main>

      <UnifiedFooter />
    </div>
  );
};

export default Contact;
