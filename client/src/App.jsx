import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppLayout from './layouts/AppLayout';
import { Loading } from './components/ui';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Onboarding from './pages/Onboarding';

// Pages are lazy-loaded so the first load stays fast.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BrainBuddy = lazy(() => import('./pages/BrainBuddy'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const AptitudeSection = lazy(() => import('./pages/AptitudeSection'));
const Quiz = lazy(() => import('./pages/Quiz'));
const TopicPage = lazy(() => import('./pages/TopicPage'));
const Programming = lazy(() => import('./pages/Programming'));
const CodingList = lazy(() => import('./pages/CodingList'));
const CodingProblem = lazy(() => import('./pages/CodingProblem'));
const Communication = lazy(() => import('./pages/Communication'));
const Exercise = lazy(() => import('./pages/Exercise'));
const Interview = lazy(() => import('./pages/Interview'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio'));
const Projects = lazy(() => import('./pages/Projects'));
const Companies = lazy(() => import('./pages/Companies'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));
const MockInterviews = lazy(() => import('./pages/MockInterviews'));
const MockSession = lazy(() => import('./pages/MockSession'));
const Tracker = lazy(() => import('./pages/Tracker'));
const Assessments = lazy(() => import('./pages/Assessments'));
const AssessmentTake = lazy(() => import('./pages/AssessmentTake'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Videos = lazy(() => import('./pages/Videos'));
const FocusMode = lazy(() => import('./pages/FocusMode'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Protected route: requires login, and completed onboarding for app pages. */
function RequireAuth({ children, allowIncomplete }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading text="Loading BrainBridge..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!allowIncomplete && !user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to={user.onboarding_complete ? '/dashboard' : '/onboarding'} replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/p/:slug" element={<PublicPortfolio />} />
        <Route path="/onboarding" element={<RequireAuth allowIncomplete><Onboarding /></RequireAuth>} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/focus-mode" element={<FocusMode />} />
          <Route path="/brainbuddy" element={<BrainBuddy />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/aptitude" element={<AptitudeSection section="quant" />} />
          <Route path="/logical" element={<AptitudeSection section="logical" />} />
          <Route path="/verbal" element={<AptitudeSection section="verbal" />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/learn/:module/:topic" element={<TopicPage />} />
          <Route path="/programming" element={<Programming />} />
          <Route path="/coding" element={<CodingList />} />
          <Route path="/coding/:slug" element={<CodingProblem />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/communication/:slug" element={<Exercise />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:slug" element={<CompanyDetail />} />
          <Route path="/mock-interviews" element={<MockInterviews />} />
          <Route path="/mock-interviews/:id" element={<MockSession />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/assessments/:slug" element={<AssessmentTake />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
