import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendCalendarInviteProps {
  appointment: {
    date: string;
    time: string;
    interviewer: {
      name: string;
      role: string;
      email: string;
    };
    applicantName: string;
    applicantEmail: string;
    funnelName: string;
  };
}

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

const SendCalendarInvite = ({ appointment }: SendCalendarInviteProps) => {
  const { toast } = useToast();
  const [emails, setEmails] = useState<string[]>([""]);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const addEmailField = () => {
    if (emails.length < 5) setEmails([...emails, ""]);
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleSend = async () => {
    const validEmails = emails.filter((e) => e.trim() && e.includes("@"));
    if (validEmails.length === 0) {
      toast({ title: "Please enter at least one valid email", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const date = new Date(appointment.date);
      const { hours, minutes } = parseTime(appointment.time);
      date.setHours(hours, minutes, 0, 0);
      const endDate = new Date(date.getTime() + 30 * 60 * 1000);

      const { error } = await supabase.functions.invoke("create-calendar-event", {
        body: {
          summary: `${appointment.funnelName} Interview - ${appointment.applicantName}`,
          description: `Interview call for ${appointment.funnelName}\n\nApplicant: ${appointment.applicantName}\nEmail: ${appointment.applicantEmail}\nInterviewer: ${appointment.interviewer.name} (${appointment.interviewer.role})\n\nShared invite sent to: ${validEmails.join(", ")}`,
          startDateTime: date.toISOString(),
          endDateTime: endDate.toISOString(),
          attendees: [...validEmails, appointment.applicantEmail, appointment.interviewer.email, "hello@ejadlabs.com"],
          funnelName: appointment.funnelName,
        },
      });

      if (error) throw error;

      setSent(true);
      toast({ title: "Calendar invites sent!", description: `Sent to ${validEmails.join(", ")}` });
    } catch (error) {
      console.error("Send invite error:", error);
      toast({ title: "Failed to send invites", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-sm text-green-700 font-medium">✅ Calendar invites sent successfully!</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
      <Label className="text-sm font-semibold">Share Interview Invite</Label>
      <p className="text-xs text-muted-foreground">
        Send calendar invites to additional people (colleagues, partners, etc.)
      </p>
      <div className="space-y-2">
        {emails.map((email, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              className="text-sm"
            />
            {emails.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeEmail(index)} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {emails.length < 5 && (
          <Button variant="outline" size="sm" onClick={addEmailField} className="text-xs gap-1">
            <Plus className="h-3 w-3" /> Add Email
          </Button>
        )}
        <Button size="sm" onClick={handleSend} disabled={isSending} className="text-xs gap-1 ml-auto">
          {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          {isSending ? "Sending..." : "Send Invite"}
        </Button>
      </div>
    </div>
  );
};

export default SendCalendarInvite;
