// Timed multiple-choice runner used by aptitude quizzes and assessments.
import { useEffect, useRef, useState } from 'react';
import { fmtTime } from '../components/ui';

export default function QuizRunner({ questions, timeLimit, onSubmit, submitting, title }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(timeLimit);
  const started = useRef(Date.now());
  const submitted = useRef(false);

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(answers, Math.round((Date.now() - started.current) / 1000));
  };

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (left === 0) submit(); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[idx];
  const answered = Object.keys(answers).length;
  const confirmSubmit = () => {
    if (answered < questions.length && !window.confirm(`You have answered ${answered} of ${questions.length} questions. Submit anyway?`)) return;
    submit();
  };

  return (
    <div className="with-aside narrow">
      <div className="card">
        <div className="row between mb">
          <span className="badge indigo">Question {idx + 1} of {questions.length}</span>
          {q.difficulty && <span className={`badge ${q.difficulty}`}>{q.difficulty}</span>}
        </div>
        <div className="question-text">{q.question}</div>
        {q.options.map((o, i) => (
          <button key={i} className={`option ${answers[q.id] === i ? 'selected' : ''}`} onClick={() => setAnswers({ ...answers, [q.id]: i })}>
            <span className="letter">{String.fromCharCode(65 + i)}</span><span>{o}</span>
          </button>
        ))}
        <div className="row between mt">
          <button className="btn btn-secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
          <div className="row">
            {answers[q.id] !== undefined && <button className="btn btn-ghost btn-sm" onClick={() => { const a = { ...answers }; delete a[q.id]; setAnswers(a); }}>Clear</button>}
            {idx < questions.length - 1 ? <button className="btn" onClick={() => setIdx(idx + 1)}>Next</button> : <button className="btn btn-teal" disabled={submitting} onClick={confirmSubmit}>{submitting ? 'Submitting...' : 'Submit'}</button>}
          </div>
        </div>
      </div>
      <div className="card aside">
        {title && <h4>{title}</h4>}
        <div className="row between mb"><span className="small muted">Time left</span><span className={`timer ${left < 60 ? 'low' : ''}`}>{fmtTime(left)}</span></div>
        <div className="small muted mb">{answered}/{questions.length} answered</div>
        <div className="qnav">{questions.map((qq, i) => <button key={qq.id} className={`${answers[qq.id] !== undefined ? 'answered' : ''} ${i === idx ? 'current' : ''}`} onClick={() => setIdx(i)}>{i + 1}</button>)}</div>
        <button className="btn btn-teal btn-block mt" disabled={submitting} onClick={confirmSubmit}>Submit test</button>
      </div>
    </div>
  );
}

export function ReviewList({ review }) {
  return (
    <div className="stack">
      {review.map((r, i) => (
        <div key={i} className="card">
          <div className="row between mb"><span className="badge">{i + 1}</span><span className={`badge ${r.correct ? 'easy' : r.selected === null || r.selected === undefined ? '' : 'hard'}`}>{r.correct ? 'Correct' : r.selected === null || r.selected === undefined ? 'Not answered' : 'Incorrect'}</span></div>
          <div className="question-text" style={{ fontSize: '0.95rem' }}>{r.question}</div>
          {r.options.map((o, j) => (
            <div key={j} className={`option ${j === r.answer_index ? 'correct' : j === r.selected ? 'wrong' : ''}`} style={{ cursor: 'default' }}>
              <span className="letter">{String.fromCharCode(65 + j)}</span><span>{o}</span>
            </div>
          ))}
          <div className="alert alert-info"><div><strong>Explanation: </strong>{r.explanation}</div></div>
        </div>
      ))}
    </div>
  );
}
