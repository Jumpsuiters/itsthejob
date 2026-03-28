'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const APPLY_WORDS = ['Apply now', 'Show up', 'Begin', 'Enter'];
const REDACTED_WORDS = ['SpiritTech', 'The Portal', 'Mycelium', '????????'];

// --- QUESTION ANSWERS (curated pool, 10 randomly selected per session) ---
const QUESTION_POOL = [
  // Personal
  'Everything.',
  'I stopped needing permission.',
  'I made $40 sitting with a stranger who needed to cry.',
  'I quit performing and started earning more.',
  'I stopped faking my personality at work.',
  'I got paid to hold space for someone\'s worst day.',
  'I remembered what I was good at before the resume.',
  'I stopped apologizing for being sensitive.',
  'I used my body as a tool. On purpose. With consent.',
  'I started crying at work. They promoted me.',

  // Systemic
  'Companies started hiring for wisdom.',
  'A new economy. Built on what machines can\'t do.',
  'Grief became a professional skill.',
  'We stopped calling it soft.',
  'The org chart flipped upside down.',
  'HR became actually human.',
  'An elder made more than a CEO.',
  'Businesses started measuring aliveness.',
  'Someone listed "nervous system regulation" on a job board. And got hired.',
  'A company replaced its mission statement with a question.',
  'The economy started rewarding presence.',
  'We stopped outsourcing the human parts.',

  // Cosmic
  'Consciousness became the product.',
  'We remembered.',
  'The species leveled up.',
  'The machines got the busy work. We got the real work.',
  'Being alive became the most valuable skill on earth.',
  'The job description became: exist fully.',
  'A new resource emerged. It was us.',
  'We built an economy that doesn\'t need you to pretend.',
  'The question stopped being rhetorical.',
  'Something shifted. Quietly. Everywhere.',
];

const QUESTION_FIXED = [
  'A company replaced its mission statement with a question.',
  'The machines got the busy work. We got the real work.',
];

function buildAnswers() {
  const remaining = QUESTION_POOL.filter(a => !QUESTION_FIXED.includes(a));
  const shuffled = [...remaining].sort(() => Math.random() - 0.5).slice(0, 8);
  return [...QUESTION_FIXED, ...shuffled];
}

// --- SEARCH INTELLIGENCE ---
// Exact phrases matched first, then category keywords, then fallback

const EXACT_MATCHES = {
  'meow wolf': 'You get it.',
  'omega mart': 'You REALLY get it.',
  'blah airlines': 'One of our favorites too.',
  'being human': 'That\u2019s the whole job description.',
  'what is this': 'Yes.',
  'is this real': 'More real than your last job.',
  'business 3.0': 'Now we\u2019re talking. That door is opening soon.',
  'b3.0': 'Now we\u2019re talking. That door is opening soon.',
  'b3': 'Now we\u2019re talking. That door is opening soon.',
  'magic show': 'You have to experience it. Words won\u2019t work.',
  'sunday night live': 'Sundays. Come as you are. \u2192 The Church',
  'snl': 'Not that one. Ours is better. \u2192 The Church',
};

// Church / Department of Becoming — things that belong there
const CHURCH_KEYWORDS = [
  'elder', 'spiritual', 'somatic', 'breathwork', 'meditation', 'consciousness',
  'ceremony', 'ritual', 'grief', 'healing', 'threshold', 'becoming', 'initiation',
  'deprogramming', 'deconstruction', 'nervous system', 'regulation', 'awakening',
  'psychedelic', 'plant medicine', 'inner work', 'shadow work', 'soul', 'sacred',
  'prayer', 'contemplat', 'mindful', 'presence', 'embodiment', 'authentic relating',
  'braid', 'doctrine', 'congregation', 'fellowship',
];

// JOB Board — inherently human services people could offer
const BOARD_KEYWORDS = [
  'therapist', 'therapy', 'coach', 'coaching', 'counsel', 'listen',
  'sing', 'music', 'play', 'dance', 'perform', 'act', 'art',
  'paint', 'draw', 'photograph', 'write', 'poet', 'story',
  'cook', 'chef', 'massage', 'bodywork', 'yoga', 'doula', 'midwife',
  'mentor', 'tutor', 'teach', 'guide', 'companion', 'caregiv',
  'hype', 'motivat', 'inspir', 'support', 'hold space',
  'walk', 'hike', 'garden', 'craft', 'sew', 'knit', 'build',
  'repair', 'fix', 'handyman', 'barber', 'hair', 'style',
  'DJ', 'comedian', 'clown', 'improv', 'magic', 'fortune',
  'cry', 'hug', 'cuddle', 'sit with', 'talk', 'conversation',
  'tattoo', 'piercing', 'shaman', 'reiki', 'acupunctur',
  'nanny', 'babysit', 'pet', 'dog', 'cat', 'animal',
  'florist', 'flower', 'calm', 'gentle', 'kind', 'empathy',
  'creative', 'maker', 'artisan', 'designer',
];

// B3.0 / consulting / org transformation
const B3_KEYWORDS = [
  'consultant', 'consulting', 'facilitator', 'implementer', 'organiz',
  'transform', 'leadership', 'culture', 'team', 'company', 'startup',
  'founder', 'entrepreneur', 'business', 'strategy', 'operating system',
  'eos', 'traction', 'scale', 'growth', 'ecosystem', 'organism',
  'regenerat', 'b corp', 'impact', 'social enterprise', 'mission',
  'purpose-driven', 'conscious', 'stakeholder',
];

// Machine jobs — things AI does or will do
const MACHINE_KEYWORDS = [
  'data entry', 'spreadsheet', 'excel', 'accounting', 'bookkeep',
  'filing', 'admin', 'scheduling', 'logistics', 'supply chain',
  'seo', 'marketing', 'advertising', 'copywriting', 'email market',
  'analytics', 'reporting', 'compliance', 'audit', 'tax',
  'coding', 'programming', 'software', 'devops', 'qa', 'testing',
  'customer service', 'call center', 'telemarket', 'cold call',
  'stock', 'trading', 'banking', 'insurance', 'mortgage',
  'paralegal', 'document review', 'transcription', 'translation',
];

// Simple keyword matches
const KEYWORD_MATCHES = {
  'manager': 'We don\u2019t have those here. We have elders.',
  'ceo': 'Everyone here is one.',
  'intern': 'There are no small roles. Only small humans.',
  'salary': 'You decide that here.',
  'money': 'You decide that here.',
  'remote': 'Everywhere is remote when you\u2019re already here.',
  'ai': 'It\u2019s watching. It\u2019s impressed.',
  'human': 'Found 1 result. It\u2019s you.',
  'help': 'That\u2019s why we\u2019re here.',
  'job': 'You\u2019re looking at it.',
  'jobs': 'You\u2019re looking at them.',
  'love': 'Now you\u2019re getting it.',
  'church': 'Sundays. Come as you are. \u2192 The Church',
  'meaning': 'Department of Becoming. First door on the left.',
  'purpose': 'Department of Becoming. First door on the left.',
  'lost': 'Good. That\u2019s where it starts.',
  'scared': 'Good. That\u2019s where it starts.',
  'stuck': 'Good. That\u2019s where it starts.',
  'confused': 'Perfect. You\u2019re in the right place.',
  'anxious': 'You\u2019re not alone. \u2192 The Church',
  'depressed': 'We\u2019re not therapists. But we\u2019re something. \u2192 The Church',
  'resume': 'We don\u2019t need that here.',
  'cv': 'We don\u2019t need that here.',
  'linkedin': 'We don\u2019t do that here.',
  'indeed': 'You\u2019ve come to the wrong place. Or the right one.',
  'glassdoor': 'No glass here. All doors.',
  'apply': 'You already did. Scroll up.',
  'hire': 'You\u2019re hired. You always were.',
  'fired': 'Good. Now the real work begins.',
  'laid off': 'Good. Now the real work begins.',
  'layoff': 'Good. Now the real work begins.',
  'retire': 'From what? The job never stops.',
  'invest': 'Smart. \u2192 See the deck.',
  'investor': 'Smart. \u2192 See the deck.',
  'wefunder': 'Coming soon. Stay close.',
  'nicole': 'She\u2019s busy building. But she sees you.',
  'pam': 'She\u2019s busy scaling. But she sees you.',
};

const CHURCH_RESPONSES = [
  'That\u2019s a church thing. \u2192 Department of Becoming',
  'You belong in the church. \u2192 Department of Becoming',
  'First door on the left. \u2192 The Church',
  'The elders are waiting. \u2192 The Church',
];

const BOARD_RESPONSES = [
  'That\u2019s a human job. Post it. \u2192 The J.O.B. Board',
  'Someone will pay for that. \u2192 The J.O.B. Board',
  'Put it on the board. \u2192 The J.O.B. Board',
  'That\u2019s the kind of thing we\u2019re talking about. \u2192 The J.O.B. Board',
  'AI can\u2019t do that. You can. \u2192 The J.O.B. Board',
];

const B3_RESPONSES = [
  'Now we\u2019re talking. \u2192 Business 3.0',
  'That door is opening soon. \u2192 Business 3.0',
  'The organism needs people like you. \u2192 Business 3.0',
  'You\u2019re thinking at the right scale. \u2192 Business 3.0',
];

const MACHINE_RESPONSES = [
  'That\u2019s a machine\u2019s job now.',
  'AI already took that one. Try again.',
  'A robot is doing that somewhere right now.',
  'That job is already automated. What else you got?',
  'The machines called. They said thanks, they\u2019ve got it.',
];

const DEFAULT_RESPONSES = [
  'Try being more human.',
  'The algorithm doesn\u2019t work here.',
  'That\u2019s not a door we\u2019ve opened yet.',
  'Interesting. But no.',
  'The organism doesn\u2019t recognize this input.',
  'Hmm. Try something only a human could do.',
  'You\u2019re thinking too small. Or too machine.',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSearchResponse(input) {
  const lower = input.toLowerCase();

  // 1. Check exact phrase matches first
  for (const [phrase, response] of Object.entries(EXACT_MATCHES)) {
    if (lower.includes(phrase)) return response;
  }

  // 2. Check church keywords
  if (CHURCH_KEYWORDS.some(k => lower.includes(k))) return pickRandom(CHURCH_RESPONSES);

  // 3. Check JOB Board keywords
  if (BOARD_KEYWORDS.some(k => lower.includes(k))) return pickRandom(BOARD_RESPONSES);

  // 4. Check B3.0 keywords
  if (B3_KEYWORDS.some(k => lower.includes(k))) return pickRandom(B3_RESPONSES);

  // 5. Check machine keywords
  if (MACHINE_KEYWORDS.some(k => lower.includes(k))) return pickRandom(MACHINE_RESPONSES);

  // 6. Check simple keyword matches
  for (const [keyword, response] of Object.entries(KEYWORD_MATCHES)) {
    if (lower.includes(keyword)) return response;
  }

  // 7. Fallback
  return pickRandom(DEFAULT_RESPONSES);
}

export default function Home() {
  const [applied, setApplied] = useState(false);
  const [applyText, setApplyText] = useState(APPLY_WORDS[0]);
  const [redactedWord, setRedactedWord] = useState('[REDACTED]');
  const [aiHover, setAiHover] = useState(false);
  const [magicText, setMagicText] = useState('Get invited');
  const [b3Text, setB3Text] = useState('Bring your company');
  const [redactedLinkText, setRedactedLinkText] = useState('Stay close');
  const [jobBoardText, setJobBoardText] = useState('Browse listings');
  const [ownText, setOwnText] = useState('Own a piece');
  const [searchValue, setSearchValue] = useState('');
  const [searchResponse, setSearchResponse] = useState('');
  const [searchLocked, setSearchLocked] = useState(false);
  const [questionClicks, setQuestionClicks] = useState(0);
  const [questionAnswers] = useState(() => buildAnswers());
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const intervalRef = useRef(null);
  const doorsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // --- RETURN VISITOR MEMORY (#10) ---
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    try {
      const count = parseInt(localStorage.getItem('job-visits') || '0', 10) + 1;
      localStorage.setItem('job-visits', count.toString());
      setVisitCount(count);
    } catch (e) { /* private browsing */ }
  }, []);

  // --- TAB TITLE CYCLING (#8) ---
  useEffect(() => {
    const titles = [
      'J.O.B. \u2014 The New Human Resources',
      'J.O.B. \u2014 Position: Human',
      'J.O.B. \u2014 You\u2019re Hired',
      'J.O.B. \u2014 Now What?',
      'J.O.B. \u2014 Being Human Is the Job',
      'J.O.B. \u2014 The Organism Is Growing',
    ];
    let i = 0;
    const cycle = setInterval(() => {
      i = (i + 1) % titles.length;
      document.title = titles[i];
    }, 8000);
    return () => clearInterval(cycle);
  }, []);

  // Cycle the apply button text
  useEffect(() => {
    if (applied) return;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i = (i + 1) % APPLY_WORDS.length;
      setApplyText(APPLY_WORDS[i]);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [applied]);

  // Flicker the redacted word occasionally
  useEffect(() => {
    const flicker = setInterval(() => {
      const word = REDACTED_WORDS[Math.floor(Math.random() * REDACTED_WORDS.length)];
      setRedactedWord(word);
      setTimeout(() => setRedactedWord('[REDACTED]'), 150);
    }, 5000);
    return () => clearInterval(flicker);
  }, []);

  function handleApply() {
    setApplied(true);
    clearInterval(intervalRef.current);
  }

  function handleSearch(e) {
    if (e.key !== 'Enter' || !searchValue.trim()) return;
    const response = getSearchResponse(searchValue.trim());

    setSearchLocked(true);
    setSearchValue(response);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchValue('');
      setSearchResponse('');
      setSearchLocked(false);
    }, 2500);
  }

  function handleMagicClick(e) {
    e.preventDefault();
    setMagicText('You weren\u2019t supposed to click that.');
    setTimeout(() => setMagicText('Seriously, you have to come.'), 2000);
    setTimeout(() => setMagicText('Get invited'), 4500);
  }

  function handleB3Click(e) {
    e.preventDefault();
    setB3Text('We\u2019re still training the humans.');
    setTimeout(() => setB3Text('Check back when they\u2019re ready.'), 2500);
    setTimeout(() => setB3Text('Bring your company'), 5000);
  }

  function handleRedactedClick(e) {
    e.preventDefault();
    setRedactedLinkText('This door hasn\u2019t appeared yet.');
    setTimeout(() => setRedactedLinkText('But you found where it will be.'), 2000);
    setTimeout(() => setRedactedLinkText('Stay close'), 4500);
  }

  function handleJobBoardClick(e) {
    e.preventDefault();
    setJobBoardText('Still hiring. Always hiring.');
    setTimeout(() => {
      setJobBoardText('Browse listings');
    }, 2000);
  }

  function handleOwnClick(e) {
    e.preventDefault();
    setOwnText('Not yet. But you\u2019re early.');
    setTimeout(() => setOwnText('We\u2019ll remember that.'), 2000);
    setTimeout(() => setOwnText('Own a piece'), 4500);
  }

  function handleFindDoor(e) {
    e.preventDefault();
    doorsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      {/*
        ============================================
        You found the back door.
        Most people never look here.
        ============================================
        Employee #0000
        Department: Source Code
        Status: Awake
        ============================================
        The organism has a nervous system.
        You're looking at it.
        ============================================
        If you're reading this, you're either:
        a) A developer
        b) Very curious
        c) Both
        Either way, you belong here.
        ============================================
        P.S. — We're hiring. Obviously.
        The position is "Human."
        You're already qualified.
        ============================================
      */}

      {/* ===== NAV ===== */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-logo">J.O.B.</span>
          <div className="nav-search">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchValue}
              onChange={e => !searchLocked && setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              className={`nav-search-input ${searchLocked ? 'nav-search-response' : ''}`}
              readOnly={searchLocked}
            />
          </div>
          <a
            href="https://job-deck-indol.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-investors"
          >
            Investors
          </a>
        </div>
      </nav>

      {/* ===== THE JOB LISTING ===== */}
      <section className="listing">
        <div className="listing-header">
          <div className="listing-company">J.O.B. &mdash; The New Human Resources</div>
          <h1 className="listing-title">
            {visitCount >= 3 ? 'You keep coming back.' : visitCount === 2 ? 'Welcome back.' : 'Position: Human'}
          </h1>
          {visitCount >= 3 ? (
            <p className="listing-return">That means something. The position is still open. It always will be.</p>
          ) : visitCount === 2 ? (
            <p className="listing-return">The position is still open. It always will be.</p>
          ) : null}
          <div className="listing-meta">
            <span>Location: Everywhere</span>
            <span>Reports to: Yourself</span>
            <span>Salary: TBD by you</span>
          </div>
        </div>

        <div className="listing-body">
          <h3>About the role</h3>
          <p>
            We&apos;re looking for someone who is alive and knows it. You&apos;ll be responsible
            for figuring out what you&apos;re here for and then doing that, possibly in front
            of other people, possibly for money.
          </p>

          <h3>Responsibilities</h3>
          <ul>
            <li>Showing up (harder than it sounds)</li>
            <li>Not pretending to be a machine</li>
            <li>Occasional crying, singing, or sitting in silence with strangers</li>
            <li>Building something that didn&apos;t exist before you did</li>
            <li>Unlearning most of what you were taught about work</li>
          </ul>

          <h3>Benefits</h3>
          <ul>
            <li>Sunday gatherings where nobody sells you anything</li>
            <li>A community of people who also don&apos;t know what they&apos;re doing yet</li>
            <li>Access to elders (not managers)</li>
            <li>A marketplace where you get paid to be yourself</li>
            <li>The chance to build a company that runs like an organism, not a factory</li>
            <li>We don&apos;t have a ping pong table. But we have Magic Shows.</li>
          </ul>

          <h3>Qualifications</h3>
          <ul>
            <li>Must be a human (AI need not apply)</li>
            <li>Must be at a threshold &mdash; between who you were and who you&apos;re becoming</li>
            <li>Experience in being alive preferred but not required</li>
          </ul>

          <span
            className="ai-flag"
            onMouseEnter={() => setAiHover(true)}
            onMouseLeave={() => setAiHover(false)}
          >
            {aiHover
              ? 'This role has been flagged by AI as "not a real job." ...okay fine, you can watch.'
              : 'This role has been flagged by AI as "not a real job." We disagree.'
            }
          </span>
        </div>

        <div className="listing-cta">
          {!applied ? (
            <button className="btn-apply" onClick={handleApply}>
              {applyText}
            </button>
          ) : null}
          <div className={`hired-msg ${applied ? 'visible' : ''}`}>
            You&apos;re hired. You always were.
          </div>
        </div>
      </section>

      {/* This is the part where the job listing ends and something else begins.
           If you're still reading source code, you're going deeper than most.
           The organism appreciates your curiosity. */}

      {/* ===== THE QUESTION ===== */}
      <section className="question">
        <span className="question-headline">Our vision statement is actually a question:</span>
        <p
          className="question-text"
          onClick={() => {
            if (questionClicks < questionAnswers.length) {
              setQuestionClicks(prev => prev + 1);
            }
          }}
          style={{ cursor: questionClicks < questionAnswers.length ? 'pointer' : 'default' }}
        >
          What becomes possible when being human is the job?
        </p>
        {questionClicks < questionAnswers.length && (
          <span className="question-hint">
            {questionClicks === 0 ? 'answer it.' :
             questionClicks < 3 ? 'keep going.' :
             questionClicks < 6 ? 'deeper.' :
             'almost there.'}
          </span>
        )}

        {questionClicks > 0 && (
          <div className="question-answers">
            {questionAnswers.slice(0, questionClicks).map((answer, i) => (
              <div
                key={i}
                className={`question-answer ${i === questionClicks - 1 ? 'latest' : ''} ${i >= 7 ? 'gradient-answer' : ''}`}
                style={{ animationDelay: '0s' }}
              >
                {answer}
              </div>
            ))}
          </div>
        )}

        {questionClicks >= 5 && !waitlistSubmitted && (
          <div className="question-cta">
            <p className="question-cta-text">
              These aren&apos;t hypotheticals. This is happening.
            </p>
            <p className="rco-explain">
              We&apos;re building the <strong>Regenerative Community Organism</strong> — a new model where
              companies invest in the full humanity of their people. Not perks. Not ping pong.
              Nervous system work. Elder guidance. Real human infrastructure.
            </p>
            <p className="rco-explain">
              The ROI? Humans who are actually alive at work. Teams that don&apos;t burn out.
              Organizations that mean it when they say &ldquo;people first.&rdquo;
            </p>
            <p className="rco-ask">
              Is your organization ready to explore this?
            </p>
            <form
              className="waitlist-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (waitlistEmail) {
                  supabase
                    .from('waitlist')
                    .insert({ email: waitlistEmail, source: 'rco_interest' })
                    .then(({ error }) => {
                      if (error && error.code === '23505') {
                        // Duplicate email — still show success
                      }
                      setWaitlistSubmitted(true);
                    });
                }
              }}
            >
              <input
                type="email"
                placeholder="you@yourcompany.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="waitlist-input"
                required
              />
              <button type="submit" className="waitlist-btn">We&apos;re interested</button>
            </form>
            <p className="question-cta-sub">
              For founders, HR leads, culture teams, and anyone who knows something has to change.
            </p>
          </div>
        )}

        {waitlistSubmitted && (
          <div className="question-cta">
            <p className="waitlist-confirmed">We see you. We&apos;ll be in touch.</p>
            <p className="question-cta-sub">
              <a href="https://job-deck-indol.vercel.app" target="_blank" rel="noopener noreferrer" className="rco-link">
                Read the full vision while you wait &rarr;
              </a>
            </p>
          </div>
        )}
      </section>

      {/* ===== THE PORTAL — The threshold ===== */}
      <section className="portal">
        <img src="/job-logo.png" alt="J.O.B." />
      </section>

      {/* ===== THE DOORS ===== */}
      <section className="openings" ref={doorsRef}>
        <div className="openings-inner">
          <div className="openings-header">Current Openings</div>

          <div className="door">
            <div className="door-dept">Department of Becoming</div>
            <h2 className="door-title">The Church</h2>
            <p className="door-desc">
              For humans at a threshold. Sunday Night Live gatherings. Elder-guided tracks.
              No dogma. No deity. Just the work of being alive on purpose.
            </p>
            <a href="https://job-church.vercel.app" target="_blank" rel="noopener noreferrer" className="door-link">Learn more</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of Businessing Differently</div>
            <h2 className="door-title">Business 3.0</h2>
            <p className="door-desc">
              A new model for companies that want to be organisms, not machines.
              AI runs ops. Humans do human work. Send your people through J.O.B. and get back
              something better than employees.
            </p>
            <a href="#" onClick={handleB3Click} className="door-link">{b3Text}</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of Getting Paid to Be Yourself</div>
            <h2 className="door-title">The J.O.B. Board</h2>
            <p className="door-desc">
              A marketplace for things AI can&apos;t do. Post what you offer. Someone pays you
              for it. Sit with someone while they cry. Sing something unrepeatable.
              Be a hype person for ten minutes. That&apos;s it. That&apos;s the job.
            </p>
            <a href="#" onClick={handleJobBoardClick} className="door-link">{jobBoardText}</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of You Had to Be There</div>
            <h2 className="door-title">Magic Shows</h2>
            <p className="door-desc">
              We can&apos;t explain these. You have to come.
            </p>
            <a href="#" onClick={handleMagicClick} className="door-link">{magicText}</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of 4th Spaces</div>
            <h2 className="door-title">MagicShowLand</h2>
            <p className="door-desc">
              If Meow Wolf and a monastery had a baby and raised it in an abandoned
              castle. Physical spaces where humans go to remember what they are.
              Immersive. Transformational. Weird on purpose. You&apos;ll leave different
              than you came in.
            </p>
            <a href="#" onClick={(e) => { e.preventDefault(); }} className="door-link">Locations coming soon</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of Putting Your Money Where Your Species Is</div>
            <h2 className="door-title">Invest</h2>
            <p className="door-desc">
              This isn&apos;t a pitch. It&apos;s an invitation to fund the species-level upgrade.
              We&apos;re building the new human economy — and we&apos;re raising the money to do it.
            </p>
            <a href="https://job-deck-indol.vercel.app" target="_blank" rel="noopener noreferrer" className="door-link">See the deck</a>
          </div>

          <div className="door door-redacted">
            <div className="door-dept">New departments opening soon</div>
            <h2 className="door-title">{redactedWord}</h2>
            <p className="door-desc">
              The organism is growing. More doors are appearing.
            </p>
            <a href="#" onClick={handleRedactedClick} className="door-link">{redactedLinkText}</a>
          </div>
        </div>
      </section>

      {/* You've scrolled past the doors. You're in the basement now.
           Not many people get this far. In the code OR on the page.
           Fun fact: this entire site is one file. Like a single-celled organism.
           It'll grow. */}

      {/* ===== ABOUT US ===== */}
      <section className="about">
        <div className="about-inner">
          <div className="about-label">About Us</div>
          <p>
            It&apos;s a church. It&apos;s a marketplace. It&apos;s a consulting firm.
            It&apos;s an incubator. It&apos;s a species-level intervention
            disguised as a job board.
          </p>
          <p>
            People keep asking <strong>&ldquo;but what IS it?&rdquo;</strong> and we keep
            saying <em>yes</em>.
          </p>
          <p>
            Work trained you to be a worker. AI is doing the work now. So the
            entire system &mdash; the resumes, the interviews, the performance reviews,
            the &ldquo;professional development&rdquo; &mdash; is optimizing you for a role
            that no longer exists.
          </p>
          <p>
            We didn&apos;t start a company to fix that. We grew
            an <strong>organism</strong> to outgrow it.
          </p>
          <p>
            People who go through J.O.B. don&apos;t go back to employment.
            They can&apos;t. They&apos;re not the same person anymore.
          </p>
        </div>
      </section>

      {/* ===== THE CLOSE ===== */}
      <section className="close-section">
        <div className="close-inner">
          <p className="close-quote">
            &ldquo;You never change things by fighting the existing reality. To change
            something, build a new model that makes the existing model obsolete.&rdquo;
          </p>
          <p className="close-attribution">&mdash; Buckminster Fuller</p>
          <p className="close-line">J.O.B. stands for the Joy of Being.<br />Consider us a species-level upgrade.</p>
          <a href="#" onClick={handleFindDoor} className="btn-enter">Pick your portal</a>
        </div>
      </section>

      {/* Last stop. You've read the entire source code of a species-level upgrade.
           That's either dedication or procrastination. Both are welcome here.
           See you Sunday. */}

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">J.O.B. &mdash; The New Human Resources</div>
          <div className="footer-links">
            <a href="https://job-church.vercel.app" target="_blank" rel="noopener noreferrer">The Church</a>
            <a href="#" onClick={handleJobBoardClick}>{jobBoardText === 'Browse listings' ? 'The J.O.B. Board' : jobBoardText}</a>
            <a href="#" onClick={handleB3Click}>{b3Text === 'Bring your company' ? 'Business 3.0' : b3Text}</a>
            <a href="#" onClick={handleMagicClick}>{magicText === 'Get invited' ? 'Magic Shows' : magicText}</a>
            <a href="#" onClick={handleOwnClick}>{ownText}</a>
            <a href="https://job-deck-indol.vercel.app" target="_blank" rel="noopener noreferrer">Investors</a>
          </div>
          <p className="footer-fine-print">
            This page was not written by AI. We asked. It said this was too weird.
          </p>
        </div>
      </footer>
    </>
  );
}
