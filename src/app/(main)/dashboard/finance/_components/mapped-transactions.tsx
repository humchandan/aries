'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function MappedTransactions() {
  const { userAddress, jwtToken } = useWeb3();
  const [transactions, setTransactions] = useState<any[]>([]);

  const loadTransactions = async () => {
    if (!jwtToken || !userAddress) return;
    try {
      const balanceRes = await fetch(`/api/ledger/balance`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const balanceData = await balanceRes.json();
      setTransactions(balanceData.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [jwtToken, userAddress]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent activity on your utility portal account.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const isReceived = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' || tx.type === 'CLAIM_DIRECT';
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">{tx.type}</div>
                    <div className="text-xs text-muted-foreground">{tx.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(tx.timestamp).toLocaleString()}</div>
                  </div>
                  <div className={`font-mono font-semibold ${isReceived ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isReceived ? '+' : '-'}{isReceived ? tx.netAmount?.toFixed(2) : tx.amount?.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
