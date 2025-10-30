import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UserPlus } from "lucide-react";

interface AddParticipantDialogProps {
  onAddParticipant: (name: string) => void;
}

export function AddParticipantDialog({ onAddParticipant }: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    onAddParticipant(name.trim());
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 hover:shadow-md transition-shadow">
          <UserPlus className="h-4 w-4" />
          Person hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            Person hinzufügen
          </DialogTitle>
          <DialogDescription className="text-base">
            Fügen Sie eine neue Person zur Gruppe hinzu
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Name eingeben"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Person hinzufügen
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
