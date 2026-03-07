/**
 * Input shape for person display (e.g. profile or member with first_name, last_name, email).
 * Use id or user_id as fallback when no name/email.
 */
export type PersonDisplayInput = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  id?: string | null;
  user_id?: string | null;
};

/**
 * Build a display label from first name, last name, email, or id/user_id fallback.
 * Use across the project wherever we show a person's name (profiles, members, creators, leads).
 */
export function getPersonDisplayName(person: PersonDisplayInput | null | undefined): string | null {
  if (!person) return null;
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (person.email?.trim()) return person.email.trim();
  if (person.id?.trim()) return person.id.trim();
  if (person.user_id?.trim()) return person.user_id.trim();
  return null;
}

/** Lead-shaped input (first_name, last_name). */
export type LeadDisplayInput = {
  first_name?: string | null;
  last_name?: string | null;
};

/** Display name for a lead (first + last). Use in tables, headers, activity text. */
export function getLeadDisplayName(lead: LeadDisplayInput | null | undefined): string {
  const name = getPersonDisplayName(lead ?? undefined);
  return name?.trim() || "—";
}
