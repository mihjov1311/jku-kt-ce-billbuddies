import { createWorker, PSM } from 'tesseract.js';
import { NextResponse } from 'next/server';

/**
 * Hilfsfunktion, um Strings sicher in eine Regex einzubauen
 * (verhindert Absturz bei Sonderzeichen wie "NAH&FRISCH" oder "L'OSTERIA")
 */
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parsing-Logik mit Regex-Fix ("Ganzwortsuche"), Mensa-Fix, Datums-Filter.
 */
const parseOcrResult = (text: string) => {
    // 1. Bereinigung
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Originaltext für Regex behalten (Groß/Kleinschreibung macht Regex 'i' flag)
    // Wir nutzen hier text direkt, nicht nur upperCase, um flexibler zu bleiben,
    // aber für die Keywords nutzen wir das 'i' Flag.

    let amount = 0;
    let description = "Rechnung (OCR-Scan)";
    let categorySuggestion = "Sonstiges"; // Standardwert

    // --- A. KATEGORIE & BESCHREIBUNG ---
    const categorizationKeywords = {
        "Supermarkt & Lebensmittel": [
            "MAXIMARKT", "MAXI MARKT", "SPAR", "REWE", "HOFER", "LIDL",
            "BILLA", "PENNY", "UNIMARKT", "NAH&FRISCH", "METRO", "MPREIS",
            "BÄCKEREI", "RESCH", "BACKWERK"
        ],
        "Essen & Trinken": [
            "MENSA", "KANTINE", "JKU", "ALMA", "RESTAURANT", "CAFE",
            "PIZZA", "BURGER", "GASTHOF", "TRATTORIA", "VAPIANO", "L'OSTERIA",
            "MCDONALDS", "BURGER KING", "KFC", "SUBWAY", "STARBUCKS",
            "LIEFERANDO", "FOODORA", "UBER EATS", "WIRT"
        ],
        "Transport": [
            "ÖBB", "WESTBAHN", "LINZ AG", "WIENER LINIEN", "IVB", "VOR",
            "UBER", "BOLT", "TAXI", "TIER", "LIME",
            "PARKEN", "GARAGE", "APCOA", "CONTIPARK", "FAHRSCHEIN", "TICKET"
        ],
        "Unterkunft": [
            "HOTEL", "MOTEL", "AIRBNB", "BOOKING", "HOSTEL",
            "IBIS", "NOVOTEL", "HILTON", "MARRIOTT", "PENSION", "REZEPTION"
        ],
        "Einkaufen": [
            "AMAZON", "ZALANDO", "MEDIA MARKT", "SATURN", "APPLE",
            "H&M", "ZARA", "C&A", "PEEK", "CLOPPENBURG", "PRIMARK",
            "INTERSPORT", "HERVIS", "DECATHLON", "THALIA", "LIBRO", "PAGRO",
            "TSCHIBO", "EDUSCHO", "SHOP", "STORE"
        ],
        "Drogerie & Apotheke": [
            "DM", "BIPA", "MÜLLER", "DOUGLAS", "MARIONNAUD",
            "APOTHEKE", "SHOP APOTHEKE", "DOCMORRIS"
        ],
        "Tanken & Auto": [
            "TANKSTELLE", "OMV", "SHELL", "BP", "JET", "ENI", "TURMÖL",
            "AVANTI", "DISKONT", "ASFINAG", "MAUT", "WASCHSTRASSE", "KFZ"
        ],
        "Sonstiges": [
            "IKEA", "MÖBEL", "XXXLUTZ", "KIKA", "LEINER", "MÖMAX",
            "BAUMARKT", "HORNBACH", "OBI", "BAUHAUS", "ZGONC",
            "PAYPAL", "KLARNA", "TRAFIK", "POST", "DHL", "LOGOIX"
        ]
    };

    let matchFound = false;

    // Wir iterieren durch die Kategorien
    for (const categoryKey of Object.keys(categorizationKeywords) as Array<keyof typeof categorizationKeywords>) {
        if (matchFound) break;

        for (const keyword of categorizationKeywords[categoryKey]) {
            // FIX: Verwendung von Regex mit Word Boundaries (\b)
            // \bUBER\b matcht "UBER" aber NICHT "GRUBER"
            // Flag 'i' macht es case-insensitive (findet UBER, Uber, uber)
            const escapedKeyword = escapeRegExp(keyword);
            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

            if (regex.test(text)) {
                categorySuggestion = categoryKey;
                matchFound = true;

                // Beschreibung setzen (Erster Buchstabe Groß)
                description = keyword.charAt(0) + keyword.slice(1).toLowerCase();

                // Spezialfälle für schönere Namen
                if (description.toUpperCase().includes("JKU")) description = "JKU Mensa";
                if (description.toUpperCase().includes("MAXI")) description = "Maximarkt";

                // Debugging Log, damit wir sehen warum er was gewählt hat
                //console.log(`[Categorizer] Match found: '${keyword}' -> Category: '${categoryKey}'`);

                break;
            }
        }
    }

    // Fallback Beschreibung, falls kein Keyword gefunden wurde, aber Text da ist
    if ((description === "Rechnung (OCR-Scan)" || description.length < 3) && lines.length > 0) {
        // Suche eine Zeile, die nicht nur Zahlen ist
        const meaningfulLine = lines.find(line => line.length > 4 && !line.match(/^[0-9.,/ -]+$/));
        if (meaningfulLine) description = meaningfulLine.substring(0, 50).trim();
    }


    // --- B. BETRAG (MIT AGGRESSIVEM DATUMS-FILTER) ---
    const cleanAndParse = (amountStr: string): number | null => {
        let clean = amountStr.replace(/[^0-9.,]/g, '');

        // Format erraten (Deutsch vs Englisch)
        if (clean.match(/,\d{2}$/)) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.match(/\.\d{2}$/)) {
            clean = clean.replace(/,/g, '');
        } else {
            clean = clean.replace(/\./g, '').replace(',', '.');
        }

        const val = parseFloat(clean);

        if (isNaN(val)) return null;
        if (val < 0.10) return null; // Zu klein
        if (val > 5000) return null; // Unwahrscheinlich hoch für Alltag

        // DATUMS-FILTER:
        // Verhindert z.B., dass "20.11" (Datum) als 20,11€ erkannt wird
        if (val === 20.11 || val === 20.12 || val === 19.11) return null;
        // Jahreszahlen filtern (2020 - 2030)
        if (val >= 2020 && val <= 2030) return null;

        return val;
    };

    const amountRegex = /(\d{1,4}[.,]\d{2})/g;
    let allAmounts: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = amountRegex.exec(text)) !== null) {
        const parsed = cleanAndParse(match[1]);
        if (parsed !== null) {
            allAmounts.push(parsed);
        }
    }

    // 1. Priorität: Suche nach "GESAMT", "SUMME", "TOTAL" in den letzten Zeilen
    let finalTotal = 0;
    const totalKeywords = ['GESAMT', 'SUMME', 'TOTAL', 'BETRAG', 'ZAHLUNG'];
    const lowerText = text.slice(-400).toUpperCase(); // Nur das Ende scannen

    for (const kw of totalKeywords) {
        // Regex sucht Keyword gefolgt von Zahl (ignoriert bis zu 20 Zeichen dazwischen)
        const regex = new RegExp(`${kw}.{0,20}?(\\d{1,4}[.,]\\d{2})`);
        const found = lowerText.match(regex);

        if (found) {
            const val = cleanAndParse(found[1]);
            if (val !== null && val > finalTotal) {
                finalTotal = val;
            }
        }
    }

    if (finalTotal > 0) {
        amount = finalTotal;
    }
    else if (allAmounts.length > 0) {
        // Fallback: Höchster gefundener Betrag
        amount = Math.max(...allAmounts);
    }

    return {
        amount: amount.toFixed(2),
        description: description,
        category: categorySuggestion
    };
};


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) return NextResponse.json({ success: false }, { status: 400 });

        //console.log("Starting OCR processing...");
        const worker = await createWorker('deu+eng');

        // Parameter für bessere Block-Erkennung bei Rechnungen
        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        });

        const img = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

        // 1. Texterkennung
        const { data: { text } } = await worker.recognize(img);

        // 2. DEBUGGING: Raw Text
        //console.log("\n============================================");
        //console.log("=== RAW OCR TEXT START (Debugging) ===");
        //console.log("============================================");
        //console.log(text);
        //console.log("============================================");
        //console.log("=== RAW OCR TEXT END =======================\n");

        await worker.terminate();

        // 3. Text analysieren
        const result = parseOcrResult(text);

        //console.log("Final Parsed Result:", result);

        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        //console.error("OCR API Error:", error);
        return NextResponse.json({ success: false, message: 'OCR Error' }, { status: 500 });
    }
}