import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, CalendarDays, LogOut, UsersRound, KanbanSquare, ListTodo, TrendingUp, Wallet, BarChart2, Sparkles, Package, SlidersHorizontal } from "lucide-react";
import { getUnreadCount } from "@/pages/admin/Changelog";

const navItems = [
  { title: "Dashboard",    url: "/admin",               icon: LayoutDashboard },
  { title: "Contacts",     url: "/admin/contacts",      icon: Users },
  { title: "Lead Settings", url: "/admin/leads",         icon: SlidersHorizontal },
  { title: "Tasks",        url: "/admin/tasks",         icon: ListTodo },
  { title: "Deals",        url: "/admin/deals",         icon: TrendingUp },
  { title: "Applications", url: "/admin/applications",  icon: KanbanSquare },
  { title: "Appointments", url: "/admin/calendar",      icon: CalendarDays },
  { title: "Finance",      url: "/admin/finance",       icon: Wallet },
  { title: "Analytics",    url: "/admin/analytics",     icon: BarChart2 },
  { title: "Assets",       url: "/admin/assets",        icon: Package },
  { title: "Team",         url: "/admin/team",          icon: UsersRound },
  { title: "What's New",   url: "/admin/changelog",     icon: Sparkles },
];

interface AdminSidebarProps {
  user: any;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setUnread(getUnreadCount());
    const handler = () => setUnread(0);
    window.addEventListener("changelog-seen", handler);
    return () => window.removeEventListener("changelog-seen", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="relative">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.url === "/admin/changelog" && unread > 0 && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
