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
  if (expenses.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Noch keine Ausgaben vorhanden. Fügen Sie eine Ausgabe hinzu, um zu beginnen.
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
            <span className="text-primary">💰</span>
          </div>
          Ausgaben ({expenses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {expenses.map((expense) => {
          const { icon: CategoryIcon, color } = getCategoryIcon(expense.description);
          
          return (
            <div
              key={expense.id}
              className="flex items-start justify-between p-4 rounded-xl border border-border/50 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br from-white to-muted/30 ${color} flex-shrink-0 shadow-sm`}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-1.5 text-foreground">{expense.description}</h4>
                      {expense.category && (
                        <p className="text-muted-foreground flex items-center gap-1.5 mb-1">
                          <span className="text-xs">🏷️</span>
                          <span className="text-sm">{expense.category}</span>
                        </p>
                      )}
                      <div className="flex flex-col gap-1">
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <span className="text-xs">💳</span>
                          <span className="text-sm">Bezahlt von {expense.paidBy}</span>
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <span className="text-xs">👥</span>
                          <span className="text-sm">Gleichmäßig auf {expense.splitBetween.length} {expense.splitBetween.length === 1 ? "Person" : "Personen"} aufgeteilt</span>
                        </p>
                      </div>
                    </div>
                  </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="whitespace-nowrap text-lg font-semibold text-foreground">
                      {expense.amount.toFixed(2)} €
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {expense.date.toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
