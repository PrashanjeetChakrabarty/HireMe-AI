import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import TechText from '../../components/reactbits/TechText';
import MaskedHeading from '../../components/reactbits/MaskedHeading';
import ParticleText from '../../components/reactbits/ParticleText';
import ProfileCard from '../../components/reactbits/ProfileCard';
import { avatarA, avatarB, avatarC, grain, iconPattern, meshArt, meshArtDark } from '../../lib/art';
import { NearView, Reveal, useCountUp, useInView, useMagnetic, useScrollToSection, useTilt } from '../../lib/hooks';
import { useTheme } from '../../lib/theme';
import * as I from '../../lib/icons';

/* ================= Hero ================= */
function ScoreRing({ value = 87 }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 600);
    return () => clearTimeout(t);
  }, []);
  const shown = useCountUp(value, go, 1700);
  const to = 276.46 * (1 - value / 100);
  return (
    <div className="score-ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--sky)" />
            <stop offset="1" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
        <circle className="bg" cx="50" cy="50" r="44" />
        <circle className="fg" cx="50" cy="50" r="44" style={{ '--to': to }} />
      </svg>
      <div className="num">
        <span>
          {Math.round(shown)}
          <small>%</small>
        </span>
      </div>
    </div>
  );
}

function HeroScene({ sceneRef }) {
  return (
    <div className="scene" ref={sceneRef} aria-hidden="true">
      <div className="scene-inner">
        <div className="ring r1" />
        <div className="ring r2" />

        <div className="plate plate-resume">
          <div className="pl-head">
            <span className="av" />
            <span>aarav_resume.pdf</span>
            <span className="tag">parsing…</span>
          </div>
          <div className="sk t" />
          <div className="sk w90" />
          <div className="sk w80" />
          <div className="sk hl w55" />
          <div className="sk w70" />
          <div className="sk w90" />
          <div className="sk hl w70" style={{ animationDelay: '0.6s' }} />
          <div className="sk w55" />
          <div className="sk w80" />
          <div className="sk hl w40" style={{ animationDelay: '1.2s' }} />
          <div className="sk w90" />
          <div className="sk w70" />
          <div className="scan" />
        </div>

        <div className="plate plate-score">
          <div className="lbl">Match score</div>
          <ScoreRing value={87} />
          <div className="mini-bars">
            <div>
              Skills<div className="bar"><i style={{ '--w': '92%' }} /></div>
            </div>
            <div>
              Job fit<div className="bar"><i style={{ '--w': '78%', animationDelay: '1.1s' }} /></div>
            </div>
          </div>
        </div>

        <div className="chip" style={{ left: '-3%', top: '12%', '--z': '90px' }}>
          Python <span className="ok">✓</span>
        </div>
        <div className="chip" style={{ right: '8%', top: '4%', '--z': '150px', '--d': '-2s' }}>
          React <span className="ok">✓</span>
        </div>
        <div className="chip" style={{ left: '6%', bottom: '24%', '--z': '120px', '--d': '-4s' }}>
          SQL <span className="ok">✓</span>
        </div>
        <div className="chip miss" style={{ right: '0%', bottom: '12%', '--z': '80px', '--d': '-1s' }}>
          Docker <span className="ok">✕</span>
        </div>

        <div className="toast">
          <span className="tick">
            <I.Check />
          </span>
          <span>
            <b>Shortlisted</b>
            <small>Interview · Fri 09:00 AM IST</small>
          </span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const heroRef = useRef(null);
  const sceneRef = useRef(null);
  const primary = useMagnetic(0.22);
  const scrollTo = useScrollToSection();

  useEffect(() => {
    const hero = heroRef.current;
    const scene = sceneRef.current;
    if (!hero || !scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const onMove = e => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      scene.style.setProperty('--ty', `${(-22 + nx * 18).toFixed(2)}deg`);
      scene.style.setProperty('--tx', `${(12 - ny * 14).toFixed(2)}deg`);
      hero.style.setProperty('--sx', `${((nx + 0.5) * 100).toFixed(1)}%`);
      hero.style.setProperty('--sy', `${((ny + 0.5) * 100).toFixed(1)}%`);
    };
    const onLeave = () => {
      scene.style.setProperty('--ty', '-22deg');
      scene.style.setProperty('--tx', '12deg');
    };
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-bg" aria-hidden="true">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
        <div className="spot" />
        <div className="floor"><i /></div>
        <div className="noise" />
      </div>
      <div className="wrap hero-grid">
        <div>
          <Reveal as="h1">
            Fall for the <span className="grad-text">right match,</span> not the first resume.
          </Reveal>
          <Reveal as="p" className="lead" delay={0.1}>
            Right hire. Right role. AI makes the match. Recruiters meet the best fit in seconds, candidates get seen for roles that truly suit them, and the final call always stays with people.
          </Reveal>
          <Reveal className="cta-row" delay={0.18}>
            <Link ref={primary} className="btn btn-primary" to={'/register'}>
              Create account <I.Arrow />
            </Link>
          </Reveal>
          <Reveal as="p" className="login-hint" delay={0.28}>
            Already have an account? <Link to="/login">Log in</Link>
          </Reveal>
          <Reveal as="ul" className="trust" delay={0.32}>
            <li><I.Check /> Email-verified accounts</li>
            <li><I.Check /> Sign in with Google</li>
            <li><I.Check /> Delete your account any time</li>
          </Reveal>
        </div>
        <HeroScene sceneRef={sceneRef} />
      </div>
    </section>
  );
}

/* ================= Interactive wordmark (TechText) ================= */
export function Playground() {
  const { colors } = useTheme();
  const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  return (
    <section className="playground" aria-label="Interactive wordmark">
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      <TechText
        text="Hire smarter"
        fontFamily={'"Inter", system-ui, sans-serif'}
        fontWeight={700}
        fontSize={260}
        letterSpacing={-0.04}
        color={colors.ink}
        accentColor={colors.accent}
        reveal="letter"
        dashLength={5}
        dashGap={3}
        specks={18}
      />
      <p className="hint">{touch ? 'Touch the words to scan them' : 'Hover to scan the words, like our AI does'}</p>
    </section>
  );
}

/* ================= Ribbon (TextLoop) ================= */
export function Ribbon({ text, reverse = false }) {
  const copies = [0, 1];
  const repeats = [0, 1, 2, 3, 4, 5];
  return (
    <div className="ribbon" role="img" aria-label={text}>
      <div className={reverse ? 'ribbon-band reverse' : 'ribbon-band'} aria-hidden="true">
        <div className="ribbon-track">
          {copies.map(copy => (
            <div className="ribbon-set" key={copy}>
              {repeats.map(i => (
                <span key={i}>
                  {text}
                  <em>✦</em>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= Stats ================= */
function Stat({ n, prefix = '', suffix = '', label, delay }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const v = useCountUp(n, inView, 1500);
  return (
    <div className="stat" ref={ref} style={{ transitionDelay: `${delay}s` }}>
      <div className="n">
        <span className="n-ghost" aria-hidden="true">
          {prefix}
          {n}
          <small>{suffix}</small>
        </span>
        <span className="n-live">
          {prefix}
          {Math.round(v)}
          <small>{suffix}</small>
        </span>
      </div>
      <p>{label}</p>
    </div>
  );
}

export function Stats() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <Reveal className="wrap">
        <div className="stats">
          <Stat n={3} prefix="~" suffix="s" label="typical AI analysis time for one resume" />
          <Stat n={6} label="hiring stages, from Applied to Hired" />
          <Stat n={2} label="role-based workspaces: recruiter and candidate" />
          <Stat n={100} suffix="%" label="of accounts verified with an email code" />
        </div>
      </Reveal>
    </section>
  );
}

/* ================= Features (bento) ================= */
const FEATURES = [
  { span: 3, icon: I.File, title: 'Resume parsing in seconds', text: 'Upload a PDF or Word resume. The AI reads it like a human recruiter would and pulls out the skills that matter.', tags: ['PDF', 'DOCX', 'LLM extraction'] },
  { span: 3, icon: I.Target, title: 'Matching by meaning', text: 'Skills are compared semantically, so "REST APIs" on a job still counts for "REST API Design" on a resume.', tags: ['Embeddings', 'Skill match', 'Job fit'] },
  { span: 2, icon: I.Users, title: 'A clear pipeline', text: 'Shortlist, reject or schedule with one click. Every candidate always has a stage.', tags: ['6 stages'] },
  { span: 2, icon: I.Calendar, title: 'Interview scheduling', text: 'Pick the date, time, mode and venue. Candidates get an email with the time in IST.', tags: ['Email invite'] },
  { span: 2, icon: I.Chart, title: 'Analytics and history', text: 'See how each job performs, and keep a trail of every status change.', tags: ['Dashboard', 'Activity feed'] },
  { span: 3, icon: I.Shield, title: 'Secure by design', text: 'Email code verification, Google sign-in, hashed passwords and rate limiting protect every account.', tags: ['OTP', 'Google', 'Rate limits'] },
  { span: 3, icon: I.Clock, title: 'Built for speed', text: 'Scores arrive in a few seconds, so a full stack of applications is reviewed in minutes, not days.', tags: ['~3s per resume'] }
];

function FeatureCard({ f }) {
  const ref = useTilt(6);
  return (
    <div className="tilt" ref={ref}>
      <div className="ico"><f.icon /></div>
      <h3>{f.title}</h3>
      <p>{f.text}</p>
      <div className="tag-row">
        {f.tags.map(t => (
          <span className="tag" key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">Everything between “Apply” and “Hired”.</h2>
          <p className="lead">One workspace for candidates and recruiters, with AI doing the slow parts.</p>
        </Reveal>
        <div className="bento">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} className={`span-${f.span}`}>
              <FeatureCard f={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= How it works ================= */

export function Steps() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">Three steps. No spreadsheets.</h2>
          <p className="lead">From a raw PDF to a ranked shortlist in the time it takes to make tea.</p>
        </Reveal>
        <div className="steps">
          <Reveal className="step">
            <span className="no">01 / UPLOAD</span>
            <h3>Drop in a resume</h3>
            <p>Candidates upload a PDF or Word file once and reuse it for every job.</p>
            <div className="viz">
              <div className="drop">
                <I.Upload />
                <span>resume.pdf</span>
                <div className="progress"><i /></div>
              </div>
            </div>
          </Reveal>
          <Reveal className="step" delay={0.1}>
            <span className="no">02 / ANALYSE</span>
            <h3>AI finds the signal</h3>
            <p>Skills are extracted and compared with what the job asks for.</p>
            <div className="viz">
              <div className="chips">
                {['Python', 'React', 'SQL', 'Git', 'REST API Design', 'Docker?', 'TypeScript', 'CI/CD'].map((s, i) => (
                  <span className="c" style={{ '--i': i }} key={s}>{s}</span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal className="step" delay={0.2}>
            <span className="no">03 / DECIDE</span>
            <h3>Shortlist and schedule</h3>
            <p>Recruiters see ranked candidates and move the best ones forward.</p>
            <div className="viz">
              <div className="pipe">
                <div className="pipe-row">
                  <span className="node done" /><span className="bar done" />
                  <span className="node done" /><span className="bar done" />
                  <span className="node now" /><span className="bar" />
                  <span className="node" />
                </div>
                <div className="pipe-labels">
                  <span>Applied</span><span>Shortlisted</span><span>Scheduled</span><span>Hired</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= Signals (MaskedHeading + report) ================= */
const PAIRS = [
  ['Python', 'Python', 1.0],
  ['React', 'React', 1.0],
  ['SQL', 'SQL', 1.0],
  ['REST APIs', 'REST API Design', 0.8],
  ['Git', 'Git', 1.0],
  ['Docker', 'Not found', null]
];

export function Signals() {
  const { theme } = useTheme();
  return (
    <section className="section">
      <div className="wrap">
        <div className="mh-wrap">
          <MaskedHeading
            className="mh"
            text="Real signals, not keywords"
            key={theme}
            src={theme === 'dark' ? meshArtDark : meshArt}
            textScale={0.105}
            weight={700}
            tracking={-0.035}
            fillScale={1.3}
            parallax={36}
            drift={22}
            style={{ marginTop: 18 }}
          />
          <Reveal as="p" className="mh-sub">
            A language model reads the resume, then the match is scored by meaning, so good candidates are not lost to a missing buzzword.
          </Reveal>
        </div>

        <div className="report-grid">
          <div className="signal-list">
            {[
              [I.Cpu, 'Reads like a recruiter', 'The AI extracts the skills that are actually in the resume, not just the ones in the headline.'],
              [I.Target, 'Matches by meaning', 'Related skills count. "REST APIs" and "REST API Design" are recognised as close, not as a miss.'],
              [I.Shield, 'Transparent scoring', 'Every score is split into skill match and overall fit, so you can see why a candidate ranks where they do.']
            ].map(([Icon, h, p], i) => (
              <Reveal className="signal" delay={i * 0.08} key={h}>
                <div className="ico"><Icon /></div>
                <div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="report" delay={0.12}>
            <div className="report-head">
              <span><b>Match report</b> · Software Developer</span>
              <span>example</span>
            </div>
            {PAIRS.map(([job, found, sim]) => (
              <div className="pair" key={job}>
                <span>{job}</span>
                <span className="arrow">{sim === null ? '✕' : '→'}</span>
                <span>{found}</span>
                <span className={`sim ${sim === null ? 'no' : sim >= 0.95 ? 'hi' : 'mid'}`}>{sim === null ? 'missing' : sim.toFixed(2)}</span>
              </div>
            ))}
            <div className="final">
              <div><small>Skill match</small><b>83%</b></div>
              <div><small>Job fit</small><b>49%</b></div>
              <div className="big"><small>Final score</small><b>66%</b></div>
            </div>
            <p className="fine">Sample output from a real test run. Scores support the recruiter's decision; they never replace it.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= Shortlist (ProfileCard) ================= */
export function Shortlist() {
  const [done, setDone] = useState(false);
  const common = { iconUrl: iconPattern, grainUrl: grain, behindGlowColor: 'rgba(76,195,255,0.55)', innerGradient: 'linear-gradient(145deg,#1f3c9a8c 0%,#71C4FF44 100%)' };
  return (
    <section className="section" id="shortlist">
      <div className="wrap split">
        <div>
          <Reveal>
            <h2 className="h2">Meet your next hire, ranked and ready.</h2>
            <p className="lead">Every applicant lands as a clean profile card with their match score on top. Shortlist the best in one tap and the candidate is notified.</p>
          </Reveal>
          <Reveal as="ul" className="checks" delay={0.1}>
            <li><I.Check /> Candidates sorted by match score, strongest first</li>
            <li><I.Check /> View the profile and the original resume in one place</li>
            <li><I.Check /> Shortlist, reject or schedule an interview with one click</li>
            <li><I.Check /> A full history of what happened and when</li>
          </Reveal>
        </div>
        <Reveal className="stage" delay={0.1}>
          <NearView className="stage-view" margin="300px">
          <div className="halo" />
          <div className="pc-fan">
            <div className="fan-left">
              <ProfileCard {...common} avatarUrl={avatarB} name="Meera Nair" title="Frontend Developer" handle="meera.codes" status="81% match" showUserInfo={false} enableTilt={false} behindGlowEnabled={false} />
            </div>
            <div className="fan-right">
              <ProfileCard {...common} avatarUrl={avatarC} name="Rohan Das" title="Data Engineer" handle="rohan.data" status="76% match" showUserInfo={false} enableTilt={false} behindGlowEnabled={false} />
            </div>
            <div className="front">
              <ProfileCard
                {...common}
                avatarUrl={avatarA}
                name="Aarav Sharma"
                title="Backend Developer"
                handle="aarav.dev"
                status="92% match"
                contactText={done ? 'Shortlisted ✓' : 'Shortlist'}
                onContactClick={() => setDone(true)}
              />
            </div>
          </div>
          </NearView>
          <span className="sample-note">Sample profiles</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= Audience ================= */
const AUDIENCE = {
  recruiter: [
    [I.Briefcase, 'Post jobs with the skills that matter', 'Describe the role and its required skills once.'],
    [I.Target, 'Ranked applicants', 'Every applicant gets a match score, so the strongest profiles surface first.'],
    [I.Users, 'Shortlist, reject, schedule', 'Move candidates through the pipeline with a click.'],
    [I.Calendar, 'Interview scheduling', 'Set date, time, mode and venue. The candidate is emailed automatically.'],
    [I.Chart, 'Analytics dashboard', 'Track applications and outcomes for each job.'],
    [I.History, 'Full activity feed', 'Every status change is logged, so nothing gets lost.']
  ],
  candidate: [
    [I.Upload, 'Upload once', 'PDF or Word resumes, with skills extracted automatically.'],
    [I.Target, 'See your match instantly', 'Know how well you fit a job when you apply.'],
    [I.Briefcase, 'Browse and apply', 'Find open roles and apply in a click.'],
    [I.Clock, 'Track every step', 'Follow your status and interview details in one place.'],
    [I.History, 'Your activity history', 'See what happened to each application, and when.'],
    [I.Lock, 'You stay in control', 'Delete your account any time, confirmed with an email code.']
  ]
};

export function Audience() {
  const [who, setWho] = useState('recruiter');
  return (
    <section className="section" id="audience">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">One platform, two sides of hiring.</h2>
          <div className="tabs" role="tablist" aria-label="Choose your role">
            {[['recruiter', 'For recruiters'], ['candidate', 'For candidates']].map(([id, label]) => (
              <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={who === id} aria-controls="aud-panel" onClick={() => setWho(id)}>
                {label}
              </button>
            ))}
          </div>
        </Reveal>
        <div className="aud" id="aud-panel" role="tabpanel" aria-labelledby={`tab-${who}`} key={who}>
          {AUDIENCE[who].map(([Icon, h, p], i) => (
            <div className="item" style={{ '--i': i }} key={h}>
              <div className="ico"><Icon /></div>
              <div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </div>
          ))}
        </div>
        <Reveal className="cta-row" style={{ marginTop: 34 }}>
          <Link className="btn btn-primary" to={who === 'recruiter' ? '/register' : '/register'}>
            {who === 'recruiter' ? 'Start hiring' : 'Create your profile'} <I.Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= FAQ ================= */
const FAQS = [
  ['How is the match score calculated?', 'The AI pulls the skills out of the resume and the job description, then compares them by meaning. The final score is the average of two numbers: how many of the job\'s skills you match, and how well the whole resume fits the job description.'],
  ['Which files can I upload?', 'PDF and Word (DOCX) resumes.'],
  ['Does the AI decide who gets hired?', 'No. The score is decision support. Recruiters decide who to shortlist, reject or interview.'],
  ['How is my data used?', null],
  ['How do I create an account?', 'Create an account with your email and confirm it with a one-time code, or continue with Google.'],
  ['Can I delete my account?', 'Yes. Open your dashboard, choose Delete Account and confirm with the code we email you.']
];

export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">Questions, answered.</h2>
        </Reveal>
        <Reveal className="faq" delay={0.08}>
          {FAQS.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span className="plus"><I.Plus /></span>
              </summary>
              <div className="ans">
                {a ?? (
                  <>
                    Your resume is used to find your skills and match you to jobs you apply to. We never sell your data. Read the full <Link to="/privacy">Privacy Policy</Link> for what we collect, who processes it and how to delete it.
                  </>
                )}
              </div>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ================= Final CTA ================= */
export function FinalCta() {
  const magnet = useMagnetic(0.22);
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <Reveal className="cta-box">
          <div className="orb o1" />
          <div className="orb o2" />
          <h2>Ready to find your match?</h2>
          <p className="lead">Create a free account, upload a resume and see your first match score in seconds.</p>
          <div className="cta-row" style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Link ref={magnet} className="btn btn-primary" to={'/register'}>
              Create account <I.Arrow />
            </Link>
            <Link className="btn btn-ghost" to={'/login'}>
              Log in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= Brand (ParticleText) ================= */
export function Brand() {
  const { colors } = useTheme();
  return (
    <section className="section brand-block" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <Reveal>
          <span className="cap">A product by</span>
        </Reveal>
        <NearView className="brand-particles">
          <ParticleText
            text="HireMe AI"
            particleSize={2.2}
            density={5}
            color={colors.ink}
            highlightColor={colors.accent}
            scatter={220}
            gatherDuration={1800}
            stagger={500}
            pointerRepel={46}
            repelRadius={130}
            idleDrift={0.7}
            trigger="click"
            fontSize="clamp(3.4rem, 14vw, 10rem)"
            fontWeight={700}
            fontFamily={'"Inter", system-ui, sans-serif'}
            glow={false}
          />
        </NearView>
      </div>
    </section>
  );
}


export default function LandingPage() {
  return (
    <>
      <Hero />
      <Playground />
      <Ribbon text="Resume ✦ Match ✦ Shortlist ✦ Interview" />
      <Stats />
      <Features />
      <Steps />
      <Signals />
      <Shortlist />
      <Ribbon text="Screen faster ✦ Hire better" reverse />
      <Audience />
      <Faq />
      <FinalCta />
      <Brand />
    </>
  );
}

