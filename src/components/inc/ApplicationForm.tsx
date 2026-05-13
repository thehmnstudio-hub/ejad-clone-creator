import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Phone, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTracking } from "@/hooks/use-tracking";
import { supabase } from "@/integrations/supabase/client";
import { classifyLead } from "@/utils/leadClassification";
// Lazy: pulls supabase-js + date-fns + react-day-picker (~120KB).
// Only needed AFTER form submit for qualified leads — keep it off the
// initial /inc bundle so admin-vendor doesn't load on landing.
const AppointmentScheduler = lazy(() => import("@/components/scheduling/AppointmentScheduler"));

const ApplicationForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'scheduling'>('form');
  const [applicantData, setApplicantData] = useState({ name: '', email: '' });
  const [pixelEventId] = useState(() => crypto.randomUUID());
  const tracking = useTracking();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    natureOfBusiness: "",
    businessType: "",
    services: {
      physicalBank: false,
      digitalBank: false,
      ecommerce: false,
      others: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.phone || 
        !formData.city || !formData.natureOfBusiness || !formData.businessType) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one service is selected
    const hasSelectedService = Object.values(formData.services).some(v => v);
    if (!hasSelectedService) {
      toast({
        title: "Service Required",
        description: "Please select at least one service",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Classify the lead based on nature of business
      const classification = classifyLead(formData.natureOfBusiness);
      const leadStatus = classification.status;
      

      // Prepare services list
      const selectedServices = [];
      if (formData.services.physicalBank) selectedServices.push('US Physical Bank ($3,000)');
      if (formData.services.digitalBank) selectedServices.push('US Company Formation ($250)');
      if (formData.services.ecommerce) selectedServices.push('Ecommerce Platforms (Account setup or verification)');
      // Others is always last in both UI + Sheet row
      if (formData.services.others) selectedServices.push('Others');

      // Prepare data for Google Sheets - include lead_status
      const submissionData = {
        timestamp: new Date().toISOString(),
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        natureOfBusiness: formData.natureOfBusiness,
        businessType: formData.businessType,
        services: selectedServices,
        action: 'Applied',
        lead_status: leadStatus,
        sheetName: "Company Formation",
        pixel_event_id: pixelEventId,
        ...tracking,
      };

      const { error: fnError } = await supabase.functions.invoke('submit-to-sheets', { body: submissionData });
      if (fnError) throw fnError;

      // US Physical Bank qualified leads get scheduling, others skip to appropriate success page
      if (leadStatus === 'qualified' && formData.services.physicalBank) {
        setApplicantData({ name: formData.fullName, email: formData.email });
        setStep('scheduling');
      } else if (leadStatus === 'qualified') {
        navigate('/inc/success', { state: { pixelEventId } });
      } else {
        navigate('/inc/success-off');
      }

    } catch {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly via WhatsApp",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'scheduling') {
    return (
      <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <AppointmentScheduler
          applicantName={applicantData.name}
          applicantEmail={applicantData.email}
          funnelName="Company Formation"
          successPath="/inc/success"
          pixelEventId={pixelEventId}
        />
      </Suspense>
    );
  }

  return <section id="contact" className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Shield className="h-4 w-4 mr-2 inline" />
              100% Confidential & Secure
            </Badge>
            {/* 2-Step Progress */}
            <div className="flex items-center gap-0 mb-6 mt-4">
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
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Apply Today</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Fill out the form below and we'll assess your eligibility within 24 hours
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 pb-6">
              
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" required value={formData.fullName} onChange={e => setFormData({
                  ...formData,
                  fullName: e.target.value
                })} placeholder="Enter your full name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} placeholder="your.email@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" required value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} placeholder="+92 304 111 1055" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" required value={formData.city} onChange={e => setFormData({
                  ...formData,
                  city: e.target.value
                })} placeholder="Your city" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="natureOfBusiness">Nature of Business *</Label>
                  <Input id="natureOfBusiness" required value={formData.natureOfBusiness} onChange={e => setFormData({
                  ...formData,
                  natureOfBusiness: e.target.value
                })} placeholder="E.g., Software Development, E-commerce" />
                </div>

                <div className="space-y-3">
                  <Label>Type of Business *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card 
                      className={`transition-all hover:shadow-md cursor-pointer ${formData.businessType === 'existing' ? 'border-primary border-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <label htmlFor="existing-business" className="flex items-start gap-3 cursor-pointer w-full">
                          <Checkbox 
                            id="existing-business" 
                            checked={formData.businessType === 'existing'}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                businessType: checked ? 'existing' : (prev.businessType === 'existing' ? '' : prev.businessType)
                              }))
                            }
                            className="rounded-full h-5 w-5 min-h-5 min-w-5 mt-0.5 transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-110"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium leading-tight block">
                              Existing Business
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">Already running a business</p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`transition-all hover:shadow-md cursor-pointer ${formData.businessType === 'new' ? 'border-primary border-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <label htmlFor="new-business" className="flex items-start gap-3 cursor-pointer w-full">
                          <Checkbox 
                            id="new-business" 
                            checked={formData.businessType === 'new'}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                businessType: checked ? 'new' : (prev.businessType === 'new' ? '' : prev.businessType)
                              }))
                            }
                            className="rounded-full h-5 w-5 min-h-5 min-w-5 mt-0.5 transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-110"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium leading-tight block">
                              New Business
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">Starting a new business</p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What services do you need? *</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card 
                      className={`transition-all hover:shadow-md ${formData.services.physicalBank ? 'border-primary border-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <label htmlFor="physical-bank" className="flex items-start gap-3 cursor-pointer">
                          <Checkbox 
                            id="physical-bank" 
                            checked={formData.services.physicalBank}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                services: { ...prev.services, physicalBank: !!checked }
                              }))
                            }
                            className="rounded-full h-5 w-5 min-h-5 min-w-5 mt-0.5 transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-110"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium leading-tight">
                                US Physical Bank
                              </span>
                              <span className="text-sm font-bold text-primary">$3,000</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Full-Service high street banking</p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`transition-all hover:shadow-md ${formData.services.digitalBank ? 'border-primary border-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <label htmlFor="digital-bank" className="flex items-start gap-3 cursor-pointer">
                          <Checkbox 
                            id="digital-bank" 
                            checked={formData.services.digitalBank}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                services: { ...prev.services, digitalBank: !!checked }
                              }))
                            }
                            className="rounded-full h-5 w-5 min-h-5 min-w-5 mt-0.5 transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-110"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium leading-tight">
                                US Company Formation
                              </span>
                              <span className="text-sm font-bold text-primary">$250</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">LLC, C-Corp and Digital Bank</p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>

                    <Card
                      className={`transition-all hover:shadow-md ${formData.services.ecommerce ? 'border-primary border-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <label htmlFor="ecommerce" className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            id="ecommerce"
                            checked={formData.services.ecommerce}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                services: { ...prev.services, ecommerce: !!checked }
                              }))
                            }
                            className="rounded-full h-5 w-5 min-h-5 min-w-5 mt-0.5 transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-110"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium leading-tight block">
                              Ecommerce Platforms
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">Account setup or verification</p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>
                    {/* Others is always last regardless of how the rest are ordered */}
                    <Card 
                      className={`transition-all hover:shadow-md ${formData.services.others ? 'border-primary border-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <label htmlFor="others" className="flex items-start gap-3 cursor-pointer">
                          <Checkbox 
                            id="others" 
                            checked={formData.services.others}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                services: { ...prev.services, others: !!checked }
                              }))
                            }
                            className="rounded-full h-5 w-5 min-h-5 min-w-5 mt-0.5 transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-110"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium leading-tight block">
                              Others
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">ITIN, Tax Filing, Reseller Certificate, etc.</p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Button 
                  type="button" 
                  size="lg"
                  className="w-full mt-6"
                  onClick={(e) => handleSubmit(e as any)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-4 text-center">Need Help?</h3>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a 
                    href="https://wa.me/924232300134" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      0423 230 0134
                    </Button>
                  </a>
                  
                  <a href="tel:+923041111055" className="w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                      <Phone className="w-4 h-4" />
                      0304 111 1055
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};

export default ApplicationForm;
