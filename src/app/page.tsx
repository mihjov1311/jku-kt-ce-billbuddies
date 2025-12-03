/* =============================================================================
 * APP.TSX - HAUPTKOMPONENTE DER BILLBUDDIES-ANWENDUNG
 * =============================================================================
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthPage } from "@/components/AuthPage";
import { GroupManagement } from "@/components/GroupManagement";
import { AddExpenseDialog, Participant } from "@/components/AddExpenseDialog";
import { ExpenseList } from "@/components/ExpenseList";
import { BalanceOverview } from "@/components/BalanceOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// FIX: Plus importieren
import { Button } from "@/components/ui/button";
import { Receipt, LogOut, ArrowLeft, Camera, Plus } from "lucide-react";


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
    foto?: string;
}

interface Balance {
    from: string;
    to: string;
    amount: number;
}

interface User {
    name: string;
    email?: string;
    dbId?: string; // Die echte Benutzer-ID aus der Datenbank
}

interface Group {
    id: string;
    name: string;
    code: string;
    memberCount: number;
    members: Participant[];
}

// Interface für die Rückgabe der OCR-API
interface OcrResult {
    amount: string;
    description: string;
    category?: string;
    imageUrl?: string;
}

/**
 * HELFERFUNKTION: Datei zu Base64 konvertieren (für den API-Call)
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


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

    // NEU: STATE FÜR OCR & DIALOG-SICHTBARKEIT
    const [ocrData, setOcrData] = useState<OcrResult | null>(null);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // --- 1. AUTHENTIFIZIERUNG & PROFIL LADEN ---
    useEffect(() => {
        const getUserProfile = async (session: any) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('mitglieder')
                    .select('benutzername')
                    .eq('id', session.user.id)
                    .single();

                setUser({
                    name: session.user.email || "Benutzer",
                    email: session.user.email,
                    dbId: profile?.benutzername
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
                // Sicherstellen, dass die Spalte 'foto' hier ausgewählt wird
                .select("*, foto")
                .eq("gruppenid", groupIdInt)
                .order("ausgabeid", { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedExpenses: Expense[] = data.map((item: any) => ({
                    id: item.ausgabeid.toString(),
                    description: item.beschreibung,
                    amount: parseFloat(item.betrag),
                    category: item.kategorie,
                    paidBy: item.benutzername, // Wichtig: Hier wird 'benutzername' verwendet
                    splitBetween: selectedGroup.members.map(m => m.id),
                    date: item.created_at ? new Date(item.created_at) : new Date(),
                    foto: item.foto,
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
    const removeParticipantFromGroup = async (participantIdToRemove: string, participantName: string) => {
        if (!selectedGroup || !user) return;

        // Verhinderung der Selbst-Löschung über diesen Button
        if (participantIdToRemove === user.dbId) {
            alert("Um sich selbst zu entfernen, nutzen Sie bitte den 'Gruppe verlassen' Button.");
            return;
        }

        // 1. Warnung bei Beteiligung an Ausgaben (bleibt erhalten)
        const isInvolved = expenses.some(
            (expense) =>
                expense.paidBy === participantIdToRemove ||
                expense.splitBetween.includes(participantIdToRemove)
        );

        let confirmMessage = `Möchten Sie den Teilnehmer ${participantName} wirklich aus der Gruppe entfernen?`;
        if (isInvolved) {
            confirmMessage += "\n\nACHTUNG: Dieses Mitglied ist an Ausgaben beteiligt. Die Rechnungen bleiben erhalten, aber die Salden werden in der Gruppe unkorrekt, bis die Ausgaben angepasst oder gelöscht wurden.";
        }

        if (!confirm(confirmMessage)) return;

        // 2. Datenbank-Löschung
        const { error } = await supabase
            .from("gruppenmitglieder")
            .delete()
            .eq("gruppenid", selectedGroup.id)
            .eq("benutzername", participantIdToRemove);

        if (error) {
            alert("Fehler beim Entfernen des Mitglieds: " + error.message);
        } else {
            // 3. UI und Daten neu laden
            setParticipants(prev => prev.filter(p => p.id !== participantIdToRemove));
            fetchExpenses();
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

    // --- OCR SCAN LOGIK ---
    const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            alert("Bitte wählen Sie ein Bild (JPEG, PNG) aus.");
            e.target.value = '';
            return;
        }

        setIsOcrProcessing(true);

        try {
            // 1. Datei in Base64 konvertieren (Frontend)
            const imageBase64WithPrefix = await fileToBase64(file);
            const base64Data = imageBase64WithPrefix.split(',')[1];

            // 2. Base64 an den API-Endpunkt senden
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageBase64: base64Data }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Serverfehler (${response.status}). ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der OCR-Verarbeitung.');
            }

            // 3. OCR-Daten speichern
            setOcrData({
                amount: data.amount,
                description: data.description,
                category: data.category,
                imageUrl: data.imageUrl,
            });

            // 4. Dialog öffnen
            setIsDialogOpen(true);

        } catch (error: any) {
            console.error("Fehler beim Scannen:", error);
            alert("Fehler beim Scannen der Rechnung: " + error.message);
        } finally {
            setIsOcrProcessing(false);
            e.target.value = ''; // Input zurücksetzen
        }
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

    // --- BERECHNUNGEN FÜR DAS DASHBOARD ---
    const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + (Number(expense.amount) || 0);
    }, 0);

    const myTotalPaid = expenses
        .filter(e => e.paidBy === user?.dbId)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const costPerPerson = participants.length > 0 ? totalExpenses / participants.length : 0;

    const myBalance = myTotalPaid - costPerPerson;

    const balances = calculateBalances();

    const currentUserDbId = user.dbId || "";

    // --- GRUPPE VERLASSEN ---
      const leaveGroup = async () => {
        if (!selectedGroup || !user) return;

        // 1. Sicherheitsabfrage
        if (!confirm("Möchten Sie diese Gruppe wirklich verlassen?")) return;

        // 2. Datenbank-Löschung (DELETE)
        const { error } = await supabase
          .from("gruppenmitglieder")
          .delete()
          .eq("gruppenid", selectedGroup.id)
          .eq("benutzername", user.dbId); // Wichtig: Wir nutzen user.dbId (den Benutzernamen)

        if (error) {
          alert("Fehler beim Verlassen: " + error.message);
        } else {
          // 3. Zurück zur Gruppenübersicht
          setSelectedGroup(null);
          setExpenses([]);
        }
      };



    return (
        <div className="min-h-screen bg-[#f3faf8]">
            {/* HEADER */}
            {/* ... (Header-Code bleibt unverändert) ... */}
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
                    {/* ... (Teilnehmer-Card-Code bleibt unverändert) ... */}
                    <Card className="border-0 rounded-3xl shadow-md bg-white">
                        <CardHeader className="border-b border-emerald-100 bg-white rounded-t-3xl pb-3">
                            <div className="flex justify-between items-center">
                                {/* 1. LINKS: Titel (Teilnehmer) */}
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-purple-100 text-purple-700">👥</span>
                                    Teilnehmer ({participants.length})
                                </CardTitle>

                                {/* 2. RECHTS: Gruppe verlassen Button (kleiner und weniger prominent) */}
                                <Button
                                    variant="ghost" // Weniger prominente, transparente Darstellung
                                    size="sm"       // Etwas kleiner (kleinerer Padding)
                                    onClick={leaveGroup}
                                    className="text-rose-600 hover:bg-rose-50/70 hover:text-rose-700 font-semibold gap-1"
                                >
                                    <LogOut className="h-3 w-3" /> {/* Kleineres Icon (h-3 w-3) */}
                                    Verlassen
                                </Button>
                            </div>
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
                                                <button onClick={() => removeParticipantFromGroup(participant.id, participant.name)} className="ml-1 text-xs opacity-60 hover:opacity-100 hover:text-red-500">✕</button>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>


                    {/* DASHBOARD */}
                    {/* ... (Dashboard-Card-Code bleibt unverändert) ... */}
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

                {/* AKTIONEN (FIX: Manuelle und Scan-Buttons sind jetzt beide sichtbar) */}
                <div className="mb-6 flex flex-wrap items-center gap-3">

                    {/* 1. MANUELLER BUTTON (FIX: Erscheint wieder und setzt OCR-Daten zurück) */}
                    <Button
                        onClick={() => {
                            setOcrData(null); // WICHTIG: Setzt OCR-Daten zurück, bevor der Dialog geöffnet wird
                            setIsDialogOpen(true);
                        }}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    >
                        <Plus className="w-5 h-5 mr-1" /> Ausgabe
                    </Button>

                    {/* 2. RECHNUNG SCANNEN BUTTON */}
                    <label
                        htmlFor="receipt-upload"
                        className={`inline-flex items-center justify-center gap-2 rounded-full bg-teal-700 text-white shadow-md transition-all h-10 px-4 py-2 text-sm font-medium ${
                            isOcrProcessing
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-teal-800 hover:shadow-lg cursor-pointer'
                        }`}
                    >
                        <Camera className="h-4 w-4"/>
                        <span className="hidden sm:inline">
                            {isOcrProcessing ? "Verarbeite..." : "Rechnung scannen"}
                        </span>
                    </label>
                    <input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScanReceipt}
                        disabled={isOcrProcessing}
                    />

                    {/* 3. DER DIALOG (Steuerung über isDialogOpen) */}
                    <AddExpenseDialog
                        groupId={parseInt(selectedGroup.id)}
                        participants={participants}
                        onExpenseAdded={() => {
                            handleExpenseAdded();
                            // setOcrData(null); -> Ist jetzt in onOpenChange
                        }}
                        initialAmount={ocrData?.amount}
                        initialDescription={ocrData?.description}
                        initialCategory={ocrData?.category}
                        initialImage={ocrData?.imageUrl}

                        open={isDialogOpen}
                        onOpenChange={(newOpenState) => {
                            setIsDialogOpen(newOpenState);
                            // WICHTIG: Setzt OCR-Daten zurück, wenn der Dialog geschlossen wird (egal ob gespeichert oder abgebrochen)
                            if (!newOpenState) setOcrData(null);
                        }}

                        currentUserDbId={currentUserDbId}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {isLoading ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">Lade Ausgaben...</div>
                    ) : (
                        <>
                            <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense}/>
                            <BalanceOverview balances={balances}/>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}