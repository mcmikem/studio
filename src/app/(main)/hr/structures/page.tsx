'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Building2, Users, ShieldCheck, 
  Plus, ArrowRight, Briefcase,
  Layers, Lock, Sliders, ChevronRight
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface UserProfile {
    id?: string;
    displayName?: string;
    role?: string;
    department?: string;
}

const departmentConfig: Record<string, { icon: any; color: string; bg: string; lead: string }> = {
    'Executive Director': { icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50', lead: '' },
    'Programs Lead': { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50', lead: '' },
    'Finance Lead': { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', lead: '' },
    'Media & Communications Lead': { icon: Sliders, color: 'text-primary', bg: 'bg-primary/5', lead: '' },
};

export default function HRStructuresPage() {
    const usersQuery = useMemoFirebase((db) => query(collection(db, 'users')));
    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

    const departments = useMemo(() => {
        if (!users) return [];
        
        const deptGroups: Record<string, UserProfile[]> = {};
        users.forEach(u => {
            const dept = u.department || 'Unassigned';
            if (!deptGroups[dept]) deptGroups[dept] = [];
            deptGroups[dept].push(u);
        });

        return Object.entries(deptGroups).map(([name, members]) => {
            const config = departmentConfig[name] || { icon: Briefcase, color: 'text-omuto-navy', bg: 'bg-gray-50', lead: 'TBD' };
            return {
                name,
                count: members.length,
                lead: members[0]?.displayName || config.lead || 'TBD',
                icon: config.icon,
                color: config.color,
                bg: config.bg,
            };
        });
    }, [users]);

    const totalMembers = users?.length || 0;
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="HR Structures"
        description="Define organizational hierarchy, departments, and role-based permissions."
        icon={Building2}
      >
          <Button className="btn-omuto h-12 px-6 shadow-comic-sm">
              <Plus className="mr-2 h-4 w-4" /> Create Department
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Active Departments</h3>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 border-none">Total: {departments.length}</Badge>
              </div>
              
              <div className="space-y-4">
                  {isLoading ? (
                      [1,2,3].map(i => (
                          <Card key={i} className="border-2 shadow-xl rounded-[2rem] overflow-hidden">
                              <CardContent className="p-6 flex items-center gap-6">
                                  <Skeleton className="h-16 w-16 rounded-2xl" />
                                  <div className="space-y-2">
                                      <Skeleton className="h-6 w-48" />
                                      <Skeleton className="h-4 w-32" />
                                  </div>
                              </CardContent>
                          </Card>
                      ))
                  ) : departments.length === 0 ? (
                      <Card className="border-2 shadow-xl rounded-[2rem] overflow-hidden">
                          <CardContent className="p-12 text-center">
                              <Building2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                              <p className="text-lg font-bold text-muted-foreground">No departments found</p>
                              <p className="text-sm text-muted-foreground/60">Add team members with department assignments</p>
                          </CardContent>
                      </Card>
                  ) : (
                      departments.map((dept: any, i: number) => (
                          <Card key={i} className="border-2 shadow-xl rounded-[2rem] overflow-hidden hover:scale-[1.01] transition-transform duration-300 group">
                              <CardContent className="p-0">
                                  <div className="flex items-center p-6 gap-6">
                                      <div className={`h-16 w-16 rounded-2xl ${dept.bg} ${dept.color} flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm`}>
                                          <dept.icon className="h-7 w-7" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-lg font-black text-omuto-navy uppercase tracking-tight">{dept.name}</p>
                                          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                              <span>Lead: {dept.lead}</span>
                                              <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                              <span>{dept.count} Members</span>
                                          </div>
                                      </div>
                                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-omuto-navy/5">
                                          <ChevronRight className="h-5 w-5 text-omuto-navy/20 group-hover:text-primary transition-colors" />
                                      </Button>
                                  </div>
                              </CardContent>
                          </Card>
                      ))
                  )}
              </div>
          </div>

          <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Access Control (RBAC)</h3>
                  <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto">View All Roles →</Button>
              </div>
              
              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-omuto-navy text-white p-8">
                  <CardTitle className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" /> Permission Engine
                  </CardTitle>
                  <CardDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-8">
                      Global access rules and institutional safety protocols.
                  </CardDescription>
                  
                  <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest">Financial Approval Floor</span>
                          <span className="text-[10px] font-black bg-primary px-3 py-1 rounded-full">Administrator+</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest">Data Deletion Rights</span>
                          <span className="text-[10px] font-black bg-rose-600 px-3 py-1 rounded-full">Executive Only</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between opacity-50">
                          <span className="text-xs font-bold uppercase tracking-widest">School Registration</span>
                          <span className="text-[10px] font-black bg-emerald-600 px-3 py-1 rounded-full">All Staff</span>
                      </div>
                  </div>
                  
                  <Button className="w-full mt-8 bg-white text-omuto-navy hover:bg-white/90 font-black uppercase tracking-widest text-xs h-12 rounded-xl">
                      Configure Global RBAC
                  </Button>
              </Card>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden p-8 border-omuto-navy/10">
                   <div className="flex items-start gap-4">
                       <div className="p-3 bg-omuto-navy/5 rounded-2xl text-omuto-navy">
                           <Users className="h-6 w-6" />
                       </div>
                       <div>
                           <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-1">Hierarchy Visualization</h4>
                           <p className="text-xs text-muted-foreground leading-relaxed">
                               The organizational tree is automatically generated based on the 'Supervisor' field in team member profiles.
                           </p>
                           <Button variant="link" className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary mt-4">
                               Open Org Chart →
                           </Button>
                       </div>
                   </div>
              </Card>
          </div>
      </div>
    </div>
  );
}
