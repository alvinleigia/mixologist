"use client";

import Link from "next/link";
import { useState } from "react";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { MenuManager } from "@/components/staff/MenuManager";
import { StaffOrderBoard } from "@/components/staff/StaffOrderBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StaffView = "orders" | "menu";

type StaffOperationsWorkspaceProps = {
  hasLocationAccess: boolean;
};

function OperationsSetupRequired() {
  return (
    <Card className="rounded-xl border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(40,26,20,0.08)]">
      <CardHeader className="px-6 pt-6">
        <SectionHeader
          eyebrow="Operations"
          title="Location access required"
          meta="Orders and menu operations need a restaurant location before this panel can load."
          className="mb-0"
        />
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 p-6">
          <p className="text-sm leading-6 text-stone-600">
            You are signed in at a higher admin level. Create a company, create a
            restaurant/location, then invite or switch to a restaurant manager or
            order operator account for live operations.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/platform">Go to Platform</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/company">Go to Company</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffOperationsWorkspace({
  hasLocationAccess,
}: StaffOperationsWorkspaceProps) {
  const [activeView, setActiveView] = useState<StaffView>("orders");

  if (!hasLocationAccess) {
    return <OperationsSetupRequired />;
  }

  return (
    <Tabs value={activeView} onValueChange={(value) => setActiveView(value as StaffView)}>
      <TabsList>
        <TabsTrigger
          value="orders"
          className="border-stone-600/60 bg-white/5 text-stone-100 hover:bg-white/10 hover:text-white data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-stone-950"
        >
          Orders
        </TabsTrigger>
        <TabsTrigger
          value="menu"
          className="border-stone-600/60 bg-white/5 text-stone-100 hover:bg-white/10 hover:text-white data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-stone-950"
        >
          Menu Manager
        </TabsTrigger>
      </TabsList>

      <TabsContent value="orders">
        <StaffOrderBoard />
      </TabsContent>
      <TabsContent value="menu">
        <MenuManager />
      </TabsContent>
    </Tabs>
  );
}
