import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTracking } from "@/hooks/use-tracking";
import { supabase } from "@/integrations/supabase/client";
import AppointmentScheduler from "@/components/scheduling/AppointmentScheduler";

const ApplicationForm = () => {
  const { toast } = useToast();
  const tracking = useTracking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'scheduling'>('form');
  const [applicantData, setApplicantData] = useState({ name: '', email: '' });
  const [pixelEventId] = useState(() => crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const city = formData.get('city') as string;
    const category = formData.get('category') as string;
    const company = formData.get('company') as string;
    const position = formData.get('position') as string;
    const experience = formData.get('experience') as string;
    const motivation = formData.get('motivation') as string;

    if (!fullName || !email || !phone || !city || !category || !company || 
        !position || !experience || !motivation) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const linkedin = formData.get('linkedin') as string || 'N/A';
      
      const submissionData = {
        timestamp: new Date().toISOString(),
        fullName,
        email,
        phone,
        city,
        natureOfBusiness: `${category} | ${company} | ${position}`,
        services: [
          `Experience: ${experience} years`,
          `LinkedIn: ${linkedin}`,
          `Motivation: ${motivation}`
        ],
        action: 'Applied',
        sheetName: 'Silicon Valley',
        pixel_event_id: pixelEventId,
        ...tracking,
      };

      const { error: fnError } = await supabase.functions.invoke('submit-to-sheets', { body: submissionData });
      if (fnError) throw fnError;

      setApplicantData({ name: fullName, email });
      setStep('scheduling');
    } catch {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'scheduling') {
    return (
      <AppointmentScheduler
        applicantName={applicantData.name}
        applicantEmail={applicantData.email}
        funnelName="Silicon Valley"
        successPath="/silicon-valley/success"
        pixelEventId={pixelEventId}
      />
    );
  }

  return (
    <section className="py-8 md:py-12 bg-muted/50" id="application-form">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-4 md:pb-6">
            {/* 2-Step Progress */}
            <div className="flex items-center gap-0 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-sm font-medium hidden sm:inline">Submit Application</span>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-3" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold border border-border">2</div>
                <span className="text-sm text-muted-foreground hidden sm:inline">Schedule Appointment</span>
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl">Apply Now</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Join Pakistan's premier Silicon Valley program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" name="fullName" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" type="tel" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" name="city" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Applicant Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Startup Founder</SelectItem>
                      <SelectItem value="tech-professional">Technology Professional</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="corporate">Corporate Professional</SelectItem>
                      <SelectItem value="government">Government Official</SelectItem>
                      <SelectItem value="investor">Investor/VC</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input id="company" name="company" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Job Title *</Label>
                  <Input id="position" name="position" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input id="experience" name="experience" type="number" min="0" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/yourprofile" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Why do you want to join this program? *</Label>
                  <Textarea 
                    id="motivation"
                    name="motivation"
                    rows={5} 
                    required
                    placeholder="Tell us about your goals and what you hope to achieve..."
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox id="terms" required className="h-4 w-4 mt-0.5" />
                  <Label htmlFor="terms" className="cursor-pointer text-xs md:text-sm font-normal leading-snug text-muted-foreground">
                    I agree to the terms and conditions and understand the payment schedule *
                  </Label>
                </div>

                <Button type="submit" size="lg" className="w-full text-base md:text-lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ApplicationForm;
