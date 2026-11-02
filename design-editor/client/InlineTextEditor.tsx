import React from 'react';
import { canEditDirectText, getEditableDirectTextNode, queryByVleId } from './dom-utils';
import { setInlineEditing, stageText, useDesignModeStore } from './store';

function EditingHint() {
  return (
    <div className="fixed left-1/2 top-3 z-[2147483002] -translate-x-1/2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-lg">
      Editing text · Enter to apply · Escape to cancel
    </div>
  );
}

function PlainInlineTextEditor({ id, el, textNode }: { id: string; el: HTMLElement; textNode: Text }) {
  React.useEffect(() => {
    const originalText = textNode.nodeValue ?? '';
    const previous = {
      contentEditable: el.getAttribute('contenteditable'),
      spellcheck: el.getAttribute('spellcheck'),
      cursor: el.style.cursor,
      outline: el.style.outline,
      outlineOffset: el.style.outlineOffset,
      userSelect: el.style.userSelect,
    };
    let finished = false;

    const restoreEditingChrome = () => {
      if (previous.contentEditable == null) el.removeAttribute('contenteditable');
      else el.setAttribute('contenteditable', previous.contentEditable);
      if (previous.spellcheck == null) el.removeAttribute('spellcheck');
      else el.setAttribute('spellcheck', previous.spellcheck);
      el.style.cursor = previous.cursor;
      el.style.outline = previous.outline;
      el.style.outlineOffset = previous.outlineOffset;
      el.style.userSelect = previous.userSelect;
      delete el.dataset.vleInlineEditing;
    };

    const selectText = () => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textNode);
      selection?.removeAllRanges();
      selection?.addRange(range);
    };

    const finish = (cancel: boolean) => {
      if (finished) return;
      finished = true;
      const nextText = textNode.nodeValue ?? '';
      if (cancel) textNode.nodeValue = originalText;
      restoreEditingChrome();
      if (!cancel && nextText !== originalText) stageText(id, nextText);
      setInlineEditing(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        event.stopPropagation();
        selectText();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    };

    el.dataset.vleInlineEditing = 'true';
    el.setAttribute('contenteditable', 'plaintext-only');
    el.setAttribute('spellcheck', 'true');
    el.style.cursor = 'text';
    el.style.userSelect = 'text';
    el.style.outline = '2px solid #16a34a';
    el.style.outlineOffset = '3px';
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('blur', () => finish(false), { once: true });
    el.focus({ preventScroll: true });
    selectText();

    return () => {
      el.removeEventListener('keydown', onKeyDown);
      if (!finished) textNode.nodeValue = originalText;
      restoreEditingChrome();
    };
  }, [el, id, textNode]);

  return null;
}

function MixedInlineTextEditor({ id, el, textNode }: { id: string; el: HTMLElement; textNode: Text }) {
  const originalText = React.useRef(textNode.nodeValue ?? '');
  const finished = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = React.useState(originalText.current);
  const [, forceMeasure] = React.useState(0);

  const range = document.createRange();
  range.selectNodeContents(textNode);
  const rect = range.getBoundingClientRect();
  const computed = getComputedStyle(el);

  React.useEffect(() => {
    const input = inputRef.current;
    input?.focus({ preventScroll: true });
    input?.select();
    let raf = 0;
    const measure = () => {
      forceMeasure((value) => (value + 1) % 1_000_000);
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(raf);
      if (!finished.current) textNode.nodeValue = originalText.current;
    };
  }, [textNode]);

  const finish = (cancel: boolean) => {
    if (finished.current) return;
    finished.current = true;
    if (cancel) {
      textNode.nodeValue = originalText.current;
    } else if (draft !== originalText.current) {
      textNode.nodeValue = draft;
      stageText(id, draft);
    }
    setInlineEditing(null);
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      aria-label="Edit selected text on canvas"
      onChange={(event) => {
        setDraft(event.target.value);
        textNode.nodeValue = event.target.value;
      }}
      onBlur={() => finish(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish(true);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          finish(false);
        }
      }}
      style={{
        position: 'fixed',
        zIndex: 2147483002,
        left: rect.left - 4,
        top: rect.top - 3,
        width: Math.max(120, Math.min(window.innerWidth - rect.left - 12, Math.max(rect.width + 18, draft.length * 10))),
        height: Math.max(28, rect.height + 6),
        border: '2px solid #16a34a',
        borderRadius: 5,
        outline: 'none',
        background: '#fff',
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
        padding: '1px 4px',
        boxShadow: '0 6px 20px rgba(15,23,42,0.14)',
      }}
    />
  );
}

export function InlineTextEditor() {
  const state = useDesignModeStore();
  const editingId = state.inlineEditingId;
  if (!state.active || !editingId) return null;

  const el = queryByVleId(editingId);
  const textNode = el ? getEditableDirectTextNode(el) : null;
  if (!el || !textNode || !canEditDirectText(el)) return null;
  const mixed = el.children.length > 0;

  return (
    <>
      {mixed
        ? <MixedInlineTextEditor key={editingId} id={editingId} el={el} textNode={textNode} />
        : <PlainInlineTextEditor key={editingId} id={editingId} el={el} textNode={textNode} />}
      <EditingHint />
    </>
  );
}
