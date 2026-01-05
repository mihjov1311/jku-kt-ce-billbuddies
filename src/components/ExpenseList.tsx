"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient"; // WICHTIG: Pfad anpassen, falls nötig
import {
  Trash2, Home, Car, Utensils, Bus, ShoppingCart, Plane, Coffee,
  Ticket, Zap, Wifi, Heart, Gift, Smartphone, Fuel, TrendingUp,
  Receipt, Image as ImageIcon
} from "lucide-react";

// --- INTERFACES ---
interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  paidBy: string;
  splitBetween: string[];
  foto?: string; // Optionales Foto
}

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

// --- HELPER: KATEGORIE ICONS ---
const getCategoryIcon = (description: string) => {
  const text = description.toLowerCase();

  if (text.match(/wohnung|hotel|unterkunft|miete|airbnb|hostel|apartment/)) return { icon: Home, color: "text-blue-600" };
  if (text.match(/auto|taxi|uber|fahrt|parken|mietwagen|car/)) return { icon: Car, color: "text-purple-600" };
  if (text.match(/tank|benzin|diesel|tanken|sprit/)) return { icon: Fuel, color: "text-orange-600" };
  if (text.match(/essen|restaurant|burger|pizza|frühstück|mittag|abend|café|dinner|lunch|breakfast|food/)) return { icon: Utensils, color: "text-red-600" };
  if (text.match(/kaffee|coffee|bar|drink|getränk|bier|wein/)) return { icon: Coffee, color: "text-amber-600" };
  if (text.match(/bus|bahn|zug|metro|ubahn|öpnv|ticket|train|subway/)) return { icon: Bus, color: "text-green-600" };
  if (text.match(/flug|flight|fliegen|airline/)) return { icon: Plane, color: "text-sky-600" };
  if (text.match(/einkauf|supermarkt|shopping|markt|lebensmittel|groceries/)) return { icon: ShoppingCart, color: "text-teal-600" };
  if (text.match(/ticket|eintritt|konzert|kino|theater|museum|event/)) return { icon: Ticket, color: "text-indigo-600" };
  if (text.match(/strom|energie|gas|wasser|electricity/)) return { icon: Zap, color: "text-yellow-600" };
  if (text.match(/internet|wifi|wlan|telefon|handy|mobile/)) return { icon: Wifi, color: "text-cyan-600" };
  if (text.match(/geschenk|gift|present/)) return { icon: Gift, color: "text-pink-600" };
  if (text.match(/arzt|apotheke|medikament|health|doctor|pharmacy/)) return { icon: Heart, color: "text-rose-600" };
  if (text.match(/handy|smartphone|laptop|computer|tablet|technik/)) return { icon: Smartphone, color: "text-slate-600" };

  return { icon: TrendingUp, color: "text-gray-600" };
};

// --- MAIN COMPONENT ---
export function ExpenseList({ expenses, onDeleteExpense }: ExpenseListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Hilfsfunktion: Wandelt Pfad in Public URL um, falls nötig
  const getImageUrl = (pathOrUrl: string | undefined) => {
    if (!pathOrUrl) return null;

    // Wenn es schon eine vollständige URL ist (z.B. durch OCR direkt geliefert)
    if (pathOrUrl.startsWith("http")) {
      return pathOrUrl;
    }

    // Wenn es ein Pfad im Storage Bucket ist -> Public URL generieren
    const { data } = supabase.storage
        .from("receipts") // Dein Bucket Name
        .getPublicUrl(pathOrUrl);

    return data.publicUrl;
  };

  // 1. KEINE AUSGABEN
  if (expenses.length === 0) {
    return (
        <Card className="border-0 rounded-3xl shadow-md bg-white">
          <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center shadow-sm">
              <Receipt className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Noch keine Ausgaben vorhanden. Fügen Sie eine Ausgabe hinzu, um zu beginnen.
            </p>
          </CardContent>
        </Card>
    );
  }

  // 2. LISTE DER AUSGABEN
  return (
      <>
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
              const { icon: CategoryIcon, color } = getCategoryIcon(expense.description);

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

                      <div className="flex flex-wrap gap-2">
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
                      </div>

                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>
                      Aufgeteilt auf {expense.splitBetween.length}{" "}
                          {expense.splitBetween.length === 1 ? "Person" : "Personen"}
                    </span>
                      </p>
                    </div>

                    {/* Rechts: Betrag, Datum, Aktionen */}
                    <div className="flex flex-col items-end justify-between ml-4">
                      <div className="text-right mb-2">
                        <div className="whitespace-nowrap text-lg font-semibold text-slate-900">
                          {expense.amount.toFixed(2)} €
                        </div>
                        <div className="text-xs text-slate-500">

                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* FOTO BUTTON (nur wenn Foto existiert) */}
                        {expense.foto && (
                            <Button
                                variant="ghost"
                                size="icon"
                                // URL sicher auflösen bevor State gesetzt wird
                                onClick={() => setSelectedImage(getImageUrl(expense.foto))}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8"
                                title="Beleg anzeigen"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                        )}

                        {/* LÖSCHEN BUTTON */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteExpense(expense.id)}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
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

        {/* 3. BILD VORSCHAU MODAL */}
        {/* 3. BILD VORSCHAU MODAL */}
        <Dialog
            open={!!selectedImage}
            onOpenChange={(open) => !open && setSelectedImage(null)}
        >
          <DialogContent
              className="
      sm:max-w-xl max-h-[90vh]
      bg-[#F5F7FA]           /* Popup-Fenster */
      p-0 overflow-hidden border-0 flex flex-col

      [&>button]:top-4
      [&>button]:right-4

      data-[state=open]:bg-[#F5F7FA]   /* Overlay */
    "
          >

            {/* HIER GEÄNDERT:
               h-12 (48px Höhe):
               - 16px Padding oben (vom Button style)
               - ~16px Button Größe
               - Bleiben 16px Platz unter dem Button -> Perfekt zentriert.
            */}
            <DialogHeader className="h-7 flex-shrink-0">
              <DialogTitle className="sr-only">Rechnungsbeleg</DialogTitle>
            </DialogHeader>

            {/* mt-0, da der Header (h-12) das Bild jetzt automatisch nach unten schiebt */}
            <div className="flex-1 flex items-center justify-center bg-slate-100 p-4 min-h-[300px]">
              {selectedImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                      src={selectedImage}
                      alt="Rechnung"
                      className="max-w-full max-h-[80vh] object-contain rounded-md shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        alert("Bild konnte nicht geladen werden.");
                      }}
                  />
              ) : (
                  <p className="text-slate-500">Bild wird geladen...</p>
              )}
            </div>

            <div className="bg-white p-3 border-t text-center">
              <a href={selectedImage || "#"} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                Im Browser öffnen
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </>
  );
}