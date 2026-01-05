export interface Balance {
  from: string;
  to: string;
  amount: number;
}

export interface CalcParticipant {
  id: string;   // benutzername (z.B. "karl")
  name: string; // Anzeige (z.B. "Karl Hauser")
}

export interface CalcExpense {
  amount: number;
  paidBy: string;         // participant.id (benutzername)
  splitBetween: string[]; // array von participant.id
}


    // Berechnung der Schulden - Mit Unterstützung von Chatgpt
    export function calculateBalances  (
        expenses: CalcExpense[],
         participants: CalcParticipant[]
         ): Balance[]  {
        //für jeden Tn wird ein Saldo erstellt
        const balances: Record<string, number> = {};
        participants.forEach((p) => { balances[p.id] = 0; });

        //jede Ausgabe wird durchgegangen
        expenses.forEach((expense) => {
            //Wer beteiligt ist an dieser Ausgabe
            const validSplitIds = expense.splitBetween.filter(id =>
                participants.some(p => p.id === id)
            );

            if(validSplitIds.length === 0) return;

            //der Anteil wird berechnet also pro person
            const shareAmount = expense.amount / validSplitIds.length;

            //Der was bezahlt hat bekommt es gut geschrieben -> ganzer Betrag
            if (balances[expense.paidBy] !== undefined) {
                balances[expense.paidBy] += expense.amount;
            }
            //Eigener Anteil wird jedoch wieder abgezogen
            validSplitIds.forEach((personId) => {
                if (balances[personId] !== undefined) {
                    balances[personId] -= shareAmount;
                }
            });
        });
        //Liste für Schuldner erzeugen
        const debtors = Object.entries(balances)
            .filter(([_, amount]) => amount < -0.01)
            .sort((a, b) => a[1] - b[1]);
        //Liste mit neg Saldo erzeugen
        const creditors = Object.entries(balances)
            .filter(([_, amount]) => amount > 0.01)
            .sort((a, b) => b[1] - a[1]);

        const result: Balance[] = [];
        let i = 0;
        let j = 0;
        //Vergleich von Schuldner und Gläubiger - entweder Schuldner zahlt alles was er schuldet oder alles, was der Gläubiger bekommen soll je nachdem was kleiner ist
        //so wird verhindert, dass keiner zu viel zahlt
        while (i < debtors.length && j < creditors.length) {
            const [debtorId, debtAmount] = debtors[i];
            const [creditorId, creditAmount] = creditors[j];
            //-debtAmount macht es positiv also die Schulden
            //creditamount sind das Guthaben vom anderen
            const amount = Math.min(-debtAmount, creditAmount);

            if (amount > 0.01) {
                const debtorName = participants.find(p => p.id === debtorId)?.name || debtorId;
                const creditorName = participants.find(p => p.id === creditorId)?.name || creditorId;

                //"A zahlt B zb. 20 Euro"
                result.push({
                    from: debtorName,
                    to: creditorName,
                    amount: amount,
                });
            }

            //Schulden ausgleichen
            debtors[i] = [debtorId, debtAmount + amount];
            creditors[j] = [creditorId, creditAmount - amount];

            if (Math.abs(debtors[i][1]) < 0.01) i++;
            if (Math.abs(creditors[j][1]) < 0.01) j++;
        }

        return result;
    };