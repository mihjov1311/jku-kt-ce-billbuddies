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
  <div className="min-h-screen bg-[#f3faf8] flex items-center justify-center px-4">
    {/* Zentrierter Content-Container */}
    <div className="w-full max-w-md">
      {/* Header zentriert */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-teal-600 rounded-xl shadow-md">
            <Receipt className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-teal-800">BillBuddies</h1>
        <p className="text-sm text-teal-600 mt-1">
          Verwalten Sie gemeinsame Ausgaben mit Freunden und Familie
        </p>
      </div>

      {/* Tabs + Formular – alles innerhalb des max-w-md Containers */}
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="flex w-full mb-6 bg-white rounded-full shadow-sm p-1">
          <TabsTrigger
            value="login"
            className="w-1/2 rounded-full px-6 py-2 text-sm font-medium transition
                       data-[state=active]:bg-teal-600
                       data-[state=active]:text-white
                       data-[state=inactive]:text-slate-700
                       data-[state=inactive]:bg-transparent"
          >
            Anmelden
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="w-1/2 rounded-full px-6 py-2 text-sm font-medium transition
                       data-[state=active]:bg-teal-600
                       data-[state=active]:text-white
                       data-[state=inactive]:text-slate-700
                       data-[state=inactive]:bg-transparent"
          >
            Registrieren
          </TabsTrigger>
        </TabsList>

        {/* LOGIN */}
        <TabsContent value="login">
          <Card className="border-0 rounded-3xl shadow-2xl bg-gradient-to-br from-white to-emerald-50/70">
            <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-transparent rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100">
                  🔐
                </span>
                Anmelden
              </CardTitle>
              <CardDescription>Melden Sie sich mit Ihrem Konto an</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ihre.email@beispiel.de"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="rounded-xl border border-emerald-100 bg-white/80"
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
                    className="rounded-xl border border-emerald-100 bg-white/80"
                  />
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  type="submit"
                  className="w-full mt-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Bitte warten..." : "Anmelden"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGISTER */}
        <TabsContent value="register">
          <Card className="border-0 rounded-3xl shadow-2xl bg-gradient-to-br from-white to-emerald-50/70">
            <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-transparent rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100">
                  ✨
                </span>
                Registrieren
              </CardTitle>
              <CardDescription>Erstellen Sie ein neues Konto</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
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
                      className="rounded-xl border border-emerald-100 bg-white/80"
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
                      className="rounded-xl border border-emerald-100 bg-white/80"
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
                    className="rounded-xl border border-emerald-100 bg-white/80"
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
                    className="rounded-xl border border-emerald-100 bg-white/80"
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
                    className="rounded-xl border border-emerald-100 bg-white/80"
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
                    className="rounded-xl border border-emerald-100 bg-white/80"
                  />
                </div>

                {registerPassword &&
                  registerConfirmPassword &&
                  registerPassword !== registerConfirmPassword && (
                    <p className="text-destructive text-sm">
                      Die Passwörter stimmen nicht überein
                    </p>
                  )}

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  type="submit"
                  className="w-full mt-2 rounded-xl bg-teal-600 text-white font-semibold py-2.5 hover:bg-teal-700"
                  disabled={
                    loading ||
                    registerPassword !== registerConfirmPassword ||
                    !registerFirstName ||
                    !registerLastName ||
                    !registerEmail ||
                    !registerUsername ||
                    !registerPassword
                  }
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
