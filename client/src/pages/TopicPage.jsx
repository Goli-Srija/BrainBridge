import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Icon from '../components/Icon';
import LessonContent from '../components/LessonContent';
import { Async, PageHead, useToast } from '../components/ui';

const BACK = { java: '/programming', python: '/programming', c: '/programming', dsa: '/programming', core: '/interview', quant: '/aptitude', logical: '/logical', verbal: '/verbal', communication: '/communication', interview: '/interview' };

export default function TopicPage() {
  const { module, topic } = useParams();
  const { user } = useAuth();
  const state = useApi(`/learn/topic/${module}/${topic}`);
  const toast = useToast();
  const lesson = state.data?.lessons?.[0];

  // Opening a lesson marks it as "started" (only the first time).
  useEffect(() => { if (lesson && !lesson.status) api.post(`/learn/lessons/${lesson.id}/start`).catch(() => {}); }, [lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = async () => {
    try {
      const r = await api.post(`/learn/lessons/${lesson.id}/complete`);
      toast(r.message);
      state.reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const uncomplete = async () => { await api.post(`/learn/lessons/${lesson.id}/uncomplete`); state.reload(); };
  const bookmark = async () => {
    const r = await api.post('/bookmarks/toggle', { item_type: 'lesson', item_id: lesson.id });
    toast(r.bookmarked ? 'Lesson bookmarked' : 'Bookmark removed');
    state.reload();
  };

  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHead back={{ to: BACK[module] || '/roadmap', label: d.topic.module_title }} title={d.topic.title} subtitle={d.topic.summary}
            actions={<>
              <button className="btn btn-secondary btn-sm" onClick={bookmark}><Icon name="bookmark" />{d.bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
              {lesson?.status === 'completed'
                ? <button className="btn btn-secondary btn-sm" onClick={uncomplete} title="Mark as in progress"><Icon name="check" />Completed</button>
                : <button className="btn btn-teal btn-sm" onClick={complete}><Icon name="check" />Mark complete</button>}
            </>} />
          <div className="with-aside">
            <div className="card">
              {lesson ? <LessonContent content={lesson.content} preferredLanguage={user?.preferred_language} /> : <p>No lesson content.</p>}
            </div>
            <div className="stack aside">
              {d.questionCount > 0 && (
                <div className="card">
                  <h4>Practice this topic</h4>
                  <p className="small muted">{d.questionCount} questions available.</p>
                  <div className="stack" style={{ gap: 8 }}>
                    {['easy', 'medium', 'hard'].map((lv) => <Link key={lv} className="btn btn-secondary btn-sm" style={{ textTransform: 'capitalize' }} to={`/quiz?section=${module}&topic=${topic}&difficulty=${lv}&count=10`}>{lv} quiz (10 Qs)</Link>)}
                  </div>
                </div>
              )}
              {lesson?.content?.coding_topic && (
                <div className="card"><h4>Coding practice</h4><p className="small muted">Solve problems on this pattern.</p><Link className="btn btn-sm" to={`/coding?topic=${lesson.content.coding_topic}`}>Open coding bank</Link></div>
              )}
              <div className="card">
                <h4>Lesson info</h4>
                <div className="small muted">Level: <span className={`badge ${lesson?.difficulty}`}>{lesson?.difficulty}</span></div>
                <div className="small muted mt" style={{ marginTop: 6 }}>Estimated time: {lesson?.est_minutes} min</div>
                <div className="row between mt">
                  {d.prev ? <Link className="small" to={`/learn/${module}/${d.prev.slug}`}>← {d.prev.title}</Link> : <span />}
                  {d.next && <Link className="small" to={`/learn/${module}/${d.next.slug}`}>{d.next.title} →</Link>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Async>
  );
}
