import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus } from "lucide-react";

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
        <Button className="gap-2 shadow-md hover:shadow-lg transition-shadow" size="lg">
          <Plus className="h-5 w-5" />
          Ausgabe hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white">
              <Plus className="h-5 w-5" />
            </div>
            Neue Ausgabe
          </DialogTitle>
          <DialogDescription className="text-base">
            Fügen Sie eine neue Ausgabe hinzu. Die Kosten werden automatisch gleichmäßig auf alle Teilnehmer aufgeteilt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              placeholder="z.B. Abendessen"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Betrag (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Essen & Trinken">🍽️ Essen & Trinken</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="paidBy">Bezahlt von</Label>
            <Select value={paidBy} onValueChange={setPaidBy} required>
              <SelectTrigger>
                <SelectValue placeholder="Person auswählen" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant} value={participant}>
                    {participant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aufgeteilt zwischen</Label>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="text-xs">👥</span>
                <span className="text-sm">Gleichmäßig zwischen allen {participants.length} Teilnehmern</span>
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Ausgabe speichern
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
