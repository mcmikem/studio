
"use client";

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { PartnershipList } from "@/components/management/partnerships/partnership-list";
import { SchoolList } from "@/components/management/partnerships/school-list";
import { PartnershipForm } from "@/components/forms/partnership-form"; 
import type { Partnership } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

const PartnershipPipelineKanban = () => {
    const firestore = useFirestore();
    const partnershipsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'partnerships'));
    }, [firestore]);
    const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);
    return <PartnershipList partnerships={partnerships || []} isLoading={isLoading} onEdit={() => {}} />;
};

export default function PartnershipsManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partnership | null>(null);

  const handleAddPartner = () => {
    setEditingPartner(null);
    setIsDialogOpen(true);
  };
  
  const handleEditPartner = (partner: Partnership) => {
    setEditingPartner(partner);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingPartner(null);
  };

  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'partnerships'));
  }, [firestore]);
  const { data: partnerships, isLoading } = useCollection<Partnership>(partnershipsQuery);

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Partnerships Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddPartner}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
          </Button>
        </div>
      </div>
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{editingPartner ? "Edit Partnership" : "Add New Partnership"}</DialogTitle>
                   <DialogDescription>
                        {editingPartner ? `Update details for ${editingPartner.name}.` : "Fill in the form to create a new partner profile."}
                    </DialogDescription>
              </DialogHeader>
              <PartnershipForm 
                initialData={editingPartner} 
                onSuccess={handleFormSuccess}
              />
          </DialogContent>
      </Dialog>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="all">All Partners</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="space-y-4">
          <PartnershipList partnerships={(partnerships || []).filter(p => p.status !== 'Active' && p.status !== 'Terminated')} isLoading={isLoading} onEdit={handleEditPartner} />
        </TabsContent>
        <TabsContent value="schools" className="space-y-4">
          <SchoolList onEdit={handleEditPartner} />
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <PartnershipList partnerships={partnerships || []} isLoading={isLoading} onEdit={handleEditPartner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
