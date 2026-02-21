
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { PartnershipList } from "@/components/management/partnerships/partnership-list";
import { SchoolList } from "@/components/management/partnerships/school-list";
import { PartnershipForm } from "@/components/forms/partnership-form"; // Import the form
import { Partnership } from "@/lib/types";

// Placeholder for the Kanban Pipeline component (will be more complex)
const PartnershipPipelineKanban = () => (
  <div className="p-4 border rounded-md h-[600px] flex items-center justify-center text-gray-500">
    Partnership Pipeline (Kanban Board) - (Using All Partners List for now, will be replaced with Kanban)
    <PartnershipList /> {/* Temporarily using PartnershipList here for initial view */}
  </div>
);

export default function PartnershipsManagementPage() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false); // State to manage form visibility

  const handleAddPartner = () => {
    console.log("Add New Partner clicked! (Will open a form/dialog)");
    setShowAddPartnerForm(true); // Example: show the form if it's a component
  };

  const handleFormSuccess = (newPartnership: Partnership) => {
    console.log("New partnership added:", newPartnership);
    setShowAddPartnerForm(false);
    // In a real app, you would refresh the data for the lists
    // For now, just close the form
    // Consider adding a toast or notification here for successful creation
  };

  const handleFormCancel = () => {
    setShowAddPartnerForm(false);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Partnerships Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddPartner}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
          </Button>
        </div>
      </div>

      {showAddPartnerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Add New Partnership</h3>
            {/* For demonstration, directly including the form. In a real app, use a Dialog/Modal */}
            <PartnershipForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
          </div>
        </div>
      )}

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
