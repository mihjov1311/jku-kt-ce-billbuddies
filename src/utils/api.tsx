/**
 * =============================================================================
 * API-WRAPPER - ZENTRALE SCHNITTSTELLE ZUM BACKEND
 * =============================================================================
 * 
 * Diese Datei definiert alle API-Funktionen, die das Frontend verwenden kann,
 * um mit dem Backend zu kommunizieren.
 * 
 * ARCHITEKTUR:
 * Frontend (React) → api.tsx → Backend Server → Supabase Datenbank
 * 
 * WAS MACHT DIESE DATEI?
 * - Definiert Funktionen für alle Backend-Operationen (Auth, Groups, Expenses)
 * - Kümmert sich um HTTP-Requests (GET, POST, DELETE)
 * - Fügt automatisch Authorization-Header hinzu
 * - Behandelt Fehler zentral
 * 
 * AKTUELLER STATUS:
 * ⚠️ Alle Funktionen sind PLATZHALTER - sie rufen das Backend auf,
 *    aber das Backend hat noch keine Logik implementiert.
 * 
 * VERWENDUNG:
 * ```typescript
 * import { authAPI, groupsAPI, expensesAPI } from './utils/api';
 * 
 * // Beispiel: Benutzer anmelden
 * const result = await authAPI.signin({ username: 'max', password: '12345' });
 * ```
 */

import { projectId, publicAnonKey } from "./supabase/info";

/**
 * BASIS-URL FÜR ALLE API-AUFRUFE
 * 
 * Alle API-Endpunkte beginnen mit dieser URL.
 * Format: https://{projektId}.supabase.co/functions/v1/make-server-1ed4438c
 * 
 * Beispiel kompletter Endpunkt:
 * https://gwpsblqhcbwegjydhxfh.supabase.co/functions/v1/make-server-1ed4438c/auth/signin
 */
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1ed4438c`;

/**
 * HILFSFUNKTION FÜR API-AUFRUFE
 * 
 * Diese zentrale Funktion wird von allen API-Funktionen verwendet.
 * Sie kümmert sich um:
 * - Hinzufügen von Headers (Content-Type, Authorization)
 * - Senden des HTTP-Requests
 * - Fehlerbehandlung
 * - JSON-Parsing der Antwort
 * 
 * PARAMETER:
 * @param endpoint - Der Endpunkt relativ zur BASE_URL (z.B. "/auth/signin")
 * @param options - Fetch-Optionen (method, body, headers, etc.)
 * @param accessToken - (Optional) JWT Access Token für authentifizierte Requests
 * 
 * AUTHORIZATION:
 * - Wenn accessToken vorhanden → verwendet diesen (für angemeldete Benutzer)
 * - Sonst → verwendet publicAnonKey (für öffentliche Endpunkte wie Registrierung)
 * 
 * FEHLERBEHANDLUNG:
 * Wirft einen Error, wenn die API einen Fehler zurückgibt (z.B. 400, 500)
 */
async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
) {
  // HTTP-Headers zusammenstellen
  const headers: HeadersInit = {
    "Content-Type": "application/json",  // Wir senden JSON-Daten
    Authorization: `Bearer ${accessToken || publicAnonKey}`,  // Auth-Header
    ...options.headers,  // Zusätzliche Headers übernehmen
  };

  // HTTP-Request an Backend senden
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Fehlerbehandlung: Wenn Response nicht OK (Status 200-299)
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API-Fehler");
  }

  // Response als JSON parsen und zurückgeben
  return response.json();
}

// ============================================
// AUTH API - AUTHENTIFIZIERUNGS-FUNKTIONEN
// ============================================
// 
// Diese Funktionen ermöglichen:
// - Registrierung neuer Benutzer
// - Anmeldung existierender Benutzer  
// - Abmeldung
//
// ⚠️ STATUS: PLATZHALTER - Backend hat noch keine Logik
// ============================================

export const authAPI = {
  /**
   * BENUTZER REGISTRIEREN
   * 
   * Erstellt einen neuen Benutzer-Account.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Daten an Backend
   * 2. Backend erstellt Benutzer in Supabase Auth
   * 3. Backend speichert zusätzliche Daten (firstName, lastName, username) in KV-Store
   * 4. Backend gibt Access Token zurück
   * 
   * @param data - Registrierungsdaten (Vorname, Nachname, E-Mail, Benutzername, Passwort)
   * @returns Promise mit Registrierungsergebnis
   */
  async signup(data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }) {
    return apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * BENUTZER ANMELDEN
   * 
   * Meldet einen Benutzer mit Benutzername und Passwort an.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Benutzername + Passwort
   * 2. Backend findet E-Mail für Benutzername (aus KV-Store)
   * 3. Backend meldet mit E-Mail + Passwort bei Supabase Auth an
   * 4. Backend gibt Access Token zurück
   * 5. Frontend speichert Token für weitere Requests
   * 
   * @param data - Anmeldedaten (Benutzername, Passwort)
   * @returns Promise mit Access Token und Benutzerdaten
   */
  async signin(data: { username: string; password: string }) {
    return apiCall("/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * BENUTZER ABMELDEN
   * 
   * Meldet den aktuellen Benutzer ab.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Access Token
   * 2. Backend beendet Session bei Supabase Auth
   * 3. Frontend löscht gespeicherten Token
   * 
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit Abmeldungsergebnis
   */
  async signout(accessToken: string) {
    return apiCall("/auth/signout", {
      method: "POST",
    }, accessToken);
  },
};

// ============================================
// GROUPS API - GRUPPENVERWALTUNGS-FUNKTIONEN
// ============================================
//
// Diese Funktionen ermöglichen:
// - Erstellen neuer Gruppen
// - Beitreten zu existierenden Gruppen (via 6-stelligem Code)
// - Abrufen aller Gruppen eines Benutzers
//
// ⚠️ STATUS: PLATZHALTER - Backend hat noch keine Logik
// ============================================

export const groupsAPI = {
  /**
   * NEUE GRUPPE ERSTELLEN
   * 
   * Erstellt eine neue Gruppe mit einem zufälligen 6-stelligen Code.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Gruppennamen + Access Token
   * 2. Backend überprüft Authentifizierung
   * 3. Backend generiert 6-stelligen Code (z.B. "A8F2K9")
   * 4. Backend speichert Gruppe in KV-Store mit:
   *    - Gruppen-ID (eindeutig)
   *    - Name
   *    - Code (6-stellig)
   *    - Mitglieder (zunächst nur Ersteller)
   *    - Erstellungsdatum
   * 5. Backend gibt Gruppe mit Code zurück
   * 
   * @param name - Name der Gruppe (z.B. "Urlaub Italien 2025")
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit erstellter Gruppe inkl. Code
   */
  async create(name: string, accessToken: string) {
    return apiCall("/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    }, accessToken);
  },

  /**
   * GRUPPE BEITRETEN
   * 
   * Tritt einer existierenden Gruppe über einen 6-stelligen Code bei.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Code + Access Token
   * 2. Backend überprüft Authentifizierung
   * 3. Backend sucht Gruppe mit diesem Code in KV-Store
   * 4. Backend fügt Benutzer zu Gruppenmitgliedern hinzu
   * 5. Backend gibt Gruppendaten zurück
   * 
   * WICHTIG:
   * - Benutzer können NUR über Code beitreten (kein manuelles Hinzufügen)
   * - Ein Benutzer kann mehreren Gruppen angehören
   * 
   * @param code - 6-stelliger Gruppen-Code (z.B. "A8F2K9")
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit Gruppendaten
   */
  async join(code: string, accessToken: string) {
    return apiCall("/groups/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }, accessToken);
  },

  /**
   * ALLE GRUPPEN DES BENUTZERS ABRUFEN
   * 
   * Lädt alle Gruppen, in denen der Benutzer Mitglied ist.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Access Token
   * 2. Backend überprüft Authentifizierung
   * 3. Backend sucht alle Gruppen, in denen Benutzer Mitglied ist
   * 4. Backend gibt Liste aller Gruppen zurück
   * 
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit Array aller Gruppen
   */
  async list(accessToken: string) {
    return apiCall("/groups", {
      method: "GET",
    }, accessToken);
  },
};

// ============================================
// EXPENSES API - AUSGABENVERWALTUNGS-FUNKTIONEN
// ============================================
//
// Diese Funktionen ermöglichen:
// - Hinzufügen neuer Ausgaben zu einer Gruppe
// - Abrufen aller Ausgaben einer Gruppe
// - Löschen von Ausgaben
//
// WICHTIG: Ausgaben werden AUTOMATISCH gleichmäßig auf
// alle Gruppenmitglieder aufgeteilt (keine manuelle Auswahl)
//
// ⚠️ STATUS: PLATZHALTER - Backend hat noch keine Logik
// ============================================

export const expensesAPI = {
  /**
   * NEUE AUSGABE HINZUFÜGEN
   * 
   * Fügt einer Gruppe eine neue Ausgabe hinzu.
   * Die Ausgabe wird automatisch gleichmäßig auf alle Gruppenmitglieder aufgeteilt.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Ausgabendaten + Access Token
   * 2. Backend überprüft Authentifizierung
   * 3. Backend überprüft, ob Benutzer Mitglied der Gruppe ist
   * 4. Backend holt alle Gruppenmitglieder
   * 5. Backend speichert Ausgabe mit:
   *    - Beschreibung (z.B. "Abendessen")
   *    - Betrag (z.B. 60.00)
   *    - Kategorie (z.B. "Essen & Trinken")
   *    - Bezahlt von (Benutzername)
   *    - Aufgeteilt zwischen (ALLE Gruppenmitglieder automatisch)
   *    - Datum
   * 6. Backend gibt gespeicherte Ausgabe zurück
   * 
   * BEISPIEL:
   * Gruppe hat 4 Mitglieder: Anna, Ben, Clara, David
   * Anna fügt Ausgabe "Restaurant" für 80€ hinzu
   * → Jeder schuldet Anna 20€ (80€ / 4 Personen)
   * 
   * @param groupId - ID der Gruppe
   * @param data - Ausgabendaten (Beschreibung, Betrag, Kategorie, Zahler)
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit gespeicherter Ausgabe
   */
  async add(
    groupId: string,
    data: {
      description: string;
      amount: number;
      category?: string;
      paidBy: string;
    },
    accessToken: string
  ) {
    return apiCall(`/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    }, accessToken);
  },

  /**
   * ALLE AUSGABEN EINER GRUPPE ABRUFEN
   * 
   * Lädt alle Ausgaben einer Gruppe.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Gruppen-ID + Access Token
   * 2. Backend überprüft Authentifizierung
   * 3. Backend überprüft, ob Benutzer Mitglied der Gruppe ist
   * 4. Backend lädt alle Ausgaben der Gruppe aus KV-Store
   * 5. Backend gibt Liste aller Ausgaben zurück
   * 
   * @param groupId - ID der Gruppe
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit Array aller Ausgaben
   */
  async list(groupId: string, accessToken: string) {
    return apiCall(`/groups/${groupId}/expenses`, {
      method: "GET",
    }, accessToken);
  },

  /**
   * AUSGABE LÖSCHEN
   * 
   * Löscht eine Ausgabe aus einer Gruppe.
   * 
   * ABLAUF (später implementiert):
   * 1. Frontend sendet Gruppen-ID + Ausgaben-ID + Access Token
   * 2. Backend überprüft Authentifizierung
   * 3. Backend überprüft, ob Benutzer Mitglied der Gruppe ist
   * 4. Backend löscht Ausgabe aus KV-Store
   * 5. Backend gibt Bestätigung zurück
   * 
   * WICHTIG:
   * - Nur Mitglieder der Gruppe können Ausgaben löschen
   * - Das Löschen einer Ausgabe ändert die Abrechnungen
   * 
   * @param groupId - ID der Gruppe
   * @param expenseId - ID der zu löschenden Ausgabe
   * @param accessToken - JWT Token des angemeldeten Benutzers
   * @returns Promise mit Löschbestätigung
   */
  async delete(groupId: string, expenseId: string, accessToken: string) {
    return apiCall(`/groups/${groupId}/expenses/${expenseId}`, {
      method: "DELETE",
    }, accessToken);
  },
};
