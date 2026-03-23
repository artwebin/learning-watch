import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kfitcikuisbdtlizeqpv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaXRjaWt1aXNiZHRsaXplcXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDI5NDEsImV4cCI6MjA4OTg3ODk0MX0.a00vTecPfb80XjMaR9qnfFZPp3l3JyQgVFlQPmmIY-c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface StudentRow {
  id: string;
  name: string;
  name_lower: string;
  password_hash: string;
  max_unlocked_phase: number;
  current_phase: number;
  score: number;
  level: number;
  phase_wins: Record<string, number>;
  speedrun_highscore: number;
  updated_at: string;
}

/** SHA-256 hash via Web Crypto API (no external deps) */
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Register a brand-new student. Returns:
 *  - { ok: true, student }  – success
 *  - { ok: false, taken: true, suggestions }  – name already exists
 */
export async function registerStudent(
  name: string,
  password: string
): Promise<
  | { ok: true; student: StudentRow }
  | { ok: false; taken: true; suggestions: string[] }
> {
  const trimmed = name.trim();
  const pwHash = await hashPassword(password);

  // Check if name already exists
  const { data: existing } = await supabase
    .from('students')
    .select('name')
    .eq('name_lower', trimmed.toLowerCase())
    .maybeSingle();

  if (existing) {
    // Generate name suggestions
    const suggestions: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const candidate = `${trimmed}${i}`;
      const { data: taken } = await supabase
        .from('students')
        .select('name')
        .eq('name_lower', candidate.toLowerCase())
        .maybeSingle();
      if (!taken) suggestions.push(candidate);
      if (suggestions.length >= 3) break;
    }
    return { ok: false, taken: true, suggestions };
  }

  // Create the student
  const { data, error } = await supabase
    .from('students')
    .insert({ name: trimmed, password_hash: pwHash })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create student');
  }
  return { ok: true, student: data as StudentRow };
}

/** Login: verify name + password. Returns:
 *  - { ok: true, student }       – credentials correct
 *  - { ok: false, reason: 'not_found' }   – name doesn't exist
 *  - { ok: false, reason: 'wrong_password' } – wrong password
 */
export async function loginStudent(
  name: string,
  password: string
): Promise<
  | { ok: true; student: StudentRow }
  | { ok: false; reason: 'not_found' | 'wrong_password' }
> {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('name_lower', name.trim().toLowerCase())
    .maybeSingle();

  if (!data) return { ok: false, reason: 'not_found' };

  const pwHash = await hashPassword(password);
  if (data.password_hash !== pwHash) return { ok: false, reason: 'wrong_password' };

  return { ok: true, student: data as StudentRow };
}

/** Save progress for an existing student */
export async function saveStudent(
  name: string,
  progress: Omit<StudentRow, 'id' | 'name' | 'name_lower' | 'password_hash' | 'updated_at'>
): Promise<void> {
  await supabase
    .from('students')
    .update(progress)
    .eq('name_lower', name.trim().toLowerCase());
}
