import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ErrorState, Loading, PageHead, Ring, Stat, fmtTime, useToast } from '../components/ui';
import QuizRunner, { ReviewList } from '../modules/QuizRunner';
import { SECTION_META } from '../modules/constants';

export default function Quiz() {
  const [params] = useSearchParams();
  const section = params.get('section') || 'quant';
  const topic = params.get('topic') || 'mixed';
  const difficulty = params.get('difficulty') || '';
  const count = params.get('count') || 10;
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);
  const toast = useToast();

  useEffect(() => {
    setQuiz(null); setResult(null); setError('');
    api.get(`/aptitude/quiz?section=${section}&topic=${topic}&count=${count}${difficulty ? `&difficulty=${difficulty}` : ''}`)
      .then(setQuiz).catch((e) => setError(e.message));
  }, [section, topic, difficulty, count, round]);

  const submit = async (answers, time) => {
    setBusy(true);
    try {
      const r = await api.post('/aptitude/submit', { section, topic, difficulty: difficulty || null, time_taken_s: time, answers: quiz.questions.map((q) => ({ question_id: q.id, selected: answers[q.id] ?? null })) });
      setResult(r);
      toast(`Quiz submitted: ${r.correct}/${r.total} correct`);
      window.scrollTo(0, 0);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  const meta = SECTION_META[section];
  const topicTitle = topic === 'mixed' ? 'Mixed topics' : topic.replace(/-/g, ' ');
  if (error) return <ErrorState message={error} />;
  if (!quiz) return <Loading text="Preparing your quiz..." />;

  return (
    <>
      <PageHead back={{ to: meta.path, label: meta.title }} title={result ? 'Quiz results' : `${topicTitle} quiz`} subtitle={`${meta.title} · ${difficulty || 'all levels'} · ${quiz.questions.length} questions`} />
      {!result ? (
        <QuizRunner key={round} questions={quiz.questions} timeLimit={quiz.timeLimitSeconds} onSubmit={submit} submitting={busy} />
      ) : (
        <>
          <div className="grid grid-4 mb">
            <div className="card" style={{ display: 'grid', placeItems: 'center' }}><Ring value={result.accuracy} size={120} label="% accuracy" /></div>
            <Stat icon="check" tone="green" value={`${result.correct}/${result.total}`} label="Correct answers" />
            <Stat icon="target" tone="violet" value={result.attempted} label="Questions attempted" />
            <Stat icon="clock" tone="amber" value={fmtTime(result.timeTaken)} label="Time taken" />
          </div>
          <div className="row mb">
            <button className="btn" onClick={() => setRound(round + 1)}>Retry with new questions</button>
            {topic !== 'mixed' && <Link className="btn btn-secondary" to={`/learn/${section}/${topic}`}>Revise the lesson</Link>}
            <Link className="btn btn-ghost" to={meta.path}>Back to topics</Link>
          </div>
          <h2>Review</h2>
          <ReviewList review={result.review} />
        </>
      )}
    </>
  );
}
