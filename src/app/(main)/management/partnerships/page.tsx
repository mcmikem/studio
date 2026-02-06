
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { PartnershipList } from "@/components/management/partnerships/partnership-list";
import { SchoolList } from "@/components/management/partnerships/school-list";
import { PartnershipForm } from "@/components/forms/partnership-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const PartnershipPipelineKanban = () => (
  <div className="p-4 border rounded-md h-[600px] flex items-center justify-center text-gray-500">
    Partnership Pipeline (Kanban Board) - (Using PartnershipList for now)
    <PartnershipList />
  </div>
);

export default function PartnershipsManagementPage() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);

  const handleAddPartner = () => {
    setShowAddPartnerForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddPartnerForm(false);
  };

  const handleFormCancel = () => {
    setShowAddPartnerForm(false);
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Partnerships Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddPartner}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
          </Button>
        </div>
      </div>

      <Dialog open={showAddPartnerForm} onOpenChange={setShowAddPartnerForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Partnership</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new partner to your pipeline.
            </DialogDescription>
          </DialogHeader>
          <PartnershipForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pipeline" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline (Kanban)</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="all">All Partners</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="space-y-4">
          <PartnershipPipelineKanban />
        </TabsContent>
        <TabsContent value="schools" className="space-y-4">
          <SchoolList />
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <PartnershipList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
