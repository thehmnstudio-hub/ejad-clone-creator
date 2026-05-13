import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, Globe, ChevronLeft, Video } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppointmentSchedulerProps {
  applicantName: string;
  applicantEmail: string;
  funnelName: string;
  successPath: string;
  pixelEventId?: string;
}

const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM",
];

const TEAM_MEMBERS = [
  {
    name: "Zainab Jamshed",
    role: "Partnerships Manager",
    company: "Ejad Labs",
    email: "zainab.j@ejadlabs.com",
    image: "/team/zainab-jamshed.webp",
    linkedin: "",
  },
  {
    name: "Zara Batool",
    role: "Partnerships Manager",
    company: "Ejad Labs",
    email: "zara@ejadlabs.com",
    image: "/team/zara-batool.webp",
    linkedin: "",
  },
  {
    name: "Ajwa",
    role: "Partnerships Manager",
    company: "Ejad Labs",
    email: "ajwa@ejadlabs.com",
    image: "/team/ajwa.webp",
    linkedin: "",
  },
];

const getAssignedMember = (funnelName: string) => {
  if (funnelName === "Company Formation") {
    return TEAM_MEMBERS.find(m => m.name === "Ajwa")!;
  }
  const svVisaTeam = TEAM_MEMBERS.filter(m => m.name !== "Ajwa");
  return svVisaTeam[Math.floor(Date.now() / 1000) % svVisaTeam.length];
};

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

const AppointmentScheduler = ({
  applicantName,
  applicantEmail,
  funnelName,
  successPath,
  pixelEventId,
}: AppointmentSchedulerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);

  const assignedMember = useMemo(() => getAssignedMember(funnelName), [funnelName]);

  const disabledDays = useMemo(() => {
    return [{ before: addDays(new Date(), 1) }, { dayOfWeek: [0, 6] }];
  }, []);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsBooking(true);

    try {
      const { hours, minutes } = parseTime(selectedTime);
      const appointmentDate = setMinutes(setHours(selectedDate, hours), minutes);
      const endDate = new Date(appointmentDate.getTime() + 30 * 60 * 1000);

      // Submit to sheets
      const bookingData = {
        timestamp: new Date().toISOString(),
        fullName: applicantName,
        email: applicantEmail,
        phone: "",
        city: "",
        natureOfBusiness: `Interview: ${format(appointmentDate, "PPP")} at ${selectedTime}`,
        services: [
          `Interviewer: ${assignedMember.name}`,
          `Date: ${format(appointmentDate, "PPP")}`,
          `Time: ${selectedTime}`,
          `Funnel: ${funnelName}`,
        ],
        action: "Booked Interview",
        sheetName: funnelName,
      };

      await fetch(
        `https://pobuisklmptthlqscbaw.supabase.co/functions/v1/submit-to-sheets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        }
      );

      // Send Google Calendar invite (created as the CSR's calendar event)
      const calendarResponse = await supabase.functions.invoke("create-calendar-event", {
        body: {
          summary: `${funnelName} Interview - ${applicantName}`,
          description: `Interview call for ${funnelName}\n\nApplicant: ${applicantName}\nEmail: ${applicantEmail}\nInterviewer: ${assignedMember.name} (${assignedMember.role})\n\nThis is an automated invite from Ejad Labs.`,
          startDateTime: appointmentDate.toISOString(),
          endDateTime: endDate.toISOString(),
          attendees: [applicantEmail, assignedMember.email, "hello@ejadlabs.com"],
          funnelName,
          applicantName,
          interviewerName: assignedMember.name,
          interviewerRole: assignedMember.role,
          interviewerEmail: assignedMember.email,
        },
      });

      let eventId = "";
      let meetLink = "";
      if (calendarResponse.data?.eventId) {
        eventId = calendarResponse.data.eventId;
      }
      if (calendarResponse.data?.meetLink) {
        meetLink = calendarResponse.data.meetLink;
      }

      // Save appointment to database
      try {
        await supabase.from("appointments" as any).insert({
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          interviewer_name: assignedMember.name,
          interviewer_email: assignedMember.email,
          funnel: funnelName,
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          appointment_time: selectedTime,
          google_event_id: eventId || null,
          google_meet_link: meetLink || null,
        });
      } catch {
        // DB insert is non-blocking; navigation proceeds regardless
      }

      navigate(successPath, {
        state: {
          appointment: {
            date: selectedDate.toISOString(),
            time: selectedTime,
            interviewer: assignedMember,
            applicantName,
            applicantEmail,
            funnelName,
          },
          pixelEventId,
        },
      });
    } catch {
      toast({
        title: "Booking submitted",
        description: "Your interview has been scheduled. Calendar invite may take a moment.",
      });
      navigate(successPath, {
        state: {
          appointment: {
            date: selectedDate.toISOString(),
            time: selectedTime,
            interviewer: assignedMember,
            applicantName,
            applicantEmail,
            funnelName,
          },
          pixelEventId,
        },
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <section className="py-8 md:py-12 bg-muted/50" id="schedule-appointment">
      <div className="container mx-auto px-4">
        {/* 2-Step Progress */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex items-center gap-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <span className="text-sm font-medium hidden sm:inline">Submit Application</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary mx-3" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Schedule Interview</span>
            </div>
          </div>
        </div>

        {/* Calendly-style card */}
        <div className="max-w-3xl mx-auto bg-card rounded-xl border shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-[280px_1fr]">
            {/* Left sidebar - Interviewer Info */}
            <div className="border-b md:border-b-0 md:border-r p-6 space-y-5">
              <div>
                <button
                  onClick={() => setSelectedDate(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Ejad Labs
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={assignedMember.image}
                    alt={assignedMember.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <p className="text-sm font-medium">{assignedMember.name}</p>
                    <p className="text-xs text-muted-foreground">{assignedMember.role}</p>
                  </div>
                </div>
                <h2 className="text-lg font-bold leading-tight">
                  {funnelName} Interview
                </h2>
              </div>

              <Separator />

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>30 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 shrink-0" />
                  <span>Google Meet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0" />
                  <span>Pakistan Standard Time (PKT)</span>
                </div>
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground leading-relaxed">
                Schedule your interview call with {assignedMember.name} to discuss your application and next steps.
              </p>
            </div>

            {/* Right panel - Calendar & Times */}
            <div className="p-5 md:p-6">
              {!selectedDate ? (
                <div>
                  <h3 className="font-semibold mb-1">Select a Date</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Choose a day that works best for you
                  </p>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={disabledDays}
                    fromDate={addDays(new Date(), 1)}
                    toDate={addDays(new Date(), 60)}
                    className={cn("p-0 pointer-events-auto w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_row]:flex [&_.rdp-head_row]:justify-around [&_.rdp-row]:flex [&_.rdp-row]:justify-around")}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        {format(selectedDate, "EEEE, MMMM d")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Select a time slot below
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(undefined);
                        setSelectedTime("");
                      }}
                      className="text-xs gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Back
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {TIME_SLOTS.map((time) => (
                      <div key={time} className="flex gap-2">
                        <Button
                          variant={selectedTime === time ? "default" : "outline"}
                          className={cn(
                            "flex-1 justify-center transition-all",
                            selectedTime === time
                              ? ""
                              : "border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
                          )}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                        {selectedTime === time && (
                          <Button
                            onClick={handleConfirm}
                            disabled={isBooking}
                            className="animate-in slide-in-from-right-2 min-w-[100px]"
                          >
                            {isBooking ? "Booking..." : "Confirm"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate(successPath)}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Skip scheduling for now
          </button>
        </div>
      </div>
    </section>
  );
};

export default AppointmentScheduler;
