
 /*/* =============================================================================
 * APP.TSX - HAUPTKOMPONENTE DER BILLBUDDIES-ANWENDUNG
 * =============================================================================
 *
 * Dies ist die zentrale Komponente, die die gesamte App install @supabase/supabase-jsp steuert.
 *
 * APP-STRUKTUR:
 * 1. Nicht angemeldet → AuthPage (Login/Registrierung)
 * 2. Angemeldet, keine Gruppe → GroupManagement (Gruppen erstellen/beitreten)
 * 3. Angemeldet, Gruppe ausgewählt → Hauptansicht (Ausgaben, Teilnehmer, Abrechnung)
 *
 * STATE-VERWALTUNG:
 * - user: Aktuell angemeldeter Benutzer (null wenn nicht angemeldet)
 * - selectedGroup: Aktuell ausgewählte Gruppe (null wenn keine ausgewählt)
 * - participants: Liste der Teilnehmer der aktuellen Gruppe
 * - expenses: Liste der Ausgaben der aktuellen Gruppe
 *
 * WICHTIGE FUNKTIONEN:
 * - addExpense: Neue Ausgabe hinzufügen (automatisch auf alle Teilnehmer aufgeteilt)
 * - calculateBalances: Berechnet, wer wem wie viel schuldet
 * - handleLogin/Logout: Benutzer an-/abmelden
 * - handleSelectGroup: Gruppe auswählen und Daten laden
 *
 * ⚠️ AKTUELLER STATUS:
 * Alle Daten werden lokal im State gespeichert (kein Backend).
 * Später werden die Daten über die API im Backend gespeichert.
 */
"use client";
import Image from "next/image";
import { useState } from "react";
import { AuthPage } from "@/components/AuthPage";
import { GroupManagement } from "@/components/GroupManagement";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { ExpenseList } from "@/components/ExpenseList";
import { BalanceOverview } from "@/components/BalanceOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, X, LogOut, ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * TYPESCRIPT INTERFACES
 *
 * Definieren die Datenstrukturen für die App.
 * TypeScript prüft zur Compile-Zeit, dass alle Daten
 * die richtige Struktur haben.
 */

// Eine Ausgabe (z.B. "Abendessen 80€")
interface Expense {
  id: string;              // Eindeutige ID
  description: string;     // z.B. "Restaurant am Hafen"
  amount: number;          // Betrag in Euro
  category?: string;       // Optional: "Essen & Trinken", "Transport", etc.
  paidBy: string;          // Wer hat bezahlt (Benutzername)
  splitBetween: string[];  // Auf wen wird aufgeteilt (Array von Benutzernamen)
  date: Date;              // Wann wurde die Ausgabe erstellt
}

// Eine Schuld (z.B. "Anna schuldet Ben 25€")
interface Balance {
  from: string;   // Wer schuldet (Benutzername)
  to: string;     // Wem wird geschuldet (Benutzername)
  amount: number; // Betrag in Euro
}

// Ein Benutzer
interface User {
  name: string;  // Name des Benutzers
}

// Eine Gruppe
interface Group {
  id: string;          // Eindeutige ID
  name: string;        // z.B. "Urlaub Italien 2025"
  code: string;        // 6-stelliger Code zum Beitreten
  memberCount: number; // Anzahl Mitglieder
  createdAt: Date;     // Erstellungsdatum
  members: string[];   // Liste der Mitglieder (Benutzernamen)
}

/**
 * HAUPTKOMPONENTE
 */
export default function App() {
  // =============================================================================
  // STATE-VARIABLEN
  // =============================================================================

  /**
   * BENUTZER-STATE
   *
   * Speichert den aktuell angemeldeten Benutzer.
   * - null: Niemand angemeldet → Zeige AuthPage
   * - { name: "Max" }: Max ist angemeldet → Zeige App
   */
  const [user, setUser] = useState<User | null>(null);

  /**
   * AUSGEWÄHLTE GRUPPE
   *
   * Speichert die aktuell ausgewählte Gruppe.
   * - null: Keine Gruppe ausgewählt → Zeige GroupManagement
   * - { id: "123", name: "...", ... }: Gruppe ausgewählt → Zeige Hauptansicht
   */
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  /**
   * TEILNEHMER
   *
   * Liste aller Teilnehmer der aktuellen Gruppe.
   * Wird verwendet für:
   * - Anzeige der Teilnehmer
   * - Auswahl "Bezahlt von" bei neuer Ausgabe
   * - Automatisches Aufteilen der Ausgaben
   *
   * ⚠️ Aktuell: Demo-Daten ("Anna", "Ben", "Clara")
   *    Später: Wird beim Auswählen einer Gruppe vom Backend geladen
   */
  const [participants, setParticipants] = useState<string[]>(["Anna", "Ben", "Clara"]);

  /**
   * AUSGABEN
   *
   * Liste aller Ausgaben der aktuellen Gruppe.
   * Wird verwendet für:
   * - Anzeige in der Ausgabenliste
   * - Berechnung der Abrechnungen (calculateBalances)
   * - Gesamtsumme
   *
   * ⚠️ Aktuell: Leeres Array (lokal im State)
   *    Später: Wird vom Backend geladen
   */
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // =============================================================================
  // TEILNEHMER-VERWALTUNG
  // =============================================================================

  /**
   * TEILNEHMER HINZUFÜGEN
   *
   * ⚠️ HINWEIS: Diese Funktion wird aktuell nicht verwendet!
   * In BillBuddies können Teilnehmer NUR über den 6-stelligen Code
   * beitreten (nicht manuell hinzugefügt werden).
   *
   * Die Funktion bleibt aber im Code für eventuelle zukünftige Features.
   */
  const addParticipant = (name: string) => {
    if (!participants.includes(name)) {
      setParticipants([...participants, name]);
    }
  };

  /**
   * TEILNEHMER ENTFERNEN
   *
   * Entfernt einen Teilnehmer aus der Liste.
   *
   * REGELN:
   * 1. Der angemeldete Benutzer kann sich nicht selbst entfernen
   * 2. Teilnehmer, die in Ausgaben involviert sind, können nicht entfernt werden
   *    (würde die Abrechnungen verfälschen)
   *
   * @param name - Name des zu entfernenden Teilnehmers
   */
  const removeParticipant = (name: string) => {
    // Regel 1: Angemeldeter Benutzer kann sich nicht selbst entfernen
    if (user && name === user.name) {
      return;
    }

    // Regel 2: Prüfen, ob Teilnehmer in Ausgaben involviert ist
    const isInvolved = expenses.some(
      (expense) =>
        expense.paidBy === name ||           // Hat bezahlt
        expense.splitBetween.includes(name)  // Ist an Aufteilung beteiligt
    );

    // Nur entfernen, wenn nicht involviert
    if (!isInvolved) {
      setParticipants(participants.filter((p) => p !== name));
    }
  };

  // =============================================================================
  // AUSGABEN-VERWALTUNG
  // =============================================================================

  /**
   * NEUE AUSGABE HINZUFÜGEN
   *
   * Fügt eine neue Ausgabe zur Liste hinzu.
   * Die Ausgabe wird AUTOMATISCH gleichmäßig auf ALLE Teilnehmer aufgeteilt.
   *
   * ABLAUF:
   * 1. Frontend-Formular sammelt Daten (AddExpenseDialog)
   * 2. Diese Funktion erstellt Expense-Objekt
   * 3. Expense wird zum State hinzugefügt
   * 4. UI wird aktualisiert (ExpenseList, BalanceOverview)
   *
   * ⚠️ Aktuell: Speichert lokal im State
   *    Später: Sendet an Backend via expensesAPI.add()
   *
   * @param expenseData - Daten der Ausgabe (ohne ID und Datum)
   */
  const addExpense = (expenseData: {
    description: string;
    amount: number;
    category?: string;
    paidBy: string;
    splitBetween: string[];
  }) => {
    // Neues Expense-Objekt erstellen
    const newExpense: Expense = {
      id: Date.now().toString(),  // Eindeutige ID (aktuell: Timestamp)
      ...expenseData,              // Daten aus Formular übernehmen
      date: new Date(),            // Aktuelles Datum
    };

    // Zur Liste hinzufügen (neueste zuerst)
    setExpenses([newExpense, ...expenses]);
  };

  /**
   * AUSGABE LÖSCHEN
   *
   * Entfernt eine Ausgabe aus der Liste.
   *
   * ⚠️ Aktuell: Löscht lokal aus State
   *    Später: Sendet DELETE-Request an Backend via expensesAPI.delete()
   *
   * @param id - ID der zu löschenden Ausgabe
   */
  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  // =============================================================================
  // ABRECHNUNGS-BERECHNUNG
  // =============================================================================

  /**
   * ABRECHNUNGEN BERECHNEN
   *
   * Berechnet, wer wem wie viel schuldet, basierend auf allen Ausgaben.
   * Verwendet einen Algorithmus zur Minimierung der Transaktionen.
   *
   * BEISPIEL:
   * Ausgaben:
   * - Anna bezahlt 60€ für Restaurant → Alle 3 teilen (je 20€)
   * - Ben bezahlt 30€ für Taxi → Alle 3 teilen (je 10€)
   *
   * Saldo:
   * - Anna: +60€ (bezahlt) - 20€ (Anteil) = +40€ (bekommt Geld)
   * - Ben: +30€ (bezahlt) - 20€ (Anteil) = +10€ (bekommt Geld)
   * - Clara: 0€ (bezahlt) - 30€ (Anteil) = -30€ (schuldet Geld)
   *
   * Vereinfachte Transaktionen:
   * - Clara schuldet Anna 20€
   * - Clara schuldet Ben 10€
   *
   * ALGORITHMUS:
   * 1. Für jeden Teilnehmer: Berechne Saldo (bezahlt - Anteil)
   * 2. Sortiere Schuldner (negative Salden) und Gläubiger (positive Salden)
   * 3. Gleiche Schuldner mit Gläubigern aus (greedy algorithm)
   * 4. Minimiert die Anzahl der Transaktionen
   *
   * @returns Array von Balance-Objekten (wer schuldet wem wie viel)
   */
  const calculateBalances = (): Balance[] => {
    // Schritt 1: Saldo für jeden Teilnehmer berechnen
    const balances: Record<string, number> = {};

    // Initialisiere alle Teilnehmer mit 0
    participants.forEach((participant) => {
      balances[participant] = 0;
    });

    // Für jede Ausgabe: Saldo aktualisieren
    expenses.forEach((expense) => {
      // Betrag pro Person berechnen
      const shareAmount = expense.amount / expense.splitBetween.length;

      // Zahler bekommt den vollen Betrag gutgeschrieben
      balances[expense.paidBy] += expense.amount;

      // Jeder Teilnehmer zahlt seinen Anteil
      expense.splitBetween.forEach((person) => {
        balances[person] -= shareAmount;
      });
    });

    // Schritt 2: Transaktionen berechnen (Schulden ausgleichen)
    const result: Balance[] = [];

    // Schuldner: Personen mit negativem Saldo (schulden Geld)
    const debtors = Object.entries(balances)
      .filter(([_, amount]) => amount < -0.01)  // -0.01 wegen Rundungsfehlern
      .sort((a, b) => a[1] - b[1]);              // Größte Schulden zuerst

    // Gläubiger: Personen mit positivem Saldo (bekommen Geld)
    const creditors = Object.entries(balances)
      .filter(([_, amount]) => amount > 0.01)   // +0.01 wegen Rundungsfehlern
      .sort((a, b) => b[1] - a[1]);              // Größte Guthaben zuerst

    // Schritt 3: Schuldner mit Gläubigern ausgleichen
    let i = 0;  // Index für debtors
    let j = 0;  // Index für creditors

    while (i < debtors.length && j < creditors.length) {
      const [debtor, debtAmount] = debtors[i];       // z.B. ["Clara", -30]
      const [creditor, creditAmount] = creditors[j]; // z.B. ["Anna", +40]

      // Betrag der Transaktion: Minimum aus Schuld und Guthaben
      const amount = Math.min(-debtAmount, creditAmount);

      // Transaktion erstellen (wenn Betrag > 0.01)
      if (amount > 0.01) {
        result.push({
          from: debtor,
          to: creditor,
          amount: amount,
        });
      }

      // Salden aktualisieren
      debtors[i] = [debtor, debtAmount + amount];     // Schuld verringern
      creditors[j] = [creditor, creditAmount - amount]; // Guthaben verringern

      // Zum nächsten Schuldner/Gläubiger, wenn ausgeglichen
      if (Math.abs(debtors[i][1]) < 0.01) i++;
      if (Math.abs(creditors[j][1]) < 0.01) j++;
    }

    return result;
  };

  // =============================================================================
  // AUTHENTIFIZIERUNG
  // =============================================================================

  /**
   * BENUTZER ANMELDEN
   *
   * Wird von AuthPage aufgerufen, wenn Login erfolgreich.
   *
   * ⚠️ Aktuell: Akzeptiert jeden Namen (Demo-Modus)
   *    Später: Wird authAPI.signin() aufrufen und Access Token speichern
   *
   * @param name - Name des angemeldeten Benutzers
   */
  const handleLogin = (name: string) => {
    setUser({ name });
  };

  /**
   * BENUTZER ABMELDEN
   *
   * Meldet Benutzer ab und setzt App in Ausgangszustand.
   *
   * ⚠️ Aktuell: Löscht nur lokalen State
   *    Später: Wird authAPI.signout() aufrufen
   */
  const handleLogout = () => {
    setUser(null);
    setSelectedGroup(null);
    setExpenses([]);
  };

  // =============================================================================
  // GRUPPENVERWALTUNG
  // =============================================================================

  /**
   * GRUPPE AUSWÄHLEN
   *
   * Wird von GroupManagement aufgerufen, wenn Benutzer eine Gruppe öffnet.
   *
   * ABLAUF:
   * 1. Gruppe wird als selectedGroup gespeichert
   * 2. Ausgaben werden zurückgesetzt
   * 3. Gruppenmitglieder werden als participants gesetzt
   * 4. Angemeldeter Benutzer wird hinzugefügt (falls nicht in Liste)
   *
   * ⚠️ Aktuell: Verwendet Daten aus GroupManagement
   *    Später: Wird Ausgaben vom Backend laden via expensesAPI.list()
   *
   * @param group - Die ausgewählte Gruppe
   */
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);

    // Ausgaben zurücksetzen (werden später vom Backend geladen)
    setExpenses([]);

    // Gruppenmitglieder laden
    if (user) {
      const groupMembers = [...group.members];

      // Sicherstellen, dass angemeldeter Benutzer in Liste ist
      if (!groupMembers.includes(user.name)) {
        groupMembers.unshift(user.name);  // An erste Stelle setzen
      }

      setParticipants(groupMembers);
    }
  };

  /**
   * ZURÜCK ZUR GRUPPENÜBERSICHT
   *
   * Deselektiert die aktuelle Gruppe und zeigt GroupManagement an.
   */
  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  // =============================================================================
  // RENDERING (Was wird angezeigt?)
  // =============================================================================

  /**
   * FALL 1: NICHT ANGEMELDET
   *
   * Zeige Login/Registrierungs-Seite.
   */
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  /**
   * FALL 2: ANGEMELDET, KEINE GRUPPE AUSGEWÄHLT
   *
   * Zeige Gruppenverwaltung (Gruppen erstellen/beitreten/auswählen).
   */
  if (!selectedGroup) {
    return (
      <GroupManagement
        userName={user.name}
        onSelectGroup={handleSelectGroup}
        onLogout={handleLogout}
      />
    );
  }

  /**
   * FALL 3: ANGEMELDET, GRUPPE AUSGEWÄHLT
   *
   * Zeige Hauptansicht mit:
   * - Header (Gruppenname, Benutzer, Logout)
   * - Teilnehmer-Karte
   * - Zusammenfassungs-Karte (Gesamtausgaben, Anzahl, etc.)
   * - Buttons zum Hinzufügen von Ausgaben und Scannen (OCR-Platzhalter)
   * - Ausgabenliste
   * - Abrechnungsübersicht
   */

  // Berechnungen für Zusammenfassung
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balances = calculateBalances();

  return (
    <div className="min-h-screen bg-[#f3faf8]">
      {/* =================================================================
          HEADER
          ================================================================= */}
       <div className="bg-teal-700 text-white shadow-md">
            <div className="mx-auto w-full max-w-6xl px-6 py-4">
              <div className="flex items-center justify-between">
            {/* Linke Seite: Zurück-Button + Gruppen-Info */}
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

            {/* Rechte Seite: Benutzer-Info + Logout */}
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

      {/* =================================================================
          HAUPT-CONTENT-BEREICH
          ================================================================= */}
      <div className="container mx-auto py-8 px-4 max-w-6xl">

        {/* KARTEN-REIHE: Teilnehmer + Zusammenfassung */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">

          {/* TEILNEHMER-KARTE */}
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
                  // Prüfen, ob Teilnehmer in Ausgaben involviert ist
                  const isInvolved = expenses.some(
                    (expense) =>
                      expense.paidBy === participant ||
                      expense.splitBetween.includes(participant)
                  );

                  // Prüfen, ob aktueller Benutzer
                  const isCurrentUser = user && participant === user.name;


          return (
            <span
              key={participant}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm
                ${
                  isCurrentUser
                    ? "bg-teal-700 text-white shadow-md"
                                  : "bg-[#e6fbf7] text-teal-900"
                }`}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
                  ${
                    isCurrentUser ? "bg-teal-700 text-white shadow-md"
                                                : "bg-[#e6fbf7] text-teal-900"
                  }`}
              >
                {participant.charAt(0).toUpperCase()}
              </span>
              {participant}
              {isCurrentUser && (
                <span className="text-xs opacity-90 ml-1">(Sie)</span>
              )}
              {!isInvolved && !isCurrentUser && (
                <button
                  onClick={() => removeParticipant(participant)}
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
        {/* BUTTONS: Ausgabe hinzufügen + Rechnung scannen */}
        <div className="mb-6 flex items-center gap-3">
          <AddExpenseDialog
            participants={participants}
            onAddExpense={addExpense}
          />
          <Button
            variant="outline"
            className="gap-2 rounded-full border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50 px-5 py-2 shadow-sm"
            onClick={() => {
              // Platzhalter für zukünftige OCR-Funktionalität
              alert("OCR-Funktion kommt bald! Hier können Sie in Zukunft Rechnungen fotografieren und automatisch einlesen.");
            }}
          >
            <Camera className="h-5 w-5 text-emerald-700" />
            <span className="hidden sm:inline text-sm">Rechnung scannen</span>
          </Button>
        </div>

        {/* GRID: Ausgabenliste + Abrechnungsübersicht */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
          <BalanceOverview balances={balances} />
        </div>
      </div>
    </div>
  );
}
