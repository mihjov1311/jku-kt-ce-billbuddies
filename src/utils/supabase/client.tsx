/**
 * =============================================================================
 * SUPABASE CLIENT - SINGLETON FÜR FRONTEND
 * =============================================================================
 * 
 * Diese Datei erstellt einen wiederverwendbaren Supabase-Client für das Frontend.
 * 
 * WAS IST SUPABASE?
 * Supabase ist eine Backend-Plattform, die Datenbank, Authentication und Storage bereitstellt.
 * 
 * WAS MACHT DIESE DATEI?
 * - Erstellt einen einzigen (Singleton) Supabase-Client, der im gesamten Frontend verwendet wird
 * - Der Client nutzt den ÖFFENTLICHEN Anon-Key (sicher für Frontend-Nutzung)
 * - Wird später für Authentication (Login/Logout) im Frontend verwendet
 * 
 * WICHTIG:
 * - Dieser Client sollte NUR im Frontend (React-Komponenten) verwendet werden
 * - Für Backend-Operationen gibt es einen separaten Client im Server (mit Service Role Key)
 * - Der publicAnonKey ist sicher für Frontend-Nutzung, da er nur begrenzte Rechte hat
 */

import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

// Variable speichert den erstellten Client (wird nur einmal erstellt)
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Gibt den Supabase-Client zurück (Singleton-Muster)
 * 
 * SINGLETON-MUSTER:
 * Stellt sicher, dass nur EINE Instanz des Clients existiert.
 * Beim ersten Aufruf wird der Client erstellt, danach wird immer
 * derselbe Client zurückgegeben.
 * 
 * VERWENDUNG:
 * ```typescript
 * import { getSupabaseClient } from './utils/supabase/client';
 * const supabase = getSupabaseClient();
 * // Jetzt kann man z.B. Auth-Funktionen aufrufen:
 * // await supabase.auth.signInWithPassword(...)
 * ```
 */
export function getSupabaseClient() {
  // Wenn noch kein Client existiert, erstelle einen neuen
  if (!supabaseClient) {
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,  // URL zur Supabase-Instanz
      publicAnonKey                          // Öffentlicher Key (sicher für Frontend)
    );
  }
  // Gebe den existierenden oder neu erstellten Client zurück
  return supabaseClient;
}
