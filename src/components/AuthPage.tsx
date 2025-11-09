import { useState } from "react";
// Importieren Sie Ihren Supabase-Client
import { supabase } from "@/lib/supabaseClient"; // Passen Sie den Pfad an
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Receipt, Loader2 } from "lucide-react"; // Loader2 für Ladeanzeige hinzugefügt

interface AuthPageProps {
  onLogin: (name: string) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [loginEmail, setLoginEmail] = useState(""); // Geändert von loginUsername
  const [loginPassword, setLoginPassword] = useState("");

  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // Status für Ladeanzeige und Fehlermeldungen
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // =================================================================
      // HIER IST DIE NEUE, VERBESSERTE LOGIK ZUR NAMENSFINDUNG
      // =================================================================
      const meta = data.user.user_metadata;
      let displayName = "";

      // 1. Priorität: Versuche, den Namen aus Teilen zu bauen
      if (meta?.first_name && meta?.last_name) {
        displayName = `${meta.first_name} ${meta.last_name}`; // z.B. "Jovana Mihajlovic"
      }
      // 2. Priorität: Suche nach einem kompletten 'full_name'
      else if (meta?.full_name) {
        displayName = meta.full_name;
      }
      // 3. Priorität: Nimm den 'username'
      else if (meta?.username) {
        displayName = meta.username; // z.B. "mijo13"
      }
      // 4. Fallback: Nimm die E-Mail
      else {
        displayName = data.user.email || "";
      }

      onLogin(displayName);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      return;
    }

    setLoading(true);
    setError(null);

    const fullName = `${registerFirstName} ${registerLastName}`;

    const { data, error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: {
          // KORREKTUR: Senden Sie die einzelnen Felder,
          // die Ihr SQL-Trigger erwartet.
          first_name: registerFirstName,
          last_name: registerLastName,
          username: registerUsername,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // WICHTIG: Standardmäßig sendet Supabase eine Bestätigungs-E-Mail.
      // Der Benutzer wird erst eingeloggt, NACHDEM er die E-Mail bestätigt hat.
      // Wenn Sie den Benutzer sofort einloggen möchten, müssen Sie
      // "Confirm email" in Ihren Supabase Auth-Einstellungen DEAKTIVIEREN.

      // Wenn "Confirm email" deaktiviert ist, enthält 'data.session' die Sitzung
      // und wir können den Benutzer direkt einloggen.
      if (data.session) {
        onLogin(fullName);
      } else {
        // Andernfalls zeigen wir eine Meldung zur Bestätigung an.
        setError("Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.");
      }
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-cyan-50/30 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {/* ... (Header bleibt gleich) ... */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-xl">
                <Receipt className="h-10 w-10" />
              </div>
            </div>
            <h1 className="mb-3 text-4xl">BillBuddies</h1>
            <p className="text-muted-foreground text-lg">
              Verwalten Sie gemeinsame Ausgaben mit Freunden und Familie
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50">
              {/* ... (TabsTrigger bleiben gleich) ... */}
              <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-teal-600 data-[state=active]:text-white">Anmelden</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-teal-600 data-[state=active]:text-white">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
                  {/* ... (CardTitle/Description bleiben gleich) ... */}
                  <CardTitle className="flex items-center gap-2">
                    <span>🔐</span>
                    Anmelden
                  </CardTitle>
                  <CardDescription>
                    Melden Sie sich mit Ihrem Konto an
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      {/* Geändert zu E-Mail */}
                      <Label htmlFor="login-email">E-Mail</Label>
                      <Input
                          id="login-email"
                          type="email" // Typ geändert
                          placeholder="ihre.email@beispiel.de" // Placeholder geändert
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Passwort</Label>
                      <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                      />
                    </div>

                    {/* Fehlermeldung anzeigen */}
                    {error && <p className="text-destructive">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {loading ? "Bitte warten..." : "Anmelden"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
                  {/* ... (CardTitle/Description bleiben gleich) ... */}
                  <CardTitle className="flex items-center gap-2">
                    <span>✨</span>
                    Registrieren
                  </CardTitle>
                  <CardDescription>
                    Erstellen Sie ein neues Konto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* ... (Alle Registrierungsfelder bleiben gleich) ... */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-first-name">Vorname</Label>
                        <Input
                            id="register-first-name"
                            type="text"
                            placeholder="Vorname"
                            value={registerFirstName}
                            onChange={(e) => setRegisterFirstName(e.target.value)}
                            required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-last-name">Nachname</Label>
                        <Input
                            id="register-last-name"
                            type="text"
                            placeholder="Nachname"
                            value={registerLastName}
                            onChange={(e) => setRegisterLastName(e.target.value)}
                            required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-Mail</Label>
                      <Input
                          id="register-email"
                          type="email"
                          placeholder="ihre.email@beispiel.de"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Benutzername</Label>
                      <Input
                          id="register-username"
                          type="text"
                          placeholder="IhrBenutzername"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Passwort</Label>
                      <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">
                        Passwort bestätigen
                      </Label>
                      <Input
                          id="register-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          required
                      />
                    </div>

                    {/* Passwort-Mismatch-Logik (unverändert) */}
                    {registerPassword &&
                        registerConfirmPassword &&
                        registerPassword !== registerConfirmPassword && (
                            <p className="text-destructive">
                              Die Passwörter stimmen nicht überein
                            </p>
                        )}

                    {/* Fehlermeldung anzeigen */}
                    {error && <p className="text-destructive">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={
                            loading || // Ladezustand hinzufügen
                            registerPassword !== registerConfirmPassword ||
                            !registerFirstName ||
                            !registerLastName ||
                            !registerEmail ||
                            !registerUsername ||
                            !registerPassword
                        }
                    >
                      {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {loading ? "Bitte warten..." : "Registrieren"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
  );
}