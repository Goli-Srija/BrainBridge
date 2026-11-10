// Code editor: Monaco (the VS Code editor) when it can load, with a plain-text fallback.
// Monaco is loaded from a CDN by @monaco-editor/react, so it needs internet; the fallback always works.
import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

const MONACO_LANG = { java: 'java', python: 'python', c: 'c' };

function getPref() { try { return localStorage.getItem('bb_editor') || 'monaco'; } catch { return 'monaco'; } }

export default function CodeEditor({ language, value, onChange, height = 440 }) {
  const [mode, setMode] = useState(getPref());
  const [failed, setFailed] = useState(false);

  // If Monaco has not mounted within 10 s (e.g. offline), switch to the simple editor.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (mode !== 'monaco' || mounted) return undefined;
    const t = setTimeout(() => { if (!mounted) setFailed(true); }, 10000);
    return () => clearTimeout(t);
  }, [mode, mounted]);

  const switchMode = (m) => { setMode(m); try { localStorage.setItem('bb_editor', m); } catch { /* ignore */ } };
  const useSimple = mode === 'simple' || failed;

  const onKeyDown = (e) => { // Tab inserts 4 spaces in the simple editor
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target; const s = el.selectionStart;
      const next = value.slice(0, s) + '    ' + value.slice(el.selectionEnd);
      onChange(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  };

  return (
    <div>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="tiny muted">{useSimple ? (failed ? 'Simple editor (Monaco could not load — check internet)' : 'Simple editor') : 'Monaco editor'}</span>
        <button className="link-btn tiny" onClick={() => { setFailed(false); switchMode(useSimple ? 'monaco' : 'simple'); }}>{useSimple ? 'Use Monaco editor' : 'Use simple editor'}</button>
      </div>
      <div className="editor-box">
        {useSimple ? (
          <textarea className="editor-textarea" style={{ height }} spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} aria-label="Code editor" />
        ) : (
          <Editor height={height} theme="vs-dark" language={MONACO_LANG[language]} value={value} onChange={(v) => onChange(v ?? '')}
            onMount={() => setMounted(true)} loading={<div style={{ color: '#cbd5e1', padding: 16 }}>Loading editor...</div>}
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, automaticLayout: true }} />
        )}
      </div>
    </div>
  );
}
