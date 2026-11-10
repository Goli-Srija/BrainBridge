import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Async, PageHead, fmtDateTime, useToast } from '../components/ui';
import Feedback from '../modules/Feedback';

export default function Exercise() {
  const { slug } = useParams();
  const state = useApi(`/communication/exercises/${slug}`);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = async () => {
    if (words < 10) return toast('Please write at least 10 words.', 'error');
    setBusy(true);
    try {
      const r = await api.post(`/communication/exercises/${slug}/submit`, { response: text });
      setResult(r);
      toast(`Scored ${r.score}/100`);
      state.reload();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead back={{ to: '/communication', label: 'Communication' }} title={d.exercise.title} subtitle={d.exercise.prompt} />
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="card stack">
              <div className="alert alert-info"><div><strong>How to answer: </strong>{d.exercise.guidance}</div></div>
              <textarea className="textarea" style={{ minHeight: 260 }} placeholder="Type your answer here (you can also say it aloud first, then write it)..." value={text} onChange={(e) => setText(e.target.value)} />
              <div className="row between"><span className="small muted">{words} words · aim for {d.exercise.min_words}+</span><button className="btn" disabled={busy} onClick={submit}>{busy ? 'Evaluating...' : 'Submit for feedback'}</button></div>
            </div>
            <div className="card">
              {result ? <Feedback result={result.feedback} modelAnswer={result.modelAnswer} /> : (
                <div className="center-state" style={{ padding: 20 }}><h3>Feedback appears here</h3><p>Your answer is scored with a transparent rubric. The model answer is revealed after you submit.</p></div>
              )}
            </div>
          </div>
          {d.attempts.length > 0 && (
            <div className="card mt">
              <h3>Previous attempts</h3>
              <div className="list">{d.attempts.map((a) => (
                <details key={a.id} className="qa"><summary><span>{fmtDateTime(a.created_at)}</span><span className="badge indigo">{a.score}/100</span></summary><div style={{ whiteSpace: 'pre-wrap' }}>{a.response}</div></details>
              ))}</div>
            </div>
          )}
        </>
      )}
    </Async>
  );
}
