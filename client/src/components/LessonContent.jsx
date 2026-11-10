// Renders the structured lesson JSON (explanation, formulas, code in 3 languages, interview Q&A ...).
import { useState } from 'react';

const LANG_LABEL = { java: 'Java', python: 'Python', c: 'C' };

export function CodeTabs({ code, preferred }) {
  const langs = ['java', 'python', 'c', ...Object.keys(code || {})].filter((l, i, a) => code?.[l] && a.indexOf(l) === i);
  const [lang, setLang] = useState(langs.includes(preferred) ? preferred : langs[0]);
  if (!langs.length) return null;
  return (
    <div>
      {langs.length > 1 && (
        <div className="code-tabs">
          {langs.map((l) => <button key={l} className={`chip ${l === lang ? 'active' : ''}`} onClick={() => setLang(l)}>{LANG_LABEL[l] || l}</button>)}
        </div>
      )}
      <pre className="code"><code>{code[lang]}</code></pre>
    </div>
  );
}

const Section = ({ title, children }) => <section className="mb"><h3>{title}</h3>{children}</section>;
const Bullets = ({ items }) => <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

export default function LessonContent({ content, preferredLanguage }) {
  const c = content || {};
  return (
    <div className="prose">
      {c.explanation && <Section title="Explanation"><p>{c.explanation}</p></Section>}
      {c.complexity && <Section title="Complexity"><p className="mono small">{c.complexity}</p></Section>}
      {c.key_points && <Section title="Key points"><Bullets items={c.key_points} /></Section>}
      {c.formulas && <Section title="Formulas"><Bullets items={c.formulas} /></Section>}
      {c.syntax && <Section title="Syntax"><pre className="code"><code>{c.syntax}</code></pre></Section>}
      {c.shortcuts && <Section title="Shortcuts & tricks"><Bullets items={c.shortcuts} /></Section>}
      {c.tips && <Section title="Tips"><Bullets items={c.tips} /></Section>}
      {c.code && <Section title={Object.keys(c.code).length > 1 ? 'Code in Java, Python and C' : 'Example program'}><CodeTabs code={c.code} preferred={preferredLanguage} /></Section>}
      {c.example && <Section title="Example"><pre className="code" style={{ whiteSpace: 'pre-wrap' }}><code>{c.example}</code></pre></Section>}
      {c.solved_examples && (
        <Section title="Solved examples">
          {c.solved_examples.map((e, i) => (
            <div key={i} className="card mb" style={{ padding: 14, background: '#fafbfe' }}>
              <div className="bold">Q{i + 1}. {e.question}</div>
              <div className="mt" style={{ marginTop: 6 }}><span className="badge teal">Solution</span> {e.solution}</div>
            </div>
          ))}
        </Section>
      )}
      {c.word_list && (
        <Section title="Word list">
          <div className="table-wrap"><table className="table"><thead><tr><th>Word</th><th>Meaning</th><th>Synonym</th><th>Antonym</th></tr></thead>
            <tbody>{c.word_list.map((w) => <tr key={w.word}><td className="bold">{w.word}</td><td>{w.meaning}</td><td>{w.synonym}</td><td>{w.antonym}</td></tr>)}</tbody></table></div>
        </Section>
      )}
      {c.applications && <Section title="Real-world applications"><Bullets items={c.applications} /></Section>}
      {c.interview_questions && (
        <Section title="Interview questions">
          {c.interview_questions.map((q, i) => <details key={i} className="qa"><summary>{q.question}</summary><div>{q.answer}</div></details>)}
        </Section>
      )}
      {c.practice && <Section title="Practice"><Bullets items={c.practice} /></Section>}
      {c.practice_note && <p className="muted small">{c.practice_note}</p>}
      {preferredLanguage && c.syntax_language && c.syntax_language !== preferredLanguage && (
        <p className="muted small">Tip: you selected {LANG_LABEL[preferredLanguage]} as your main language — the same topic is available in the {LANG_LABEL[preferredLanguage]} path.</p>
      )}
    </div>
  );
}
