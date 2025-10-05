
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { partnerships } from '@/lib/data';

const statusColors: { [key: string]: string } = {
    "Active": "border-green-500 bg-green-500/10 text-green-500",
    "Potential": "border-blue-500 bg-blue-500/10 text-blue-500",
    "Inactive": "border-gray-500 bg-gray-500/10 text-gray-500",
};

export default function PartnershipsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Partnerships
        </h1>
        <p className="text-muted-foreground">
          Manage and track all partner relations and engagements.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Partner Database</CardTitle>
            <CardDescription>A central list of all Omuto Foundation partners.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnerships.map((partner) => (
                <TableRow key={partner.name}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.contactPerson}</TableCell>
                  <TableCell>
                    <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">
                      {partner.contactEmail}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[partner.status]}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{partner.nextStep}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
