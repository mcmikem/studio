'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { 
    Database, 
    Trash2, 
    Edit, 
    Plus,
    Search,
    Filter,
    RefreshCw,
    Upload,
    Download,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Building2,
    Users,
    TreePine,
    Droplets,
    GraduationCap
} from 'lucide-react';
import { collection, doc, deleteDoc, updateDoc, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type DataCollection = 'schools' | 'users' | 'tree-surveys' | 'water-sources' | 'activities' | 'checkins' | 'checkouts' | 'expenses' | 'income';

interface DataStats {
    total: number;
    lastUpdated: Date | null;
}

const COLLECTION_INFO: Record<DataCollection, { label: string; icon: any; description: string }> = {
    schools: { label: 'Schools', icon: Building2, description: 'School profiles and details' },
    users: { label: 'Users', icon: Users, description: 'Team members and roles' },
    'tree-surveys': { label: 'Tree Surveys', icon: TreePine, description: 'GreenSchools tree data' },
    'water-sources': { label: 'Water Sources', icon: Droplets, description: 'PureWater data points' },
    activities: { label: 'Activities', icon: GraduationCap, description: 'Program activities logged' },
    checkins: { label: 'Check-ins', icon: CheckCircle, description: 'Daily check-in records' },
    checkouts: { label: 'Check-outs', icon: XCircle, description: 'Daily check-out reports' },
    expenses: { label: 'Expenses', icon: AlertTriangle, description: 'Requisition and reimbursement records' },
    income: { label: 'Income', icon: Upload, description: 'Income records' },
};

export default function DataManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { profile } = useUserProfile(user);
    const { viewAsRole } = useViewAs();
    const effectiveRole = viewAsRole || profile?.role;
    
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

    const adminRoles = ['Executive Director', 'Administrator'];
    if (!adminRoles.includes(effectiveRole || '')) {
        return (
            <Card className="m-4">
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                    <p className="font-bold text-lg">Access Restricted</p>
                    <p className="text-sm text-muted-foreground mt-2">Only Executive Directors and Administrators can manage data.</p>
                </CardContent>
            </Card>
        );
    }

    const [refreshKey, setRefreshKey] = useState(0);

    const collectionQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, selectedCollection), orderBy('createdAt', 'desc'), limit(100));
    }, [firestore, selectedCollection]);

    const { data: documents, isLoading } = useCollection<any>(collectionQuery);

    const filteredDocs = useMemo(() => {
        if (!documents) return [];
        if (!searchQuery) return documents;
        const query = searchQuery.toLowerCase();
        return documents.filter((doc: any) => {
            const searchable = JSON.stringify(doc).toLowerCase();
            return searchable.includes(query);
        });
    }, [documents, searchQuery]);

    const openEditDialog = (doc: any) => {
        setEditingDoc(doc);
        setEditForm({ ...doc });
        setIsEditing(true);
        setError('');
    };

    const openDeleteDialog = (doc: any) => {
        setDeletingDoc(doc);
        setIsDeleting(true);
        setError('');
    };

    const handleSaveEdit = async () => {
        if (!firestore || !editingDoc?.id) return;
        setLoading(true);
        setError('');
        try {
            await updateDoc(doc(firestore, selectedCollection, editingDoc.id), editForm);
            setSuccess('Record updated successfully');
            setIsEditing(false);
            setRefreshKey(k => k + 1);
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
            setRefreshKey(k => k + 1);
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Data Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">View, edit, and delete records across the database</p>
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
                            <span className="text-[10px] text-muted-foreground">{documents?.length || 0} records</span>
                        </button>
                    );
                })}
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${Info.label}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" onClick={() => setRefreshKey(k => k + 1)} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                </Button>
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Icon className="h-5 w-5 text-primary" />
                                {Info.label}
                            </CardTitle>
                            <CardDescription>{Info.description}</CardDescription>
                        </div>
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
                            <p className="text-sm">Try changing your search or collection</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px] space-y-2">
                                {filteredDocs.slice(0, 20).map((doc: any) => (
                                    <div 
                                        key={doc.id} 
                                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            <div className="truncate">
                                                <p className="font-bold text-sm truncate">{doc.schoolName || doc.name || doc.title || doc.email || doc.id}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {doc.district || doc.role || doc.userId || ''}
                                                </p>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {doc.subCounty || doc.email || ''}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {doc.status || doc.type || ''}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => openEditDialog(doc)}
                                                className="h-8 w-8"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => openDeleteDialog(doc)}
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit {Info.label} Record</DialogTitle>
                        <DialogDescription>Modify the fields below and save changes.</DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
                    )}
                    <div className="grid gap-4 py-4">
                        {Object.keys(editForm)
                            .filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt')
                            .slice(0, 15)
                            .map(key => (
                                <div key={key} className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">{key}</Label>
                                    {key.includes('Description') || key.includes('Notes') || key.includes('Feedback') || key.includes('Comment') ? (
                                        <Textarea 
                                            value={editForm[key] || ''} 
                                            onChange={(e) => setEditForm({...editForm, [key]: e.target.value})}
                                            className="min-h-[80px]"
                                        />
                                    ) : (
                                        <Input 
                                            value={editForm[key] || ''} 
                                            onChange={(e) => setEditForm({...editForm, [key]: e.target.value})}
                                        />
                                    )}
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
                        <DialogDescription>
                            Are you sure you want to delete this record? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
                    )}
                    {deletingDoc && (
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="font-bold">{deletingDoc.schoolName || deletingDoc.name || deletingDoc.title || deletingDoc.id}</p>
                            {deletingDoc.district && <p className="text-sm text-muted-foreground">{deletingDoc.district}</p>}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? 'Deleting...' : 'Delete Record'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
