/** Browser file helpers used by export, import, and backup flows. */

/** Refuse to read anything larger than this from the user's disk. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function downloadTextFile(
  filename: string,
  text: string,
  mimeType = 'application/json',
): void {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Turns a set title into a safe filename (never trust pasted text). */
export function sanitizeFilename(title: string): string {
  const cleaned = title
    .normalize('NFKC')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  return cleaned.length > 0 ? cleaned : 'quizeasy-set';
}

export async function readTextFile(
  file: File,
  maxBytes: number = MAX_IMPORT_BYTES,
): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `That file is larger than ${Math.round(
        maxBytes / (1024 * 1024),
      )} MB. Quizeasy only reads reasonably sized JSON exports.`,
    };
  }
  try {
    const text = await file.text();
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      message: 'Quizeasy could not read that file. Try choosing it again.',
    };
  }
}

export function parseJson(
  text: string,
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (text.trim().length === 0) {
    return { ok: false, message: 'That file is empty.' };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      message:
        'That file is not valid JSON. Choose a file exported from Quizeasy.',
    };
  }
}

/** Formats a byte count for the settings screen. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
