
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { PartnershipList } from "@/components/management/partnerships/partnership-list";
import { SchoolList } from "@/components/management/partnerships/school-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PartnershipForm } from '@/components/forms/partnership-form';
import type { Partnership } from '@/lib/types';

// Placeholder for the Kanban Pipeline component (will be more complex)
const PartnershipPipelineKanban = () => (
  <div className="p-4 border rounded-md h-[600px] flex items-center justify-center text-gray-500">
    Partnership Pipeline (Kanban Board) - Coming Soon!
  </div>
);

export default function PartnershipsManagementPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partnership | undefined>(undefined);

  const handleAddNew = () => {
    setEditingPartner(undefined);
    setIsFormOpen(true);
  };
  
  const handleEdit = (partner: Partnership) => {
    setEditingPartner(partner);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPartner(undefined);
    // Data will refetch automatically due to useCollection hook
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Partnerships Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Edit Partnership' : 'Add New Partnership'}</DialogTitle>
            <DialogDescription>
              {editingPartner ? `Update the details for ${editingPartner.name}.` : 'Fill out the form below to add a new partner to your pipeline.'}
            </DialogDescription>
          </DialogHeader>
          <PartnershipForm 
            key={editingPartner?.id || 'new'}
            initialData={editingPartner} 
            onSuccess={handleFormSuccess} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="all">All Partners</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="space-y-4">
          <PartnershipPipelineKanban />
        </TabsContent>
        <TabsContent value="schools" className="space-y-4">
          <SchoolList onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <PartnershipList onEdit={handleEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
