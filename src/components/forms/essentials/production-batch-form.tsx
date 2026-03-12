const [editingBatch, setEditingBatch] = useState<ProductionBatchRecord | null>(null);

const handleEditBatch = (batch: ProductionBatchRecord) => {
  setEditingBatch(batch);
  reset({
    batch_number: batch.batch_number,
    productId: batch.productId,
    quantity_produced: batch.quantity_produced,
    production_date: batch.production_date,
    status: batch.status,
    supervisorId: profile?.id || '',
    notes: batch.notes || '',
    materials_used: batch.materials_used || [],
  });
};

const handleDeleteBatch = async (batch: ProductionBatchRecord) => {
  if (!firestore) return;
  try {
    await deleteDocumentNonBlocking(doc(firestore, 'production-batches', batch.id));
    toast({ title: 'Batch Deleted', description: `${batch.batch_number} has been deleted.` });
    if (editingBatch?.id === batch.id) {
      setEditingBatch(null);
      reset({
        production_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'in-progress',
        supervisorId: profile?.id || '',
        materials_used: [],
        batch_number: '',
        productId: '',
        quantity_produced: 0,
        notes: '',
      });
    }
  } catch (error: any) {
    toast({
      variant: 'destructive',
      title: 'Delete Failed',
      description: error?.message || 'Could not delete batch.',
    });
  }
};
