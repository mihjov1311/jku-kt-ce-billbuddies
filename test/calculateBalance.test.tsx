import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { calculateBalances, type CalcExpense, type CalcParticipant } from "@/lib/calculateBalance";

import { supabase } from '@/lib/supabaseClient';

//Testpersonen werden angelegt
describe("calculateBalance", () => {
  const participants: CalcParticipant[] = [
    { id: "user1", name: "Max" },
    { id: "user2", name: "Erika" },
  ];

  it("liefert leeres Array wenn keine Ausgaben", () => {
    const result = calculateBalances([], participants);
    expect(result).toEqual([]);
  });

  it("1 Ausgabe: Max zahlt 20, geteilt durch 2 => Erika schuldet Max 10", () => {
    const expenses: CalcExpense[] = [
      { amount: 20, paidBy: "user1", splitBetween: ["user1", "user2"] },
    ];

    const result = calculateBalances(expenses, participants);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: "Erika", to: "Max" });
    expect(result[0].amount).toBeCloseTo(10, 2);
  });

  it("ignoriert splitBetween-IDs die nicht in participants sind", () => {
    const expenses: CalcExpense[] = [
      { amount: 30, paidBy: "user1", splitBetween: ["user1", "user2", "ghost"] },
    ];

    // gültig sind nur user1 und user2 => share = 15
    // user1: +30 -15 = +15, user2: -15 => user2 schuldet user1 15
    const result = calculateBalances(expenses, participants);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: "Erika", to: "Max" });
    expect(result[0].amount).toBeCloseTo(15, 2);
  });

  it("mehrere Ausgaben: Ergebnis bleibt konsistent und summiert korrekt", () => {
    const expenses: CalcExpense[] = [
      { amount: 40, paidBy: "user1", splitBetween: ["user1", "user2"] }, // Erika schuldet 20 an Max
      { amount: 10, paidBy: "user2", splitBetween: ["user1", "user2"] }, // Max schuldet 5 an Erika
    ];

    // Netto: Erika schuldet Max 15
    const result = calculateBalances(expenses, participants);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: "Erika", to: "Max" });
    expect(result[0].amount).toBeCloseTo(15, 2);
  });
});
