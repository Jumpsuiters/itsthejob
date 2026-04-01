'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const APPLY_WORDS = ['Apply now', 'Show up', 'Begin', 'Enter'];
const REDACTED_WORDS = ['SpiritTech', 'The Portal', 'Mycelium', '????????'];

// --- QUESTION ANSWERS (fixed 3) ---
const QUESTION_ANSWERS = [
  'Work never taught us how to be human. At best, it fragmented us. At worst, it punished us for expressing who we really are.',
  'It prioritized our brains over our bodies. Our hands over our hearts. And, somewhere along the way, we forgot to care about all those parts ourselves. Because who was going to pay for it?',
  'Now, we\u2019re all paying for it.',
  'And now that AI is here, millions of people will be without jobs. And the ones that remain will be paid to do the things only humans can do.',
  'It\u2019s easy to imagine the worst case scenario here. But we prefer the best case one:',
  'That you step into your job. The one that\u2019s always been yours.',
];

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
  const [b3Text, setB3Text] = useState('Evolve your company');
  const [redactedLinkText, setRedactedLinkText] = useState('Stay close');
  const [jobBoardText, setJobBoardText] = useState('Browse listings');
  const [ownText, setOwnText] = useState('Own a piece');
  const [searchValue, setSearchValue] = useState('');
  const [searchResponse, setSearchResponse] = useState('');
  const [searchLocked, setSearchLocked] = useState(false);
  const [questionClicks, setQuestionClicks] = useState(0);
  const questionAnswers = QUESTION_ANSWERS;
  const [heroRevealed, setHeroRevealed] = useState(false);
  const [closeRevealed, setCloseRevealed] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicCode, setMagicCode] = useState('');
  const [magicCodeMsg, setMagicCodeMsg] = useState('');
  const [magicReferralEmail, setMagicReferralEmail] = useState('');
  const [magicReferralName, setMagicReferralName] = useState('');
  const [magicReferralSent, setMagicReferralSent] = useState(false);
  const [investForm, setInvestForm] = useState({ name: '', email: '', phone: '', investment_level: '' });
  const [investStatus, setInvestStatus] = useState('idle');
  const [magicReferralWhy, setMagicReferralWhy] = useState('');
  const [mslHover, setMslHover] = useState(false);
  const [jobBoardHover, setJobBoardHover] = useState(false);
  const intervalRef = useRef(null);
  const doorsRef = useRef(null);
  const investRef = useRef(null);
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

  // --- SPARKLE CURSOR TRAIL ---
  useEffect(() => {
    const colors = ['#d4b84c', '#a8c744', '#3dcdb4', '#9b6dff', '#d466b0'];
    let cursorX = 0, cursorY = 0;
    let prevX = null, prevY = null;
    let isMoving = false;
    let moveTimeout = null;
    let animFrame = null;

    // Inject keyframes once
    if (!document.getElementById('sparkle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'sparkle-keyframes';
      style.textContent = `
        @keyframes sparkleDrift {
          0% { opacity: 0.9; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.1); }
        }
        .sparkle-particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          animation: sparkleDrift var(--duration) ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }

    function spawnSparkle(x, y) {
      const el = document.createElement('div');
      el.className = 'sparkle-particle';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 5 + 2;
      const dx = (Math.random() - 0.5) * 40;
      const dy = (Math.random() - 0.5) * 40 - 15;
      const duration = Math.random() * 1 + 1.5;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = color;
      el.style.boxShadow = `0 0 ${size + 2}px ${color}80`;
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.setProperty('--duration', duration + 's');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), duration * 1000);
    }

    // Continuous render loop — spawns sparkles every frame while moving
    function sparkleLoop() {
      if (!isMoving) return;
      // Interpolate from previous to current
      if (prevX !== null) {
        const dx = cursorX - prevX;
        const dy = cursorY - prevY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          const steps = Math.max(1, Math.floor(dist / 12));
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const ix = prevX + dx * t;
            const iy = prevY + dy * t;
            spawnSparkle(ix + (Math.random() - 0.5) * 14, iy + (Math.random() - 0.5) * 14);
          }
        }
      }
      // Spawn at current position
      spawnSparkle(cursorX + (Math.random() - 0.5) * 14, cursorY + (Math.random() - 0.5) * 14);
      prevX = cursorX;
      prevY = cursorY;
      animFrame = requestAnimationFrame(sparkleLoop);
    }

    function handleMove(e) {
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        prevX = cursorX;
        prevY = cursorY;
        sparkleLoop();
      }
      // Reset the stop timer
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
        cancelAnimationFrame(animFrame);
        prevX = null;
        prevY = null;
      }, 100);
    }

    function handleTouch(e) {
      const touch = e.touches[0];
      if (touch) {
        handleMove({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }

    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('touchmove', handleTouch, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleTouch);
    };
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
    setTimeout(() => setB3Text('Evolve your company'), 5000);
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
            href="#invest"
            onClick={(e) => { e.preventDefault(); investRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
            className="nav-investors"
          >
            Investors
          </a>
          <a href="/pay" className="nav-investors">But who&apos;s gonna pay for it?</a>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="hero-title">Being human<br /><span className="hero-gradient">is the job now.</span><br /><span className="hero-sub">The rest is being automated.</span></h1>
        <img src="/badge.png" alt="J.O.B. Employee Badge" className="hero-badge" />
        <p
          className="question-text"
          onClick={() => {
            if (!heroRevealed) setHeroRevealed(true);
          }}
          style={{ cursor: !heroRevealed ? 'pointer' : 'default' }}
        >
          Welcome to the &ldquo;new human&rdquo; resource.
        </p>
        {!heroRevealed && (
          <span className="question-hint">click.</span>
        )}

        {heroRevealed && (
          <div className="hero-reveal">
            <p className="hero-narrative">
              Work never taught us how to be human. It fragmented us. So did religion.
              <br /><br />
              <span className="hero-gradient">Our J.O.B. is the integration.</span>
            </p>
            <div className="hero-cta">
              <p className="rco-explain">
                We&apos;re calling in individuals and organizations committed to exploring
                what it means to be fully human.
              </p>
              {!waitlistSubmitted ? (
                <>
                  <p className="rco-ask">If that&apos;s you, tell us you were here:</p>
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
                      placeholder="you@email.com"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="waitlist-input"
                      required
                    />
                    <button type="submit" className="waitlist-btn">was here</button>
                  </form>
                </>
              ) : (
                <p className="waitlist-confirmed">We see you. We&apos;ll be in touch.</p>
              )}
            </div>
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
          <div className="openings-header">J.O.B. stands for the Joy of Being.<br />Pick the portal you want to play in.</div>

          <div className="door">
            <div className="door-dept">Department of Becoming</div>
            <h2 className="door-title">The Church</h2>
            <p className="door-desc">
              Being is the new doing. Sunday Night Live gatherings. All questions, no answers.
              Unorganized religion where there is no deity or dogma, just the rediscovery of
              your personal sovereignty. Integrating the fragmentation of work and soul.
            </p>
            <a href="https://job-church.vercel.app" target="_blank" rel="noopener noreferrer" className="door-link">Become a member</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of Businessing Differently</div>
            <h2 className="door-title">Business 3.0</h2>
            <p className="door-desc">
              A new model for companies that want to be organisms, not machines.
              AI runs ops. Humans do human work.
              The companies that survive the next decade won&apos;t look like companies at all.
            </p>
            <a href="#" onClick={handleB3Click} className="door-link">{b3Text}</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of Getting Paid to Be Yourself</div>
            <h2 className="door-title">The J.O.B. Board</h2>
            <p className="door-desc">
              A marketplace for things AI can&apos;t do. Post a very unique human offer.
              Another human pays you for it. &ldquo;I&apos;ll hold your hand while you have
              that hard conversation.&rdquo; &ldquo;I&apos;ll draw you while you talk about
              your day.&rdquo; That&apos;s it. That&apos;s the job.
            </p>
            <a
              href="#"
              onClick={handleJobBoardClick}
              onMouseEnter={() => setJobBoardHover(true)}
              onMouseLeave={() => setJobBoardHover(false)}
              className="door-link"
            >{jobBoardHover ? 'Patience. The machines would\u2019ve finished by now.' : 'WIP'}</a>
          </div>

          <div className="door">
            <div className="door-dept">Department of You Had to Be There</div>
            <h2 className="door-title">Magic Shows</h2>
            <p className="door-desc">
              We can&apos;t explain these. You have to come.
            </p>
            {!magicOpen ? (
              <a href="#" onClick={(e) => { e.preventDefault(); setMagicOpen(true); }} className="door-link">Got a golden ticket?</a>
            ) : (
              <div className="magic-portal">
                <div className="magic-code-section">
                  <input
                    type="text"
                    placeholder="Enter Golden Ticket code"
                    value={magicCode}
                    onChange={(e) => setMagicCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && magicCode) {
                        // TODO: validate against real codes
                        setMagicCodeMsg('That\u2019s not it. But we like that you tried.');
                        setTimeout(() => setMagicCodeMsg(''), 3000);
                      }
                    }}
                    className="magic-input"
                  />
                  {magicCodeMsg && <span className="magic-code-msg">{magicCodeMsg}</span>}
                </div>
                <div className="magic-divider">
                  <span>or</span>
                </div>
                {!magicReferralSent ? (
                  <div className="magic-referral">
                    <p className="magic-referral-label">Someone told you. They weren&apos;t supposed to.</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (magicReferralEmail) {
                        supabase
                          .from('waitlist')
                          .insert({
                            email: magicReferralEmail,
                            name: magicReferralName || null,
                            note: magicReferralWhy || null,
                            source: 'magic_show_referral',
                          })
                          .then(() => setMagicReferralSent(true));
                      }
                    }}>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={magicReferralName}
                        onChange={(e) => setMagicReferralName(e.target.value)}
                        className="magic-input"
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={magicReferralEmail}
                        onChange={(e) => setMagicReferralEmail(e.target.value)}
                        className="magic-input"
                        required
                      />
                      <textarea
                        placeholder="Why should we invite you to a show?"
                        value={magicReferralWhy}
                        onChange={(e) => setMagicReferralWhy(e.target.value)}
                        className="magic-input magic-textarea"
                        rows={3}
                      />
                      <button type="submit" className="magic-btn">Put me on the list anyway</button>
                    </form>
                  </div>
                ) : (
                  <p className="magic-confirmed">You&apos;ll know when you know.</p>
                )}
              </div>
            )}
          </div>

          <div className="door">
            <div className="door-dept">Department of 4th Spaces</div>
            <h2 className="door-title">MagicShowLand</h2>
            <p className="door-desc">
              If Meow Wolf, Indeed, and AA had a baby.
              Physical spaces where humans go to remember what they are.
              Immersive. Transformational. Weird on purpose. You&apos;ll leave different
              than you came in.
            </p>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); }}
              onMouseEnter={() => setMslHover(true)}
              onMouseLeave={() => setMslHover(false)}
              className="door-link"
            >{mslHover ? 'We\u2019re scouting castles. Literally.' : 'Locations coming soon'}</a>
          </div>

          <div className="door" ref={investRef}>
            <div className="door-dept">Department of Putting Your Money Where Your Species Is</div>
            <h2 className="door-title">Invest</h2>
            <p className="door-desc">
              This is an invitation to fund a species-level upgrade.
              We&apos;re the new human resources that will create the new human economy.
              Expressing interest doesn&apos;t commit you to anything — it just starts the conversation.
            </p>
            {investStatus === 'success' ? (
              <p className="magic-confirmed">You&apos;re in. We&apos;ll be in touch when the organism is ready for you.</p>
            ) : (
              <form className="invest-form" onSubmit={async (e) => {
                e.preventDefault();
                setInvestStatus('submitting');
                const { error } = await supabase.from('deck_waitlist').insert([{
                  name: investForm.name,
                  email: investForm.email,
                  phone: investForm.phone || null,
                  investment_level: investForm.investment_level || null,
                }]);
                setInvestStatus(error ? 'error' : 'success');
              }}>
                <div className="invest-form-field">
                  <label>Name *</label>
                  <input type="text" required value={investForm.name} onChange={e => setInvestForm(f => ({ ...f, name: e.target.value }))} className="magic-input" placeholder="Your name" />
                </div>
                <div className="invest-form-field">
                  <label>Email *</label>
                  <input type="email" required value={investForm.email} onChange={e => setInvestForm(f => ({ ...f, email: e.target.value }))} className="magic-input" placeholder="Your email" />
                </div>
                <div className="invest-form-field">
                  <label>Phone</label>
                  <input type="tel" value={investForm.phone} onChange={e => setInvestForm(f => ({ ...f, phone: e.target.value }))} className="magic-input" placeholder="Your phone (optional)" />
                </div>
                <div className="invest-form-field">
                  <label>Investment Interest</label>
                  <select value={investForm.investment_level} onChange={e => setInvestForm(f => ({ ...f, investment_level: e.target.value }))} className="magic-input">
                    <option value="">Select a range</option>
                    <option value="$1K-$10K">$1K – $10K</option>
                    <option value="$10K-$50K">$10K – $50K</option>
                    <option value="$50K-$100K">$50K – $100K</option>
                    <option value="$100K-$500K">$100K – $500K</option>
                    <option value="$500K+">$500K+</option>
                    <option value="Just watching">Just watching for now</option>
                  </select>
                </div>
                <button type="submit" className="magic-btn" disabled={investStatus === 'submitting'}>
                  {investStatus === 'submitting' ? 'Joining...' : investStatus === 'error' ? 'Try again' : 'Join the Organism'}
                </button>
              </form>
            )}
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

      {/* ===== THE JOB LISTING ===== */}
      <section className="listing">
        <div className="listing-inner">
        <div className="listing-header">
          <div className="listing-company">J.O.B. Openings</div>
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
            We&apos;re looking for someone who is alive. You&apos;ll be responsible
            for figuring out what you&apos;re here for and then doing that, possibly in front
            of other people, possibly for money.
          </p>

          <h3>Responsibilities</h3>
          <ul>
            <li>Showing up (harder than it sounds)</li>
            <li>Doing the inner work</li>
            <li>And then, and only then, doing the external work</li>
            <li>Unlearning most of what you were taught</li>
          </ul>

          <h3>Benefits</h3>
          <ul>
            <li>Obliterating the separation of work and soul</li>
            <li>A community of people who want to co-create a new reality</li>
            <li>A marketplace where you get paid to be yourself</li>
            <li>The chance to build a company that runs like an organism, not a factory</li>
            <li>The chance to win a golden ticket to a Magic Show</li>
          </ul>

          <h3>Qualifications</h3>
          <ul>
            <li>Must be a human (AI need not apply)</li>
            <li>Must be at a threshold between who you were and who you&apos;re becoming</li>
            <li>Experience in deconstruction (preferred, but also inevitable)</li>
          </ul>

          <span
            className="ai-flag"
            onMouseEnter={() => setAiHover(true)}
            onMouseLeave={() => setAiHover(false)}
          >
            {aiHover
              ? 'This role has been flagged by AI as "not a real job." Which, fair. We\'re inspiring, not hiring. Yet...'
              : 'This role has been flagged by AI as "not a real job." Which, fair. We\'re inspiring, not hiring. Yet...'
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
            We&apos;re a church. We&apos;re a marketplace. We&apos;re a consulting firm.
            We&apos;re an incubator. We&apos;re a species-level intervention
            disguised as a job board.
          </p>
          <p>
            People keep asking <strong>&ldquo;but what IS it?&rdquo;</strong> and
            we&apos;re like, <em>&ldquo;What&apos;s your J.O.B.?&rdquo;</em>
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
        </div>
      </section>

      {/* ===== THE CLOSE ===== */}
      <section className="close-section">
        <div className="close-inner">
          <p className="close-quote close-quote-bold">
            &ldquo;You never change things by fighting the existing reality. To change
            something, build a new model that makes the existing model obsolete.&rdquo;
          </p>
          <p className="close-attribution">&mdash; Buckminster Fuller</p>
          {!closeRevealed && (
            <a href="#" onClick={(e) => { e.preventDefault(); setCloseRevealed(true); }} className="btn-enter">Build a new model</a>
          )}
          {closeRevealed && (
            <div className="close-reveal">
              <p className="close-vision">What if J.O.B. became the new human resources?</p>
              <p className="close-vision">What if J.O.B. became the largest <s>employer</s> deployer on the planet?</p>
              <p className="close-vision">What if we accidentally on purpose created the new human economy?</p>
              <a href="#" onClick={handleFindDoor} className="btn-enter" style={{ marginTop: '2rem' }}>Pick your portal</a>
            </div>
          )}
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
            <a href="#" onClick={handleB3Click}>{b3Text === 'Evolve your company' ? 'Business 3.0' : b3Text}</a>
            <a href="#" onClick={handleMagicClick}>{magicText === 'Get invited' ? 'Magic Shows' : magicText}</a>
            <a href="#invest" onClick={(e) => { e.preventDefault(); investRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Investors</a>
          </div>
          <p className="footer-fine-print">
            This page was not written by AI. We asked. It said this was too weird.
          </p>
        </div>
      </footer>
    </>
  );
}
