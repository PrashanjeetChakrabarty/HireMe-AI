import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Each page is its own download, so charts, the document viewer and the animations load only where they are used.
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const OtpVerifyPage = lazy(() => import('./pages/OtpVerifyPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ResumePage = lazy(() => import('./pages/ResumePage'));
const RecruiterJobsPage = lazy(() => import('./pages/RecruiterJobsPage'));
const CandidateJobsPage = lazy(() => import('./pages/CandidateJobsPage'));
const RecruiterActivityFeedPage = lazy(() => import('./pages/RecruiterActivityFeedPage'));
const CandidateActivityFeedPage = lazy(() => import('./pages/CandidateActivityFeedPage'));
const RecruiterAnalyticsPage = lazy(() => import('./pages/RecruiterAnalyticsPage'));
const PrivacyPage = lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.TermsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="u-gate" role="status" aria-live="polite">
      <span className="u-spin" />
    </div>
  );
}

// App only holds the pages. The router and the providers live in main.jsx,
// so tests (and the design preview) can wrap it in whatever router they need.
function App() {
  const guard = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OtpVerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={guard(<DashboardPage />)} />
        <Route path="/resumes" element={guard(<ResumePage />)} />
        <Route path="/jobs" element={guard(<CandidateJobsPage />)} />
        <Route path="/my-activity" element={guard(<CandidateActivityFeedPage />)} />
        <Route path="/my-jobs" element={guard(<RecruiterJobsPage />)} />
        <Route path="/analytics" element={guard(<RecruiterAnalyticsPage />)} />
        <Route path="/activity-feed" element={guard(<RecruiterActivityFeedPage />)} />
        <Route path="/profile" element={guard(<ProfilePage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;