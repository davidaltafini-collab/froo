import type { PendingEdit, SaveResponseBody } from '../shared-types';
import { clearAllPending, getPendingEdits } from './store';

export interface SaveOutcome {
  ok: boolean;
  results: { id: string; ok: boolean; error?: string }[];
}

export async function saveDesignModeEdits(onlyEdits?: PendingEdit[]): Promise<SaveOutcome> {
  const edits = onlyEdits ?? getPendingEdits();
  if (!edits.length) return { ok: true, results: [] };

  let res: Response;
  try {
    res = await fetch('/__design-mode/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edits }),
    });
  } catch (err) {
    return { ok: false, results: edits.map((e) => ({ id: e.id, ok: false, error: (err as Error).message })) };
  }

  if (!res.ok) {
    return { ok: false, results: edits.map((e) => ({ id: e.id, ok: false, error: `save request failed (${res.status})` })) };
  }

  const body = (await res.json()) as SaveResponseBody;
  const allOk = body.results.length > 0 && body.results.every((r) => r.ok);
  if (allOk) {
    clearAllPending();
    window.location.reload();
  }
  return { ok: allOk, results: body.results };
}
