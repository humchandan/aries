import { format } from "date-fns";


import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BalanceDistributionCard } from "./_components/balance-distribution-card";
import { MappedInvestments } from "./_components/mapped-investments";
import { OverviewKpis } from "./_components/overview-kpis";
import { LifetimeEarningsCard } from "./_components/lifetime-earnings-card";
import { UpcomingTransactions } from "./_components/upcoming-transactions";
import { MappedHistory } from "./_components/mapped-history";
import { MappedAccounts } from "./_components/mapped-accounts";
import { MappedTransactions } from "./_components/mapped-transactions";
import { MappedWithdrawals } from "./_components/mapped-withdrawals";
import { ProxyWalletManager } from "./_components/proxy-wallet-manager";

export default function Page() {
  const formattedDate = format(new Date(), "EEEE, do MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Personal Finances</h1>
        <p className="text-muted-foreground text-sm">{formattedDate}</p>
      </div>

      <Tabs defaultValue="30-days" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList variant="line">
            <TabsTrigger value="30-days">Dashboard</TabsTrigger>
            <TabsTrigger value="12-months">Accounts</TabsTrigger>
            <TabsTrigger value="custom">Transactions</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-3">
          </div>
        </div>

        <TabsContent value="30-days" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-6">
              <OverviewKpis />
              <MappedInvestments />
              <MappedHistory />
            </div>

            <div className="flex flex-col gap-4 xl:col-span-6">
              <ProxyWalletManager />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-12">
              <LifetimeEarningsCard />
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-6">
              <MappedWithdrawals />
              <BalanceDistributionCard />
            </div>
            <div className="xl:col-span-6">
              <UpcomingTransactions />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="12-months">
          <MappedAccounts />
        </TabsContent>

        <TabsContent value="custom">
          <MappedTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
