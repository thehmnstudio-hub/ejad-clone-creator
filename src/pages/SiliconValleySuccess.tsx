import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Phone, Clock, CalendarDays } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedFooter from "@/components/UnifiedFooter";
import SendCalendarInvite from "@/components/scheduling/SendCalendarInvite";

declare global { interface Window { fbq: any; } }

const SiliconValleySuccess = () => {
  const location = useLocation();
  const appointment = location.state?.appointment;
  const pixelEventId: string | undefined = location.state?.pixelEventId;

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Silicon Valley Tech Exchange Lead',
        content_category: 'Silicon Valley',
      }, pixelEventId ? { eventID: pixelEventId } : undefined);
    }
  }, [pixelEventId]);

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      <main className="flex-grow">
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">Thank You!</h1>
                  <p className="text-lg text-muted-foreground mb-8">
                    Your application for the Silicon Valley Tech Exchange has been received successfully.
                  </p>

                  {appointment && (
                    <div className="mb-8 space-y-4">
                      <div className="bg-muted/50 rounded-lg p-5 text-left space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          Scheduled Interview
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4" /> Date
                            </span>
                            <span className="font-medium">
                              {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-4 w-4" /> Time
                            </span>
                            <span className="font-medium">{appointment.time}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">With</span>
                            <div className="flex items-center gap-2">
                              <img
                                src={appointment.interviewer?.image}
                                alt={appointment.interviewer?.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-medium">{appointment.interviewer?.name}</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-medium">30 minutes</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        ✅ Calendar invites have been sent to you and our team automatically
                      </p>

                      <SendCalendarInvite appointment={appointment} />
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="bg-muted/30 rounded-lg p-4 text-left">
                      <h3 className="font-semibold text-sm mb-2">What's Next?</h3>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>✅ Your application has been received</li>
                        {appointment && <li>📅 Your interview call is scheduled</li>}
                        <li>📞 You'll have an interview call with our partnerships team</li>
                        <li>✍️ Based on the interview, your application will be approved or declined</li>
                        <li>🚀 Approved applicants will receive onboarding details via email</li>
                      </ul>
                    </div>

                    <p className="font-medium text-lg">Want to get in touch earlier?</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a href="https://wa.me/924232300134" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                        <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          WhatsApp: 0423 230 0134
                        </Button>
                      </a>
                      <a href="tel:+923041111055" className="w-full sm:w-auto">
                        <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                          <Phone className="w-5 h-5" />
                          Call: 0304 111 1055
                        </Button>
                      </a>
                    </div>
                    
                    <div className="pt-6 border-t">
                      <Link to="/silicon-valley">
                        <Button variant="link" className="text-base">
                          ← Back to Silicon Valley Program
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <UnifiedFooter />
    </div>
  );
};

export default SiliconValleySuccess;
