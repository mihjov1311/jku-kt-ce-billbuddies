import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowRight } from "lucide-react";

interface Balance {
  from: string;
  to: string;
  amount: number;
}

interface BalanceOverviewProps {
  balances: Balance[];
}

export function BalanceOverview({ balances }: BalanceOverviewProps) {
  if (balances.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary">✅</span>
            </div>
            Abrechnung
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <p className="text-center text-muted-foreground">
              Alle Schulden sind beglichen!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary">💸</span>
          </div>
          Abrechnung ({balances.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {balances.map((balance, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-gradient-to-r from-card to-muted/20 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                <span>{balance.from.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{balance.from}</span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-medium">{balance.to}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <span>{balance.to.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-lg font-semibold text-destructive">
                {balance.amount.toFixed(2)} €
              </div>
              <div className="text-xs text-muted-foreground">
                schuldet
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
