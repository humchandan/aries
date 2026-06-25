"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeb3 } from "@/hooks/useWeb3";

import type { RecentCustomerRow } from "./recent-customers-table/schema";
import { RecentCustomersTable } from "./recent-customers-table/table";

export function SubscriberOverview() {
  const { jwtToken, isConnected } = useWeb3();
  const [customers, setCustomers] = useState<RecentCustomerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchReferrals() {
      if (!jwtToken) return;
      try {
        setLoading(true);
        const res = await fetch("/api/user/referrals", {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        const json = await res.json();
        if (json.referrals) {
          setCustomers(json.referrals);
        }
      } catch (err) {
        console.error("Error fetching downline customers table:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isConnected && jwtToken) {
      fetchReferrals();
    }
  }, [isConnected, jwtToken]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">
          {customers.length.toLocaleString()} Downline Customers
        </CardTitle>
        <CardDescription>
          Network customer records showing levels, staking activity, business volume, and registration history.
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => {
            // Simple CSV export of data
            const headers = "Name,Wallet Address,Mobile,Level,Status,Self Stake,Team Business,Joined Date\n";
            const rows = customers.map(c => 
              `"${c.name}","${c.walletAddress}","${c.mobile}",${c.level},"${c.status}",${c.selfStake},${c.teamBusiness},"${c.joinedDate}"`
            ).join("\n");
            const blob = new Blob([headers + rows], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("href", url);
            a.setAttribute("download", `downlines-export.csv`);
            a.click();
          }}>
            <Download />
            Export
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentCustomersTable data={customers} />
      </CardContent>
    </Card>
  );
}
