import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddExpenseDialog, Participant } from '@/components/AddExpenseDialog';
import { supabase } from '@/lib/supabaseClient';

// Supabase Mock
jest.mock('@/lib/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => ({
            insert: jest.fn(),
        })),
    },
}));

describe('AddExpenseDialog - Full Coverage Fix', () => {
    const mockParticipants: Participant[] = [
        { id: 'user1', name: 'Max' },
        { id: 'user2', name: 'Erika' },
    ];

    const defaultProps = {
        groupId: 1,
        participants: mockParticipants,
        onExpenseAdded: jest.fn(),
        open: true,
        onOpenChange: jest.fn(),
        currentUserDbId: 'user1',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(window, 'alert').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('sollte den Dialog mit den korrekten Feldern rendern', () => {
        render(<AddExpenseDialog {...defaultProps} />);
        expect(screen.getByText('Neue Ausgabe')).toBeInTheDocument();
    });

    it('sollte eine Fehlermeldung zeigen, wenn Pflichtfelder fehlen', async () => {
        render(<AddExpenseDialog {...defaultProps} />);
        const form = screen.getByRole('dialog').querySelector('form');
        if (form) fireEvent.submit(form);
        expect(window.alert).toHaveBeenCalledWith("Bitte füllen Sie alle Pflichtfelder aus.");
    });

    it('sollte den Fehler-Catch-Block ausführen, wenn der Insert wirft (Zeile 101-102)', async () => {
        (supabase.from as jest.Mock).mockReturnValue({
            insert: jest.fn().mockImplementation(() => {
                throw new Error("Netzwerkfehler");
            }),
        });

        render(<AddExpenseDialog {...defaultProps} />);
        fireEvent.change(screen.getByLabelText(/Beschreibung/i), { target: { value: 'Pizza' } });
        fireEvent.change(screen.getByLabelText(/Betrag/i), { target: { value: '10' } });

        const form = screen.getByRole('dialog').querySelector('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Fehler beim Speichern: Netzwerkfehler"));
        });
    });

    it('sollte die Felder zurücksetzen, wenn der open-Status auf false wechselt (Zeile 125-126)', () => {
        const { rerender } = render(<AddExpenseDialog {...defaultProps} open={true} />);
        fireEvent.change(screen.getByLabelText(/Beschreibung/i), { target: { value: 'Inhalt' } });
        rerender(<AddExpenseDialog {...defaultProps} open={false} />);
        rerender(<AddExpenseDialog {...defaultProps} open={true} />);
        expect(screen.getByLabelText(/Beschreibung/i)).toHaveValue('');
    });

    it('sollte onOpenChange aufrufen, wenn der Abbrechen-Button geklickt wird (Zeile 251)', () => {
        render(<AddExpenseDialog {...defaultProps} />);
        fireEvent.click(screen.getByText('Abbrechen'));
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('sollte bei Erfolg onExpenseAdded aufrufen', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

        render(<AddExpenseDialog {...defaultProps} />);
        fireEvent.change(screen.getByLabelText(/Beschreibung/i), { target: { value: 'Einkauf' } });
        fireEvent.change(screen.getByLabelText(/Betrag/i), { target: { value: '20.50' } });

        const form = screen.getByRole('dialog').querySelector('form');
        if (form) fireEvent.submit(form);

        await waitFor(() => {
            expect(defaultProps.onExpenseAdded).toHaveBeenCalled();
        });
    });

    it('sollte für Screen Reader zugänglich sein', () => {
        render(<AddExpenseDialog {...defaultProps} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/Beschreibung/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Betrag/i)).toBeInTheDocument();
    });

});