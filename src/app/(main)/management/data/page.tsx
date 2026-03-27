'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { 
    Database, 
    Trash2, 
    Edit, 
    Search,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Building2,
    Users,
    TreePine,
    Droplets
} from 'lucide-react';
import { collection, doc, deleteDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type DataCollection = 'schools' | 'users' | 'tree-surveys' | 'water-sources' | 'activities';

const COLLECTION_INFO: Record<DataCollection, { label: string; icon: any }> = {
    schools: { label: 'Schools', icon: Building2 },
    users: { label: 'Users', icon: Users },
    'tree-surveys': { label: 'Tree Surveys', icon: TreePine },
    'water-sources': { label: 'Water Sources', icon: Droplets },
    activities: { label: 'Activities', icon: Database },
};

export default function DataManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [selectedCollection, setSelectedCollection] = useState<DataCollection>('schools');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingDoc, setEditingDoc] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const collectionQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, selectedCollection), orderBy('createdAt', 'desc'), limit(100));
    }, [firestore, selectedCollection]);

    const { data: documents, isLoading } = useCollection<any>(collectionQuery);

    const filteredDocs = useMemo(() => {
        if (!documents) return [];
        if (!searchQuery) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter((d: any) => {
            const searchable = JSON.stringify(d).toLowerCase();
            return searchable.includes(q);
        });
    }, [documents, searchQuery]);

    const handleSaveEdit = async () => {
        if (!firestore || !editingDoc?.id) return;
        setLoading(true);
        setError('');
        try {
            await updateDoc(doc(firestore, selectedCollection, editingDoc.id), editForm);
            setSuccess('Record updated successfully');
            setIsEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!firestore || !deletingDoc?.id) return;
        setLoading(true);
        setError('');
        try {
            await deleteDoc(doc(firestore, selectedCollection, deletingDoc.id));
            setSuccess('Record deleted successfully');
            setIsDeleting(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const Info = COLLECTION_INFO[selectedCollection];
    const Icon = Info.icon;

    return (
        <div className="max-w-full overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            Data Manager
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">View and edit records</p>
                    </div>
                    {success && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            {success}
                        </div>
                    )}
                </div>

                {/* Collection Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {Object.entries(COLLECTION_INFO).map(([key, info]) => {
                        const CIcon = info.icon;
                        const isActive = selectedCollection === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedCollection(key as DataCollection)}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${
                                    isActive 
                                        ? 'border-primary bg-primary/5 shadow-md' 
                                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <CIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className="font-bold text-xs">{info.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${Info.label}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Data List */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Icon className="h-5 w-5 text-primary" />
                                {Info.label}
                            </CardTitle>
                            <Badge variant="secondary">{filteredDocs.length} records</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array(5).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No records found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredDocs.slice(0, 20).map((d: any) => (
                                    <div 
                                        key={d.id} 
                                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{d.schoolName || d.name || d.title || d.email || d.id}</p>
                                            <p className="text-xs text-muted-foreground truncate">{d.district || d.role || ''}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => { setEditingDoc(d); setEditForm({...d}); setIsEditing(true); }}
                                                className="h-8 w-8"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => { setDeletingDoc(d); setIsDeleting(true); }}
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Record</DialogTitle>
                        </DialogHeader>
                        {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
                        <div className="grid gap-4 py-4">
                            {Object.keys(editForm).filter(k => k !== 'id').slice(0, 10).map(key => (
                                <div key={key} className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">{key}</Label>
                                    <Input 
                                        value={editForm[key] || ''} 
                                        onChange={(e) => setEditForm({...editForm, [key]: e.target.value})}
                                    />
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSaveEdit} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Delete
                            </DialogTitle>
                            <DialogDescription>This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        {deletingDoc && (
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="font-bold">{deletingDoc.schoolName || deletingDoc.name || deletingDoc.id}</p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                {loading ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
