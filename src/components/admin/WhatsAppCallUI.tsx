import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallState, CallDirection } from "@/hooks/useWhatsAppCall";
import { useEffect, useState } from "react";

interface WhatsAppCallUIProps {
  callState: CallState;
  direction?: CallDirection;
  remoteName?: string;
  remotePhone?: string;
  duration: number;
  isMuted: boolean;
  onAccept: () => void;
  onReject: () => void;
  onTerminate: () => void;
  onToggleMute: () => void;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function WhatsAppCallUI({
  callState, direction, remoteName, remotePhone, duration,
  isMuted, onAccept, onReject, onTerminate, onToggleMute,
}: WhatsAppCallUIProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (callState === "ringing" && direction === "inbound") {
      const t = setInterval(() => setPulse(p => !p), 600);
      return () => clearInterval(t);
    }
  }, [callState, direction]);

  if (callState === "idle") return null;

  const isIncoming = direction === "inbound" && callState === "ringing";
  const displayName = remoteName || remotePhone || "Unknown";

  return (
    <div className="fixed top-4 right-4 z-[9999] w-72 rounded-xl bg-card border shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
      <div className={`px-4 py-3 ${isIncoming ? "bg-emerald-600" : "bg-primary"} text-primary-foreground`}>
        <div className="flex items-center gap-2">
          {isIncoming ? (
            <PhoneIncoming className={`h-4 w-4 ${pulse ? "scale-110" : "scale-100"} transition-transform`} />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          <span className="text-xs font-medium uppercase tracking-wide">
            {isIncoming ? "Incoming Call" :
             callState === "requesting" ? "Connecting..." :
             callState === "ringing" ? "Ringing..." :
             callState === "connecting" ? "Connecting..." :
             callState === "active" ? "On Call" :
             "Ending..."}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="text-center">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          {remotePhone && remoteName && (
            <p className="text-xs text-muted-foreground">{remotePhone}</p>
          )}
          {callState === "active" && (
            <p className="text-lg font-mono text-primary mt-1">{formatDuration(duration)}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          {isIncoming ? (
            <>
              <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={onReject}>
                <PhoneOff className="h-4 w-4" />
              </Button>
              <Button size="icon" className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={onAccept}>
                <Phone className="h-4 w-4" />
              </Button>
            </>
          ) : callState === "active" ? (
            <>
              <Button size="icon" variant={isMuted ? "destructive" : "outline"} className="h-10 w-10 rounded-full" onClick={onToggleMute}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="destructive" className="h-12 w-12 rounded-full" onClick={onTerminate}>
                <PhoneOff className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={onTerminate}>
              <PhoneOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
