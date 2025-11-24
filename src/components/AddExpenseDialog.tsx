"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { Plus, Users, Loader2, Image as ImageIcon } from "lucide-react"; // Icons aktualisiert

// --- INTERFACES ---
export interface Participant {
    id: string;
    name: string;
}

interface AddExpenseDialogProps {
    groupId: number;
    participants: Participant[];
    onExpenseAdded: () => void;

    // Externe Steuerung
    open: boolean;
    onOpenChange: (open: boolean) => void;

    // Initialwerte von OCR (Hinzugefügt/Aktualisiert)
    initialDescription?: string;
    initialAmount?: string;
    initialCategory?: string;
    initialImage?: string; // NEU: Für das Foto
    currentUserDbId: string;
}

export function AddExpenseDialog({
                                     groupId,
                                     participants,
                                     onExpenseAdded,
                                     open,
                                     onOpenChange,
                                     initialDescription = "",
                                     initialAmount = "",
                                     initialCategory = "",
                                     initialImage, // Hier initialImage übernehmen
                                     currentUserDbId
                                 }: AddExpenseDialogProps) {

    // Zustand für Formularfelder
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [paidBy, setPaidBy] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // useEffect: Füllt Felder, wenn der Dialog geöffnet wird (OCR-Daten laden oder Formular leeren)
    useEffect(() => {
        if (open) {
            // Beim Öffnen mit OCR-Daten befüllen (wenn vorhanden)
            setDescription(initialDescription || "");
            setAmount(initialAmount || "");
            setCategory(initialCategory || "");

            // Setzt den Zahler auf den aktuellen User
            setPaidBy(currentUserDbId);
        } else {
            // State beim Schließen zurücksetzen
            setDescription("");
            setAmount("");
            setCategory("");
            setPaidBy("");
        }
    }, [open, initialDescription, initialAmount, initialCategory, currentUserDbId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description || !amount || !paidBy) {
            alert("Bitte füllen Sie alle Pflichtfelder aus.");
            return;
        }

        const cleanAmount = amount.replace(",", ".");
        const amountFloat = parseFloat(cleanAmount);

        if (isNaN(amountFloat)) {
            alert("Ungültiger Betrag.");
            return;
        }

        setIsSaving(true);

        try {
            const { error } = await supabase
                .from("ausgaben")
                .insert({
                    gruppenid: groupId,
                    benutzername: paidBy,
                    betrag: amountFloat,
                    beschreibung: description,
                    kategorie: category || "Sonstiges",
                    foto: initialImage || null // FOTO-URL HINZUGEFÜGT
                });

            if (error) throw error;

            onOpenChange(false); // Schließt den Dialog
            onExpenseAdded();

        } catch (error: any) {
            console.error("Fehler beim Speichern:", error);
            alert("Fehler beim Speichern: " + (error.message || "Unbekannter Fehler"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* HINWEIS: DialogTrigger entfernt, da die Steuerung extern erfolgt (z.B. durch den Scan-Button) */}

            {/* STYLING WIE GEWÜNSCHT */}
            <DialogContent className="sm:max-w-[500px] bg-slate-50 rounded-3xl">
                <DialogHeader className="pb-4 border-b border-slate-200">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white">
                            <Plus className="h-4 w-4" />
                        </span>
                        Neue Ausgabe
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600 mt-1">
                        Fügen Sie eine neue Ausgabe hinzu.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">

                    {/* NEU: Foto Hinweis, nur sichtbar, wenn ein Bild von OCR übergeben wurde */}
                    {initialImage && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-sm">
                            <ImageIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-slate-700 font-medium">Rechnungsfoto angehängt</span>
                            <a
                                href={initialImage}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-xs text-emerald-600 underline hover:no-underline"
                            >
                                Ansehen
                            </a>
                        </div>
                    )}

                    {/* BESCHREIBUNG */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Input
                            id="description"
                            placeholder="z.B. Abendessen"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="bg-white border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm"
                        />
                    </div>

                    {/* BETRAG */}
                    <div className="space-y-1.5">
                        <Label htmlFor="amount">Betrag (€)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="bg-white border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm"
                        />
                    </div>

                    {/* KATEGORIE */}
                    <div className="space-y-1.5">
                        <Label htmlFor="category">Kategorie</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-white border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm">
                                <SelectValue placeholder="Kategorie auswählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                                <SelectItem value="Supermarkt & Lebensmittel">🛒 Supermarkt & Lebensmittel</SelectItem>
                                <SelectItem value="Essen & Trinken">🍽️ Essen &amp; Trinken</SelectItem>
                                <SelectItem value="Transport">🚗 Transport</SelectItem>
                                <SelectItem value="Unterkunft">🏠 Unterkunft</SelectItem>
                                <SelectItem value="Einkaufen">🛍️ Einkaufen</SelectItem>
                                <SelectItem value="Drogerie & Apotheke">💊 Drogerie & Apotheke</SelectItem>
                                <SelectItem value="Tanken & Auto">⛽ Tanken & Auto</SelectItem>
                                <SelectItem value="Sonstiges">📦 Sonstiges</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* BEZAHLT VON */}
                    <div className="space-y-1.5">
                        <Label htmlFor="paidBy">Bezahlt von</Label>
                        <Select value={paidBy} onValueChange={setPaidBy} required>
                            <SelectTrigger className="bg-white border border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-xl shadow-sm">
                                <SelectValue placeholder="Person auswählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-xl">
                                {participants.map((participant) => (
                                    <SelectItem key={participant.id} value={participant.id}>
                                        {participant.name} {participant.id === currentUserDbId ? "(Du)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* INFO BOX: Aufteilung */}
                    <div className="space-y-1.5">
                        <Label>Aufgeteilt zwischen</Label>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm shadow-sm">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                                <Users className="h-3 w-3" />
                            </span>
                            <span className="text-slate-700">
                                Gleichmäßig zwischen allen {participants.length} Teilnehmern
                            </span>
                        </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                            Abbrechen
                        </Button>

                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Wird gespeichert...</>
                            ) : (
                                "Ausgabe speichern"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}