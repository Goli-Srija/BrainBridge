import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Async, PageHead, Ring, Stat, fmtTime, useToast } from '../components/ui';
import { HBar } from '../components/Charts';
import QuizRunner, { ReviewList } from '../modules/QuizRunner';

export default function AssessmentTake() {
  const { slug } = useParams();
  const state = useApi(`/assessments/${slug}`);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (answers, time) => {
    setBusy(true);
    try { const r = await api.post(`/assessments/${slug}/submit`, { answers, time_taken_s: time }); setResult(r); window.scrollTo(0, 0); }
    catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead back={{ to: '/assessments', label: 'Assessments' }} title={d.assessment.title} subtitle={d.assessment.description} />
          {!started && !result && (
            <div className="card" style={{ maxWidth: 640 }}>
              <h3>Instructions</h3>
              <ul className="prose"><li>{d.questions.length} multiple-choice questions, {d.assessment.duration_min} minutes.</li><li>The test submits automatically when time runs out.</li><li>You can move between questions and change answers before submitting.</li><li>Pass mark: {d.assessment.pass_percent}%. Unanswered questions count as incorrect.</li></ul>
              <button className="btn btn-lg" onClick={() => setStarted(true)}>Start the test</button>
            </div>
          )}
          {started && !result && <QuizRunner questions={d.questions} timeLimit={d.assessment.duration_min * 60} onSubmit={submit} submitting={busy} title={d.assessment.title} />}
          {result && (
            <>
              <div className="grid grid-4 mb">
                <div className="card" style={{ display: 'grid', placeItems: 'center' }}><Ring value={result.percent} size={120} label="%" /></div>
                <Stat icon={result.passed ? 'trophy' : 'target'} tone={result.passed ? 'green' : 'red'} value={result.passed ? 'Passed' : 'Not passed'} label={`Pass mark ${result.passPercent}%`} />
                <Stat icon="check" tone="indigo" value={`${result.score}/${result.total}`} label="Correct" />
                <Stat icon="clock" tone="amber" value={fmtTime(result.timeTaken)} label="Time taken" />
              </div>
              <div className="card mb"><h3>Topic-wise breakdown</h3><HBar labels={result.breakdown.map((b) => b.topic.replace(/-/g, ' '))} values={result.breakdown.map((b) => b.percent)} /></div>
              <div className="row mb"><Link className="btn" to="/assessments">All assessments</Link><button className="btn btn-secondary" onClick={() => { setResult(null); setStarted(false); }}>Retake</button></div>
              <h2>Review</h2>
              <ReviewList review={result.review} />
            </>
          )}
        </>
      )}
    </Async>
  );
}
