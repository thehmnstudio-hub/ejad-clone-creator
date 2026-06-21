import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield, Trash2, Upload } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  csr: "CSR",
  moderator: "Moderator",
  user: "User",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  csr: "bg-blue-100 text-blue-800 border-blue-200",
  moderator: "bg-amber-100 text-amber-800 border-amber-200",
  user: "bg-muted text-muted-foreground",
};

const Team = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("csr");
  const [inviting, setInviting] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (!roles?.length) { setMembers([]); setLoading(false); return; }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at")
      .in("id", userIds);

    // We need emails - get from auth via a simple approach
    // Since we can't query auth.users, we'll store email in raw_data or just show profile info
    const merged: TeamMember[] = (profiles || []).map((p) => {
      const role = roles.find((r) => r.user_id === p.id);
      return {
        id: p.id,
        email: "", // Will be populated if we have it
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: role?.role || "user",
        created_at: p.created_at,
      };
    });

    setMembers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      // Sign up the user with a random password - they'll get an email to set their own
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
        options: {
          data: { full_name: inviteName },
          emailRedirectTo: window.location.origin + "/admin/login",
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user");

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: signUpData.user.id,
        role: inviteRole as any,
      });
      if (roleError) throw roleError;

      toast({ title: "Invitation sent!", description: `${inviteEmail} will receive an email to verify their account.` });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("csr");
      fetchTeam();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // user_roles has UNIQUE(user_id, role) — a user can have multiple rows.
    // UPDATE .eq("user_id") hits all rows and violates the constraint on the 2nd row,
    // or silently updates 0 rows when RLS blocks it. Delete+insert is the safe pattern.
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) {
      toast({ title: "Error", description: delErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole as any });
    if (insErr) {
      toast({ title: "Error", description: insErr.message, variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
    toast({ title: "Role updated" });
  };

  const handleAvatarUpload = async (userId: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload error", description: uploadError.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, avatar_url: urlData.publicUrl } : m)));
    toast({ title: "Photo updated" });
  };

  const handleRemoveUser = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      toast({ title: "User removed from team" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Full Name</Label>
                <Input placeholder="e.g. Zainab Jamshed" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="name@ejadlabs.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="csr">CSR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No team members yet</TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(member.full_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Upload className="h-3 w-3 text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              if (e.target.files?.[0]) handleAvatarUpload(member.id, e.target.files[0]);
                            }} />
                          </label>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{member.email || member.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v)}>
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                          <Badge variant="outline" className={`text-xs ${roleBadgeColors[member.role] || ""}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {roleLabels[member.role] || member.role}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="csr">CSR</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveUser(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
