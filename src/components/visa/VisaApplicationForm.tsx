import { useState, lazy, Suspense } from "react";
import { useTracking } from "@/hooks/use-tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Lazy-load: only ships when applicant reaches step 2 (after submit success).
// Removes calendar / date-fns / day-picker from initial /visa bundle.
const AppointmentScheduler = lazy(() => import("@/components/scheduling/AppointmentScheduler"));

const VisaApplicationForm = () => {
  const { toast } = useToast();
  const tracking = useTracking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'scheduling'>('form');
  const [applicantData, setApplicantData] = useState({ name: '', email: '' });
  const [pixelEventId] = useState(() => crypto.randomUUID());
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    natureOfWork: "",
    purposeOfTravel: "",
    education: "",
    professionalAffiliations: "",
    propertyOwnership: "",
    familyTies: "",
    applicationType: "",
    travelHistory: "",
    currentEmployment: "",
    annualIncome: "",
    previousVisaRejections: "",
    intendedTravelDate: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.city || 
        !formData.age || !formData.applicationType || !formData.natureOfWork || 
        !formData.purposeOfTravel || !formData.education || !formData.currentEmployment || 
        !formData.annualIncome) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        timestamp: new Date().toISOString(),
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        natureOfBusiness: "",
        services: [
          `Age: ${formData.age}`,
          `Application Type: ${formData.applicationType}`,
          `Nature of Work: ${formData.natureOfWork}`,
          `Purpose: ${formData.purposeOfTravel}`,
          `Education: ${formData.education}`,
          `Employment: ${formData.currentEmployment}`,
          `Annual Income: ${formData.annualIncome}`,
          `Professional Affiliations: ${formData.professionalAffiliations}`,
          `Property Ownership: ${formData.propertyOwnership}`,
          `Family Ties: ${formData.familyTies}`,
          `Travel History: ${formData.travelHistory}`,
          `Previous Rejections: ${formData.previousVisaRejections}`,
          `Intended Date: ${formData.intendedTravelDate}`,
        ],
        action: "Applied",
        sheetName: "Visa Desk",
        pixel_event_id: pixelEventId,
        ...tracking,
      };

      const { error } = await supabase.functions.invoke('submit-to-sheets', {
        body: submissionData
      });

      if (error) throw error;

      setApplicantData({ name: formData.fullName, email: formData.email });
      setStep('scheduling');
    } catch {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'scheduling') {
    return (
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading scheduler…</div>}>
        <AppointmentScheduler
          applicantName={applicantData.name}
          applicantEmail={applicantData.email}
          funnelName="Visa Desk"
          successPath="/visa/success"
          pixelEventId={pixelEventId}
        />
      </Suspense>
    );
  }

  return (
    <section id="visa-application" className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Shield className="h-4 w-4 mr-2 inline" />
            100% Confidential & Secure
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Check Your Eligibility</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Fill out the form below and we'll assess your eligibility within 24 hours
          </p>
        </div>

        <Card>
          <CardHeader>
            {/* 2-Step Progress */}
            <div className="flex items-center gap-0 mb-4">
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
            <CardTitle>Application Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input 
                    id="fullName" 
                    required 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city" 
                    required 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    required 
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationType">Application Type *</Label>
                  <Select required value={formData.applicationType} onValueChange={(value) => setFormData({...formData, applicationType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-tourism">US Tourism</SelectItem>
                      <SelectItem value="us-business">US Business</SelectItem>
                      <SelectItem value="eu-tourism">EU Tourism</SelectItem>
                      <SelectItem value="eu-business">EU Business</SelectItem>
                      <SelectItem value="both-tourism">Both (Tourism)</SelectItem>
                      <SelectItem value="both-business">Both (Business)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="natureOfWork">Nature of Work *</Label>
                <Input 
                  id="natureOfWork" 
                  required 
                  placeholder="e.g., Software Engineer, Business Owner"
                  value={formData.natureOfWork}
                  onChange={(e) => setFormData({...formData, natureOfWork: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purposeOfTravel">Purpose of Travel *</Label>
                <Textarea 
                  id="purposeOfTravel" 
                  required 
                  placeholder="Describe your purpose of travel"
                  value={formData.purposeOfTravel}
                  onChange={(e) => setFormData({...formData, purposeOfTravel: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education Background *</Label>
                <Input 
                  id="education" 
                  required 
                  placeholder="e.g., Bachelor's in Computer Science"
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentEmployment">Current Employment Status *</Label>
                <Input 
                  id="currentEmployment" 
                  required 
                  placeholder="e.g., Employed, Self-employed, Business Owner"
                  value={formData.currentEmployment}
                  onChange={(e) => setFormData({...formData, currentEmployment: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualIncome">Annual Income (PKR) *</Label>
                <Input 
                  id="annualIncome" 
                  required 
                  placeholder="e.g., 2,000,000"
                  value={formData.annualIncome}
                  onChange={(e) => setFormData({...formData, annualIncome: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalAffiliations">Professional Affiliations</Label>
                <Textarea 
                  id="professionalAffiliations" 
                  placeholder="List any professional memberships, organizations, or associations"
                  value={formData.professionalAffiliations}
                  onChange={(e) => setFormData({...formData, professionalAffiliations: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyOwnership">Property and Other Ownerships</Label>
                <Textarea 
                  id="propertyOwnership" 
                  placeholder="Describe any property, business, or assets you own"
                  value={formData.propertyOwnership}
                  onChange={(e) => setFormData({...formData, propertyOwnership: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyTies">Family Ties in Pakistan</Label>
                <Textarea 
                  id="familyTies" 
                  placeholder="Describe your family situation and ties to Pakistan"
                  value={formData.familyTies}
                  onChange={(e) => setFormData({...formData, familyTies: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelHistory">Travel History</Label>
                <Textarea 
                  id="travelHistory" 
                  placeholder="List countries you've visited and approximate dates"
                  value={formData.travelHistory}
                  onChange={(e) => setFormData({...formData, travelHistory: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousVisaRejections">Previous Visa Rejections (if any)</Label>
                <Textarea 
                  id="previousVisaRejections" 
                  placeholder="Have you been rejected for any visas before? Please provide details"
                  value={formData.previousVisaRejections}
                  onChange={(e) => setFormData({...formData, previousVisaRejections: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intendedTravelDate">Intended Travel Date</Label>
                <Input 
                  id="intendedTravelDate" 
                  type="date"
                  value={formData.intendedTravelDate}
                  onChange={(e) => setFormData({...formData, intendedTravelDate: e.target.value})}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your information is kept private and will only be used to assess your eligibility
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VisaApplicationForm;
