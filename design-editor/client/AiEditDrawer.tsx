import React from 'react';
import { Check, Copy, Sparkles, X } from 'lucide-react';
import { queryByVleId } from './dom-utils';
import { classifyElement, layoutKindLabel } from './layout-classifier';
import { sendSelectionContext } from './selection-context';
import { useDesignModeStore } from './store';

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export function AiEditDrawer({ selectedId, onClose }: { selectedId: string; onClose: () => void }) {
  const state = useDesignModeStore();
  const [prompt, setPrompt] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const selected = queryByVleId(selectedId);
  if (!selected) return null;
  const classification = classifyElement(selected, state.layoutOverrides[selectedId] ?? 'auto');
  const label = (selected.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 42) || selected.tagName.toLowerCase();

  const prepare = async (shouldCopy: boolean) => {
    if (shouldCopy && !prompt.trim()) {
      setStatus('Describe the change you want first.');
      return;
    }
    setBusy(true);
    setCopied(false);
    setStatus('Capturing exact element and source context...');
    try {
      const result = await sendSelectionContext(selectedId, prompt);
      if (!result.ok || !result.path) throw new Error(result.error ?? 'Could not create selection context');
      if (shouldCopy) {
        const request = [
          `Edit the exact design-editor selection described in \`${result.path}\`.`,
          `User request: ${prompt.trim()}`,
          'Read the context bundle before changing code. Preserve behavior, event handlers, accessibility semantics, and layout flow unless the request explicitly requires otherwise.',
          'After editing, run the relevant tests and typecheck, then summarize the visual and source changes.',
        ].join('\n\n');
        await copyText(request);
        setCopied(true);
        setStatus(`Codex request copied. Context: ${result.path}`);
      } else {
        setStatus(`Exact context saved to ${result.path}`);
      }
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2147483003]" role="dialog" aria-modal="true" aria-label="Edit selected element with AI">
      <button className="absolute inset-0 bg-slate-950/12 backdrop-blur-[1px]" onClick={onClose} aria-label="Close AI editor" />
      <div className="absolute bottom-3 right-3 top-3 flex w-[390px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sparkles size={15} strokeWidth={2} className="text-green-600" />
              Edit with AI
            </div>
            <p className="mt-1 truncate text-[11px] text-slate-500" title={label}>Selected: {label}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-[0.96]" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[10px] text-slate-500" title={selectedId}>{selectedId}</span>
              <span className="shrink-0 rounded-md bg-white px-1.5 py-1 text-[9px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                {layoutKindLabel(classification.kind)}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Source, selected rectangle, parent, children, siblings, computed layout, route, and viewport will be captured together.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <label className="text-xs font-bold text-slate-700" htmlFor="design-ai-prompt">What should change?</label>
          <textarea
            id="design-ai-prompt"
            autoFocus
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setCopied(false);
              setStatus(null);
            }}
            placeholder="For example: align this with the card title, use the same left padding, and keep its click action unchanged."
            className="mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-350 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.12)]"
          />

          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">
            This first integration prepares an exact Codex request. It does not send code or credentials to an unrelated browser chat.
          </div>

          {status && (
            <div className={`mt-3 rounded-lg px-3 py-2 text-[10px] leading-relaxed ${copied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {status}
            </div>
          )}
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-slate-100 p-4">
          <button
            onClick={() => void prepare(false)}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
          >
            Save context
          </button>
          <button
            onClick={() => void prepare(true)}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {busy ? 'Preparing...' : copied ? 'Request copied' : 'Copy Codex request'}
          </button>
        </div>
      </div>
    </div>
  );
}

