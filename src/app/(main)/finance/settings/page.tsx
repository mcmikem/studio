'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { Settings, Users, Shield, Banknote } from 'lucide-react';

const roles = [
  { role: 'Executive Director', canApprove: true, canDisburse: true, canDelete: true, description: 'Full financial control' },
  { role: 'Media & Finance Lead', canApprove: false, canDisburse: true, canDelete: false, description: 'Manage finances and disburse' },
  { role: 'Administrator', canApprove: false, canDisburse: true, canDelete: false, description: 'Full system access' },
  { role: 'Media & Communications Lead', canApprove: false, canDisburse: true, canDelete: false, description: 'Finance management' },
  { role: 'Programs & Partnerships Manager', canApprove: true, canDisburse: false, canDelete: false, description: 'Approve program expenses' },
  { role: 'Operations & Field Manager', canApprove: true, canDisburse: false, canDelete: false, description: 'Approve operational expenses' },
];

export default function FinanceSettingsPage() {
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const isFinanceRole = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'].includes(profile?.role || '');

  if (!isFinanceRole) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">Only finance roles can access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Finance Settings
        </h1>
        <p className="text-muted-foreground">Configure finance permissions and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" /> Role Permissions
          </CardTitle>
          <CardDescription>Who can do what in the finance section.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.role} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-sm">{r.role}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                <div className="flex gap-2">
                  {r.canApprove && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Approve</Badge>}
                  {r.canDisburse && <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Disburse</Badge>}
                  {r.canDelete && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Delete</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5" /> Petty Cash Limit
          </CardTitle>
          <CardDescription>Expenses under this amount bypass approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div>
              <p className="text-2xl font-bold">UGX 50,000</p>
              <p className="text-xs text-muted-foreground">Current threshold</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
