import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupManagement } from '@/components/GroupManagement';
import { supabase } from '@/lib/supabaseClient';

// --- MOCKS ---

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-users" />,
  Plus: () => <span>Plus</span>,
  LogIn: () => <span>LogIn</span>,
  ArrowRight: () => <span>ArrowRight</span>,
  LogOut: () => <span>LogOut</span>,
  Copy: () => <span>Copy</span>,
  Check: () => <span>Check</span>,
}));

// UI MOCKS (Wichtig für Interaktionen)

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, className }: any) => (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, id }: any) => (
    <input id={id} value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

// --- TS INTERFACE FÜR HELPER ---

interface SetupMocksProps {
  user?: { id: string } | null;
  profile?: { benutzername: string } | null;
  groups?: any[];
  members?: any[];
  authError?: any;
}

const setupSupabaseMocks = ({
  user = { id: 'user-123' },
  profile = { benutzername: 'testuser' },
  groups = [] as any[],
  members = [] as any[],
  authError = null,
}: SetupMocksProps = {}) => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user },
    error: authError,
  });

  const mockFrom = supabase.from as jest.Mock;
  mockFrom.mockImplementation((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data:
        table === 'mitglieder'
          ? profile
          : { gruppenid: 99, gruppenname: 'Neue Gruppe', code: 'NEW123' },
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: (resolve: any) => {
      if (table === 'gruppenmitglieder') {
        // Wechselt zwischen Gruppen-Liste und Mitglieder-Liste basierend auf Inhalt
        const data = groups.length > 0 ? groups : members;
        return resolve({ data, error: null });
      }
      return resolve({ data: [], error: null });
    },
  }));
};

describe('GroupManagement - Coverage Booster Suite', () => {
  const defaultProps = {
    userName: 'Max',
    onSelectGroup: jest.fn(),
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    // Clipboard Mock
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  // TEST 1: GRUPPE ERSTELLEN (Deckt Zeilen 146-200 ab)
  it('erstellt eine neue Gruppe über das Formular', async () => {
    setupSupabaseMocks();
    render(<GroupManagement {...defaultProps} />);

    // Dialog öffnen (Card klicken)
    const createCard = await screen.findAllByText(/Neue Gruppe erstellen/i);
    fireEvent.click(createCard[0]);

    const input = screen.getByPlaceholderText(/z.B. Urlaub Italien/i);
    fireEvent.change(input, { target: { value: 'Sommercamp 2026' } });

    const submitBtn = screen.getByText('Gruppe erstellen');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('gruppen');
      expect(supabase.from).toHaveBeenCalledWith('gruppenmitglieder');
    });
  });

  // TEST 2: GRUPPE BEITRETEN (Deckt Zeilen 206-259 ab)
  it('tritt einer Gruppe mit Code bei', async () => {
    setupSupabaseMocks();
    render(<GroupManagement {...defaultProps} />);

    const joinBtn = (await screen.findAllByText(/Gruppe beitreten/i))[0];
    fireEvent.click(joinBtn);

    const input = screen.getByPlaceholderText('XXXXXX');
    fireEvent.change(input, { target: { value: 'JOIN12' } });

    const submitBtn = screen.getByText('Beitreten');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('gruppen');
    });
  });

  // TEST 3: CLIPBOARD (Deckt Zeilen 264-266 ab)
  it('kopiert den Gruppencode', async () => {
    const mockGroups = [
      {
        gruppen: { gruppenid: 1, gruppenname: 'Test-Group', code: 'ABCDEF' },
      },
    ];
    setupSupabaseMocks({ groups: mockGroups });

    render(<GroupManagement {...defaultProps} />);

    const copyBtn = await screen.findByText(/Kopieren/i);
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCDEF');
    expect(await screen.findByText(/Kopiert/i)).toBeInTheDocument();
  });

  // TEST 4: GRUPPE AUSWÄHLEN (Deckt Interaktion ab)
  it('ruft onSelectGroup auf, wenn "Öffnen" geklickt wird', async () => {
    const mockGroups = [
      {
        gruppen: { gruppenid: 1, gruppenname: 'Aktiv', code: 'ACT123' },
      },
    ];
    setupSupabaseMocks({ groups: mockGroups });

    render(<GroupManagement {...defaultProps} />);

    const openBtn = await screen.findByText(/Öffnen/i);
    fireEvent.click(openBtn);

    expect(defaultProps.onSelectGroup).toHaveBeenCalled();
  });
});