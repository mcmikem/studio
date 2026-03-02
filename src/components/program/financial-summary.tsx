import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialSummary, Transaction } from '@/lib/types';

interface ProgramFinancialSummaryProps {
  summary: FinancialSummary;
  transactions: Transaction[];
}

export default function ProgramFinancialSummary({ summary, transactions }: ProgramFinancialSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-2xl font-bold">${summary.budget.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="text-2xl font-bold">${summary.spent.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-bold">${summary.income.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className="text-2xl font-bold">${summary.net.toLocaleString()}</p>
          </div>
        </div>
        <h4 className="font-semibold mb-2">Recent Transactions</h4>
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{t.description}</p>
                <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
              </div>
              <p className={`font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}