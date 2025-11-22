/*/* =============================================================================
 * APP.TSX - HAUPTKOMPONENTE DER BILLBUDDIES-ANWENDUNG
 * =============================================================================
 *
 * Dies ist die zentrale Komponente, die die gesamte App steuert.
 * JETZT VERBUNDEN MIT SUPABASE DATENBANK.
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthPage } from "@/components/AuthPage";
import { GroupManagement } from "@/components/GroupManagement";
import { AddExpenseDialog, Participant } from "@/components/AddExpenseDialog"
import { ExpenseList } from "@/components/ExpenseList";
import { BalanceOverview } from "@/components/BalanceOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, LogOut, ArrowLeft, Camera } from "lucide-react";

/**
 * TYPESCRIPT INTERFACES
 */

// Eine Ausgabe (Frontend-Struktur)
interface Expense {
    id: string;
    description: string;
    amount: number;
    category?: string;
    paidBy: string;         // ID des Zahlers (z.B. "karl")
    splitBetween: string[]; // Array von IDs (z.B. ["karl", "luma06"])
    date: Date;
}

// Eine Schuld
interface Balance {
    from: string;   // Name des Schuldners (für die Anzeige)
    to: string;     // Name des Gläubigers (für die Anzeige)
    amount: number;
}

// Ein Benutzer
interface User {
    name: string;
    email?: string;
}

// Eine Gruppe
interface Group {
    id: string;
    name: string;
    code: string;
    memberCount: number;
    members: Participant[]; // Wir nutzen das Interface aus dem Dialog
}

/**
 * HAUPTKOMPONENTE
 */
export default function App() {
    // =============================================================================
    // STATE-VARIABLEN
    // =============================================================================

    const [user, setUser] = useState<User | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    // WICHTIG: Participants sind jetzt Objekte { id, name }
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    // =============================================================================
    // 1. AUTHENTIFIZIERUNG
    // =============================================================================

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    name: session.user.email || "Benutzer",
                    email: session.user.email
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    name: session.user.email || "Benutzer",
                    email: session.user.email
                });
            } else {
                setUser(null);
                setSelectedGroup(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSelectedGroup(null);
        setExpenses([]);
    };

    // =============================================================================
    // 2. DATEN LADEN
    // =============================================================================

    const fetchExpenses = useCallback(async () => {
        if (!selectedGroup) return;

        setIsLoading(true);
        console.log("Lade Daten für Gruppe:", selectedGroup.id);

        try {
            const groupIdInt = parseInt(selectedGroup.id);

            const { data, error } = await supabase
                .from("ausgaben")
                .select("*")
                .eq("gruppenid", groupIdInt)
                .order("ausgabeid", { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedExpenses: Expense[] = data.map((item: any) => ({
                    id: item.ausgabeid.toString(),
                    description: item.beschreibung,
                    amount: parseFloat(item.betrag),
                    category: item.kategorie,
                    paidBy: item.benutzername,
                    splitBetween: selectedGroup.members.map(m => m.id),
                    date: new Date(),
                }));
                setExpenses(mappedExpenses);
            }
        } catch (err: any) {
            console.error("Fehler beim Laden:", err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (selectedGroup) {
            fetchExpenses();
        }
    }, [selectedGroup, fetchExpenses]);


    // =============================================================================
    // TEILNEHMER-VERWALTUNG (LOKAL)
    // =============================================================================

    const removeParticipant = (idToRemove: string) => {
        // Wir prüfen anhand der ID
        const isInvolved = expenses.some(
            (expense) =>
                expense.paidBy === idToRemove ||
                expense.splitBetween.includes(idToRemove)
        );

        if (!isInvolved) {
            setParticipants(participants.filter((p) => p.id !== idToRemove));
        }
    };

    // =============================================================================
    // AUSGABEN & ABRECHNUNG
    // =============================================================================

    const handleExpenseAdded = () => {
        fetchExpenses();
    };

    const deleteExpense = async (id: string) => {
        const oldExpenses = [...expenses];
        setExpenses(expenses.filter((e) => e.id !== id));

        try {
            const { error } = await supabase
                .from("ausgaben")
                .delete()
                .eq("ausgabeid", parseInt(id));

            if (error) throw error;
        } catch (err: any) {
            alert("Fehler beim Löschen: " + err.message);
            setExpenses(oldExpenses);
        }
    };

    // --- KORRIGIERTE ABRECHNUNG (Arbeitet mit IDs) ---
    const calculateBalances = (): Balance[] => {
        const balances: Record<string, number> = {};

        // 1. Alles auf 0 setzen (nutze IDs als Key)
        participants.forEach((p) => {
            balances[p.id] = 0;
        });

        // 2. Ausgaben verrechnen
        expenses.forEach((expense) => {
            // Prüfen, welche der beteiligten IDs noch in der Gruppe sind
            const validSplitIds = expense.splitBetween.filter(id =>
                participants.some(p => p.id === id)
            );

            if(validSplitIds.length === 0) return;

            const shareAmount = expense.amount / validSplitIds.length;

            // Zahler (ID) bekommt Plus
            if (balances[expense.paidBy] !== undefined) {
                balances[expense.paidBy] += expense.amount;
            }

            // Alle Beteiligten (IDs) bekommen Minus
            validSplitIds.forEach((personId) => {
                if (balances[personId] !== undefined) {
                    balances[personId] -= shareAmount;
                }
            });
        });

        // 3. Sortieren (Schuldner & Gläubiger)
        const debtors = Object.entries(balances)
            .filter(([_, amount]) => amount < -0.01)
            .sort((a, b) => a[1] - b[1]);

        const creditors = Object.entries(balances)
            .filter(([_, amount]) => amount > 0.01)
            .sort((a, b) => b[1] - a[1]);

        const result: Balance[] = [];
        let i = 0;
        let j = 0;

        // 4. Ausgleichen
        while (i < debtors.length && j < creditors.length) {
            const [debtorId, debtAmount] = debtors[i];
            const [creditorId, creditAmount] = creditors[j];
            const amount = Math.min(-debtAmount, creditAmount);

            if (amount > 0.01) {
                // HIER IST DER TRICK: Wir wandeln die ID ("karl") zurück in den Namen ("Karl Hauser") für die Anzeige
                const debtorName = participants.find(p => p.id === debtorId)?.name || debtorId;
                const creditorName = participants.find(p => p.id === creditorId)?.name || creditorId;

                result.push({
                    from: debtorName,
                    to: creditorName,
                    amount: amount,
                });
            }

            debtors[i] = [debtorId, debtAmount + amount];
            creditors[j] = [creditorId, creditAmount - amount];

            if (Math.abs(debtors[i][1]) < 0.01) i++;
            if (Math.abs(creditors[j][1]) < 0.01) j++;
        }

        return result;
    };

    // =============================================================================
    // GRUPPEN-AUSWAHL
    // =============================================================================

    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
        setExpenses([]);

        if (user) {
            const groupMembers = group.members ? [...group.members] : [];
            setParticipants(groupMembers);
        }
    };

    const handleBackToGroups = () => {
        setSelectedGroup(null);
    };

    // =============================================================================
    // RENDERING
    // =============================================================================

    if (!user) {
        return <AuthPage onLogin={() => {}} />;
    }

    if (!selectedGroup) {
        return (
            <GroupManagement
                userName={user.name}
                onSelectGroup={handleSelectGroup}
                onLogout={handleLogout}
            />
        );
    }

    const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + (Number(expense.amount) || 0);
    }, 0);

    const balances = calculateBalances();

    return (
        <div className="min-h-screen bg-[#f3faf8]">
            {/* HEADER */}
            <div className="bg-teal-700 text-white shadow-md">
                <div className="mx-auto w-full max-w-6xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToGroups}
                                className="text-white hover:bg-teal-600/60"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-600 rounded-xl shadow-md">
                                    <Receipt className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold">
                                        {selectedGroup.name}
                                    </h1>
                                    <p className="text-sm text-teal-50/90">
                                        Code: {selectedGroup.code} • {selectedGroup.memberCount}{" "}
                                        {selectedGroup.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-teal-600 rounded-full shadow-sm">
                                <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-sm font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm">{user.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="gap-2 text-white hover:bg-teal-600/60"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Abmelden</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* HAUPT-CONTENT */}
            <div className="container mx-auto py-8 px-4 max-w-6xl">

                <div className="grid gap-6 md:grid-cols-2 mb-6">

                    {/* TEILNEHMER-KARTE - HIER WAR DER FEHLER */}
                    <Card className="border-0 rounded-3xl shadow-md bg-white">
                        <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-purple-100 text-purple-700">
                                    👥
                                </span>
                                Teilnehmer ({participants.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-5">
                            <div className="flex flex-wrap gap-2">
                                {participants.map((participant) => {
                                    // participant ist jetzt ein Objekt!

                                    const isInvolved = expenses.some(
                                        (expense) =>
                                            expense.paidBy === participant.id ||
                                            expense.splitBetween.includes(participant.id)
                                    );
                                    // Vergleich mit ID wäre besser, aber user.name ist Email...
                                    // Wir lassen das erstmal so für die Anzeige
                                    const isCurrentUser = user && participant.name === user.name;

                                    return (
                                        <span
                                            key={participant.id} // Wichtig: ID als Key
                                            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm
                                            ${isCurrentUser ? "bg-teal-700 text-white shadow-md" : "bg-[#e6fbf7] text-teal-900"}`}
                                        >
                                            <span
                                                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
                                                ${isCurrentUser ? "bg-teal-700 text-white shadow-md" : "bg-[#e6fbf7] text-teal-900"}`}
                                            >
                                                {/* HIER WAR DER FEHLER: participant.name statt participant */}
                                                {participant.name.charAt(0).toUpperCase()}
                                            </span>

                                            {/* Hier auch .name */}
                                            {participant.name}

                                            {isCurrentUser && <span className="text-xs opacity-90 ml-1">(Sie)</span>}

                                            {!isInvolved && !isCurrentUser && (
                                                <button
                                                    onClick={() => removeParticipant(participant.id)} // Hier ID übergeben
                                                    className="ml-1 text-xs opacity-60 hover:opacity-100 hover:text-red-500"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ZUSAMMENFASSUNGS-KARTE */}
                    <Card className="border-0 rounded-3xl shadow-md bg-white">
                        <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-sky-100">
                                    📊
                                </span>
                                Zusammenfassung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-5">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50">
                                    <span className="text-sm text-slate-600">Gesamtausgaben:</span>
                                    <span className="font-semibold">
                                        {totalExpenses.toFixed(2)} €
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50">
                                    <span className="text-sm text-slate-600">Anzahl Ausgaben:</span>
                                    <span className="font-semibold">{expenses.length}</span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50">
                                    <span className="text-sm text-slate-600">Offene Schulden:</span>
                                    <span className="font-semibold">{balances.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6 flex items-center gap-3">
                    <AddExpenseDialog
                        groupId={parseInt(selectedGroup.id)}
                        participants={participants}
                        onExpenseAdded={handleExpenseAdded}
                    />

                    <Button
                        variant="outline"
                        className="gap-2 rounded-full border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50 px-5 py-2 shadow-sm"
                        onClick={() => {
                            alert("OCR-Funktion kommt bald!");
                        }}
                    >
                        <Camera className="h-5 w-5 text-emerald-700" />
                        <span className="hidden sm:inline text-sm">Rechnung scannen</span>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {isLoading ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">
                            Lade Ausgaben...
                        </div>
                    ) : (
                        <>
                            {/* WICHTIG: ExpenseList muss mit IDs umgehen können oder wir müssen sie anpassen.
                                Für jetzt übergeben wir die expenses so wie sie sind.
                                Da in paidBy jetzt "karl" steht, zeigt die Liste evtl. "karl" an.
                                Das ist aber okay für den Moment.
                            */}
                            <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
                            <BalanceOverview balances={balances} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}