"use client";

import { useState } from "react";
import { doc } from "firebase/firestore"; // or your own re-export
import { format } from "date-fns";

import { firestore } from "@/lib/firebase"; // CHANGE to your Firestore instance path
import { deleteDocumentNonBlocking } from "@/lib/firestore-utils"; // CHANGE to your helper path
import { toast } from "@/components/ui/use-toast"; // CHANGE to your toast hook path
import type { ProductionBatchRecord } from "@/types/production"; // CHANGE to your real type path

type Profile = {
  id: string;
};

type FormValues = {
  batch_number: string;
  productId: string;
  quantity_produced: number;
  production_date: string;
  status: string;
  supervisorId: string;
  notes: string;
  materials_used: any[]; // tighten this type if you have one
};

type ProductionBatchFormProps = {
  profile?: Profile | null;
  // react-hook-form Reset type, but kept generic so file compiles even if you don't import RHF types
  reset: (values: Partial<FormValues>) => void;
};

export function ProductionBatchForm({
  profile,
  reset,
}: ProductionBatchFormProps) {
  const [editingBatch, setEditingBatch] =
    useState<ProductionBatchRecord | null>(null);

  const handleEditBatch = (batch: ProductionBatchRecord) => {
    setEditingBatch(batch);
    reset({
      batch_number: batch.batch_number,
      productId: batch.productId,
      quantity_produced: batch.quantity_produced,
      production_date: batch.production_date,
      status: batch.status,
      supervisorId: profile?.id || "",
      notes: batch.notes || "",
      materials_used: batch.materials_used || [],
    });
  };

  const handleDeleteBatch = async (batch: ProductionBatchRecord) => {
    if (!firestore) return;

    try {
      await deleteDocumentNonBlocking(
        doc(firestore, "production-batches", batch.id)
      );
      toast({
        title: "Batch Deleted",
        description: `${batch.batch_number} has been deleted.`,
      });

      if (editingBatch?.id === batch.id) {
        setEditingBatch(null);
        reset({
          production_date: format(new Date(), "yyyy-MM-dd"),
          status: "in-progress",
          supervisorId: profile?.id || "",
          materials_used: [],
          batch_number: "",
          productId: "",
          quantity_produced: 0,
          notes: "",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error?.message || "Could not delete batch.",
      });
    }
  };

  // TODO: render your UI using handleEditBatch and handleDeleteBatch
  return (
    <div>
      {/* Your form and list UI goes here.
          Example:
          - List batches and call handleEditBatch(batch) on edit button
          - Call handleDeleteBatch(batch) on delete button
      */}
    </div>
  );
}

export default ProductionBatchForm;
