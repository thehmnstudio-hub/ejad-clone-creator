import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { AdminErrorBoundary } from "./AdminErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { WhatsAppChat } from "./WhatsAppChat";
import WhatsAppCallUI from "./WhatsAppCallUI";
import { ChatPanelProvider, useChatPanel } from "@/hooks/useChatPanel";
import { useWhatsAppCall } from "@/hooks/useWhatsAppCall";
import { Loader2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

function AdminContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { isOpen, toggle, totalUnread } = useChatPanel();
  const { callState, callInfo, duration, isMuted, acceptCall, rejectCall, terminateCall, toggleMute } = useWhatsAppCall();

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async (session: any) => {
      if (!isMounted) return;

      if (!session) {
        setUser(null);
        setLoading(false);
        navigate("/admin/login", { replace: true });
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["admin", "csr"])
        .limit(1);

      if (!isMounted) return;

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        navigate("/admin/login", { replace: true });
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void verifyAccess(session);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void verifyAccess(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden flex w-full">
        <AdminSidebar user={user} />
        <div className="flex-1 flex min-h-0 flex-col min-w-0 overflow-hidden">
          <header className="h-12 flex items-center border-b bg-background px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <img src="/ejad-labs-logo.png" alt="Ejad Labs" className="h-6" />
            <span className="text-xs font-semibold text-foreground tracking-wide">HQ</span>
            <div className="ml-auto">
              <Button
                variant={isOpen ? "default" : "outline"}
                size="sm"
                onClick={toggle}
                className="gap-2 h-8 text-xs relative"
              >
                {isOpen ? <X className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">WhatsApp</span>
                {totalUnread > 0 && !isOpen && (
                  <span className="absolute -top-1 -right-1 bg-[#25D366] text-white text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                    {totalUnread}
                  </span>
                )}
              </Button>
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-hidden">
            {isOpen ? (
              <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
                <ResizablePanel defaultSize={60} minSize={30} className="min-h-0 overflow-hidden">
                  <main className="h-full min-h-0 p-4 md:p-6 bg-muted/30 overflow-auto">
                    <AdminErrorBoundary><Outlet /></AdminErrorBoundary>
                  </main>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={25} className="min-h-0 overflow-hidden">
                  <div className="h-full min-h-0 border-l overflow-hidden">
                    <WhatsAppChat />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <main className="h-full min-h-0 p-4 md:p-6 bg-muted/30 overflow-auto">
                <Outlet />
              </main>
            )}
          </div>
        </div>
      </div>

      {/* Incoming call overlay */}
      <WhatsAppCallUI
        callState={callState}
        direction={callInfo?.direction}
        remoteName={callInfo?.remoteName}
        remotePhone={callInfo?.remotePhone}
        duration={duration}
        isMuted={isMuted}
        onAccept={acceptCall}
        onReject={rejectCall}
        onTerminate={terminateCall}
        onToggleMute={toggleMute}
      />
    </SidebarProvider>
  );
}

const AdminLayout = () => {
  return (
    <ChatPanelProvider>
      <AdminContent />
    </ChatPanelProvider>
  );
};

export default AdminLayout;
