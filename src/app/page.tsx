/* =============================================================================
 * APP.TSX - HAUPTKOMPONENTE DER BILLBUDDIES-ANWENDUNG
 * =============================================================================
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

interface Expense {
    id: string;
    description: string;
    amount: number;
    category?: string;
    paidBy: string;
    splitBetween: string[];
    date: Date;
}

interface Balance {
    from: string;
    to: string;
    amount: number;
}

interface User {
    name: string;
    email?: string;
    dbId?: string; // NEU: Die echte Benutzer-ID aus der Datenbank
}

interface Group {
    id: string;
    name: string;
    code: string;
    memberCount: number;
    members: Participant[];
}

/**
 * HAUPTKOMPONENTE
 */
export default function App() {
    // --- STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- 1. AUTHENTIFIZIERUNG & PROFIL LADEN ---
    useEffect(() => {
        const getUserProfile = async (session: any) => {
            if (session?.user) {
                // Wir laden den echten Benutzernamen aus der Tabelle 'mitglieder'
                const { data: profile } = await supabase
                    .from('mitglieder')
                    .select('benutzername')
                    .eq('id', session.user.id)
                    .single();

                setUser({
                    name: session.user.email || "Benutzer",
                    email: session.user.email,
                    dbId: profile?.benutzername // Hier speichern wir z.B. "luma06"
                });
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            getUserProfile(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                getUserProfile(session);
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

    // --- 2. DATEN LADEN ---
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
                    amount: parseFloat(item.betrag), // Wichtig: Text zu Zahl
                    category: item.kategorie,
                    paidBy: item.benutzername,
                    splitBetween: selectedGroup.members.map(m => m.id),
                    date: item.created_at ? new Date(item.created_at) : new Date(),
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

    // --- TEILNEHMER ENTFERNEN (UI) ---
    const removeParticipant = (idToRemove: string) => {
        const isInvolved = expenses.some(
            (expense) =>
                expense.paidBy === idToRemove ||
                expense.splitBetween.includes(idToRemove)
        );

        if (!isInvolved) {
            setParticipants(participants.filter((p) => p.id !== idToRemove));
        }
    };

    // --- AKTIONEN ---
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

    // --- BERECHNUNG DER SCHULDEN ---
    const calculateBalances = (): Balance[] => {
        const balances: Record<string, number> = {};

        participants.forEach((p) => { balances[p.id] = 0; });

        expenses.forEach((expense) => {
            const validSplitIds = expense.splitBetween.filter(id =>
                participants.some(p => p.id === id)
            );

            if(validSplitIds.length === 0) return;

            const shareAmount = expense.amount / validSplitIds.length;

            if (balances[expense.paidBy] !== undefined) {
                balances[expense.paidBy] += expense.amount;
            }

            validSplitIds.forEach((personId) => {
                if (balances[personId] !== undefined) {
                    balances[personId] -= shareAmount;
                }
            });
        });

        const debtors = Object.entries(balances)
            .filter(([_, amount]) => amount < -0.01)
            .sort((a, b) => a[1] - b[1]);

        const creditors = Object.entries(balances)
            .filter(([_, amount]) => amount > 0.01)
            .sort((a, b) => b[1] - a[1]);

        const result: Balance[] = [];
        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const [debtorId, debtAmount] = debtors[i];
            const [creditorId, creditAmount] = creditors[j];
            const amount = Math.min(-debtAmount, creditAmount);

            if (amount > 0.01) {
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

    // --- GRUPPEN HANDLING ---
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

    // --- RENDER CHECKS ---
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

    // --- BERECHNUNGEN FÜR DAS DASHBOARD (Hier war der Fehler!) ---

    // 1. Gesamtsumme
    const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + (Number(expense.amount) || 0);
    }, 0);

    // 2. Dein Beitrag (Wir vergleichen jetzt mit user.dbId)
    const myTotalPaid = expenses
        .filter(e => e.paidBy === user?.dbId)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 3. Kosten pro Kopf
    const costPerPerson = participants.length > 0 ? totalExpenses / participants.length : 0;

    // 4. Dein Saldo
    const myBalance = myTotalPaid - costPerPerson;

    const balances = calculateBalances();

    return (
        <div className="min-h-screen bg-[#f3faf8]">
            {/* HEADER */}
            <div className="bg-teal-700 text-white shadow-md">
                <div className="mx-auto w-full max-w-6xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={handleBackToGroups} className="text-white hover:bg-teal-600/60">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-600 rounded-xl shadow-md">
                                    <Receipt className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold">{selectedGroup.name}</h1>
                                    <p className="text-sm text-teal-50/90">
                                        Code: {selectedGroup.code} • {selectedGroup.memberCount} Mitglieder
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
                            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-white hover:bg-teal-600/60">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Abmelden</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto py-8 px-4 max-w-6xl">
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                    {/* TEILNEHMER */}
                    <Card className="border-0 rounded-3xl shadow-md bg-white">
                        <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-purple-100 text-purple-700">👥</span>
                                Teilnehmer ({participants.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-5">
                            <div className="flex flex-wrap gap-2">
                                {participants.map((participant) => {
                                    const isInvolved = expenses.some(e => e.paidBy === participant.id || e.splitBetween.includes(participant.id));
                                    const isCurrentUser = user && participant.name === user.name;
                                    return (
                                        <span key={participant.id} className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm ${isCurrentUser ? "bg-teal-700 text-white shadow-md" : "bg-[#e6fbf7] text-teal-900"}`}>
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${isCurrentUser ? "bg-teal-700 text-white shadow-md" : "bg-[#e6fbf7] text-teal-900"}`}>
                                                {participant.name.charAt(0).toUpperCase()}
                                            </span>
                                            {participant.name}
                                            {isCurrentUser && <span className="text-xs opacity-90 ml-1">(Sie)</span>}
                                            {!isInvolved && !isCurrentUser && (
                                                <button onClick={() => removeParticipant(participant.id)} className="ml-1 text-xs opacity-60 hover:opacity-100 hover:text-red-500">✕</button>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* DASHBOARD */}
                    <Card className="border-0 rounded-3xl shadow-md bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-white/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600">💰</span>
                                Finanzstatus
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                <div className="flex flex-col items-center justify-center p-6 bg-white">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Gruppen-Total</span>
                                    <div className="text-2xl font-bold text-slate-800">{totalExpenses.toFixed(2)} €</div>
                                    <span className="text-xs text-slate-400 mt-1">Ø {costPerPerson.toFixed(2)} € / Person</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-slate-50/30">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Du hast bezahlt</span>
                                    <div className="text-xl font-semibold text-slate-600">{myTotalPaid.toFixed(2)} €</div>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-6 ${myBalance >= 0 ? 'bg-emerald-50/60' : 'bg-rose-50/60'}`}>
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Dein Saldo</span>
                                    <div className={`text-2xl font-bold flex items-center gap-1 ${myBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {myBalance > 0 ? '+' : ''}{myBalance.toFixed(2)} €
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide ${myBalance >= -0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {myBalance >= -0.01 ? 'Du bekommst Geld' : 'Du musst zahlen'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6 flex items-center gap-3">
                    <AddExpenseDialog groupId={parseInt(selectedGroup.id)} participants={participants} onExpenseAdded={handleExpenseAdded} />
                    <Button variant="outline" className="gap-2 rounded-full border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50 px-5 py-2 shadow-sm" onClick={() => alert("OCR-Funktion kommt bald!")}>
                        <Camera className="h-5 w-5 text-emerald-700" />
                        <span className="hidden sm:inline text-sm">Rechnung scannen</span>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {isLoading ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">Lade Ausgaben...</div>
                    ) : (
                        <>
                            <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
                            <BalanceOverview balances={balances} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}