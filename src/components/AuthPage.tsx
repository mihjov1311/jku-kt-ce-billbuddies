import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Receipt } from "lucide-react";

interface AuthPageProps {
  onLogin: (name: string) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername && loginPassword) {
      // Simulate login - in real app this would call an API
      onLogin(loginUsername);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      registerFirstName &&
      registerLastName &&
      registerEmail &&
      registerUsername &&
      registerPassword &&
      registerPassword === registerConfirmPassword
    ) {
      // Simulate registration - in real app this would call an API
      const fullName = `${registerFirstName} ${registerLastName}`;
      onLogin(fullName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-cyan-50/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
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
            <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-teal-600 data-[state=active]:text-white">Anmelden</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-teal-600 data-[state=active]:text-white">Registrieren</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
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
                    <Label htmlFor="login-username">Benutzername</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="IhrBenutzername"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
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

                  <Button type="submit" className="w-full">
                    Anmelden
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
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

                  {registerPassword &&
                    registerConfirmPassword &&
                    registerPassword !== registerConfirmPassword && (
                      <p className="text-destructive">
                        Die Passwörter stimmen nicht überein
                      </p>
                    )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      registerPassword !== registerConfirmPassword ||
                      !registerFirstName ||
                      !registerLastName ||
                      !registerEmail ||
                      !registerUsername ||
                      !registerPassword
                    }
                  >
                    Registrieren
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
