import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CallState = "idle" | "requesting" | "ringing" | "connecting" | "active" | "ending";
export type CallDirection = "outbound" | "inbound";

interface CallInfo {
  callId: string;
  direction: CallDirection;
  remotePhone: string;
  remoteName?: string;
  startTime?: number;
}

export function useWhatsAppCall() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callIdRef = useRef<string>("");
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  // Shadowed ref so subscription handlers read current callState without re-subscribing
  const callStateRef = useRef(callState);
  callStateRef.current = callState;

  // Global calls on/off gate — reads call_settings.calls_enabled, re-subscribes on change.
  // When false: the incoming-call channel is not subscribed and initiateCall throws.
  const [callsEnabled, setCallsEnabled] = useState(true);
  useEffect(() => {
    (supabase as any).from("call_settings").select("calls_enabled").limit(1).maybeSingle()
      .then(({ data }) => {
        if (data !== null && typeof (data as any).calls_enabled === "boolean") {
          setCallsEnabled((data as any).calls_enabled);
        }
      });
    const ch = supabase
      .channel("ejad-call-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "call_settings" }, (payload: any) => {
        if (typeof payload.new?.calls_enabled === "boolean") setCallsEnabled(payload.new.calls_enabled);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Ringtone management
  const startRingtone = useCallback(() => {
    try {
      // Stop any existing ringtone before starting a new one
      if (ringtoneRef.current) {
        (ringtoneRef.current as any).__stopRing?.();
        ringtoneRef.current = null;
      }
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 440;
      osc.type = "sine";
      gain.gain.value = 0;

      let playing = true;

      // Schedule the gain/frequency envelope for one ring cycle.
      // osc.start() is called once before this; the oscillator runs
      // continuously and gain modulation creates the ring pattern.
      const scheduleRing = () => {
        if (!playing) return;
        const t = audioCtx.currentTime;
        gain.gain.cancelScheduledValues(t);
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(480, t + 0.25);
        osc.frequency.setValueAtTime(440, t + 0.5);
        osc.frequency.setValueAtTime(480, t + 0.75);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.setValueAtTime(0, t + 1);
        gain.gain.setValueAtTime(0.3, t + 3);
        gain.gain.setValueAtTime(0, t + 4);
      };

      osc.start();
      scheduleRing();
      const interval = setInterval(() => {
        if (!playing) { clearInterval(interval); return; }
        scheduleRing();
      }, 6000);

      const fakeAudio = new Audio();
      (fakeAudio as any).__stopRing = () => {
        playing = false;
        clearInterval(interval);
        gain.gain.cancelScheduledValues(audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        try { osc.stop(); } catch {}
        try { audioCtx.close(); } catch {}
      };
      ringtoneRef.current = fakeAudio;
    } catch (e) {
      console.warn("Could not play ringtone:", e);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      (ringtoneRef.current as any).__stopRing?.();
      ringtoneRef.current = null;
    }
  }, []);

  // Ensure ringing is always stopped when call state leaves "ringing"
  useEffect(() => {
    if (callState !== "ringing") stopRingtone();
  }, [callState, stopRingtone]);

  // Duration timer
  useEffect(() => {
    if (callState === "active") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const cleanup = useCallback(() => {
    stopRingtone();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCallState("idle");
    setCallInfo(null);
    setDuration(0);
    setIsMuted(false);
    callIdRef.current = "";
  }, [stopRingtone]);

  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    streamRef.current = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (ev) => {
      const audio = document.createElement("audio");
      audio.srcObject = ev.streams[0];
      audio.autoplay = true;
      (audio as any).playsInline = true;
      audio.play().catch(() => {});
      remoteAudioRef.current = audio;
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallState("active");
      } else if (pc.iceConnectionState === "failed") {
        terminateCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // Initiate outbound call
  const initiateCall = useCallback(async (phone: string, name?: string) => {
    if (!callsEnabled) throw new Error("WhatsApp calls are currently disabled.");
    try {
      setCallState("requesting");
      const pc = await createPeerConnection();

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") { resolve(); return; }
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") resolve();
        };
        setTimeout(resolve, 3000);
      });

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("Failed to create SDP offer");

      const phoneClean = phone.replace(/[^0-9]/g, "");
      const { data, error } = await supabase.functions.invoke("whatsapp-call", {
        body: { action: "initiate", to: phoneClean, sdp },
      });

      if (error || !data?.success) throw new Error(data?.error || "Failed to initiate call");

      const callId = data.data?.calls?.[0]?.id || "";
      callIdRef.current = callId;
      setCallInfo({ callId, direction: "outbound", remotePhone: phone, remoteName: name });
      setCallState("ringing");
    } catch (e) {
      console.error("Call initiation failed:", e);
      cleanup();
      throw e;
    }
  }, [callsEnabled, createPeerConnection, cleanup]);

  // Handle incoming call
  const handleIncomingCall = useCallback(async (callId: string, remoteSdp: string, phone: string, name?: string) => {
    try {
      callIdRef.current = callId;
      setCallInfo({ callId, direction: "inbound", remotePhone: phone, remoteName: name });
      setCallState("ringing");
      startRingtone();
      (window as any).__pendingCallSdp = remoteSdp;
    } catch (e) {
      console.error("Failed to handle incoming call:", e);
      cleanup();
    }
  }, [cleanup, startRingtone]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const currentCallId = callIdRef.current;
    if (!currentCallId) {
      console.error("acceptCall: No call_id available — cannot accept");
      cleanup();
      throw new Error("No active call to accept");
    }

    try {
      stopRingtone();
      setCallState("connecting");
      const pc = await createPeerConnection();
      const remoteSdp = (window as any).__pendingCallSdp;
      delete (window as any).__pendingCallSdp;

      if (remoteSdp) {
        await pc.setRemoteDescription({ type: "offer", sdp: remoteSdp });
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") { resolve(); return; }
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") resolve();
        };
        setTimeout(resolve, 3000);
      });

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("Failed to create SDP answer");

      const { data: preData, error: preError } = await supabase.functions.invoke("whatsapp-call", {
        body: { action: "pre_accept", call_id: currentCallId, sdp },
      });
      if (preError || !preData?.success) {
        console.warn("pre_accept failed (non-fatal):", preData?.error || preError);
      }

      const { data, error } = await supabase.functions.invoke("whatsapp-call", {
        body: { action: "accept", call_id: currentCallId },
      });

      if (error || !data?.success) throw new Error(data?.error || "Failed to accept call");
    } catch (e) {
      console.error("Accept call failed:", e);
      cleanup();
      throw e;
    }
  }, [createPeerConnection, cleanup, stopRingtone]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    try {
      if (callIdRef.current) {
        await supabase.functions.invoke("whatsapp-call", {
          body: { action: "reject", call_id: callIdRef.current },
        });
      }
    } catch (e) {
      console.error("Reject call failed:", e);
    } finally {
      cleanup();
    }
  }, [cleanup]);

  // Terminate active call
  const terminateCall = useCallback(async () => {
    try {
      setCallState("ending");
      if (callIdRef.current) {
        await supabase.functions.invoke("whatsapp-call", {
          body: { action: "terminate", call_id: callIdRef.current },
        });
      }
    } catch (e) {
      console.error("Terminate call failed:", e);
    } finally {
      cleanup();
    }
  }, [cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  }, []);

  // Apply remote SDP answer (for outbound calls when Meta sends back answer)
  const applyRemoteSdp = useCallback(async (sdp: string, type: RTCSdpType = "answer") => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription({ type, sdp });
    }
  }, []);

  // Request call permission
  const requestCallPermission = useCallback(async (phone: string, message?: string) => {
    const phoneClean = phone.replace(/[^0-9]/g, "");
    const { data, error } = await supabase.functions.invoke("whatsapp-call", {
      body: { action: "request_permission", to: phoneClean, message },
    });
    if (error || !data?.success) throw new Error(data?.error || "Failed to request permission");
    return data;
  }, []);

  // Deduplicate incoming calls
  const processedCallIds = useRef(new Set<string>());

  // Listen for call events via Supabase Realtime broadcast.
  // Only subscribe when calls are globally enabled.
  // callState is intentionally NOT in the dep array — callStateRef is used inside
  // the handler instead so the channel is not rebuilt on every state transition.
  useEffect(() => {
    if (!callsEnabled) return;

    const channel = supabase
      .channel("wa-calls")
      .on("broadcast", { event: "incoming_call" }, (payload: any) => {
        const { call_id, sdp, from_phone, from_name } = payload.payload || {};
        if (call_id && sdp && callStateRef.current === "idle" && !processedCallIds.current.has(call_id)) {
          processedCallIds.current.add(call_id);
          handleIncomingCall(call_id, sdp, from_phone, from_name);
        }
      })
      .on("broadcast", { event: "call_connect" }, (payload: any) => {
        const { sdp } = payload.payload || {};
        if (sdp) {
          applyRemoteSdp(sdp);
        }
      })
      .on("broadcast", { event: "call_terminate" }, () => {
        cleanup();
      })
      .on("broadcast", { event: "call_status" }, (payload: any) => {
        const { status } = payload.payload || {};
        if (status === "REJECTED" || status === "MISSED") cleanup();
        else if (status === "ACCEPTED") setCallState("connecting");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      processedCallIds.current.clear();
    };
  }, [callsEnabled, handleIncomingCall, applyRemoteSdp, cleanup]);

  return {
    callState,
    callInfo,
    duration,
    isMuted,
    callsEnabled,
    initiateCall,
    handleIncomingCall,
    acceptCall,
    rejectCall,
    terminateCall,
    toggleMute,
    applyRemoteSdp,
    requestCallPermission,
    cleanup,
  };
}
