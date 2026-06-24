"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, CheckCircle, Search, Ban } from "lucide-react";
import { toast } from "sonner";
import { useWeb3 } from "@/hooks/useWeb3";

export function AdminUsers() {
  const { jwtToken, isAdmin } = useWeb3();
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [banningAddress, setBanningAddress] = React.useState<string | null>(null);

  const fetchUsers = async () => {
    if (!jwtToken || !isAdmin) return;
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [jwtToken, isAdmin]);

  const toggleBan = async (walletAddress: string, currentlyBanned: boolean) => {
    if (!confirm(`Are you sure you want to ${currentlyBanned ? "UNBAN" : "BAN"} this user?`)) return;
    
    setBanningAddress(walletAddress);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}` 
        },
        body: JSON.stringify({ 
          targetAddress: walletAddress, 
          isBanned: !currentlyBanned 
        })
      });

      if (res.ok) {
        toast.success(`User successfully ${currentlyBanned ? "unbanned" : "banned"}.`);
        setUsers(users.map(u => u.walletAddress === walletAddress ? { ...u, isBanned: !currentlyBanned } : u));
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch (err) {
      toast.error("Server error");
    } finally {
      setBanningAddress(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.walletAddress.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) return null;

  return (
    <Card className="mt-6 border-zinc-800 bg-zinc-950/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">User Management</CardTitle>
            <CardDescription>View all system users and manage blockchain restrictions.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search by name or wallet..." 
              className="pl-9 bg-zinc-900 border-zinc-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800">
                  <TableHead>User</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.walletAddress} className="border-zinc-800">
                      <TableCell className="font-medium">
                        {user.name}
                        <div className="text-xs text-zinc-500">{user.mobile}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {user.walletAddress}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                            <ShieldAlert className="w-3 h-3 mr-1" /> Banned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={user.isBanned ? "outline" : "destructive"}
                          size="sm"
                          disabled={banningAddress === user.walletAddress}
                          onClick={() => toggleBan(user.walletAddress, user.isBanned)}
                        >
                          {banningAddress === user.walletAddress ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.isBanned ? (
                            "Unban User"
                          ) : (
                            <><Ban className="w-4 h-4 mr-1" /> Restrict</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
