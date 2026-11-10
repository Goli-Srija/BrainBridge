import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Async, Badge, PageHead, Progress, Ring, useToast } from '../components/ui';
import Feedback from '../modules/Feedback';

const STAGE_LABEL = { intro: 'Introduction', technical: 'Technical', coding: 'Coding', project: 'Project', hr: 'HR' };

function Report({ report, track }) {
  return (
    <div className="stack">
      <div className="grid grid-3">
        <div className="card" style={{ display: 'grid', placeItems: 'center' }}><Ring value={report.overall} label="overall" /></div>
        <div className="card span-2">
          <h3>Final report — {track}</h3>
          <p className="bold">{report.verdict}</p>
          <p className="small muted">Answered {report.answered}/{report.total} questions. Strongest round: <strong>{STAGE_LABEL[report.strongest]}</strong>. Needs work: <strong>{STAGE_LABEL[report.weakest]}</strong>.</p>
          <p className="tiny muted">{report.note}</p>
        </div>
      </div>
      <div className="card">
        <h3>Round-wise scores</h3>
        {report.byStage.map((s) => (
          <div key={s.stage} className="mb"><div className="row between small"><span>{STAGE_LABEL[s.stage]} ({s.answered}/{s.questions} answered)</span><span className="bold">{s.score}/100</span></div><Progress value={s.score} /></div>
        ))}
      </div>
      {report.topicsToRevise.length > 0 && (
        <div className="card"><h3>Topics to revise</h3><div className="row" style={{ gap: 6 }}>{report.topicsToRevise.map((t) => <span key={t} className="badge">{t}</span>)}</div></div>
      )}
    </div>
  );
}

export default function MockSession() {
  const { id } = useParams();
  const state = useApi(`/mock/${id}`);
  const toast = useToast();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!state.data) return;
    const a = {}, f = {};
    state.data.responses.forEach((r) => { a[r.question_id] = r.answer; f[r.question_id] = r.feedback; });
    setAnswers(a); setFeedback(f);
    if (state.data.interview.status === 'completed') setReport(state.data.interview.report);
    else { const first = state.data.questions.findIndex((q) => !a[q.id]); setIdx(first === -1 ? state.data.questions.length - 1 : first); }
  }, [state.data]);

  const submitAnswer = async (q) => {
    setBusy(true);
    try {
      const r = await api.post(`/mock/${id}/answer`, { question_id: q.id, answer: answers[q.id] || '' });
      setFeedback((f) => ({ ...f, [q.id]: r.feedback }));
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const finish = async () => {
    const answered = Object.keys(feedback).length;
    if (answered < state.data.questions.length && !window.confirm(`You answered ${answered}/${state.data.questions.length}. Unanswered questions score 0. Finish now?`)) return;
    setBusy(true);
    try { const r = await api.post(`/mock/${id}/finish`); setReport(r.report); window.scrollTo(0, 0); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Async state={state}>
      {(d) => {
        const q = d.questions[idx];
        if (report) return (<><PageHead back={{ to: '/mock-interviews', label: 'Mock interviews' }} title={`${d.track.name} — Interview ${d.interview.set_no}`} /><Report report={report} track={d.track.name} /><div className="row mt"><Link className="btn" to="/mock-interviews">Back to tracks</Link></div></>);
        return (
          <>
            <PageHead back={{ to: '/mock-interviews', label: 'Mock interviews' }} title={`${d.track.name} — Interview ${d.interview.set_no}`} subtitle="Answer as you would speak in a real interview. Each answer is evaluated immediately." />
            <div className="row mb" style={{ gap: 6 }}>
              {d.questions.map((qq, i) => <button key={qq.id} className={`chip ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}>{i + 1}. {STAGE_LABEL[qq.category]}{feedback[qq.id] ? ' ✓' : ''}</button>)}
            </div>
            <div className="grid grid-2" style={{ alignItems: 'start' }}>
              <div className="card stack">
                <div className="row"><Badge kind="indigo">{STAGE_LABEL[q.category]} round</Badge><span className={`badge ${q.difficulty}`}>{q.difficulty}</span></div>
                <h2 style={{ margin: 0 }}>{q.question}</h2>
                <textarea className="textarea" style={{ minHeight: 220 }} placeholder="Type your answer..." value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                <div className="row between">
                  <button className="btn btn-secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
                  <div className="row">
                    <button className="btn" disabled={busy || !(answers[q.id] || '').trim()} onClick={() => submitAnswer(q)}>{feedback[q.id] ? 'Re-submit answer' : 'Submit answer'}</button>
                    {idx < d.questions.length - 1 ? <button className="btn btn-secondary" onClick={() => setIdx(idx + 1)}>Next</button> : <button className="btn btn-teal" disabled={busy} onClick={finish}>Finish & get report</button>}
                  </div>
                </div>
              </div>
              <div className="card">
                {feedback[q.id] ? <Feedback result={feedback[q.id]} modelAnswer={feedback[q.id].modelAnswer} /> : <div className="center-state" style={{ padding: 20 }}><h3>Feedback appears after you submit</h3><p>Tip: structure your answer as point → explanation → example → result.</p></div>}
              </div>
            </div>
            <div className="row mt" style={{ justifyContent: 'flex-end' }}><button className="btn btn-teal" disabled={busy} onClick={finish}>Finish interview ({Object.keys(feedback).length}/{d.questions.length} answered)</button></div>
          </>
        );
      }}
    </Async>
  );
}
