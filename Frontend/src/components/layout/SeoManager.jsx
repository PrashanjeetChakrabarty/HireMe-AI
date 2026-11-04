import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://hireme-ai-hiring.vercel.app';

const HOME_DESCRIPTION =
  'AI-assisted resume screening: upload a resume, match skills to the job and shortlist the best candidates in seconds.';

// Title, description and whether search engines may list the page. Private pages are never listed.
const PAGES = {
  '/': { title: 'HireMe AI | Right hire. Right role. AI makes the match.', description: HOME_DESCRIPTION, listed: true },
  '/login': { title: 'Log in | HireMe AI', description: 'Log in to review ranked applicants or follow your applications.', listed: true },
  '/register': { title: 'Create account | HireMe AI', description: 'Create a free account as a candidate or a recruiter.', listed: true },
  '/privacy': { title: 'Privacy Policy | HireMe AI', description: 'How HireMe AI handles your account, resume and application data.', listed: true },
  '/terms': { title: 'Terms of Service | HireMe AI', description: 'The rules for using HireMe AI as a candidate or a recruiter.', listed: true },
  '/verify-otp': { title: 'Verify your email | HireMe AI', description: 'Enter the code we emailed you.', listed: false },
  '/forgot-password': { title: 'Forgot password | HireMe AI', description: 'Get a code to reset your password.', listed: false },
  '/reset-password': { title: 'Reset password | HireMe AI', description: 'Choose a new password.', listed: false },
  '/dashboard': { title: 'Dashboard | HireMe AI', description: 'Your HireMe AI workspace.', listed: false },
  '/resumes': { title: 'My resumes | HireMe AI', description: 'Upload and manage your resumes.', listed: false },
  '/jobs': { title: 'Browse jobs | HireMe AI', description: 'Find open jobs and apply.', listed: false },
  '/my-activity': { title: 'My activity | HireMe AI', description: 'Every change to your applications.', listed: false },
  '/my-jobs': { title: 'My jobs | HireMe AI', description: 'Post jobs and review ranked applicants.', listed: false },
  '/analytics': { title: 'Analytics | HireMe AI', description: 'Hiring numbers across your jobs.', listed: false },
  '/activity-feed': { title: 'Activity feed | HireMe AI', description: 'Every application change across your jobs.', listed: false },
  '/profile': { title: 'My profile | HireMe AI', description: 'Your details, password and account.', listed: false },
};
const NOT_FOUND = { title: 'Page not found | HireMe AI', description: 'This page does not exist.', listed: false };

function setTag(attribute, key, content) {
  let element = document.head.querySelector('meta[' + attribute + '="' + key + '"]');
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

// Keeps the browser tab title, the search description and the share preview in step with the page.
export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = PAGES[pathname] || NOT_FOUND;
    const url = SITE_URL + (pathname === '/' ? '/' : pathname);
    document.title = page.title;
    setTag('name', 'description', page.description);
    setTag('name', 'robots', page.listed ? 'index, follow' : 'noindex, nofollow');
    setTag('property', 'og:title', page.title);
    setTag('property', 'og:description', page.description);
    setTag('property', 'og:url', url);
    setTag('name', 'twitter:title', page.title);
    setTag('name', 'twitter:description', page.description);
    setCanonical(url);
  }, [pathname]);

  return null;
}
