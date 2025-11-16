import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Users, Plus, LogIn, ArrowRight, LogOut, Copy, Check } from "lucide-react";
import { Badge } from "./ui/badge";

interface Group {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  members: string[];
}

interface GroupManagementProps {
  userName: string;
  onSelectGroup: (group: Group) => void;
  onLogout: () => void;
}

export function GroupManagement({ userName, onSelectGroup, onLogout }: GroupManagementProps) {
  const [groups, setGroups] = useState<Group[]>([]);

  // Lade- und Fehler-Zustände
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);


  const fetchUserGroups = async () => {
    setLoading(true);
    setError(null);
    console.log("DEBUG: 1. fetchUserGroups gestartet.");

    try {
      // 1. Benutzer holen
      console.log("DEBUG: 2. Hole Benutzer (auth.getUser)...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Benutzer nicht gefunden (authError).");
      console.log("DEBUG: 3. Benutzer gefunden:", user.id);

      // 2. Benutzerprofil holen
      console.log("DEBUG: 4. Hole Profil (from 'mitglieder')...");
      const { data: profile, error: profileError } = await supabase
          .from("mitglieder")
          .select("benutzername")
          .eq("id", user.id)
          .single();

      if (profileError || !profile) throw new Error(`Benutzerprofil nicht gefunden (profileError): ${profileError?.message}`);
      const currentUsername = profile.benutzername;
      console.log("DEBUG: 5. Profil gefunden:", currentUsername);

      // 3. Gruppen-IDs holen
      console.log("DEBUG: 6. Hole Gruppen-IDs (from 'gruppenmitglieder')...");
      const { data: groupEntries, error: groupsError } = await supabase
          .from("gruppenmitglieder")
          .select(`
            gruppen (
              gruppenid,
              gruppenname,
              code
            )
          `)
          .eq("benutzername", currentUsername);

      if (groupsError) throw new Error(`Fehler beim Holen der Gruppen-IDs (groupsError): ${groupsError.message}`);
      console.log("DEBUG: 7. Gruppen-IDs gefunden:", groupEntries);

      if (!groupEntries || groupEntries.length === 0) {
        setGroups([]);
        setLoading(false);
        console.log("DEBUG: 8. Keine Gruppen gefunden, Ladevorgang beendet.");
        return;
      }

      const userGroups = groupEntries.map((entry: any) => entry.gruppen);

      // 4. Mitgliederlisten holen (Dieser Teil ist oft der Übeltäter)
      console.log("DEBUG: 9. Hole Mitgliederlisten (Promise.all)...");
      const groupsData = await Promise.all(
          userGroups.map(async (group: any) => {

            // KORRIGIERT: 'group.gruppenid'
            console.log(`DEBUG: 9a. Hole Mitglieder für Gruppe ${group.gruppenid}`);
            const { data: memberList, error: memberListError } = await supabase
                .from("gruppenmitglieder")
                .select(`
                mitglieder (
                  vorname,
                  nachname
                )
              `)
                // KORRIGIERT: 'group.gruppenid'
                .eq("gruppenid", group.gruppenid);

            if (memberListError) {
              throw new Error(`Fehler beim Laden der Mitglieder für Gruppe ${group.gruppenid}: ${memberListError.message}`);
            }
            console.log(`DEBUG: 9b. Mitglieder für Gruppe ${group.gruppenid} gefunden:`, memberList);

            const memberNames = memberList
                .map((m: any) => m.mitglieder ? `${m.mitglieder.vorname} ${m.mitglieder.nachname}` : null)
                .filter(Boolean);

            // KORRIGIERT: Mappt Datenbank-Spalten auf Interface-Namen
            return {
              id: group.gruppenid.toString(),
              name: group.gruppenname,
              code: group.code,
              members: memberNames,
              memberCount: memberNames.length,
            };
          })
      );

      console.log("DEBUG: 10. Alle Daten verarbeitet.");
      setGroups(groupsData as Group[]);

    } catch (err: any) {
      // Dies ist der Fehler, den Sie sehen
      console.error("DEBUG: FEHLER IN fetchUserGroups:", err.message ? err.message : err);
      setError(err.message || "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // NEU: DATENABRUF MIT 'useEffect' (MIT DEBUG-LOGGING)
  // =============================================================================
  useEffect(() => {

    fetchUserGroups();

  }, []);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setDialogLoading(true);
    setError(null); // Fehler zurücksetzen

    try {
      // 1. Benutzerdaten holen (ID und benutzername)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Benutzer nicht gefunden.");

      const { data: profile, error: profileError } = await supabase
          .from("mitglieder")
          .select("benutzername")
          .eq("id", user.id)
          .single();

      if (profileError || !profile) throw new Error("Benutzerprofil nicht gefunden.");
      const currentUsername = profile.benutzername;

      // 2. KORRIGIERT: Neue Gruppe in der 'gruppen' Tabelle erstellen
      const newCode = generateCode();
      const { data: newGroup, error: groupError } = await supabase
          .from("gruppen")
          .insert({
            gruppenname: newGroupName.trim(), // KORREKT: 'gruppenname'
            code: newCode,
            summe: 0 // KORREKT: 'summe' initialisieren
          })
          .select()
          .single();

      if (groupError) throw groupError;

      // 3. KORRIGIERT: Benutzer als Mitglied in 'gruppenmitglieder' eintragen
      const { error: memberError } = await supabase
          .from("gruppenmitglieder")
          .insert({
            gruppenid: newGroup.gruppenid,   // KORREKT: 'gruppenid'
            benutzername: currentUsername,
            ausgaben: 0 // KORREKT: 'ausgaben' initialisieren
          });

      if (memberError) throw memberError;

      // 4. Erfolgreich! Dialog schließen und Gruppenliste neu laden
      setNewGroupName("");
      setCreateDialogOpen(false);
      fetchUserGroups(); // Lädt die Liste neu, um die neue Gruppe anzuzeigen

    } catch (err: any) {
      console.error("Fehler beim Erstellen der Gruppe:", err);
      alert(err.message); // Einfacher Alert für den Benutzer
    } finally {
      setDialogLoading(false);
    }
  };

  // ⚠️ HINWEIS: Diese Funktion ist NOCH NICHT umgebaut
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setDialogLoading(true);

    try {
      // 1. Benutzerdaten holen
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Benutzer nicht gefunden.");

      const { data: profile } = await supabase.from("mitglieder").select("benutzername").eq("id", user.id).single();
      if (!profile) throw new Error("Benutzerprofil nicht gefunden.");
      const currentUsername = profile.benutzername;

      // 2. Gruppe anhand des 'code' finden
      const { data: groupToJoin, error: findError } = await supabase
          .from("gruppen")
          .select("gruppenid") // KORREKT: 'gruppenid'
          .eq("code", joinCode.trim())
          .single();

      if (findError || !groupToJoin) throw new Error("Gruppe mit diesem Code nicht gefunden.");

      // 3. Prüfen, ob Benutzer schon Mitglied ist
      const { data: existingMember, error: checkError } = await supabase
          .from("gruppenmitglieder")
          .select()
          .eq("gruppenid", groupToJoin.gruppenid)
          .eq("benutzername", currentUsername)
          .maybeSingle();

      if (checkError) throw checkError;
      if (existingMember) throw new Error("Sie sind bereits Mitglied dieser Gruppe.");

      // 4. Benutzer in 'gruppenmitglieder' eintragen
      const { error: joinError } = await supabase
          .from("gruppenmitglieder")
          .insert({
            gruppenid: groupToJoin.gruppenid,
            benutzername: currentUsername,
            ausgaben: 0
          });

      if (joinError) throw joinError;

      // 5. Erfolgreich! Dialog schließen und Gruppenliste neu laden
      setJoinCode("");
      setJoinDialogOpen(false);
      fetchUserGroups(); // Lädt die Liste neu

    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setDialogLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // =============================================================================
  // LADE- UND FEHLER-ANZEIGE
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Lade Gruppen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={onLogout} className="ml-4">
          Abmelden
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3faf8]">
      {/* HEADER */}
      <div className="bg-teal-700 text-white shadow-md">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-teal-600 rounded-2xl shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-x1 font-semibold">Meine Gruppen</h1>
                <p className="text.sm text-teal-50/90">
                  Hallo {userName}! Wählen Sie eine Gruppe aus oder erstellen Sie eine
                  neue.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="gap-2 text-white hover:bg-teal-600/60"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* ACTION CARDS */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Neue Gruppe erstellen */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <div>
                <Card className="cursor-pointer rounded-3xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 border-dashed border-emerald-200 bg-gradient-to-br from-white to-emerald-50">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 rounded-2xl bg-teal-600 text-white mb-4 shadow-lg">
                      <Plus className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Neue Gruppe erstellen
                    </h3>
                    <p className="text-muted-foreground text-center text-sm">
                      Erstellen Sie eine Gruppe und teilen Sie den Code
                    </p>
                  </CardContent>
                </Card>
              </div>
            </DialogTrigger>
            <DialogContent className="bg-slate-50">
              <DialogHeader>
                <DialogTitle>Neue Gruppe erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Gruppe. Andere können über den generierten
                  Code beitreten.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Gruppenname</Label>
                    <Input
                      id="group-name"
                      placeholder="z.B. Urlaub Italien 2025"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                      className="border-2 border-teal-500 rounded-xl px-4 py-2
                                 focus-visible:ring-2 focus-visible:ring-teal-500
                                 focus-visible:outline-none"
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full rounded-xl bg-teal-600 text-white font-semibold py-3 hover:bg-teal-700"
                    disabled={dialogLoading}
                 >
                  {dialogLoading ? "Wird erstellt..." : "Gruppe erstellen"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Gruppe beitreten */}
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <div>
                  <Card className="cursor-pointer rounded-3xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 border-dashed border-emerald-200 bg-gradient-to-br from-white to-cyan-50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="p-4 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg">
                        <LogIn className="h-8 w-8" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">Gruppe beitreten</h3>
                      <p className="text-muted-foreground text-center text-sm">
                        Treten Sie einer Gruppe über einen 6-stelligen Code bei
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </DialogTrigger>

              <DialogContent className="bg-slate-50 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-center">
                    Gruppe beitreten
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Geben Sie den 6-stelligen Code ein, den Sie erhalten haben
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleJoinGroup} className="space-y-6 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="join-code">Gruppen-Code</Label>

                    <Input
                      id="join-code"
                      placeholder="XXXXXX"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      required
                      className="
                        border-2 border-teal-500 rounded-xl px-4 py-2 text-lg tracking-[0.3em]
                        focus-visible:ring-2 focus-visible:ring-teal-500
                        focus-visible:outline-none
                      "
                    />

                    <p className="text-muted-foreground text-sm">
                      Geben Sie den 6-stelligen Code ein, den Sie erhalten haben
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-teal-600 text-white font-semibold py-3 hover:bg-teal-700"
                    disabled={dialogLoading}
                  >
                    {dialogLoading ? "Wird beigetreten..." : "Beitreten"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
        </div>

        {/* GROUP LIST */}
        {groups.length > 0 ? (
          <div>
            {/* Titel wie im Prototyp */}
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span>Ihre Gruppen</span>
              <span className="text-emerald-600 text-sm">{groups.length}</span>
            </h2>

            <div className="grid gap-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="border-0 rounded-3xl shadow-md bg-gradient-to-r from-emerald-50 to-emerald-50/40"
                >
                  {/* Oberer Teil der Karte */}
                  <CardHeader className="border-b border-emerald-100 bg-transparent rounded-t-3xl pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar links */}
                        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                          <span className="text-xl">
                            {group.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="mb-1">{group.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-purple-700">
                              👥 {group.memberCount}{" "}
                              {group.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                            </span>
                          </CardDescription>
                        </div>
                      </div>

                      {/* Öffnen-Button als „Pille“ rechts */}
                      <Button
                        onClick={() => onSelectGroup(group)}
                        className="gap-2 shadow-sm rounded-full px-6 bg-teal-600 hover:bg-teal-700 text-white"
                        size="sm"
                      >
                        Öffnen
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Unterer Teil: Code + Kopieren */}
                  <CardContent className="pt-4 pb-5">
                    <div className="flex items-center gap-3">
                      {/* großer Code-Pill */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 h-11 px-5 rounded-full bg-white border border-emerald-100">
                          <span className="text-sm text-muted-foreground">Code:</span>
                          <code className="font-mono font-semibold text-emerald-700 tracking-[0.5em]">
                            {group.code}
                          </code>
                        </div>
                      </div>

                      {/* Kopieren-Button als runde Outline-Pille */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(group.code)}
                        className="gap-2 rounded-full border-slate-300 bg-white hover:bg-slate-50"
                      >
                        {copiedCode === group.code ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            Kopiert
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Kopieren
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-sm bg-white rounded-3xl">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 mb-4 shadow-md">
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Noch keine Gruppen</h3>
              <p className="text-muted-foreground">
                Erstellen Sie eine neue Gruppe oder treten Sie einer Gruppe bei, um zu
                starten.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}