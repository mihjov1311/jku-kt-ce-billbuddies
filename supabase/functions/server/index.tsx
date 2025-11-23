/**
 * =============================================================================
 * BACKEND SERVER - HONO WEB SERVER FÜR BILLBUDDIES
 * =============================================================================
 * 
 * Dies ist der Backend-Server, der auf Supabase Edge Functions läuft.
 * 
 * TECHNOLOGIE-STACK:
 * - Hono: Modernes Web-Framework für Edge-Umgebungen (wie Express.js)
 * - Deno: JavaScript/TypeScript-Runtime (statt Node.js)
 * - Supabase: Backend-Plattform (Datenbank, Auth, Storage)
 * 
 * ARCHITEKTUR:
 * Frontend (React) → HTTP-Request → Dieser Server → Supabase (Auth + KV-Store)
 * 
 * WAS MACHT DIESER SERVER?
 * - Empfängt Requests vom Frontend
 * - Authentifiziert Benutzer (mit Supabase Auth)
 * - Verwaltet Daten in KV-Store (Key-Value-Datenbank)
 * - Sendet Antworten zurück ans Frontend
 * 
 * WICHTIGE KONZEPTE:
 * 
 * 1. SUPABASE AUTH:
 *    - Supabase verwaltet Benutzer-Accounts und Sessions
 *    - Frontend/Backend meldet Benutzer an/ab
 *    - Supabase gibt JWT Access Tokens zurück
 *    - Diese Tokens werden für authentifizierte Requests verwendet
 * 
 * 2. KV-STORE (Key-Value-Store):
 *    - Einfache Datenbank mit Key-Value-Paaren
 *    - Beispiel: Key="user:123" → Value={ username: "max", firstName: "Max" }
 *    - Flexibel: Kann beliebige JSON-Daten speichern
 *    - Importiert über: import * as kv from "./kv_store.tsx"
 * 
 * 3. SERVICE ROLE KEY vs. ANON KEY:
 *    - SERVICE_ROLE_KEY: Volle Rechte, NUR im Backend verwenden (GEHEIM!)
 *    - ANON_KEY: Begrenzte Rechte, im Frontend verwenden (öffentlich)
 * 
 * ⚠️ AKTUELLER STATUS:
 * Alle Routen sind vorbereitet, haben aber noch KEINE Logik.
 * Sie sind mit TODO-Kommentaren markiert.
 * 
 * =============================================================================
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

// Hono-App erstellen (ähnlich wie Express.js)
const app = new Hono();

/**
 * SUPABASE CLIENT FÜR BACKEND
 * 
 * Dieser Client hat VOLLE RECHTE (Service Role Key).
 * WICHTIG: Dieser Key darf NIEMALS ans Frontend geschickt werden!
 * 
 * Mit diesem Client können wir:
 * - Benutzer erstellen/löschen (admin.createUser)
 * - Benutzer authentifizieren (auth.getUser)
 * - Storage verwalten (wenn später benötigt)
 */
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,           // URL zur Supabase-Instanz
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,  // GEHEIMER Admin-Key (nur Backend!)
);

/**
 * LOGGER MIDDLEWARE
 * 
 * Protokolliert alle Requests in der Console.
 * Hilfreich für Debugging.
 * 
 * Beispiel-Output:
 * POST /make-server-1ed4438c/auth/signin 200 45ms
 */
app.use('*', logger(console.log));

/**
 * CORS MIDDLEWARE
 * 
 * CORS = Cross-Origin Resource Sharing
 * Ermöglicht dem Frontend (andere Domain), diesen Server anzusprechen.
 * 
 * Ohne CORS würde der Browser die Requests blockieren!
 * 
 * Konfiguration:
 * - origin: "*" → Alle Domains dürfen zugreifen
 * - allowHeaders: Welche HTTP-Header erlaubt sind
 * - allowMethods: Welche HTTP-Methoden erlaubt sind (GET, POST, etc.)
 */
app.use(
  "/*",
  cors({
    origin: "*",  // Alle Origins erlauben (für Entwicklung OK, in Produktion besser spezifischer)
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

/**
 * HEALTH CHECK ENDPOINT
 * 
 * Einfacher Endpunkt zum Testen, ob der Server läuft.
 * 
 * Test: GET https://{projektId}.supabase.co/functions/v1/make-server-1ed4438c/health
 * Antwort: { "status": "ok" }
 */
app.get("/make-server-1ed4438c/health", (c) => {
  return c.json({ status: "ok" });
});

// =============================================================================
// AUTH ROUTES - AUTHENTIFIZIERUNGS-ENDPUNKTE
// =============================================================================
//
// Diese Routen kümmern sich um:
// - Benutzer-Registrierung (signup)
// - Benutzer-Anmeldung (signin)
// - Benutzer-Abmeldung (signout)
//
// ⚠️ STATUS: PLATZHALTER - Noch keine Logik implementiert
// =============================================================================

/**
 * POST /auth/signup - BENUTZER REGISTRIEREN
 * 
 * Erstellt einen neuen Benutzer-Account.
 * 
 * REQUEST BODY:
 * {
 *   firstName: string,    // z.B. "Max"
 *   lastName: string,     // z.B. "Mustermann"
 *   email: string,        // z.B. "max@beispiel.de"
 *   username: string,     // z.B. "maxmuster"
 *   password: string      // z.B. "geheim123"
 * }
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Daten aus Request-Body extrahieren
 * 2. Prüfen, ob Username schon existiert (in KV-Store)
 * 3. Benutzer in Supabase Auth erstellen:
 *    await supabase.auth.admin.createUser({
 *      email,
 *      password,
 *      email_confirm: true  // E-Mail automatisch bestätigen (kein E-Mail-Server konfiguriert)
 *    })
 * 4. Zusätzliche Daten in KV-Store speichern:
 *    Key: `user:{userId}`
 *    Value: { username, firstName, lastName, email }
 * 5. Mapping Username → Email speichern (für Login):
 *    Key: `username:{username}`
 *    Value: { userId, email }
 * 6. Access Token zurückgeben
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   accessToken: "eyJhbGci...",
 *   user: { id: "...", username: "maxmuster", ... }
 * }
 */
app.post("/make-server-1ed4438c/auth/signup", async (c) => {
  try {
    // Später: Daten aus Request-Body holen
    // const { firstName, lastName, email, username, password } = await c.req.json();
    
    // TODO: Hier kommt die Registrierungslogik (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Registrierung (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    // Fehlerbehandlung: Detaillierte Error-Message für Debugging
    console.log(`Auth signup error: ${error}`);
    return c.json({ error: "Fehler bei der Registrierung" }, 500);
  }
});

/**
 * POST /auth/signin - BENUTZER ANMELDEN
 * 
 * Meldet einen Benutzer mit Benutzername und Passwort an.
 * 
 * HERAUSFORDERUNG:
 * Supabase Auth verwendet E-Mail + Passwort zum Login,
 * aber wir wollen Benutzername + Passwort unterstützen!
 * 
 * LÖSUNG:
 * 1. Im KV-Store speichern wir: username → email
 * 2. Beim Login: Username in E-Mail umwandeln
 * 3. Mit E-Mail + Passwort bei Supabase anmelden
 * 
 * REQUEST BODY:
 * {
 *   username: string,  // z.B. "maxmuster"
 *   password: string   // z.B. "geheim123"
 * }
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Daten aus Request-Body extrahieren
 * 2. E-Mail für Username finden:
 *    const data = await kv.get(`username:{username}`);
 *    const email = data.email;
 * 3. Mit E-Mail + Passwort anmelden:
 *    const { data: session } = await supabase.auth.signInWithPassword({ email, password });
 * 4. Benutzerdaten aus KV-Store laden
 * 5. Access Token + Benutzerdaten zurückgeben
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   accessToken: "eyJhbGci...",
 *   user: { id: "...", username: "maxmuster", firstName: "Max", ... }
 * }
 */
app.post("/make-server-1ed4438c/auth/signin", async (c) => {
  try {
    // Später: Daten aus Request-Body holen
    // const { username, password } = await c.req.json();
    
    // TODO: Hier kommt die Anmeldelogik (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Anmeldung (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Auth signin error: ${error}`);
    return c.json({ error: "Fehler bei der Anmeldung" }, 500);
  }
});

/**
 * POST /auth/signout - BENUTZER ABMELDEN
 * 
 * Meldet den aktuellen Benutzer ab.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token aus Authorization-Header extrahieren
 * 2. Session mit Supabase beenden:
 *    await supabase.auth.admin.signOut(accessToken);
 * 3. Bestätigung zurückgeben
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   message: "Erfolgreich abgemeldet"
 * }
 */
app.post("/make-server-1ed4438c/auth/signout", async (c) => {
  try {
    // Später: Access Token aus Header holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // TODO: Hier kommt die Abmeldelogik (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Abmeldung (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Auth signout error: ${error}`);
    return c.json({ error: "Fehler bei der Abmeldung" }, 500);
  }
});

// =============================================================================
// GROUP ROUTES - GRUPPENVERWALTUNGS-ENDPUNKTE
// =============================================================================
//
// Diese Routen kümmern sich um:
// - Erstellen neuer Gruppen
// - Beitreten zu Gruppen (via 6-stelligem Code)
// - Abrufen aller Gruppen eines Benutzers
//
// DATENSTRUKTUR IN KV-STORE (später):
// Key: `group:{groupId}`
// Value: {
//   id: string,
//   name: string,
//   code: string (6-stellig),
//   members: string[] (User-IDs),
//   createdAt: Date,
//   createdBy: string (User-ID)
// }
//
// Key: `group:code:{code}` → Value: { groupId }  (für schnelles Finden)
// Key: `user:{userId}:groups` → Value: string[] (Liste von Group-IDs)
//
// ⚠️ STATUS: PLATZHALTER - Noch keine Logik implementiert
// =============================================================================

/**
 * POST /groups - NEUE GRUPPE ERSTELLEN
 * 
 * Erstellt eine neue Gruppe mit einem zufälligen 6-stelligen Code.
 * Nur angemeldete Benutzer können Gruppen erstellen.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * REQUEST BODY:
 * {
 *   name: string  // z.B. "Urlaub Italien 2025"
 * }
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token aus Header extrahieren
 * 2. Benutzer authentifizieren:
 *    const { data: { user } } = await supabase.auth.getUser(accessToken);
 *    if (!user) return 401 Unauthorized
 * 3. 6-stelligen Code generieren (z.B. "A8F2K9"):
 *    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
 *    Prüfen, ob Code schon existiert (selten, aber möglich)
 * 4. Gruppe speichern:
 *    const group = {
 *      id: crypto.randomUUID(),
 *      name,
 *      code,
 *      members: [user.id],
 *      createdAt: new Date(),
 *      createdBy: user.id
 *    };
 *    await kv.set(`group:${group.id}`, group);
 *    await kv.set(`group:code:${code}`, { groupId: group.id });
 * 5. Gruppe zur Benutzerliste hinzufügen:
 *    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
 *    userGroups.push(group.id);
 *    await kv.set(`user:${user.id}:groups`, userGroups);
 * 6. Gruppe zurückgeben
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   group: { id: "...", name: "...", code: "A8F2K9", members: [...], ... }
 * }
 */
app.post("/make-server-1ed4438c/groups", async (c) => {
  try {
    // Später: Access Token und Daten holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    // const { name } = await c.req.json();
    
    // TODO: Hier kommt die Logik zum Erstellen einer Gruppe (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Gruppe erstellen (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Create group error: ${error}`);
    return c.json({ error: "Fehler beim Erstellen der Gruppe" }, 500);
  }
});

/**
 * POST /groups/join - GRUPPE BEITRETEN
 * 
 * Tritt einer existierenden Gruppe über einen 6-stelligen Code bei.
 * Nur angemeldete Benutzer können Gruppen beitreten.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * REQUEST BODY:
 * {
 *   code: string  // z.B. "A8F2K9"
 * }
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token aus Header extrahieren
 * 2. Benutzer authentifizieren (siehe oben)
 * 3. Gruppe mit Code finden:
 *    const codeData = await kv.get(`group:code:${code}`);
 *    if (!codeData) return 404 "Gruppe nicht gefunden"
 *    const group = await kv.get(`group:${codeData.groupId}`);
 * 4. Prüfen, ob Benutzer schon Mitglied ist:
 *    if (group.members.includes(user.id)) return "Bereits Mitglied"
 * 5. Benutzer zu Gruppenmitgliedern hinzufügen:
 *    group.members.push(user.id);
 *    await kv.set(`group:${group.id}`, group);
 * 6. Gruppe zur Benutzerliste hinzufügen:
 *    const userGroups = await kv.get(`user:${user.id}:groups`) || [];
 *    userGroups.push(group.id);
 *    await kv.set(`user:${user.id}:groups`, userGroups);
 * 7. Gruppendaten zurückgeben
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   group: { id: "...", name: "...", code: "A8F2K9", members: [...], ... }
 * }
 */
app.post("/make-server-1ed4438c/groups/join", async (c) => {
  try {
    // Später: Access Token und Code holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    // const { code } = await c.req.json();
    
    // TODO: Hier kommt die Logik zum Beitreten einer Gruppe (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Gruppe beitreten (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Join group error: ${error}`);
    return c.json({ error: "Fehler beim Beitreten der Gruppe" }, 500);
  }
});

/**
 * GET /groups - ALLE GRUPPEN DES BENUTZERS ABRUFEN
 * 
 * Lädt alle Gruppen, in denen der Benutzer Mitglied ist.
 * Nur angemeldete Benutzer können ihre Gruppen abrufen.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token aus Header extrahieren
 * 2. Benutzer authentifizieren (siehe oben)
 * 3. Gruppen-IDs des Benutzers laden:
 *    const groupIds = await kv.get(`user:${user.id}:groups`) || [];
 * 4. Alle Gruppen laden:
 *    const groups = await kv.mget(groupIds.map(id => `group:${id}`));
 * 5. Für jede Gruppe: Mitgliederdaten laden (Namen statt IDs)
 * 6. Gruppen sortiert zurückgeben (neueste zuerst)
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   groups: [
 *     { id: "...", name: "Urlaub Italien", code: "ABC123", memberCount: 4, ... },
 *     { id: "...", name: "WG Kosten", code: "XYZ789", memberCount: 3, ... }
 *   ]
 * }
 */
app.get("/make-server-1ed4438c/groups", async (c) => {
  try {
    // Später: Access Token holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // TODO: Hier kommt die Logik zum Abrufen der Gruppen (siehe Kommentar oben)
    
    return c.json({ 
      groups: [],
      message: "Gruppen laden (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Get groups error: ${error}`);
    return c.json({ error: "Fehler beim Laden der Gruppen" }, 500);
  }
});

// =============================================================================
// EXPENSE ROUTES - AUSGABENVERWALTUNGS-ENDPUNKTE
// =============================================================================
//
// Diese Routen kümmern sich um:
// - Hinzufügen neuer Ausgaben zu einer Gruppe
// - Abrufen aller Ausgaben einer Gruppe
// - Löschen von Ausgaben
//
// DATENSTRUKTUR IN KV-STORE (später):
// Key: `group:{groupId}:expenses`
// Value: [
//   {
//     id: string,
//     description: string,
//     amount: number,
//     category: string,
//     paidBy: string (User-ID),
//     splitBetween: string[] (User-IDs - ALLE Gruppenmitglieder automatisch),
//     date: Date,
//     createdBy: string (User-ID)
//   }
// ]
//
// ⚠️ STATUS: PLATZHALTER - Noch keine Logik implementiert
// =============================================================================

/**
 * POST /groups/:groupId/expenses - AUSGABE HINZUFÜGEN
 * 
 * Fügt einer Gruppe eine neue Ausgabe hinzu.
 * Die Ausgabe wird AUTOMATISCH gleichmäßig auf ALLE Gruppenmitglieder aufgeteilt.
 * Nur Mitglieder der Gruppe können Ausgaben hinzufügen.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * URL PARAMETER:
 * groupId: string  // ID der Gruppe
 * 
 * REQUEST BODY:
 * {
 *   description: string,  // z.B. "Abendessen im Restaurant"
 *   amount: number,       // z.B. 80.50
 *   category: string,     // z.B. "Essen & Trinken" (optional)
 *   paidBy: string        // Benutzername (wird in User-ID umgewandelt)
 * }
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token aus Header und groupId aus URL extrahieren
 * 2. Benutzer authentifizieren (siehe oben)
 * 3. Gruppe laden und prüfen, ob Benutzer Mitglied ist:
 *    const group = await kv.get(`group:${groupId}`);
 *    if (!group.members.includes(user.id)) return 403 Forbidden
 * 4. Neue Ausgabe erstellen:
 *    const expense = {
 *      id: crypto.randomUUID(),
 *      description,
 *      amount,
 *      category,
 *      paidBy: user.id,  // User-ID des Zahlers
 *      splitBetween: group.members,  // ALLE Gruppenmitglieder automatisch!
 *      date: new Date(),
 *      createdBy: user.id
 *    };
 * 5. Ausgabe zu Gruppe hinzufügen:
 *    const expenses = await kv.get(`group:${groupId}:expenses`) || [];
 *    expenses.push(expense);
 *    await kv.set(`group:${groupId}:expenses`, expenses);
 * 6. Ausgabe zurückgeben
 * 
 * BEISPIEL:
 * Gruppe hat 4 Mitglieder: Anna, Ben, Clara, David
 * Anna fügt Ausgabe "Restaurant" für 80€ hinzu
 * → splitBetween = [Anna-ID, Ben-ID, Clara-ID, David-ID]
 * → Jeder schuldet Anna 20€ (80€ / 4 Personen)
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   expense: { id: "...", description: "...", amount: 80.50, ... }
 * }
 */
app.post("/make-server-1ed4438c/groups/:groupId/expenses", async (c) => {
  try {
    // Später: Access Token, groupId und Daten holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    // const { groupId } = c.req.param();
    // const { description, amount, category, paidBy } = await c.req.json();
    
    // TODO: Hier kommt die Logik zum Hinzufügen einer Ausgabe (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Ausgabe hinzufügen (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Add expense error: ${error}`);
    return c.json({ error: "Fehler beim Hinzufügen der Ausgabe" }, 500);
  }
});

/**
 * GET /groups/:groupId/expenses - AUSGABEN ABRUFEN
 * 
 * Lädt alle Ausgaben einer Gruppe.
 * Nur Mitglieder der Gruppe können die Ausgaben abrufen.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * URL PARAMETER:
 * groupId: string  // ID der Gruppe
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token aus Header und groupId aus URL extrahieren
 * 2. Benutzer authentifizieren (siehe oben)
 * 3. Gruppe laden und prüfen, ob Benutzer Mitglied ist (siehe oben)
 * 4. Ausgaben laden:
 *    const expenses = await kv.get(`group:${groupId}:expenses`) || [];
 * 5. Für jede Ausgabe: Benutzernamen statt IDs zurückgeben
 * 6. Ausgaben sortiert zurückgeben (neueste zuerst)
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   expenses: [
 *     { id: "...", description: "Restaurant", amount: 80.50, paidBy: "Anna", ... },
 *     { id: "...", description: "Taxi", amount: 25.00, paidBy: "Ben", ... }
 *   ]
 * }
 */
app.get("/make-server-1ed4438c/groups/:groupId/expenses", async (c) => {
  try {
    // Später: Access Token und groupId holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    // const { groupId } = c.req.param();
    
    // TODO: Hier kommt die Logik zum Abrufen der Ausgaben (siehe Kommentar oben)
    
    return c.json({ 
      expenses: [],
      message: "Ausgaben laden (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Get expenses error: ${error}`);
    return c.json({ error: "Fehler beim Laden der Ausgaben" }, 500);
  }
});

/**
 * DELETE /groups/:groupId/expenses/:expenseId - AUSGABE LÖSCHEN
 * 
 * Löscht eine Ausgabe aus einer Gruppe.
 * Nur Mitglieder der Gruppe können Ausgaben löschen.
 * 
 * REQUEST HEADER:
 * Authorization: Bearer {accessToken}
 * 
 * URL PARAMETER:
 * groupId: string    // ID der Gruppe
 * expenseId: string  // ID der zu löschenden Ausgabe
 * 
 * SPÄTER ZU IMPLEMENTIEREN:
 * 1. Access Token, groupId und expenseId extrahieren
 * 2. Benutzer authentifizieren (siehe oben)
 * 3. Gruppe laden und prüfen, ob Benutzer Mitglied ist (siehe oben)
 * 4. Ausgaben laden:
 *    const expenses = await kv.get(`group:${groupId}:expenses`) || [];
 * 5. Ausgabe finden und löschen:
 *    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
 *    if (expenses.length === updatedExpenses.length) return 404 "Ausgabe nicht gefunden"
 * 6. Aktualisierte Liste speichern:
 *    await kv.set(`group:${groupId}:expenses`, updatedExpenses);
 * 7. Bestätigung zurückgeben
 * 
 * WICHTIG:
 * Das Löschen einer Ausgabe ändert die Abrechnungen!
 * Das Frontend muss die Balances neu berechnen.
 * 
 * RESPONSE (später):
 * {
 *   success: true,
 *   message: "Ausgabe erfolgreich gelöscht"
 * }
 */
app.delete("/make-server-1ed4438c/groups/:groupId/expenses/:expenseId", async (c) => {
  try {
    // Später: Access Token, groupId und expenseId holen
    // const accessToken = c.req.header('Authorization')?.split(' ')[1];
    // const { groupId, expenseId } = c.req.param();
    
    // TODO: Hier kommt die Logik zum Löschen einer Ausgabe (siehe Kommentar oben)
    
    return c.json({ 
      success: true,
      message: "Ausgabe löschen (Platzhalter - noch keine Logik)" 
    });
  } catch (error) {
    console.log(`Delete expense error: ${error}`);
    return c.json({ error: "Fehler beim Löschen der Ausgabe" }, 500);
  }
});

/**
 * SERVER STARTEN
 * 
 * Startet den Hono-Server mit Deno.serve()
 * Der Server läuft dann als Supabase Edge Function
 * und ist über die Supabase-URL erreichbar.
 */
Deno.serve(app.fetch);
