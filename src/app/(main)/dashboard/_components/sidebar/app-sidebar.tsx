"use client";

import { useMemo } from "react";

import Image from "next/image";
import Link from "next/link";

import { CircleHelp, ClipboardList, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { useWeb3 } from "@/hooks/useWeb3";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarSupportCard } from "./sidebar-support-card";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const { isAdmin, userProfile, userAddress } = useWeb3();

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const filteredItems = useMemo(() => {
    return sidebarItems
      .filter((group) => {
        // If it's the Pages group (id: 2), only allow if user is admin
        if (group.id === 2) {
          return isAdmin;
        }
        return true;
      })
      .map((group) => {
        if (isAdmin) return group;
        return {
          ...group,
          items: group.items.filter(
            (item) => item.id !== "infrastructure" && item.id !== "crm" && item.id !== "analytics",
          ),
        };
      });
  }, [isAdmin]);

  const welcomeText = useMemo(() => {
    if (userProfile?.name) {
      return `Welcome ${userProfile.name}`;
    }
    if (userAddress) {
      return `Welcome ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    }
    return "Welcome Guest";
  }, [userProfile, userAddress]);

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12 py-2">
              <Link prefetch={false} href="/dashboard/default" className="flex items-center gap-3">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
                  <Image src="/ares-logo.png" alt="Ares Logo" fill className="object-contain" />
                </div>
                <span className="font-semibold text-sm truncate">{welcomeText}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarSupportCard />
        <NavUser user={rootUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
