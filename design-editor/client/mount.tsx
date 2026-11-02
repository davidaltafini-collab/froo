import { createRoot } from 'react-dom/client';
import { Overlay } from './Overlay';

let mounted = false;

export function mountDesignEditor() {
  if (mounted) return;
  mounted = true;
  const host = document.createElement('div');
  host.id = 'design-editor-root';
  document.body.appendChild(host);
  createRoot(host).render(<Overlay />);
}
