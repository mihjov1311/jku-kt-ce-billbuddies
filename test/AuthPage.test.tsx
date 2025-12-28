import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { AuthPage } from '@/components/AuthPage';
import { supabase } from "@/lib/supabaseClient";


// Mock Supabase Client
jest.mock("@/lib/supabaseClient", () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
        },
    },
}));

// Mock UI Components
jest.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardDescription: ({ children }: any) => <p>{children}</p>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock("@/components/ui/tabs", () => ({
    Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default={defaultValue}>{children}</div>,
    TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
}));

jest.mock("@/components/ui/input", () => ({
    Input: (props: any) => <input {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock("@/components/ui/button", () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("lucide-react", () => ({
    Receipt: () => <div data-testid="receipt-icon" />,
    Loader2: () => <div data-testid="loader-icon" />,
}));

describe("AuthPage", () => {
    const mockOnLogin = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    //prüft, ob die Komponenten korrekt angezeigt werden
    describe("Rendering", () => {
        it("sollte die Komponente korrekt rendern", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            expect(screen.getByText("BillBuddies")).toBeInTheDocument();
            expect(screen.getByText("Verwalten Sie gemeinsame Ausgaben mit Freunden und Familie")).toBeInTheDocument();
        });

        it("sollte Login- und Register-Tabs anzeigen", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            expect(screen.getByTestId("tab-trigger-login")).toBeInTheDocument();
            expect(screen.getByTestId("tab-trigger-register")).toBeInTheDocument();
        });

        it("sollte das Login-Formular mit allen Feldern anzeigen", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");

            expect(within(loginTab).getByLabelText("E-Mail")).toBeInTheDocument();
            expect(within(loginTab).getByLabelText("Passwort")).toBeInTheDocument();
            expect(within(loginTab).getByRole("button", { name: /anmelden/i })).toBeInTheDocument();
        });

        it("sollte das Register-Formular mit allen Feldern anzeigen", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");

            expect(within(registerTab).getByLabelText("Vorname")).toBeInTheDocument();
            expect(within(registerTab).getByLabelText("Nachname")).toBeInTheDocument();
            expect(within(registerTab).getByLabelText("Benutzername")).toBeInTheDocument();
            expect(within(registerTab).getByLabelText("E-Mail")).toBeInTheDocument();
        });
    });

   //Login-Tests
    describe("Login-Funktionalität", () => {
        //Vor-und Nachname
        it("sollte erfolgreich einloggen mit vollständigem Namen", async () => {
            //Mock-Daten vorbereiten
            const mockUser = {
                user: {
                    email: "test@example.com",
                    user_metadata: {
                        first_name: "Max",
                        last_name: "Mustermann",
                    },
                },
            };
            //Supabase-Mock erfolgreich
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: mockUser,
                error: null,
            });
            //Komponenten rendern
            render(<AuthPage onLogin={mockOnLogin} />);

            //Elemente finden
            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");
            const loginButton = within(loginTab).getByRole("button", { name: /anmelden/i });

            //User-Aktionen simulieren
            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });
            fireEvent.click(loginButton);

            //Ergebnisse prüfen
            await waitFor(() => {
                expect(mockOnLogin).toHaveBeenCalledWith("Max Mustermann");
            });
        });

        //vollständiger Name
        it("sollte mit full_name einloggen wenn first_name und last_name fehlen", async () => {
            const mockUser = {
                user: {
                    email: "test@example.com",
                    user_metadata: {
                        full_name: "John Doe",
                    },
                },
            };

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: mockUser,
                error: null,
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");
            const loginButton = within(loginTab).getByRole("button", { name: /anmelden/i });

            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });
            fireEvent.click(loginButton);

            await waitFor(() => {
                expect(mockOnLogin).toHaveBeenCalledWith("John Doe");
            });
        });

        //username
        it("sollte mit username einloggen als Fallback", async () => {
            const mockUser = {
                user: {
                    email: "test@example.com",
                    user_metadata: {
                        username: "testuser123",
                    },
                },
            };

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: mockUser,
                error: null,
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");
            const loginButton = within(loginTab).getByRole("button", { name: /anmelden/i });

            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });
            fireEvent.click(loginButton);

            await waitFor(() => {
                expect(mockOnLogin).toHaveBeenCalledWith("testuser123");
            });
        });

        //email
        it("sollte mit E-Mail einloggen als letzter Fallback", async () => {
            const mockUser = {
                user: {
                    email: "test@example.com",
                    user_metadata: {},
                },
            };

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: mockUser,
                error: null,
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");
            const loginButton = within(loginTab).getByRole("button", { name: /anmelden/i });

            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });
            fireEvent.click(loginButton);

            await waitFor(() => {
                expect(mockOnLogin).toHaveBeenCalledWith("test@example.com");
            });
        });

        //Fehlermeldung bei Login-Fehler
        it("sollte Fehlermeldung bei Login-Fehler anzeigen", async () => {
            //mock-up mit Fehlermeldung
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: null },
                error: { message: "Ungültige Anmeldedaten" },
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");
            const loginButton = within(loginTab).getByRole("button", { name: /anmelden/i });

            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
            fireEvent.click(loginButton);

            await waitFor(() => {
                expect(within(loginTab).getByText("Ungültige Anmeldedaten")).toBeInTheDocument();
            });
            //onLogin wurde nicht aufgerufen -> kommt nicht in die App rein
            expect(mockOnLogin).not.toHaveBeenCalled();
        });

        //während der Überprüfung der Logindaten sollte bitte warten stehen und Login-Button nicht mehr ersichtlich
        it("sollte Ladezustand während des Logins anzeigen", async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: null }, error: null }), 100))
            );

            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");
            const loginButton = within(loginTab).getByRole("button", { name: /anmelden/i });

            fireEvent.change(emailInput, { target: { value: "test@example.com" } });
            fireEvent.change(passwordInput, { target: { value: "password123" } });
            fireEvent.click(loginButton);

            expect(within(loginTab).getByText("Bitte warten...")).toBeInTheDocument();
            expect(loginButton).toBeDisabled();
        });
    });

    //Registrierung testen
    describe("Registrierungs-Funktionalität", () => {
        //erfolgreiches registrieren
        it("sollte erfolgreich registrieren mit Session", async () => {
            const mockData = {
                user: {
                    email: "newuser@example.com",
                },
                session: { access_token: "token123" },
            };

            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: mockData,
                error: null,
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            //alle Felder ausfüllen
            const registerTab = screen.getByTestId("tab-content-register");

            fireEvent.change(within(registerTab).getByLabelText("Vorname"), { target: { value: "Anna" } });
            fireEvent.change(within(registerTab).getByLabelText("Nachname"), { target: { value: "Schmidt" } });
            fireEvent.change(within(registerTab).getByLabelText("E-Mail"), { target: { value: "anna@example.com" } });
            fireEvent.change(within(registerTab).getByLabelText("Benutzername"), { target: { value: "annaschmidt" } });

            const passwordInputs = within(registerTab).getAllByPlaceholderText("••••••••");
            fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
            fireEvent.change(within(registerTab).getByLabelText("Passwort bestätigen"), { target: { value: "password123" } });

            const registerButton = within(registerTab).getByRole("button", { name: /registrieren/i });
            fireEvent.click(registerButton);

            //Prüfen: wurde korrekt registriert?
            await waitFor(() => {
                expect(mockOnLogin).toHaveBeenCalledWith("Anna Schmidt");
            });

            //Prüfen: werden die richtigen Daten an Supabase geschickt?
            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: "anna@example.com",
                password: "password123",
                options: {
                    data: {
                        first_name: "Anna",
                        last_name: "Schmidt",
                        username: "annaschmidt",
                    },
                },
            });
        });

        //Konto erstellt, aber Session fehlt noch (weil Bestätigungsmail noch nicht bestätigt wurde)
        it("sollte Bestätigungsmeldung anzeigen wenn keine Session vorhanden", async () => {
            const mockData = {
                user: {
                    email: "newuser@example.com",
                },
                session: null,
            };

            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: mockData,
                error: null,
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");

            fireEvent.change(within(registerTab).getByLabelText("Vorname"), { target: { value: "Peter" } });
            fireEvent.change(within(registerTab).getByLabelText("Nachname"), { target: { value: "Müller" } });
            fireEvent.change(within(registerTab).getByLabelText("E-Mail"), { target: { value: "peter@example.com" } });
            fireEvent.change(within(registerTab).getByLabelText("Benutzername"), { target: { value: "petermueller" } });

            const passwordInputs = within(registerTab).getAllByPlaceholderText("••••••••");
            fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
            fireEvent.change(within(registerTab).getByLabelText("Passwort bestätigen"), { target: { value: "password123" } });

            const registerButton = within(registerTab).getByRole("button", { name: /registrieren/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(within(registerTab).getByText("Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.")).toBeInTheDocument();
            });

            expect(mockOnLogin).not.toHaveBeenCalled();
        });

        //Fehlermeldung, wenn die beiden Passwörter nicht übereinstimmen (darf nicht an Supabase geschickt werden)
        it("sollte Fehler anzeigen wenn Passwörter nicht übereinstimmen", async () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");

            fireEvent.change(within(registerTab).getByLabelText("Vorname"), { target: { value: "Test" } });
            fireEvent.change(within(registerTab).getByLabelText("Nachname"), { target: { value: "User" } });
            fireEvent.change(within(registerTab).getByLabelText("E-Mail"), { target: { value: "test@example.com" } });
            fireEvent.change(within(registerTab).getByLabelText("Benutzername"), { target: { value: "testuser" } });

            const passwordInputs = within(registerTab).getAllByPlaceholderText("••••••••");
            fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
            fireEvent.change(within(registerTab).getByLabelText("Passwort bestätigen"), { target: { value: "password456" } });

            const registerButton = within(registerTab).getByRole("button", { name: /registrieren/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(screen.getByText("Die Passwörter stimmen nicht überein")).toBeInTheDocument();
            });

            expect(supabase.auth.signUp).not.toHaveBeenCalled();
        });
        //Fehlermeldung, wenn die beiden Passwörter nicht übereinstimmen (nur UI check)
        it("sollte Inline-Warnung bei nicht übereinstimmenden Passwörtern anzeigen", async () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");
            const passwordInputs = within(registerTab).getAllByPlaceholderText("••••••••");

            fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
            fireEvent.change(within(registerTab).getByLabelText("Passwort bestätigen"), { target: { value: "password456" } });

            await waitFor(() => {
                expect(within(registerTab).getByText("Die Passwörter stimmen nicht überein")).toBeInTheDocument();
            });
        });

        //Validierungsregel: keine Felder ausgefüllt -> sollte nicht möglich sein es abzusenden
        it("sollte Register-Button deaktivieren wenn Felder fehlen", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");
            const registerButton = within(registerTab).getByRole("button", { name: /registrieren/i });

            expect(registerButton).toBeDisabled();
        });

        //sollte Fehlermeldung "E-Mail wird bereits verwendet" anzeigen, wenn die email  bereits registriert ist
        it("sollte Fehlermeldung bei Registrierungs-Fehler anzeigen", async () => {
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: null },
                error: { message: "E-Mail wird bereits verwendet" },
            });

            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");

            fireEvent.change(within(registerTab).getByLabelText("Vorname"), { target: { value: "Duplicate" } });
            fireEvent.change(within(registerTab).getByLabelText("Nachname"), { target: { value: "User" } });
            fireEvent.change(within(registerTab).getByLabelText("E-Mail"), { target: { value: "duplicate@example.com" } });
            fireEvent.change(within(registerTab).getByLabelText("Benutzername"), { target: { value: "duplicateuser" } });

            const passwordInputs = within(registerTab).getAllByPlaceholderText("••••••••");
            fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
            fireEvent.change(within(registerTab).getByLabelText("Passwort bestätigen"), { target: { value: "password123" } });

            const registerButton = within(registerTab).getByRole("button", { name: /registrieren/i });
            fireEvent.click(registerButton);

            await waitFor(() => {
                expect(within(registerTab).getByText("E-Mail wird bereits verwendet")).toBeInTheDocument();
            });

            expect(mockOnLogin).not.toHaveBeenCalled();
        });
    });

    //Validierungs-Tests: prüft ob HTML-Felder required sind
    describe("Formular-Validierung", () => {
        it("sollte E-Mail-Feld als required markieren", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const emailInput = within(loginTab).getByPlaceholderText("ihre.email@beispiel.de");

            expect(emailInput).toHaveAttribute("required");
            expect(emailInput).toHaveAttribute("type", "email");
        });

        it("sollte Passwort-Feld als required markieren", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const loginTab = screen.getByTestId("tab-content-login");
            const passwordInput = within(loginTab).getByPlaceholderText("••••••••");

            expect(passwordInput).toHaveAttribute("required");
            expect(passwordInput).toHaveAttribute("type", "password");
        });

        it("sollte alle Registrierungsfelder als required markieren", () => {
            render(<AuthPage onLogin={mockOnLogin} />);

            const registerTab = screen.getByTestId("tab-content-register");

            expect(within(registerTab).getByLabelText("Vorname")).toHaveAttribute("required");
            expect(within(registerTab).getByLabelText("Nachname")).toHaveAttribute("required");
            expect(within(registerTab).getByLabelText("Benutzername")).toHaveAttribute("required");
        });
    });
});