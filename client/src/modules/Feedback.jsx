// Shows rubric-based feedback and (only if configured on the server) clearly-labelled AI feedback.
import { Badge, Progress } from '../components/ui';

export default function Feedback({ result, modelAnswer }) {
  if (!result) return null;
  const tone = result.score >= 75 ? 'easy' : result.score >= 50 ? 'medium' : 'hard';
  return (
    <div className="stack">
      <div className="row between">
        <div className="row"><span className={`score-pill badge ${tone}`} style={{ fontSize: '1rem' }}>{result.score}/100</span><Badge kind="indigo">Rule-based evaluation</Badge></div>
        <span className="tiny muted">{result.wordCount} words</span>
      </div>
      <div className="grid grid-2" style={{ gap: 10 }}>
        {result.rubric.map((r) => (
          <div key={r.criterion}>
            <div className="row between small"><span>{r.criterion}</span><span className="bold">{r.score}{r.max ? `/${r.max}` : ''}</span></div>
            {r.max > 0 && <Progress value={(r.score / r.max) * 100} />}
          </div>
        ))}
      </div>
      {result.strengths?.length > 0 && <div className="alert alert-success"><div><strong>Strengths</strong><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div></div>}
      {result.improvements?.length > 0 && <div className="alert alert-warn"><div><strong>Improve</strong><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{result.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></div></div>}
      {result.missingKeywords?.length > 0 && <div className="small"><span className="muted">Key ideas to include: </span>{result.missingKeywords.map((k) => <span key={k} className="badge" style={{ marginRight: 4 }}>{k}</span>)}</div>}
      {result.ai && (
        <div className="alert alert-info"><div><Badge kind="violet">AI-generated feedback</Badge><p style={{ margin: '6px 0 0' }}>{result.ai.feedback}</p>{result.ai.followUp && <p style={{ margin: '6px 0 0' }}><strong>Follow-up question:</strong> {result.ai.followUp}</p>}</div></div>
      )}
      {modelAnswer && <details className="qa"><summary>Model answer</summary><div style={{ whiteSpace: 'pre-wrap' }}>{modelAnswer}</div></details>}
      <p className="tiny muted" style={{ margin: 0 }}>How scoring works: content coverage of key ideas (50), depth (20), structure (15) and specific examples/numbers (15), minus a penalty for excessive filler words. The same answer always gets the same score.</p>
    </div>
  );
}
