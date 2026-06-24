"use client";

import { useEffect, useState } from "react";

import { CheckCircle, Clock, ExternalLink, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/useWeb3";

export function AdminKycApproval() {
  const { jwtToken, isAdmin } = useWeb3();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKycUsers = async () => {
    if (!jwtToken || !isAdmin) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/kyc", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch KYC users", err);
      toast.error("Failed to load KYC records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycUsers();
  }, [fetchKycUsers]);

  const updateStatus = async (userAddress: string, status: string) => {
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ userAddress, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User KYC status updated to ${status}`);
        setUsers((prev) => prev.map((u) => (u.walletAddress === userAddress ? { ...u, kycStatus: status } : u)));
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="font-bold text-xl">Unauthorized</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          You do not have administrative privileges to view this section.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed py-12 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-bold text-lg">All Caught Up</h3>
            <p className="mt-1 text-muted-foreground">No pending KYC documents to review.</p>
          </div>
        ) : (
          users.map((u) => (
            <Card key={u.walletAddress} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="truncate text-base">{u.name || "Unknown Name"}</CardTitle>
                    <CardDescription className="mt-1 max-w-[200px] truncate font-mono text-xs" title={u.walletAddress}>
                      {u.walletAddress.substring(0, 6)}...{u.walletAddress.substring(u.walletAddress.length - 4)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      u.kycStatus === "Verified"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : u.kycStatus === "Rejected"
                          ? "border-red-500/20 bg-red-500/10 text-red-500"
                          : "border-blue-500/20 bg-blue-500/10 text-blue-500"
                    }
                  >
                    {u.kycStatus === "Verified" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {u.kycStatus === "Rejected" && <XCircle className="mr-1 h-3 w-3" />}
                    {u.kycStatus === "Pending" && <Clock className="mr-1 h-3 w-3" />}
                    {u.kycStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4 text-sm">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Mobile:</span>
                    <span className="font-medium">{u.mobile || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Aadhaar No:</span>
                    <span className="font-mono">{u.aadhaarNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">PAN No:</span>
                    <span className="font-mono uppercase">{u.panNo || "N/A"}</span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Documents
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Front", url: u.aadharFrontUrl },
                        { label: "Back", url: u.aadharBackUrl },
                        { label: "PAN", url: u.panCardUrl },
                      ].map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url || "#"}
                          target={doc.url ? "_blank" : undefined}
                          rel="noreferrer"
                          className={`flex aspect-square flex-col items-center justify-center rounded border p-2 ${doc.url ? "group cursor-pointer transition-colors hover:border-primary hover:bg-accent" : "cursor-not-allowed opacity-50"}`}
                        >
                          <ExternalLink
                            className={`mb-1 h-4 w-4 ${doc.url ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="text-center font-medium text-[10px]">{doc.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                    onClick={() => updateStatus(u.walletAddress, "Verified")}
                    disabled={u.kycStatus === "Verified"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => updateStatus(u.walletAddress, "Rejected")}
                    disabled={u.kycStatus === "Rejected"}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
