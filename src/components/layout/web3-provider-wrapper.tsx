"use client";

import React from "react";
import { Web3Provider } from "@/context/Web3Context";

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
