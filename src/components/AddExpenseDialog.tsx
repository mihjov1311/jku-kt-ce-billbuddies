import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Users } from "lucide-react";

interface AddExpenseDialogProps {
  participants: string[];
  onAddExpense: (expense: {
    description: string;
    amount: number;
    category?: string;
    paidBy: string;
    splitBetween: string[];
  }) => void;
}

export function AddExpenseDialog({ participants, onAddExpense }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !paidBy) {
      return;
    }

    onAddExpense({
      description,
      amount: parseFloat(amount),
      category: category.trim() || undefined,
      paidBy,
      splitBetween: participants, // Automatically split between all participants
    });

    // Reset form
    setDescription("");
    setAmount("");
    setCategory("");
    setPaidBy("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full bg-teal-700 hover:bg-teal-700 text-white
                    rounded-full shadow-md
                                                                                  hover:shadow-lg
                                                                                  transition-shadow">
          <Plus className="h-4 w-4" />
          <span className="text-sm">Ausgabe hinzufügen</span>
        </Button>
      </DialogTrigger>


      <DialogContent className="sm:max-w-[500px] bg-slate-50 rounded-3xl">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white">
              <Plus className="h-4 w-4" />
            </span>
            Neue Ausgabe
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-1">
            Fügen Sie eine neue Ausgabe hinzu. Die Kosten werden automatisch
            gleichmäßig auf alle Teilnehmer aufgeteilt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              placeholder="z.B. Abendessen"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white rounded-xl"
              required
              className="border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Betrag (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white rounded-xl"
              required
              className="border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Kategorie (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm">
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                <SelectItem value="Essen & Trinken">🍽️ Essen &amp; Trinken</SelectItem>
                <SelectItem value="Transport">🚗 Transport</SelectItem>
                <SelectItem value="Unterkunft">🏠 Unterkunft</SelectItem>
                <SelectItem value="Einkaufen">🛒 Einkaufen</SelectItem>
                <SelectItem value="Unterhaltung">🎬 Unterhaltung</SelectItem>
                <SelectItem value="Gesundheit">❤️ Gesundheit</SelectItem>
                <SelectItem value="Energie">⚡ Energie</SelectItem>
                <SelectItem value="Sonstiges">📦 Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paidBy">Bezahlt von</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm">
                <SelectValue placeholder="Person auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                {participants.map((participant) => (
                  <SelectItem key={participant} value={participant}>
                    {participant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Aufgeteilt zwischen</Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                <Users className="h-3 w-3" />
              </span>
              <span className="text-slate-700">
                Gleichmäßig zwischen allen {participants.length}{" "}
                {participants.length === 1 ? "Teilnehmern" : "Teilnehmern"}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700"
            >
              Ausgabe speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
