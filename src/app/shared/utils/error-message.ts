/**
 * Extracts a human-readable message from an unknown thrown value. Handles native
 * Errors and object-shaped errors (e.g. Supabase's PostgrestError, which is a
 * plain object with a `message` property, not an `Error` instance).
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}
