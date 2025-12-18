import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Frontend Check', () => {
    it('sollte wahr sein (Basis-Check)', () => {
        expect(true).toBe(true);
    });

    it('ein Beispiel UI Test', () => {
        render(<h1>Billbuddies</h1>);
        const element = screen.getByText(/Billbuddies/i);
        expect(element).toBeInTheDocument();
    });
});