"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { addMonths, format, startOfMonth } from "date-fns";
import { ArrowRight, ChevronRight, Loader2, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { useWeb3 } from "@/hooks/useWeb3";

export function UpcomingTransactions() {
  const { jwtToken } = useWeb3();
  const [billers, setBillers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jwtToken) {
      setLoading(false);
      return;
    }
    const fetchBillers = async () => {
      try {
        const res = await fetch("/api/user/utility/billers", {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBillers(data.billers || []);
        }
      } catch (err) {
        console.error("Failed to fetch billers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBillers();
  }, [jwtToken]);

  const dueDate = format(startOfMonth(addMonths(new Date(), 1)), "MMMM do, yyyy");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Saved Utility Bills</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-baseline text-3xl leading-none tracking-tight">
              <span className="font-normal">{billers.length}</span>
              <span className="text-muted-foreground text-xl ml-2">saved billers</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-none">
              Ensure you pay your saved utility bills before {dueDate}
            </p>
          </div>
          {billers.length > 0 && (
            <div className="flex w-max items-center gap-2 rounded-md border border-border bg-muted/70 px-2 py-1.5 text-sm">
              <Zap className="size-4 fill-primary text-primary" />
              <span className="text-muted-foreground">Visit the Utility Portal to clear dues on time.</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="animate-spin w-5 h-5 text-zinc-500" />
          </div>
        ) : billers.length > 0 ? (
          <ItemGroup>
            {billers.map((biller) => (
              <Item key={biller.id} variant="outline" size="xs">
                <ItemMedia>
                  <div className="grid size-9 place-items-center rounded-md border bg-background">
                    <Zap className="size-4 text-primary" />
                  </div>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{biller.billerName}</ItemTitle>
                  <ItemDescription>{biller.service?.name || "Utility Service"}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Link href="/dashboard/ecommerce">
                    <ChevronRight className="size-5 text-muted-foreground hover:text-white transition-colors" />
                  </Link>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <div className="py-8 mt-2 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
            <p className="mb-3">No saved billers found.</p>
            <Link
              href="/dashboard/ecommerce"
              className="text-primary font-medium hover:underline flex items-center justify-center gap-1"
            >
              Go to Utility Portal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
