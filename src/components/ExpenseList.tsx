import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trash2, Home, Car, Utensils, Bus, ShoppingCart, Plane, Coffee, Ticket, Zap, Wifi, Heart, Gift, Smartphone, Fuel, TrendingUp, Receipt } from "lucide-react";
import { Button } from "./ui/button";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  paidBy: string;
  splitBetween: string[];
  date: Date;
}

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

const getCategoryIcon = (description: string) => {
  const text = description.toLowerCase();
  
  // Wohnung / Unterkunft
  if (text.match(/wohnung|hotel|unterkunft|miete|airbnb|hostel|apartment/)) {
    return { icon: Home, color: "text-blue-600" };
  }
  
  // Auto / Taxi
  if (text.match(/auto|taxi|uber|fahrt|parken|mietwagen|car/)) {
    return { icon: Car, color: "text-purple-600" };
  }
  
  // Tankstelle
  if (text.match(/tank|benzin|diesel|tanken|sprit/)) {
    return { icon: Fuel, color: "text-orange-600" };
  }
  
  // Essen / Restaurant
  if (text.match(/essen|restaurant|burger|pizza|frühstück|mittag|abend|café|dinner|lunch|breakfast|food/)) {
    return { icon: Utensils, color: "text-red-600" };
  }
  
  // Kaffee / Getränke
  if (text.match(/kaffee|coffee|bar|drink|getr��nk|bier|wein/)) {
    return { icon: Coffee, color: "text-amber-600" };
  }
  
  // Öffentliche Verkehrsmittel
  if (text.match(/bus|bahn|zug|metro|ubahn|öpnv|ticket|train|subway/)) {
    return { icon: Bus, color: "text-green-600" };
  }
  
  // Flug
  if (text.match(/flug|flight|fliegen|airline/)) {
    return { icon: Plane, color: "text-sky-600" };
  }
  
  // Einkaufen / Supermarkt
  if (text.match(/einkauf|supermarkt|shopping|markt|lebensmittel|groceries/)) {
    return { icon: ShoppingCart, color: "text-teal-600" };
  }
  
  // Tickets / Events
  if (text.match(/ticket|eintritt|konzert|kino|theater|museum|event/)) {
    return { icon: Ticket, color: "text-indigo-600" };
  }
  
  // Strom / Energie
  if (text.match(/strom|energie|gas|wasser|electricity/)) {
    return { icon: Zap, color: "text-yellow-600" };
  }
  
  // Internet / Telekommunikation
  if (text.match(/internet|wifi|wlan|telefon|handy|mobile/)) {
    return { icon: Wifi, color: "text-cyan-600" };
  }
  
  // Geschenke
  if (text.match(/geschenk|gift|present/)) {
    return { icon: Gift, color: "text-pink-600" };
  }
  
  // Gesundheit
  if (text.match(/arzt|apotheke|medikament|health|doctor|pharmacy/)) {
    return { icon: Heart, color: "text-rose-600" };
  }
  
  // Elektronik / Technik
  if (text.match(/handy|smartphone|laptop|computer|tablet|technik/)) {
    return { icon: Smartphone, color: "text-slate-600" };
  }
  
  // Sonstiges / Standard
  return { icon: TrendingUp, color: "text-gray-600" };
};


export function ExpenseList({ expenses, onDeleteExpense }: ExpenseListProps) {
  // Keine Ausgaben – leere Karte mit Icon
  if (expenses.length === 0) {
    return (
      <Card className="border-0 rounded-3xl shadow-md bg-white">
        <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center shadow-sm">
            <Receipt className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Noch keine Ausgaben vorhanden. Fügen Sie eine Ausgabe hinzu, um zu
            beginnen.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ausgaben
  return (
    <Card className="border-0 rounded-3xl shadow-md bg-white">
      <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-700">
            💰
          </span>
          Ausgaben ({expenses.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 pb-5 space-y-4">
        {expenses.map((expense) => {
          const { icon: CategoryIcon, color } = getCategoryIcon(
            expense.description,
          );

          return (
            <div
              key={expense.id}
              className="flex items-stretch rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              {/* Linke vertikale „Ticket“-Leiste */}
              <div className="w-10 mr-4">
                <div className="h-full w-10 rounded-2xl bg-slate-50 flex flex-col items-center justify-start pt-3 shadow-inner">
                  <CategoryIcon className={`h-5 w-5 ${color}`} />
                </div>
              </div>

              {/* Mitte: Beschreibung + Details */}
              <div className="flex-1 flex flex-col gap-1">
                <h4 className="font-medium text-slate-900 mb-1">
                  {expense.description}
                </h4>

                {expense.category && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{expense.category}</span>
                  </p>
                )}

                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Bezahlt von {expense.paidBy}</span>
                </p>

                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>
                    Gleichmäßig auf {expense.splitBetween.length}{" "}
                    {expense.splitBetween.length === 1 ? "Person" : "Personen"}{" "}
                    aufgeteilt
                  </span>
                </p>
              </div>

              {/* Rechts: Betrag, Datum, Löschen */}
              <div className="flex flex-col items-end justify-between ml-4">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="whitespace-nowrap text-lg font-semibold text-slate-900">
                      {expense.amount.toFixed(2)} €
                    </div>
                    <div className="text-xs text-slate-500">
                      {expense.date.toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
