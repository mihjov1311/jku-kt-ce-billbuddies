import { useState } from "react";
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
  createdAt: Date;
  members: string[];
}

interface GroupManagementProps {
  userName: string;
  onSelectGroup: (group: Group) => void;
  onLogout: () => void;
}

export function GroupManagement({ userName, onSelectGroup, onLogout }: GroupManagementProps) {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "1",
      name: "Urlaub Spanien 2024",
      code: "SPAN24",
      memberCount: 5,
      createdAt: new Date("2024-10-01"),
      members: ["Anna", "Ben", "Clara", "David", "Emma"],
    },
    {
      id: "2",
      name: "WG Kosten",
      code: "WG2024",
      memberCount: 3,
      createdAt: new Date("2024-09-15"),
      members: ["Anna", "Ben", "Clara"],
    },
  ]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      code: generateCode(),
      memberCount: 1,
      createdAt: new Date(),
      members: [userName],
    };

    setGroups([newGroup, ...groups]);
    setNewGroupName("");
    setCreateDialogOpen(false);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    // Simulate joining a group
    const mockGroup: Group = {
      id: Date.now().toString(),
      name: "Neue Gruppe",
      code: joinCode.toUpperCase(),
      memberCount: 4,
      createdAt: new Date(),
      members: ["Julia", "Max", "Sophie", userName],
    };

    setGroups([mockGroup, ...groups]);
    setJoinCode("");
    setJoinDialogOpen(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient background */}
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
                <Button type="submit" className="w-full">
                  Gruppe erstellen
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
                <Button type="submit" className="w-full">
                  Beitreten
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length > 0 && (
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
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              📅 {group.createdAt.toLocaleDateString("de-DE")}
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
        )}
      </div>
    </div>
  );
}
