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
          <Button onClick={onLogout} className="ml-4">Abmelden</Button>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-primary via-primary to-teal-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-white text-3xl">Meine Gruppen</h1>
                  <p className="text-white/90">
                    Hallo {userName}! Wählen Sie eine Gruppe aus oder erstellen Sie eine neue.
                  </p>
                </div>
              </div>
              <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="gap-2 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <div>
                  <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-dashed border-primary/30 bg-gradient-to-br from-white to-primary/5">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white mb-4 shadow-lg">
                        <Plus className="h-8 w-8" />
                      </div>
                      <h3 className="mb-2">Neue Gruppe erstellen</h3>
                      <p className="text-muted-foreground text-center text-sm">
                        Erstellen Sie eine Gruppe und teilen Sie den Code
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Gruppe erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine neue Gruppe. Andere können über den generierten Code beitreten.
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
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={dialogLoading}>
                    {dialogLoading ? "Wird erstellt..." : "Gruppe erstellen"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <div>
                  <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-dashed border-primary/30 bg-gradient-to-br from-white to-cyan-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white mb-4 shadow-lg">
                        <LogIn className="h-8 w-8" />
                      </div>
                      <h3 className="mb-2">Gruppe beitreten</h3>
                      <p className="text-muted-foreground text-center text-sm">
                        Treten Sie einer Gruppe über einen 6-stelligen Code bei
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gruppe beitreten</DialogTitle>
                  <DialogDescription>
                    Geben Sie den 6-stelligen Code ein, den Sie erhalten haben
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinGroup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-code">Gruppen-Code</Label>
                    <Input
                        id="join-code"
                        placeholder="XXXXXX"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        required
                    />
                    <p className="text-muted-foreground">
                      Geben Sie den 6-stelligen Code ein, den Sie erhalten haben
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={dialogLoading}>
                    {dialogLoading ? "Wird beigetreten..." : "Beitreten"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {groups.length > 0 ? (
              <div>
                <h2 className="mb-6 flex items-center gap-2">
                  <span>Ihre Gruppen</span>
                  <Badge variant="secondary" className="rounded-full">{groups.length}</Badge>
                </h2>
                <div className="grid gap-4">
                  {groups.map((group) => (
                      <Card key={group.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                                <span className="text-xl">{group.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1">
                                <CardTitle className="mb-1">{group.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1">
                              👥 {group.memberCount} {group.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                            </span>
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                                onClick={() => onSelectGroup(group)}
                                className="gap-2 shadow-sm"
                                size="lg"
                            >
                              Öffnen
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg flex-1">
                              <span className="text-sm text-muted-foreground">Code:</span>
                              <code className="font-mono font-semibold text-primary">{group.code}</code>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(group.code)}
                                className="gap-2"
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
              <Card className="border-0 shadow-sm bg-muted/50">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-2xl bg-white mb-4 shadow-md">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Noch keine Gruppen</h3>
                  <p className="text-muted-foreground">
                    Erstellen Sie eine neue Gruppe oder treten Sie einer Gruppe bei, um zu starten.
                  </p>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
  );
}