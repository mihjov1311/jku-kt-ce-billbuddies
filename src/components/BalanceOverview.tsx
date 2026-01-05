import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowRight } from "lucide-react";
import type { Balance } from "@/lib/calculateBalance";


interface BalanceOverviewProps {
  balances: Balance[];
}

export function BalanceOverview({ balances }: BalanceOverviewProps) {
  if (balances.length === 0) {
    return (
      <Card className="border-0 rounded-3xl shadow-md bg-white">
              <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 text-sm">
                  ✅
                  </span>
            Abrechnung
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shadow-sm">
            <span className="text-3xl">🎉</span>
          </div>
            <p className="text-sm text-slate-600 max-w-xs">
              Alle Schulden sind beglichen!
            </p>
        </CardContent>
      </Card>
    );
  }


  //Fall: es gibt noch offene Salden
  return (
    <Card className="border-0 rounded-3xl shadow-md bg-white">
      <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 text-sm">
            ✓
          </span>
          Abrechnung ({balances.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 pb-5 space-y-3">
        {balances.map((balance, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50"
          >
            {/* Links: wer zahlt wem */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-sm font-semibold text-rose-700">
                {balance.from.charAt(0).toUpperCase()}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-medium">{balance.from}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{balance.to}</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                {balance.to.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Rechts: Betrag */}
            <div className="text-right ml-4">
              <div className="text-base font-semibold text-emerald-700">
                {balance.amount.toFixed(2)} €
              </div>
              <div className="text-xs text-slate-500">schuldet</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
