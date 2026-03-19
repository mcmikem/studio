/**
 * OMUTO CENTRAL - DESIGN STANDARDS & BEST PRACTICES
 * 
 * This document defines the standards all components and pages must follow.
 * Following these standards ensures mobile-first, responsive, and consistent UI.
 * 
 * =============================================================================
 * LAYOUT STANDARDS
 * =============================================================================
 * 
 * 1. PAGE CONTAINERS
 *    - Always wrap page content in: <div className="w-full overflow-hidden">
 *    - Use space-y with sm: prefix for responsive spacing: space-y-4 sm:space-y-6
 *    - Never use negative margins that can cause overflow
 * 
 * 2. GRID SYSTEMS
 *    - Mobile-first: start with single column
 *    - Use responsive prefixes: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
 *    - Gaps: gap-2 sm:gap-4 lg:gap-6
 * 
 * 3. CARD LAYOUTS
 *    - Card padding: p-3 sm:p-4 lg:p-6
 *    - Card gaps: space-y-3 sm:space-y-4
 *    - Always use Card component from @/components/ui/card
 * 
 * =============================================================================
 * MOBILE-FIRST TYPOGRAPHY
 * =============================================================================
 * 
 * HEADINGS:
 * - h1: text-2xl sm:text-3xl lg:text-4xl
 * - h2: text-xl sm:text-2xl lg:text-3xl
 * - h3: text-lg sm:text-xl
 * 
 * BODY TEXT:
 * - Base: text-sm sm:text-base
 * - Small/meta: text-xs sm:text-sm
 * - Always use font-bold for emphasis, not <strong>
 * 
 * LABELS:
 * - Form labels: text-xs sm:text-sm font-medium
 * 
 * =============================================================================
 * FORM STANDARDS
 * =============================================================================
 * 
 * 1. FORM CONTAINER
 *    <form className="space-y-4 sm:space-y-6">
 *      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 *        ...form fields...
 *      </div>
 *    </form>
 * 
 * 2. FORM FIELD STRUCTURE
 *    <div className="space-y-2">
 *      <Label htmlFor="field-id">Label Text</Label>
 *      <Input id="field-id" ... />
 *      {errors.field && <p className="text-xs text-destructive">{errors.field.message}</p>}
 *    </div>
 * 
 * 3. SELECT/DROPDOWN FIELDS
 *    <Select onValueChange={field.onChange} defaultValue={field.value}>
 *      <SelectTrigger><SelectValue /></SelectTrigger>
 *      <SelectContent>...</SelectContent>
 *    </Select>
 * 
 * 4. FORM SUBMISSION
 *    - Use loading state during submission
 *    - Disable button while submitting
 *    - Show success/error toast
 *    - Reset form on success
 * 
 * =============================================================================
 * CRUD & DATA OPERATIONS
 * =============================================================================
 * 
 * USE FIREBASE HOOKS:
 * import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
 * 
 * 1. CREATE (Add Document)
 *    import { collection } from 'firebase/firestore';
 *    const collectionRef = collection(firestore, 'collection-name');
 *    await addDocumentNonBlocking(collectionRef, data);
 * 
 * 2. READ (Fetch Document)
 *    import { doc } from 'firebase/firestore';
 *    const docRef = doc(firestore, 'collection-name', id);
 *    const { data } = useDoc(collection-type>(docRef);
 * 
 * 3. UPDATE (Edit Document)
 *    await updateDocumentNonBlocking(docRef, { field: newValue });
 * 
 * 4. DELETE (Remove Document)
 *    await deleteDocumentNonBlocking(docRef);
 * 
 * =============================================================================
 * EDIT MODE PATTERN (Forms)
 * =============================================================================
 * 
 * All forms that support both create AND edit must follow this pattern:
 * 
 * interface FormProps {
 *   id?: string;  // If provided, form is in edit mode
 * }
 * 
 * function MyForm({ id }: FormProps) {
 *   // Fetch existing data if editing
 *   const docRef = id ? doc(firestore, 'collection', id) : null;
 *   const { data: existingData } = useDoc<Type>(docRef);
 * 
 *   // Initialize form with existing data
 *   useEffect(() => {
 *     if (existingData) {
 *       reset(existingData);
 *     }
 *   }, [existingData, reset]);
 * 
 *   // Toggle between create/update
 *   const onSubmit = async (data) => {
 *     if (id && existingData) {
 *       await updateDocumentNonBlocking(doc(firestore, 'collection', id), data);
 *     } else {
 *       await addDocumentNonBlocking(collection(firestore, 'collection'), data);
 *     }
 *   };
 * }
 * 
 * =============================================================================
 * PERMISSIONS & ACCESS CONTROL
 * =============================================================================
 * 
 * IMPORT PERMISSIONS:
 * import { canEdit, canDelete, isManagement } from '@/lib/permissions';
 * 
 * 1. CHECKING PERMISSIONS
 *    const { profile } = useUserProfile(user);
 *    const canUserEdit = canEdit(item, profile);
 *    const canUserDelete = canDelete(profile);
 *    const isManager = isManagement(profile);
 * 
 * 2. DATA-TABLE WITH ACTIONS
 *    Use the enhanced DataTable with permission-based actions:
 *    <DataTable
 *      data={items}
 *      columns={columns}
 *      currentUser={user}
 *      userProfile={profile}
 *      editHref={(item) => `/path/to/edit?id=${item.id}`}
 *      deleteCollection="collection-name"
 *      viewHref={(item) => `/path/to/view?id=${item.id}`}
 *    />
 * 
 * 3. MANUAL ACTION BUTTONS (if not using DataTable)
 *    // Edit button - only for owner
 *    {canEdit(item, profile) && (
 *      <Button onClick={() => router.push(`/edit/${item.id}`)}>
 *        <Pencil className="h-4 w-4" /> Edit
 *      </Button>
 *    )}
 * 
 *    // Delete button - only for ED/Admin
 *    {canDelete(profile) && (
 *      <AlertDialog>
 *        <AlertDialogTrigger><Button variant="destructive"><Trash2 /></Button></AlertDialogTrigger>
 *        <AlertDialogContent>
 *          <AlertDialogTitle>Delete?</AlertDialogTitle>
 *          <AlertDialogFooter>
 *            <AlertDialogCancel>Cancel</AlertDialogCancel>
 *            <AlertDialogAction onClick={() => deleteDocumentNonBlocking(doc(firestore, 'collection', item.id))}>
 *              Delete
 *            </AlertDialogAction>
 *          </AlertDialogFooter>
 *        </AlertDialogContent>
 *      </AlertDialog>
 *    )}
 * 
 * PERMISSION RULES:
 * - EDIT: User can edit if they created the item OR are Admin/ED
 *         canEdit(item, profile) returns true if:
 *           - item.userId === profile.uid (owner)
 *           - profile.role is 'Administrator' or 'Executive Director'
 * 
 * - DELETE: Only Executive Director can delete
 *           canDelete(profile) returns true if:
 *             - profile.role === 'Executive Director'
 * 
 * - MANAGEMENT: Users with management roles can access management sections
 *               isManagement(profile) returns true for:
 *                 - Administrator, Executive Director, Programs & Partnerships Manager,
 *                   Operations & Field Manager, Media & Finance Lead,
 *                   Media & Communications Lead, Resource Mobilization Lead
 * 
 * =============================================================================
 * BUTTON STANDARDS
 * =============================================================================
 * 
 * SIZING:
 * - Default: h-10 (40px) - for most actions
 * - Large: h-12 (48px) - for primary CTAs
 * - Small: h-8 sm:h-9 - for inline actions
 * 
 * RESPONSIVE:
 * - Mobile: w-full or auto
 * - Desktop: w-auto for secondary actions
 * 
 * ICONS:
 * - Size: h-4 w-4 for inline, h-5 w-5 for standalone
 * - Always use lucide-react icons
 * 
 * =============================================================================
 * MOBILE-SPECIFIC RULES
 * =============================================================================
 * 
 * 1. NO HORIZONTAL SCROLL
 *    - All containers must use: overflow-hidden or overflow-x-auto
 *    - Tables must be wrapped or made responsive
 *    - Body CSS: overflow-x: hidden
 * 
 * 2. TOUCH TARGETS
 *    - Minimum size: h-10 w-10 (44x44px per Apple HIG)
 *    - Spacing between tappable elements: gap-2 minimum
 * 
 * 3. INPUT SIZING
 *    - Height: h-10 sm:h-11
 *    - Padding: px-3 sm:px-4
 *    - Font size: 16px on mobile (prevents iOS zoom)
 * 
 * 4. SAFE AREAS
 *    - Use pb-[calc(2rem+env(safe-area-inset-bottom))] for bottom-pinned elements
 *    - Consider notch on iPhone models
 * 
 * =============================================================================
 * DATA DISPLAY STANDARDS
 * =============================================================================
 * 
 * TABLES:
 *    - Wrap in overflow-x-auto
 *    - Mobile: consider card-based layout instead
 *    - Use truncate for long text
 * 
 * LISTS:
 *    - Use gap-2 sm:gap-4
 *    - Skeleton loaders while loading
 *    - Empty state when no data
 * 
 * CHARTS:
 *    - Height: h-48 sm:h-64 lg:h-96
 *    - Responsive container
 * 
 * =============================================================================
 * ICONOGRAPHY
 * =============================================================================
 * 
 * SIZING:
 * - Inline with text: h-4 w-4
 * - Standalone/feature: h-6 w-6 to h-8 w-8
 * - Decorative: h-10 w-10 to h-12 w-12
 * 
 * COLORS:
 * - Use text-omuto-navy, text-omuto-red, text-muted-foreground
 * - Avoid hardcoded hex colors
 * 
 * =============================================================================
 * ACCESSIBILITY
 * =============================================================================
 * 
 * 1. COLOR CONTRAST
 *    - Minimum 4.5:1 for normal text
 *    - Minimum 3:1 for large text
 * 
 * 2. FOCUS STATES
 *    - Always include focus-visible:ring
 *    - Use data-[state=active] for selected states
 * 
 * 3. LABELS & ARIA
 *    - All inputs must have labels
 *    - Use htmlFor/id pairing
 *    - Dialogs need proper labeling
 * 
 * =============================================================================
 * ERROR HANDLING
 * =============================================================================
 * 
 * FORMS:
 *    - Inline validation messages
 *    - Use text-destructive for errors
 *    - text-xs sm:text-sm for error text
 * 
 * API ERRORS:
 *    - Toast notifications for success/failure
 *    - Log errors to console
 *    - Never expose raw error messages to users
 * 
 * LOADING STATES:
 *    - Skeleton loaders for content
 *    - Spinner for buttons during submission
 *    - Disabled state during async operations
 * 
 * =============================================================================
 * FILE STRUCTURE
 * =============================================================================
 * 
 * Components:
 * - /components/ui/ - Base UI components
 * - /components/forms/ - Form components
 * - /components/dashboard/ - Dashboard components
 * - /components/management/ - Management section components
 * 
 * Pages:
 * - /app/(main)/ - Main pages with sidebar layout
 * - /app/(main)/[section]/[page]/ - Section pages
 * 
 * Types:
 * - /lib/types/ - TypeScript type definitions
 * - /lib/types/specialized.ts - App-specific types
 * 
 * Utils:
 * - /lib/utils.ts - Utility functions
 * - /lib/permissions.ts - Permission helpers
 * 
 */

// Export constants for reuse
export const MOBILE_BREAKPOINT = '640px';
export const TABLET_BREAKPOINT = '768px';
export const DESKTOP_BREAKPOINT = '1024px';

export const SPACING_SCALE = {
  xs: 'gap-1',
  sm: 'gap-2', 
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

export const PADDING_SCALE = {
  mobile: 'p-3 sm:p-4',
  tablet: 'p-4 sm:p-6', 
  desktop: 'p-6 sm:p-8',
} as const;
