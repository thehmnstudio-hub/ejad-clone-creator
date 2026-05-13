import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useChatPanel } from "@/hooks/useChatPanel";
import { useWhatsAppCall } from "@/hooks/useWhatsAppCall";
import {
  MessageCircle, Send, Phone, PhoneCall, User, Search,
  ArrowLeft, Check, CheckCheck, X, Plus,
  Maximize2, Minimize2, Loader2, Smile, PanelRightClose,
  Paperclip, Image, FileText, Mic, MicOff, Copy, Reply, Forward,
  Bot, Zap, ExternalLink, Video, Star, Archive, Tag,
  MoreVertical, Filter, Settings, Trash2, ArrowUpDown, PhoneIncoming, PhoneOutgoing,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// --- Types ---
interface Conversation {
  id: string;
  wa_id: string;
  contact_name: string | null;
  contact_phone: string;
  last_message_at: string;
  lead_id: string | null;
  labels?: string[];
  is_archived?: boolean;
  assigned_to?: string | null;
  unread_count?: number;
  last_message?: string | null;
  last_sender_direction?: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: string;
  message_type: string;
  content: string | null;
  status: string | null;
  created_at: string;
  media_url: string | null;
  wa_message_id: string | null;
  is_starred?: boolean;
  metadata?: any;
}

interface LeadInfo {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  funnel: string;
  lead_status: string | null;
  company: string | null;
  city: string | null;
}

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface CallLogEntry {
  id: string;
  direction: string;
  status: string;
  duration_seconds: number | null;
  created_at: string;
  wa_id: string | null;
  conversation_id: string | null;
  contact_name?: string;
}

// --- Constants ---
const EMOJI_LIST = [
  "😊", "😂", "❤️", "👍", "🙏", "😍", "🔥", "✅",
  "👋", "🎉", "💯", "😁", "🤝", "⭐", "💪", "🙌",
  "😄", "🥰", "😎", "🤗", "👏", "💐", "🌟", "✨",
];

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const PAGE_SIZE = 60;

const LABEL_COLORS: Record<string, string> = {
  primary: "bg-indigo-600 text-white",
  unread: "bg-orange-500 text-white",
  new: "bg-blue-500 text-white",
  call: "bg-rose-500 text-white",
  regular: "bg-emerald-500 text-white",
  hot: "bg-red-600 text-white",
  follow_up: "bg-amber-500 text-white",
  qualified: "bg-teal-500 text-white",
  vip: "bg-purple-600 text-white",
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-orange-500",
    "bg-cyan-500", "bg-fuchsia-500", "bg-lime-600", "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatRelativeTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 86400000) return format(d, "HH:mm");
    if (diff < 604800000) return format(d, "EEE");
    return format(d, "dd/MM/yy");
  } catch { return ""; }
};

const formatCallDuration = (secs: number | null) => {
  if (!secs || secs === 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const getLabelBadgeClass = (label: string) => {
  const key = label.toLowerCase().replace(/\s+/g, "_");
  return LABEL_COLORS[key] || "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
};

type PanelView = "list" | "chat";
type InboxFilter = "all" | "unread" | "archived";
type SortOption = "recent" | "oldest" | "unread";

export function WhatsAppChat() {
  const { toast } = useToast();
  const { close, setTotalUnread, selectedPhone } = useChatPanel();
  const { initiateCall, requestCallPermission } = useWhatsAppCall();
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [panelView, setPanelView] = useState<PanelView>("list");
  const [fullscreen, setFullscreen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const convListRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Media
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string; type: string } | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reply & Forward
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState("");
  const [forwardSending, setForwardSending] = useState(false);

  // Reaction picker
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);

  // Contact panel
  const [linkedLead, setLinkedLead] = useState<LeadInfo | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(false);

  // Lead enrichment map for chat list (lead_id -> {funnel, lead_status})
  const [leadEnrichMap, setLeadEnrichMap] = useState<Record<string, { funnel: string; lead_status: string | null }>>({});

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Inbox filter
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [funnelFilter, setFunnelFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertForm, setConvertForm] = useState({ full_name: "", email: "", funnel: "Silicon Valley" });

   // Label management
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");

  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [callLog, setCallLog] = useState<CallLogEntry[]>([]);
  const [saveAllCalls, setSaveAllCalls] = useState(true);
  const [autoRecordCalls, setAutoRecordCalls] = useState(false);

  // Message caching
  const messagesCacheRef = useRef<Record<string, Message[]>>({});
  const lastLoadedConvRef = useRef<string>("");
  const selectedConvRef = useRef<Conversation | null>(null);
  selectedConvRef.current = selectedConv;

  // 24h window detection
  const isWindowExpired = useMemo(() => {
    if (!selectedConv) return false;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].direction === "inbound") {
        return (Date.now() - new Date(messages[i].created_at).getTime()) > 24 * 60 * 60 * 1000;
      }
    }
    return true;
  }, [selectedConv?.id, messages.length > 0 ? messages[messages.length - 1]?.id : null]);

  // Load current user profile name
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (name) { setCurrentUserName(name); return; }
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        setCurrentUserName(profile?.full_name || user.email?.split("@")[0] || "Agent");
      }
    };
    loadUser();
  }, []);

  // --- Conversation loading with debounced realtime ---
  useEffect(() => {
    loadConversations();
    loadQuickReplies();

    const pendingUpdates: Record<string, Conversation> = {};
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const flushUpdates = () => {
      const updates = { ...pendingUpdates };
      for (const key of Object.keys(pendingUpdates)) delete pendingUpdates[key];
      const entries = Object.values(updates);
      if (entries.length === 0) return;
      setConversations(prev => {
        const next = [...prev];
        for (const updated of entries) {
          const idx = next.findIndex(c => c.id === updated.id);
          if (idx >= 0) next[idx] = { ...next[idx], ...updated };
          else next.unshift(updated);
        }
        return next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      });
      // Update selected conv if matches
      for (const updated of entries) {
        if (selectedConvRef.current?.id === updated.id) {
          setSelectedConv(prev => prev ? { ...prev, ...updated } : prev);
        }
      }
    };

    const channel = supabase
      .channel("wa-conv-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations" }, (payload) => {
        const updated = payload.new as Conversation;
        if (updated?.id) {
          pendingUpdates[updated.id] = updated;
          if (flushTimer) clearTimeout(flushTimer);
          flushTimer = setTimeout(flushUpdates, 300);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (flushTimer) clearTimeout(flushTimer);
    };
  }, []);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("id,wa_id,contact_phone,contact_name,last_message,last_message_at,unread_count,lead_id,is_archived,labels,assigned_to,last_sender_direction,created_at,updated_at")
      .order("last_message_at", { ascending: false })
      .limit(500);
    if (data) {
      setConversations(data as Conversation[]);
      const totalUnread = (data as Conversation[]).reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setTotalUnread(totalUnread);

      // Enrich with lead funnel/status
      const leadIds = (data as Conversation[]).filter(c => c.lead_id).map(c => c.lead_id!);
      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from("leads")
          .select("id, funnel, lead_status")
          .in("id", leadIds.slice(0, 200));
        if (leads) {
          const map: Record<string, { funnel: string; lead_status: string | null }> = {};
          for (const l of leads) map[l.id] = { funnel: l.funnel, lead_status: l.lead_status };
          setLeadEnrichMap(map);
        }
      }
    }
  };

  const loadQuickReplies = async () => {
    const { data } = await supabase.from("quick_replies").select("id,title,content,category").order("title");
    if (data) setQuickReplies(data as QuickReply[]);
  };

  // --- External phone trigger ---
  useEffect(() => {
    if (selectedPhone) {
      const cleanPhone = selectedPhone.replace(/[^0-9]/g, "");
      const conv = conversations.find(c => c.wa_id === cleanPhone || c.contact_phone.includes(cleanPhone));
      if (conv) selectConversation(conv);
    }
  }, [selectedPhone, conversations.length]);

  // --- Messages loading with caching ---
  useEffect(() => {
    if (!selectedConv) return;
    if (lastLoadedConvRef.current === selectedConv.id) return;
    lastLoadedConvRef.current = selectedConv.id;

    // Show cached messages instantly
    const cached = messagesCacheRef.current[selectedConv.id];
    if (cached) {
      setMessages(cached);
      setHasMoreMessages(cached.length >= PAGE_SIZE);
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("id,conversation_id,direction,content,message_type,media_url,status,wa_message_id,is_starred,metadata,created_at")
        .eq("conversation_id", selectedConv.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (data) {
        const msgs = (data as Message[]).reverse();
        setMessages(msgs);
        setHasMoreMessages(data.length === PAGE_SIZE);
        messagesCacheRef.current[selectedConv.id] = msgs;
      }
    };
    loadMessages();
    loadContactInfo(selectedConv);

    // Send read receipt (blue ticks)
    supabase.functions.invoke("mark-read", {
      body: { conversation_id: selectedConv.id, action: "read" },
    }).catch(() => {});

    // Reset unread in local state
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, unread_count: 0 } : c));

    const channels: any[] = [];

    const msgChannel = supabase
      .channel(`wa-msgs-${selectedConv.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "whatsapp_messages",
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          const hasOptimistic = prev.some(m => m.id.startsWith("optimistic-") && m.content === newMsg.content);
          if (hasOptimistic) return prev.map(m => m.id.startsWith("optimistic-") && m.content === newMsg.content ? newMsg : m);
          if (prev.some(m => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          messagesCacheRef.current[selectedConv.id] = updated;
          return updated;
        });
        // Auto-send read receipt for new inbound messages
        if (newMsg.direction === "inbound") {
          supabase.functions.invoke("mark-read", {
            body: { conversation_id: selectedConv.id, action: "read" },
          }).catch(() => {});
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "whatsapp_messages",
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, (payload) => {
        const updatedMsg = payload.new as Message;
        setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
      })
      .subscribe();
    channels.push(msgChannel);

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [selectedConv?.id]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (!selectedConv || loadingMore || !hasMoreMessages || messages.length === 0) return;
    setLoadingMore(true);
    const oldestMsg = messages[0];
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("id,conversation_id,direction,content,message_type,media_url,status,wa_message_id,is_starred,metadata,created_at")
      .eq("conversation_id", selectedConv.id)
      .lt("created_at", oldestMsg.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (data && data.length > 0) {
      const older = (data as Message[]).reverse();
      setHasMoreMessages(data.length === PAGE_SIZE);
      setMessages(prev => {
        const updated = [...older, ...prev];
        messagesCacheRef.current[selectedConv.id] = updated;
        return updated;
      });
    } else {
      setHasMoreMessages(false);
    }
    setLoadingMore(false);
  };

  // Auto-scroll
  const prevMsgCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages.length === 0) { prevMsgCountRef.current = 0; return; }
    const behavior = prevMsgCountRef.current === 0 ? "instant" : "smooth";
    prevMsgCountRef.current = messages.length;
    messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior });
  }, [messages.length]);

  // --- Contact info ---
  const loadContactInfo = async (conv: Conversation) => {
    setLinkedLead(null);
    if (conv.lead_id) {
      const { data } = await supabase.from("leads").select("id, full_name, email, phone, funnel, lead_status, company, city").eq("id", conv.lead_id).maybeSingle();
      if (data) { setLinkedLead(data as LeadInfo); return; }
    }
    if (conv.contact_phone) {
      const cleanPhone = conv.contact_phone.replace(/[^0-9]/g, "");
      const variants = [conv.contact_phone, "+" + cleanPhone, cleanPhone];
      for (const ph of variants) {
        const { data } = await supabase.from("leads").select("id, full_name, email, phone, funnel, lead_status, company, city").eq("phone", ph).limit(1).maybeSingle();
        if (data) {
          setLinkedLead(data as LeadInfo);
          supabase.from("whatsapp_conversations").update({ lead_id: data.id, contact_name: data.full_name }).eq("id", conv.id).then();
          return;
        }
      }
    }
  };

  // --- Conversation actions ---
  const selectConversation = useCallback((conv: Conversation) => {
    lastLoadedConvRef.current = "";
    setSelectedConv(conv);
    setPanelView("chat");
    setReplyTo(null);
    setReactionMsgId(null);
  }, []);

  // --- Send message ---
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || !selectedConv) return;
    if (!overrideText) setInputText("");
    const currentReply = replyTo;
    setReplyTo(null);
    setSending(true);

    const nowIso = new Date().toISOString();
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: selectedConv.id,
      direction: "outbound",
      message_type: "text",
      content: text,
      status: "sending",
      created_at: nowIso,
      media_url: null,
      wa_message_id: null,
      metadata: currentUserName ? { sender_name: currentUserName } : {},
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const body: any = { to: selectedConv.contact_phone, message: text, conversation_id: selectedConv.id, sender_name: currentUserName || undefined };
      if (currentReply?.wa_message_id) body.reply_to_wa_id = currentReply.wa_message_id;
      const { error } = await supabase.functions.invoke("send-whatsapp", { body });
      if (error) throw error;
      textareaRef.current?.focus();
    } catch (err: any) {
      console.error("Send error:", err);
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
      // Mark optimistic as failed
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, status: "failed" } : m));
      if (!overrideText) setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // --- Send reaction ---
  const sendReaction = async (msgWaId: string, emoji: string) => {
    if (!selectedConv) return;
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: selectedConv.contact_phone,
          conversation_id: selectedConv.id,
          reaction: { message_id: msgWaId, emoji },
        },
      });
    } catch (e: any) {
      toast({ title: "Reaction failed", description: e.message, variant: "destructive" });
    }
    setReactionMsgId(null);
  };

  // --- Star message ---
  const toggleStar = async (msg: Message) => {
    const newStarred = !msg.is_starred;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_starred: newStarred } : m));
    await supabase.from("whatsapp_messages").update({ is_starred: newStarred }).eq("id", msg.id);
  };

  // --- Send media ---
  const sendMedia = async (file: File, type: string, captionText?: string) => {
    if (!selectedConv) return;
    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${selectedConv.id}/${Date.now()}.${ext}`;
      const contentType = file.type || "application/octet-stream";
      const { error: uploadErr } = await supabase.storage.from("chat-media").upload(path, file, { contentType });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
      const { error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to: selectedConv.contact_phone, conversation_id: selectedConv.id, media_url: urlData.publicUrl, media_type: type, caption: captionText || "", sender_name: currentUserName || undefined },
      });
      if (error) throw error;
      toast({ title: `${type} sent` });
    } catch (e: any) {
      console.error("Media send failed:", e);
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploadingMedia(false);
    setMediaPreview(null);
    setMediaCaption("");
  };

  // --- Voice recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeOptions = ["audio/ogg;codecs=opus", "audio/ogg", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
      const mimeType = mimeOptions.find(m => MediaRecorder.isTypeSupported(m)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordedAudio({ blob, url: URL.createObjectURL(blob) });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudio(null);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordedAudio(null);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudio) return;
    const mime = recordedAudio.blob.type.toLowerCase();
    const ext = mime.includes("ogg") || mime.includes("opus") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm";
    const file = new File([recordedAudio.blob], `voicenote-${Date.now()}.${ext}`, { type: recordedAudio.blob.type });
    URL.revokeObjectURL(recordedAudio.url);
    setRecordedAudio(null);
    setRecordingDuration(0);
    await sendMedia(file, "audio");
  };

  // --- Forward ---
  const forwardToConversation = async (targetConv: Conversation) => {
    if (!forwardMsg || forwardSending) return;
    setForwardSending(true);
    const text = `↪ Forwarded:\n${forwardMsg.content || ""}`;
    try {
      const { error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to: targetConv.contact_phone, message: text, conversation_id: targetConv.id },
      });
      if (error) throw error;
      toast({ title: `Forwarded to ${targetConv.contact_name || targetConv.contact_phone}` });
      setForwardMsg(null);
      setForwardSearch("");
    } catch (e: any) {
      toast({ title: "Forward failed", description: e.message, variant: "destructive" });
    } finally {
      setForwardSending(false);
    }
  };

  const copyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.content || "");
    toast({ title: "Copied to clipboard" });
  };

  // --- Labels ---
  const addLabel = async (convId: string, label: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const current = conv.labels || [];
    if (current.includes(label)) return;
    const updated = [...current, label];
    await supabase.from("whatsapp_conversations").update({ labels: updated }).eq("id", convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, labels: updated } : c));
    if (selectedConv?.id === convId) setSelectedConv(prev => prev ? { ...prev, labels: updated } : prev);
  };

  const removeLabel = async (convId: string, label: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const updated = (conv.labels || []).filter(l => l !== label);
    await supabase.from("whatsapp_conversations").update({ labels: updated }).eq("id", convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, labels: updated } : c));
    if (selectedConv?.id === convId) setSelectedConv(prev => prev ? { ...prev, labels: updated } : prev);
  };

  // --- Archive ---
  const toggleArchive = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const newVal = !conv.is_archived;
    await supabase.from("whatsapp_conversations").update({ is_archived: newVal }).eq("id", convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, is_archived: newVal } : c));
    toast({ title: newVal ? "Archived" : "Unarchived" });
  };

  // --- New chat ---
  const handleNewChat = async () => {
    if (!newChatPhone.trim()) return;
    setSending(true);
    try {
      const cleanPhone = newChatPhone.replace(/[^0-9+]/g, "");
      const waId = cleanPhone.replace(/[^0-9]/g, "");
      const { data: existing } = await supabase.from("whatsapp_conversations").select("id,wa_id,contact_phone,contact_name,last_message,last_message_at,unread_count,lead_id,is_archived,labels,assigned_to,last_sender_direction,created_at,updated_at").eq("wa_id", waId).maybeSingle();
      if (existing) {
        selectConversation(existing as Conversation);
      } else {
        const { data: newConv } = await supabase
          .from("whatsapp_conversations")
          .insert({ wa_id: waId, contact_phone: cleanPhone, contact_name: null })
          .select().single();
        if (newConv) selectConversation(newConv as Conversation);
      }
      setShowNewChat(false);
      setNewChatPhone("");
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  // --- Call actions ---
  const handleInitiateCall = async () => {
    if (!selectedConv) return;
    try {
      const phoneClean = selectedConv.contact_phone.replace(/[^0-9]/g, "");
      await requestCallPermission(phoneClean, "We'd like to call you. Please allow us to reach you via WhatsApp call.");
      toast({ title: "Call permission requested" });
    } catch (err: any) {
      toast({ title: "Call failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDirectCall = async () => {
    if (!selectedConv) return;
    try {
      await initiateCall(selectedConv.contact_phone, selectedConv.contact_name || undefined);
      toast({ title: "Calling..." });
    } catch (err: any) {
      toast({ title: "Call failed", description: err.message, variant: "destructive" });
    }
  };

  // --- Load call log ---
  const loadCallLog = async () => {
    const { data } = await supabase
      .from("whatsapp_calls")
      .select("id,wa_id,conversation_id,direction,status,duration_seconds,call_id,created_at,ended_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      // Enrich with contact names from conversations
      const enriched: CallLogEntry[] = [];
      for (const call of data) {
        let contactName = call.wa_id || "Unknown";
        if (call.conversation_id) {
          const conv = conversations.find(c => c.id === call.conversation_id);
          if (conv) contactName = conv.contact_name || conv.contact_phone;
        }
        enriched.push({ ...call, contact_name: contactName } as CallLogEntry);
      }
      setCallLog(enriched);
    }
  };

  // --- File handler ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview({ file, url: URL.createObjectURL(file), type });
    e.target.value = "";
  };

  // --- Computed ---
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by inbox tab
    if (inboxFilter === "unread") filtered = filtered.filter(c => (c.unread_count || 0) > 0);
    else if (inboxFilter === "archived") filtered = filtered.filter(c => c.is_archived);
    else filtered = filtered.filter(c => !c.is_archived);

    // Label filter
    if (labelFilter) {
      filtered = filtered.filter(c => (c.labels || []).includes(labelFilter));
    }

    // Funnel filter
    if (funnelFilter) {
      filtered = filtered.filter(c => c.lead_id && leadEnrichMap[c.lead_id]?.funnel === funnelFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(c => c.lead_id && leadEnrichMap[c.lead_id]?.lead_status === statusFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.contact_name?.toLowerCase().includes(q) || c.contact_phone.includes(q) ||
        c.last_message?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortOption === "oldest") {
      filtered = [...filtered].sort((a, b) => new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime());
    } else if (sortOption === "unread") {
      filtered = [...filtered].sort((a, b) => (b.unread_count || 0) - (a.unread_count || 0));
    }

    return filtered;
  }, [conversations, search, inboxFilter, sortOption, labelFilter, funnelFilter, statusFilter, leadEnrichMap]);

  // Virtualizer for the conversation list
  const convVirtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => convListRef.current,
    estimateSize: () => 84,
    overscan: 8,
  });

  // Collect all unique labels for filter dropdown
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach(c => (c.labels || []).forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [conversations]);

  const statusIcon = (status: string | null) => {
    switch (status) {
      case "sent": return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered": return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read": return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "sending": return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
      case "failed": return <X className="h-3 w-3 text-destructive" />;
      default: return null;
    }
  };

  const isCallMessage = (type: string) => ["call_request", "call_button", "call_event"].includes(type);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const getDateLabel = (dateStr: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return format(new Date(dateStr), "MMMM d, yyyy");
  };

  const forwardFilteredConversations = useMemo(() => {
    if (!forwardSearch) return conversations.filter(c => c.id !== selectedConv?.id).slice(0, 10);
    const q = forwardSearch.toLowerCase();
    return conversations.filter(c =>
      c.id !== selectedConv?.id && (c.contact_name?.toLowerCase().includes(q) || c.contact_phone.includes(q))
    ).slice(0, 10);
  }, [conversations, forwardSearch, selectedConv?.id]);

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-amber-100 text-amber-700",
    qualified: "bg-emerald-100 text-emerald-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
    irrelevant: "bg-gray-100 text-gray-600",
  };

  // --- Render: Conversation List ---
  const renderList = () => {
    const totalConvs = conversations.filter(c => !c.is_archived).length;
    const unreadConvs = conversations.filter(c => (c.unread_count || 0) > 0 && !c.is_archived);
    const unreadCount = unreadConvs.length;

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Inbox header - Farms CRM style */}
        <div className="px-3 pt-3 pb-2 border-b shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">Inbox</h3>
              {totalConvs > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">
                  {totalConvs}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setShowSettings(true); loadCallLog(); }}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={close}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Filter tabs row - like Farms CRM */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {(
              [
                { key: "all" as InboxFilter, label: "All", count: totalConvs },
                { key: "unread" as InboxFilter, label: "Unread", count: unreadCount },
                { key: "archived" as InboxFilter, label: "Archived", count: conversations.filter(c => c.is_archived).length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap flex items-center gap-1",
                  inboxFilter === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                onClick={() => setInboxFilter(tab.key)}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1",
                    inboxFilter === tab.key
                      ? "bg-primary-foreground/20"
                      : "bg-background"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
            {/* Label filters */}
            {allLabels.slice(0, 3).map(l => (
              <button
                key={l}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap",
                  labelFilter === l
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                onClick={() => setLabelFilter(labelFilter === l ? null : l)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Search + sort/filter icons */}
          <div className="flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Filter className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {allLabels.map(l => (
                  <DropdownMenuItem key={l} className="text-xs" onClick={() => setLabelFilter(labelFilter === l ? null : l)}>
                    {labelFilter === l && <Check className="h-3 w-3 mr-1" />} {l}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs font-medium" disabled>Funnel</DropdownMenuItem>
                {["Silicon Valley", "Company Formation", "Visa Desk"].map(f => (
                  <DropdownMenuItem key={f} className="text-xs" onClick={() => setFunnelFilter(funnelFilter === f ? null : f)}>
                    {funnelFilter === f && <Check className="h-3 w-3 mr-1" />} {f}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs font-medium" disabled>Status</DropdownMenuItem>
                {["Open", "Connected", "Qualified", "Unqualified", "Not interested"].map(s => (
                  <DropdownMenuItem key={s} className="text-xs" onClick={() => setStatusFilter(statusFilter === s ? null : s)}>
                    {statusFilter === s && <Check className="h-3 w-3 mr-1" />} {s}
                  </DropdownMenuItem>
                ))}
                {allLabels.length === 0 && (
                  <DropdownMenuItem className="text-xs text-muted-foreground" disabled>No labels</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem className="text-xs" onClick={() => setSortOption("recent")}>
                  {sortOption === "recent" && <Check className="h-3 w-3 mr-1" />} Most Recent
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => setSortOption("oldest")}>
                  {sortOption === "oldest" && <Check className="h-3 w-3 mr-1" />} Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => setSortOption("unread")}>
                  {sortOption === "unread" && <Check className="h-3 w-3 mr-1" />} Unread First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowNewChat(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(labelFilter || funnelFilter || statusFilter || sortOption !== "recent") && (
          <div className="px-3 py-1 flex gap-1 flex-wrap border-b shrink-0">
            {sortOption !== "recent" && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1 cursor-pointer" onClick={() => setSortOption("recent")}>
                {sortOption === "oldest" ? "Oldest" : "Unread"} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            {labelFilter && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1 cursor-pointer" onClick={() => setLabelFilter(null)}>
                {labelFilter} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            {funnelFilter && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1 cursor-pointer" onClick={() => setFunnelFilter(null)}>
                {funnelFilter} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
            {statusFilter && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1 cursor-pointer" onClick={() => setStatusFilter(null)}>
                {statusFilter} <X className="h-2.5 w-2.5" />
              </Badge>
            )}
          </div>
        )}

        {showNewChat && (
          <div className="p-3 border-b bg-muted/30 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">New Conversation</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowNewChat(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Input placeholder="+923001234567" value={newChatPhone} onChange={(e) => setNewChatPhone(e.target.value)} className="h-8 text-sm" />
              <Button size="sm" className="h-8" onClick={handleNewChat} disabled={sending}>Start</Button>
            </div>
          </div>
        )}

        {/* Conversation list — virtualized */}
        <div ref={convListRef} className="flex-1 min-h-0 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              {search ? "No results" : inboxFilter === "archived" ? "No archived conversations" : "No conversations yet"}
            </div>
          ) : (
            <div style={{ height: `${convVirtualizer.getTotalSize()}px`, position: "relative" }}>
              {convVirtualizer.getVirtualItems().map((virtualItem) => {
                const conv = filteredConversations[virtualItem.index];
                const initials = (conv.contact_name || conv.contact_phone || "?")
                  .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                const unread = conv.unread_count || 0;
                const labels = conv.labels || [];
                const isInbound = conv.last_sender_direction === "inbound";

                return (
                  <div
                    key={virtualItem.key}
                    ref={convVirtualizer.measureElement}
                    data-index={virtualItem.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-muted/50 border-b border-border/30 transition-colors flex items-start gap-2.5",
                        selectedConv?.id === conv.id && "bg-muted"
                      )}
                      onClick={() => selectConversation(conv)}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn("text-white text-xs font-bold", getAvatarColor(conv.contact_name || conv.contact_phone))}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-[#25D366] text-white text-[8px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-0.5 border-2 border-background">
                            {unread}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className={cn("text-sm truncate", unread > 0 ? "font-bold" : "font-medium")}>{conv.contact_name || conv.contact_phone}</p>
                          <span className={cn("text-[10px] ml-2 shrink-0", unread > 0 ? "text-[#25D366] font-semibold" : "text-muted-foreground")}>
                            {formatRelativeTime(conv.last_message_at)}
                          </span>
                        </div>

                        {/* Message preview */}
                        <div className="flex items-center gap-1 mt-0.5">
                          {!isInbound && conv.last_message && (
                            <CheckCheck className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                          <p className={cn("text-xs truncate", unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {conv.last_message || conv.contact_phone}
                          </p>
                        </div>

                        {/* Lead enrichment tags */}
                        {conv.lead_id && leadEnrichMap[conv.lead_id] && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-semibold leading-none",
                              leadEnrichMap[conv.lead_id].funnel === "silicon_valley" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" :
                              leadEnrichMap[conv.lead_id].funnel === "inc" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                              leadEnrichMap[conv.lead_id].funnel === "visa" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" :
                              "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            )}>
                              {leadEnrichMap[conv.lead_id].funnel === "silicon_valley" ? "Silicon Valley" :
                               leadEnrichMap[conv.lead_id].funnel === "inc" ? "Company Formation" :
                               leadEnrichMap[conv.lead_id].funnel === "visa" ? "Visa" :
                               leadEnrichMap[conv.lead_id].funnel}
                            </span>
                            {leadEnrichMap[conv.lead_id].lead_status && (
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-semibold leading-none",
                                leadEnrichMap[conv.lead_id].lead_status === "Qualified" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                leadEnrichMap[conv.lead_id].lead_status === "Connected" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                leadEnrichMap[conv.lead_id].lead_status === "Not interested" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                leadEnrichMap[conv.lead_id].lead_status === "Unqualified" ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" :
                                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              )}>
                                {leadEnrichMap[conv.lead_id].lead_status}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Labels */}
                        {labels.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {labels.slice(0, 4).map((l: string) => (
                              <span key={l} className={cn("text-[9px] px-1.5 py-0.5 rounded font-semibold leading-none", getLabelBadgeClass(l))}>
                                {l}
                              </span>
                            ))}
                            {labels.length > 4 && <span className="text-[9px] text-muted-foreground">+{labels.length - 4}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Render: Media message ---
  const renderMediaContent = (msg: Message) => {
    if (msg.media_url) {
      const isImage = msg.message_type === "image" || msg.media_url.match(/\.(jpg|jpeg|png|gif|webp)/i);
      const isVideo = msg.message_type === "video" || msg.media_url.match(/\.(mp4|mov|avi)/i);
      const isAudio = msg.message_type === "audio" || msg.media_url.match(/\.(ogg|mp3|m4a|webm)/i);

      if (isImage) {
        return (
          <div>
            <img src={msg.media_url} alt="media" className="max-w-full rounded-md max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.media_url!, "_blank")} />
            {msg.content && msg.content !== "[Image]" && <p className="whitespace-pre-wrap break-words text-[13px] mt-1">{msg.content}</p>}
          </div>
        );
      }
      if (isVideo) {
        return (
          <div>
            <video src={msg.media_url} controls className="max-w-full rounded-md max-h-48" />
            {msg.content && msg.content !== "[Video]" && <p className="whitespace-pre-wrap break-words text-[13px] mt-1">{msg.content}</p>}
          </div>
        );
      }
      if (isAudio) {
        return <audio src={msg.media_url} controls className="max-w-full" />;
      }
      return (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-[13px]">
          <FileText className="h-4 w-4" /> Download file
        </a>
      );
    }
    return null;
  };

  // --- Render: Chat View ---
  const renderChat = () => {
    if (!selectedConv) return null;

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="h-14 px-3 flex items-center gap-3 border-b bg-card shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPanelView("list"); setSelectedConv(null); lastLoadedConvRef.current = ""; setLinkedLead(null); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className={cn("text-white text-xs font-bold", getAvatarColor(selectedConv.contact_name || selectedConv.contact_phone))}>
              {(selectedConv.contact_name || selectedConv.contact_phone || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowContactPanel(true)}>
            <p className="text-sm font-medium truncate">{selectedConv.contact_name || selectedConv.contact_phone}</p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground truncate">{selectedConv.contact_phone}</p>
              {isWindowExpired && <Badge variant="outline" className="text-[9px] h-3.5 border-amber-400 text-amber-600">24h expired</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowContactPanel(!showContactPanel)}>
              <User className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-[#25D366] hover:text-green-700 hover:bg-green-50">
                  <Phone className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDirectCall}>
                  <PhoneCall className="h-4 w-4 mr-2" /> Direct call (WebRTC)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInitiateCall}>
                  <Phone className="h-4 w-4 mr-2" /> Request call permission
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleArchive(selectedConv.id)}>
                  <Archive className="h-4 w-4 mr-2" /> {selectedConv.is_archived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowLabelInput(true)}>
                  <Tag className="h-4 w-4 mr-2" /> Add label
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Labels bar */}
        {((selectedConv.labels || []).length > 0 || showLabelInput) && (
          <div className="px-3 py-1 border-b flex items-center gap-1 flex-wrap shrink-0">
            {(selectedConv.labels || []).map(l => (
              <Badge key={l} variant="secondary" className="text-[10px] h-5 gap-1">
                {l}
                <button onClick={() => removeLabel(selectedConv.id, l)} className="hover:text-destructive">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            {showLabelInput && (
              <div className="flex items-center gap-1">
                <Input
                  className="h-5 text-[10px] w-24 px-1"
                  placeholder="Label..."
                  value={newLabelText}
                  onChange={e => setNewLabelText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newLabelText.trim()) {
                      addLabel(selectedConv.id, newLabelText.trim());
                      setNewLabelText("");
                      setShowLabelInput(false);
                    }
                  }}
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShowLabelInput(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Messages area */}
          <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0" ref={scrollAreaViewportRef}>
              <div className="p-3 space-y-1">
                {hasMoreMessages && (
                  <div className="text-center py-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={loadMoreMessages} disabled={loadingMore}>
                      {loadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Load earlier messages
                    </Button>
                  </div>
                )}

                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Send the first message!</p>
                )}

                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className="flex justify-center my-2">
                      <span className="bg-muted text-muted-foreground text-[10px] px-3 py-1 rounded-full font-medium">
                        {getDateLabel(group.date)}
                      </span>
                    </div>
                    {group.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex mb-1 group", msg.direction === "outbound" ? "justify-end" : "justify-start")}
                      >
                        {isCallMessage(msg.message_type) ? (
                          <div className="bg-muted/60 border rounded-lg px-3 py-1.5 text-xs text-center max-w-[80%] flex items-center gap-2">
                            <Phone className="h-3 w-3 text-[#25D366]" />
                            <span className="text-muted-foreground">{msg.content}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
                          </div>
                        ) : (
                          <div className="relative max-w-[80%]">
                            {/* Message context actions */}
                            <div className={cn(
                              "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-10",
                              msg.direction === "outbound" ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"
                            )}>
                              <button className="h-6 w-6 flex items-center justify-center rounded bg-card border shadow-sm hover:bg-muted" onClick={() => setReplyTo(msg)} title="Reply">
                                <Reply className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button className="h-6 w-6 flex items-center justify-center rounded bg-card border shadow-sm hover:bg-muted" onClick={() => copyMessage(msg)} title="Copy">
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button className="h-6 w-6 flex items-center justify-center rounded bg-card border shadow-sm hover:bg-muted" onClick={() => setForwardMsg(msg)} title="Forward">
                                <Forward className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button className="h-6 w-6 flex items-center justify-center rounded bg-card border shadow-sm hover:bg-muted" onClick={() => toggleStar(msg)} title="Star">
                                <Star className={cn("h-3 w-3", msg.is_starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                              </button>
                              {msg.direction === "inbound" && msg.wa_message_id && (
                                <button className="h-6 w-6 flex items-center justify-center rounded bg-card border shadow-sm hover:bg-muted" onClick={() => setReactionMsgId(reactionMsgId === msg.id ? null : msg.id)} title="React">
                                  <Smile className="h-3 w-3 text-muted-foreground" />
                                </button>
                              )}
                            </div>

                            {/* Reaction picker */}
                            {reactionMsgId === msg.id && msg.wa_message_id && (
                              <div className={cn(
                                "absolute -top-8 z-20 flex gap-0.5 bg-card border rounded-full px-1.5 py-0.5 shadow-lg",
                                msg.direction === "outbound" ? "right-0" : "left-0"
                              )}>
                                {REACTION_EMOJIS.map(emoji => (
                                  <button key={emoji} className="text-base hover:scale-125 transition-transform px-0.5" onClick={() => sendReaction(msg.wa_message_id!, emoji)}>
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className={cn(
                              "rounded-lg px-3 py-1.5 text-sm shadow-sm",
                              msg.direction === "outbound"
                                ? msg.status === "failed" ? "bg-red-100 dark:bg-red-950/30 rounded-br-sm border border-red-200" : "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-br-sm"
                                : "bg-card border rounded-bl-sm"
                            )}>
                              {msg.is_starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 float-right ml-1" />}
                              {msg.direction === "outbound" && msg.metadata?.sender_name && (
                                <p className="text-[10px] font-semibold text-primary mb-0.5">{msg.metadata.sender_name}</p>
                              )}
                              {renderMediaContent(msg) || (
                                <p className="whitespace-pre-wrap break-words text-[13px]">{msg.content}</p>
                              )}
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span>
                                {msg.direction === "outbound" && statusIcon(msg.status)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-3 py-1.5 border-t bg-muted/30 flex items-center gap-2 shrink-0">
                <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
                  <p className="text-[10px] font-medium text-primary">{replyTo.direction === "inbound" ? selectedConv.contact_name || "Customer" : "You"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{replyTo.content}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setReplyTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Quick replies */}
            {showQuickReplies && quickReplies.length > 0 && (
              <div className="px-2 py-1.5 border-t bg-muted/20 shrink-0 max-h-32 overflow-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Quick Replies</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShowQuickReplies(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-0.5">
                  {quickReplies.map(qr => (
                    <button
                      key={qr.id}
                      className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-muted transition-colors truncate"
                      onClick={() => { handleSend(qr.content); setShowQuickReplies(false); }}
                    >
                      <span className="font-medium">{qr.title}:</span> <span className="text-muted-foreground">{qr.content}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media preview */}
            {mediaPreview && (
              <div className="px-3 py-2 border-t bg-muted/30 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Send {mediaPreview.type}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); setMediaCaption(""); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {mediaPreview.type === "image" && <img src={mediaPreview.url} className="max-h-32 rounded-md" />}
                {mediaPreview.type === "video" && <video src={mediaPreview.url} controls className="max-h-32 rounded-md" />}
                {mediaPreview.type === "document" && <p className="text-xs text-muted-foreground">{mediaPreview.file.name}</p>}
                <div className="flex gap-1">
                  <Input placeholder="Caption (optional)" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} className="h-8 text-sm flex-1" />
                  <Button size="sm" className="h-8 bg-[#25D366] hover:bg-[#128C7E]" onClick={() => sendMedia(mediaPreview.file, mediaPreview.type, mediaCaption)} disabled={uploadingMedia}>
                    {uploadingMedia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Voice recording UI */}
            {(isRecording || recordedAudio) && (
              <div className="px-3 py-2 border-t bg-red-50 dark:bg-red-950/20 shrink-0 flex items-center gap-2">
                {isRecording ? (
                  <>
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-red-600">{Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:{(recordingDuration % 60).toString().padStart(2, "0")}</span>
                    <div className="flex-1" />
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelRecording}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs bg-red-500 hover:bg-red-600" onClick={stopRecording}>Stop</Button>
                  </>
                ) : recordedAudio ? (
                  <>
                    <audio src={recordedAudio.url} controls className="h-8 flex-1" />
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { URL.revokeObjectURL(recordedAudio.url); setRecordedAudio(null); setRecordingDuration(0); }}>Discard</Button>
                    <Button size="sm" className="h-7 text-xs bg-[#25D366] hover:bg-[#128C7E]" onClick={sendRecordedAudio} disabled={uploadingMedia}>
                      {uploadingMedia ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                  </>
                ) : null}
              </div>
            )}

            {/* Compose area */}
            {!isRecording && !recordedAudio && !mediaPreview && (
              <div className="p-2 border-t bg-card shrink-0">
                {/* 24h window warning */}
                {isWindowExpired && (
                  <div className="mb-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-950/20 rounded text-[10px] text-amber-700 dark:text-amber-400">
                    ⚠️ 24h window expired. Only template messages can be sent.
                  </div>
                )}
                <div className="flex items-end gap-1.5">
                  {/* Emoji */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <Smile className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" side="top" align="start">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((e) => (
                          <button key={e} className="text-lg hover:bg-muted rounded p-0.5" onClick={() => { setInputText(prev => prev + e); setShowEmojiPicker(false); }}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Attachments */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start">
                      <DropdownMenuItem onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = (e: any) => handleFileSelect(e, "image"); inp.click(); }}>
                        <Image className="h-4 w-4 mr-2" /> Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "video/*"; inp.onchange = (e: any) => handleFileSelect(e, "video"); inp.click(); }}>
                        <Video className="h-4 w-4 mr-2" /> Video
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "*/*"; inp.onchange = (e: any) => handleFileSelect(e, "document"); inp.click(); }}>
                        <FileText className="h-4 w-4 mr-2" /> Document
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Quick replies toggle */}
                  {quickReplies.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowQuickReplies(!showQuickReplies)}>
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}

                  {/* Text input */}
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 min-h-[36px] max-h-[120px] resize-none text-sm py-2"
                    rows={1}
                    disabled={sending}
                  />

                  {/* Voice or Send */}
                  {inputText.trim() ? (
                    <Button
                      size="icon"
                      className="h-8 w-8 shrink-0 bg-[#25D366] hover:bg-[#128C7E]"
                      onClick={() => handleSend()}
                      disabled={sending}
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={startRecording}
                    >
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact panel */}
          {showContactPanel && (
            <div className="w-56 min-h-0 border-l bg-card shrink-0 overflow-auto p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Contact Info</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowContactPanel(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-center space-y-1">
                <Avatar className="h-14 w-14 mx-auto">
                  <AvatarFallback className={cn("text-white text-lg font-bold", getAvatarColor(selectedConv.contact_name || selectedConv.contact_phone))}>
                    {(selectedConv.contact_name || selectedConv.contact_phone || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{selectedConv.contact_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{selectedConv.contact_phone}</p>
              </div>

              {/* Labels */}
              {(selectedConv.labels || []).length > 0 && (
                <div className="border-t pt-2 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Labels</span>
                  <div className="flex flex-wrap gap-1">
                    {(selectedConv.labels || []).map(l => (
                      <Badge key={l} variant="secondary" className="text-[10px] h-5">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {linkedLead ? (
                <div className="space-y-2 border-t pt-2">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Linked Lead</span>
                  <div className="space-y-1.5">
                    <div className="text-xs"><span className="text-muted-foreground">Name:</span> {linkedLead.full_name}</div>
                    <div className="text-xs"><span className="text-muted-foreground">Email:</span> {linkedLead.email}</div>
                    <div className="text-xs"><span className="text-muted-foreground">Funnel:</span>
                      <Badge variant="outline" className="ml-1 text-[10px] h-4">{linkedLead.funnel}</Badge>
                    </div>
                    {linkedLead.lead_status && (
                      <div className="text-xs"><span className="text-muted-foreground">Status:</span>
                        <Badge className={cn("ml-1 text-[10px] h-4", statusColors[linkedLead.lead_status] || "bg-muted")}>{linkedLead.lead_status}</Badge>
                      </div>
                    )}
                    {linkedLead.company && <div className="text-xs"><span className="text-muted-foreground">Company:</span> {linkedLead.company}</div>}
                    {linkedLead.city && <div className="text-xs"><span className="text-muted-foreground">City:</span> {linkedLead.city}</div>}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-2 space-y-2 text-center">
                  <p className="text-[11px] text-muted-foreground">No linked lead found</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs w-full gap-1"
                    onClick={() => {
                      setConvertForm({
                        full_name: selectedConv.contact_name || "",
                        email: "",
                        funnel: "Silicon Valley",
                      });
                      setShowConvertDialog(true);
                    }}
                  >
                    <Plus className="h-3 w-3" /> Convert to Lead
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Forward Dialog ---
  const renderForwardDialog = () => (
    <Dialog open={!!forwardMsg} onOpenChange={(open) => { if (!open) { setForwardMsg(null); setForwardSearch(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Forward message</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded truncate">"{forwardMsg?.content}"</p>
          <Input placeholder="Search conversations..." value={forwardSearch} onChange={e => setForwardSearch(e.target.value)} className="h-8 text-sm" />
          <div className="max-h-48 overflow-auto space-y-1">
            {forwardFilteredConversations.map(conv => (
              <div
                key={conv.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => forwardToConversation(conv)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className={cn("text-white text-[10px] font-bold", getAvatarColor(conv.contact_name || conv.contact_phone))}>
                    {(conv.contact_name || conv.contact_phone || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{conv.contact_name || conv.contact_phone}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{conv.contact_phone}</p>
                </div>
                {forwardSending && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // --- Convert to Lead Dialog ---
  const handleConvertToLead = async () => {
    if (!convertForm.full_name || !convertForm.email || !selectedConv) return;
    const { data, error } = await supabase.from("leads").insert({
      full_name: convertForm.full_name,
      email: convertForm.email,
      phone: selectedConv.contact_phone,
      funnel: convertForm.funnel,
    }).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Link conversation to lead
    await supabase.from("whatsapp_conversations").update({
      lead_id: data.id,
      contact_name: data.full_name,
    }).eq("id", selectedConv.id);
    setLinkedLead({ id: data.id, full_name: data.full_name, email: data.email, phone: data.phone, funnel: data.funnel, lead_status: data.lead_status, company: null, city: null });
    setSelectedConv({ ...selectedConv, lead_id: data.id, contact_name: data.full_name });
    setShowConvertDialog(false);
    toast({ title: "Lead Created", description: `${data.full_name} added as a lead.` });
  };

  const renderConvertDialog = () => (
    <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Convert to Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Full Name *</label>
            <Input value={convertForm.full_name} onChange={e => setConvertForm(f => ({ ...f, full_name: e.target.value }))} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium">Email *</label>
            <Input value={convertForm.email} onChange={e => setConvertForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-sm mt-1" type="email" />
          </div>
          <div>
            <label className="text-xs font-medium">Phone</label>
            <Input value={selectedConv?.contact_phone || ""} disabled className="h-8 text-sm mt-1 bg-muted" />
          </div>
          <div>
            <label className="text-xs font-medium">Funnel *</label>
            <select
              className="w-full h-8 text-sm mt-1 rounded-md border border-input bg-background px-3"
              value={convertForm.funnel}
              onChange={e => setConvertForm(f => ({ ...f, funnel: e.target.value }))}
            >
              <option value="Silicon Valley">Silicon Valley</option>
              <option value="Company Formation">Company Formation</option>
              <option value="Visa Desk">Visa Desk</option>
            </select>
          </div>
          <Button size="sm" className="w-full" onClick={handleConvertToLead} disabled={!convertForm.full_name || !convertForm.email}>
            Create Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // --- Settings Dialog ---
  const renderSettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Chat Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="calling" className="mt-2">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="whatsapp" className="text-xs">WhatsApp</TabsTrigger>
            <TabsTrigger value="calling" className="text-xs">Calling</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="mt-3 space-y-3">
            <div className="text-xs text-muted-foreground">
              Connected to WhatsApp Business API. Manage your connection settings from the backend.
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Business Number</p>
                  <p className="text-[11px] text-muted-foreground">+92 42 3230 0134</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calling" className="mt-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-[#25D366]" />
              <span className="text-sm font-medium">Call Settings</span>
            </div>

            <div className="border rounded-lg divide-y">
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-xs font-medium">Save All Calls</p>
                  <p className="text-[11px] text-muted-foreground">Automatically log every call with duration and contact info</p>
                </div>
                <Switch checked={saveAllCalls} onCheckedChange={setSaveAllCalls} />
              </div>
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-xs font-medium">Auto-Record Calls</p>
                  <p className="text-[11px] text-muted-foreground">Record calls when VoIP provider is connected</p>
                </div>
                <Switch checked={autoRecordCalls} onCheckedChange={setAutoRecordCalls} />
              </div>
            </div>

            {/* Recent Call Log */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Recent Call Log</span>
              {callLog.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No calls recorded yet</p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                  {callLog.slice(0, 10).map(call => (
                    <div key={call.id} className="flex items-center gap-2 p-2.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {call.direction === "inbound" ? (
                          <PhoneIncoming className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <PhoneOutgoing className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{call.contact_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(call.created_at), "dd MMM, HH:mm")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono">{formatCallDuration(call.duration_seconds)}</p>
                        <Badge variant="outline" className="text-[9px] h-4">{call.direction}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-3 space-y-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Quick Reply Templates</div>
            {quickReplies.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No templates configured</p>
            ) : (
              <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                {quickReplies.map(qr => (
                  <div key={qr.id} className="p-2.5">
                    <p className="text-xs font-medium">{qr.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{qr.content}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn(
      "flex min-h-0 flex-col bg-background overflow-hidden",
      fullscreen ? "fixed inset-0 z-50" : "h-full max-h-full"
    )}>
      {panelView === "list" ? renderList() : renderChat()}
      {renderForwardDialog()}
      {renderSettingsDialog()}
      {renderConvertDialog()}
    </div>
  );
}
