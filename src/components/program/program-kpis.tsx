import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Kpi } from '@/lib/types';

interface ProgramKPIsProps {
  kpis: Kpi[];
}

export default function ProgramKPIs({ kpis }: ProgramKPIsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Program KPIs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {kpis.map((kpi) => (
            <div key={kpi.metric}>
              <div className="flex justify-between">
                <span>{kpi.metric}</span>
                <span>{kpi.current} / {kpi.target} {kpi.unit}</span>
              </div>
              <Progress value={(kpi.current / kpi.target) * 100} className="mt-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}