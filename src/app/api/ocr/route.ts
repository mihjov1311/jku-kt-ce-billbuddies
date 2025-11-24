import { createWorker, PSM } from 'tesseract.js';

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';



// --- SUPABASE CONFIG ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Nutze hier den Service Key für Admin-Rechte beim Upload



const supabase = createClient(supabaseUrl, supabaseServiceKey);



/**

 * Hilfsfunktion: Escape für Regex

 */

function escapeRegExp(string: string) {

    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

}



/**

 * Hilfsfunktion: Base64 zu Buffer und Upload zu Supabase

 */

async function uploadImage(base64Image: string) {

    try {

        // 1. Base64 Header entfernen (data:image/jpeg;base64,...)

        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");



        // 2. In Buffer umwandeln

        const buffer = Buffer.from(base64Data, 'base64');



        // 3. Dateinamen generieren (Zeitstempel + Zufall, damit nichts überschrieben wird)

        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;



        // 4. Upload in den Bucket "receipts"

        const { data, error } = await supabase

            .storage

            .from('receipts') // <--- ACHTUNG: Dieser Bucket muss in Supabase existieren!

            .upload(fileName, buffer, {

                contentType: 'image/jpeg',

                upsert: false

            });



        if (error) {

            console.error("Supabase Upload Error:", error);

            return null;

        }



        // 5. Public URL abrufen (damit wir das Bild im Frontend anzeigen können)

        const { data: { publicUrl } } = supabase

            .storage

            .from('receipts')

            .getPublicUrl(fileName);



        return publicUrl;



    } catch (e) {

        console.error("Upload process failed:", e);

        return null;

    }

}



/**

 * Parsing-Logik (Dein bestehender Code, unverändert)

 */

const parseOcrResult = (text: string) => {

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);



    let amount = 0;

    let description = "Rechnung (OCR-Scan)";

    let categorySuggestion = "Sonstiges";



    const categorizationKeywords = {

        "Supermarkt & Lebensmittel": ["MAXIMARKT", "MAXI MARKT", "SPAR", "REWE", "HOFER", "LIDL", "BILLA", "PENNY", "UNIMARKT", "NAH&FRISCH", "METRO", "MPREIS", "BÄCKEREI", "RESCH", "BACKWERK"],

        "Essen & Trinken": ["MENSA", "KANTINE", "JKU", "ALMA", "RESTAURANT", "CAFE", "PIZZA", "BURGER", "GASTHOF", "TRATTORIA", "VAPIANO", "L'OSTERIA", "MCDONALDS", "BURGER KING", "KFC", "SUBWAY", "STARBUCKS", "LIEFERANDO", "FOODORA", "UBER EATS", "WIRT"],

        "Transport": ["ÖBB", "WESTBAHN", "LINZ AG", "WIENER LINIEN", "IVB", "VOR", "UBER", "BOLT", "TAXI", "TIER", "LIME", "PARKEN", "GARAGE", "APCOA", "CONTIPARK", "FAHRSCHEIN", "TICKET"],

        "Unterkunft": ["HOTEL", "MOTEL", "AIRBNB", "BOOKING", "HOSTEL", "IBIS", "NOVOTEL", "HILTON", "MARRIOTT", "PENSION", "REZEPTION"],

        "Einkaufen": ["AMAZON", "ZALANDO", "MEDIA MARKT", "SATURN", "APPLE", "H&M", "ZARA", "C&A", "PEEK", "CLOPPENBURG", "PRIMARK", "INTERSPORT", "HERVIS", "DECATHLON", "THALIA", "LIBRO", "PAGRO", "TSCHIBO", "EDUSCHO", "SHOP", "STORE"],

        "Drogerie & Apotheke": ["DM", "BIPA", "MÜLLER", "DOUGLAS", "MARIONNAUD", "APOTHEKE", "SHOP APOTHEKE", "DOCMORRIS"],

        "Tanken & Auto": ["TANKSTELLE", "OMV", "SHELL", "BP", "JET", "ENI", "TURMÖL", "AVANTI", "DISKONT", "ASFINAG", "MAUT", "WASCHSTRASSE", "KFZ"],

        "Sonstiges": ["IKEA", "MÖBEL", "XXXLUTZ", "KIKA", "LEINER", "MÖMAX", "BAUMARKT", "HORNBACH", "OBI", "BAUHAUS", "ZGONC", "PAYPAL", "KLARNA", "TRAFIK", "POST", "DHL", "LOGOIX"]

    };



    let matchFound = false;



    for (const categoryKey of Object.keys(categorizationKeywords) as Array<keyof typeof categorizationKeywords>) {

        if (matchFound) break;

        for (const keyword of categorizationKeywords[categoryKey]) {

            const escapedKeyword = escapeRegExp(keyword);

            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');



            if (regex.test(text)) {

                categorySuggestion = categoryKey;

                matchFound = true;

                description = keyword.charAt(0) + keyword.slice(1).toLowerCase();

                if (description.toUpperCase().includes("JKU")) description = "JKU Mensa";

                if (description.toUpperCase().includes("MAXI")) description = "Maximarkt";

                break;

            }

        }

    }



    if ((description === "Rechnung (OCR-Scan)" || description.length < 3) && lines.length > 0) {

        const meaningfulLine = lines.find(line => line.length > 4 && !line.match(/^[0-9.,/ -]+$/));

        if (meaningfulLine) description = meaningfulLine.substring(0, 50).trim();

    }



    const cleanAndParse = (amountStr: string): number | null => {

        let clean = amountStr.replace(/[^0-9.,]/g, '');

        if (clean.match(/,\d{2}$/)) { clean = clean.replace(/\./g, '').replace(',', '.'); }

        else if (clean.match(/\.\d{2}$/)) { clean = clean.replace(/,/g, ''); }

        else { clean = clean.replace(/\./g, '').replace(',', '.'); }

        const val = parseFloat(clean);

        if (isNaN(val) || val < 0.10 || val > 5000) return null;

        if (val === 20.11 || val === 20.12 || val === 19.11) return null;

        if (val >= 2020 && val <= 2030) return null;

        return val;

    };



    const amountRegex = /(\d{1,4}[.,]\d{2})/g;

    let allAmounts: number[] = [];

    let match: RegExpExecArray | null;

    while ((match = amountRegex.exec(text)) !== null) {

        const parsed = cleanAndParse(match[1]);

        if (parsed !== null) allAmounts.push(parsed);

    }



    let finalTotal = 0;

    const totalKeywords = ['GESAMT', 'SUMME', 'TOTAL', 'BETRAG', 'ZAHLUNG'];

    const lowerText = text.slice(-400).toUpperCase();



    for (const kw of totalKeywords) {

        const regex = new RegExp(`${kw}.{0,20}?(\\d{1,4}[.,]\\d{2})`);

        const found = lowerText.match(regex);

        if (found) {

            const val = cleanAndParse(found[1]);

            if (val !== null && val > finalTotal) finalTotal = val;

        }

    }



    if (finalTotal > 0) amount = finalTotal;

    else if (allAmounts.length > 0) amount = Math.max(...allAmounts);



    return { amount: amount.toFixed(2), description, category: categorySuggestion };

};





export async function POST(request: Request) {

    try {

        const body = await request.json();

        const { imageBase64 } = body;



        if (!imageBase64) return NextResponse.json({ success: false }, { status: 400 });



        console.log("Starting OCR processing...");



        // --- SCHRITT A: PARALLEL OCR & UPLOAD STARTEN ---

        // Wir starten den Worker

        const worker = await createWorker('deu+eng');

        await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });

        const img = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;



        // Wir starten OCR und Upload gleichzeitig (Promise.all), damit es schneller geht

        const ocrPromise = worker.recognize(img);

        const uploadPromise = uploadImage(imageBase64); // Hier speichern wir das Bild!



        // Warten auf beide Ergebnisse

        const [ocrResult, publicImageUrl] = await Promise.all([ocrPromise, uploadPromise]);



        await worker.terminate();



        const text = ocrResult.data.text;



        console.log("Image saved at:", publicImageUrl);

        console.log("Raw Text:", text.substring(0, 50) + "...");



        // --- SCHRITT B: ANALYSE ---

        const parsedResult = parseOcrResult(text);



        // Wir geben die ImageURL zurück an das Frontend,

        // damit du sie beim Speichern des Eintrags in die DB nutzen kannst.

        return NextResponse.json({

            success: true,

            ...parsedResult,

            imageUrl: publicImageUrl // <--- NEU: URL zum gespeicherten Bild

        });



    } catch (error) {

        console.error("API Error:", error);

        return NextResponse.json({ success: false, message: 'Processing Error' }, { status: 500 });

    }

}