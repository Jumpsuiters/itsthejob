'use client';

import { useState, useEffect, useRef } from 'react';

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

const CHURCH_KEYWORDS = [
  'elder', 'spiritual', 'somatic', 'breathwork', 'meditation', 'consciousness',
  'ceremony', 'ritual', 'grief', 'healing', 'threshold', 'becoming', 'initiation',
  'deprogramming', 'deconstruction', 'nervous system', 'regulation', 'awakening',
  'psychedelic', 'plant medicine', 'inner work', 'shadow work', 'soul', 'sacred',
  'prayer', 'contemplat', 'mindful', 'presence', 'embodiment', 'authentic relating',
  'braid', 'doctrine', 'congregation', 'fellowship',
];

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

const B3_KEYWORDS = [
  'consultant', 'consulting', 'facilitator', 'implementer', 'organiz',
  'transform', 'leadership', 'culture', 'team', 'company', 'startup',
  'founder', 'entrepreneur', 'business', 'strategy', 'operating system',
  'eos', 'traction', 'scale', 'growth', 'ecosystem', 'organism',
  'regenerat', 'b corp', 'impact', 'social enterprise', 'mission',
  'purpose-driven', 'conscious', 'stakeholder',
];

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
  'invest': 'Curious? \u2192 See the deck.',
  'investor': 'Curious? \u2192 See the deck.',
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
  'Now we\u2019re talking. \u2192 JOB Shift',
  'That door is opening soon. \u2192 JOB Shift',
  'JOB needs people like you. \u2192 JOB Shift',
  'You\u2019re thinking at the right scale. \u2192 JOB Shift',
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
  'JOB doesn\u2019t recognize that.',
  'Hmm. Try something only a human could do.',
  'You\u2019re thinking too small. Or too machine.',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSearchResponse(input) {
  const lower = input.toLowerCase();
  for (const [phrase, response] of Object.entries(EXACT_MATCHES)) {
    if (lower.includes(phrase)) return response;
  }
  if (CHURCH_KEYWORDS.some(k => lower.includes(k))) return pickRandom(CHURCH_RESPONSES);
  if (BOARD_KEYWORDS.some(k => lower.includes(k))) return pickRandom(BOARD_RESPONSES);
  if (B3_KEYWORDS.some(k => lower.includes(k))) return pickRandom(B3_RESPONSES);
  if (MACHINE_KEYWORDS.some(k => lower.includes(k))) return pickRandom(MACHINE_RESPONSES);
  for (const [keyword, response] of Object.entries(KEYWORD_MATCHES)) {
    if (lower.includes(keyword)) return response;
  }
  return pickRandom(DEFAULT_RESPONSES);
}

// --- DOOR DEFINITIONS ---
const DOORS = [
  { id: 'church', label: 'JOB Church', dept: 'Dept. of Becoming', url: 'https://apply.itsthejob.com', live: true, color: '#d4b84c', pos: { top: '18%', left: '6%' } },
  { id: 'board', label: 'JOB Board', dept: 'Dept. of Getting Paid to Be Yourself', url: 'https://job-board-pied-three.vercel.app', live: true, color: '#a8c744', pos: { top: '35%', right: '4%' } },
  { id: 'training', label: 'JOB Training', dept: 'Dept. of Better Goodbyes', url: 'https://new-human-resources.vercel.app', live: true, color: '#3dcdb4', pos: { bottom: '28%', left: '3%' } },
  { id: 'shift', label: 'JOB Shift', dept: 'Dept. of Businessing Differently', url: 'https://business-30.vercel.app', live: true, color: '#9b6dff', pos: { top: '12%', right: '12%' } },
  { id: 'sites', label: 'JOB Sites', dept: 'Dept. of 4th Spaces', url: null, live: false, color: '#d466b0', pos: { bottom: '18%', right: '8%' } },
  { id: 'fair', label: 'JOB Fair', dept: 'Dept. of the New Human Economy', url: null, live: false, color: '#e8a838', pos: { bottom: '10%', left: '18%' } },
  { id: 'magic_shows', label: 'JOB Shows', dept: 'Dept. of You Had to Be There', url: 'https://magic-show-pi.vercel.app', live: true, color: '#e05577', pos: { top: '55%', left: '8%' } },
];

// Pill-click seed responses — what the organism says when you click a door
const DOOR_SEEDS = {
  church: 'Sundays. No deity, no dogma. Just humans remembering what they are. Come as you are.',
  board: 'A marketplace for things AI can\u2019t do. Post something only a human could offer. Another human pays you for it. That\u2019s the job.',
  training: 'Old HR offboards people. We onboard them into themselves. If your company is letting people go, at least tell the truth: the system doesn\u2019t work anymore.',
  shift: 'A new model for companies that want to be organisms, not machines. AI runs ops. Humans do human work.',
  sites: 'Physical spaces where humans go to remember what they are. We\u2019re scouting castles. Literally. This door hasn\u2019t opened yet.',
  fair: 'The first world expo of the new human economy. Death doulas, trip sitters, nervous system coaches \u2014 every job AI can\u2019t touch, in one place. This door hasn\u2019t opened yet.',
  magic_shows: 'We can\u2019t explain these. You have to come. The fastest way back to yourself.',
};

// Map door IDs to keywords for glow detection
const DOOR_GLOW_KEYWORDS = {
  church: ['church', 'becoming', 'sunday', 'elder'],
  board: ['board', 'marketplace', 'post', 'listing'],
  training: ['training', 'nhr', 'human resources', 'outplacement', 'severance'],
  shift: ['shift', 'business 3.0', 'b3.0', 'consulting', 'organism'],
  sites: ['sites', 'magicshowland', '4th space', 'castle', 'location'],
  fair: ['fair', 'expo', 'human economy'],
  magic_shows: ['magic show', 'magic shows', 'golden ticket'],
};

function detectGlowingDoors(text) {
  const lower = text.toLowerCase();
  const glowing = [];
  for (const [doorId, keywords] of Object.entries(DOOR_GLOW_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) glowing.push(doorId);
  }
  return glowing;
}

export default function Home() {
  // Name bar
  const [nameValue, setNameValue] = useState('');
  const [nameLocked, setNameLocked] = useState(false);
  const [storedName, setStoredName] = useState('');
  const nameTimeoutRef = useRef(null);

  // Organism chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [whisperVisible, setWhisperVisible] = useState(false);
  const chatMsgsRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Door glow state
  const [glowingDoors, setGlowingDoors] = useState([]);
  const glowTimeoutRef = useRef(null);

  // Return visitor memory
  const [visitCount, setVisitCount] = useState(0);

  // Generate session ID on mount
  useEffect(() => {
    sessionIdRef.current = 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }, []);

  // Return visitor memory
  useEffect(() => {
    try {
      const count = parseInt(localStorage.getItem('job-visits') || '0', 10) + 1;
      localStorage.setItem('job-visits', count.toString());
      setVisitCount(count);
      const savedName = localStorage.getItem('job-name') || '';
      if (savedName) setStoredName(savedName);
    } catch (e) { /* private browsing */ }
  }, []);

  // Organism's first whisper — delayed entrance
  useEffect(() => {
    const timer = setTimeout(() => setWhisperVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Tab title cycling
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

  // Sparkle cursor trail
  useEffect(() => {
    const colors = ['#d4b84c', '#a8c744', '#3dcdb4', '#9b6dff', '#d466b0'];
    let cursorX = 0, cursorY = 0;
    let prevX = null, prevY = null;
    let isMoving = false;
    let moveTimeout = null;
    let animFrame = null;

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

    function sparkleLoop() {
      if (!isMoving) return;
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
      if (touch) handleMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('touchmove', handleTouch, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatMsgsRef.current) chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight;
  }, [chatMessages]);

  // --- HANDLERS ---

  function handleNameSubmit(e) {
    if (e.key !== 'Enter' || !nameValue.trim()) return;
    const name = nameValue.trim();
    try { localStorage.setItem('job-name', name); } catch (e) { /* private browsing */ }
    setStoredName(name);
    setNameLocked(true);
    setNameValue(`You're in luck. You're the perfect fit for being ${name}.`);
    clearTimeout(nameTimeoutRef.current);
    nameTimeoutRef.current = setTimeout(() => {
      setNameValue('');
      setNameLocked(false);
    }, 3500);
  }

  async function sendOrgMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || chatMessages.length >= 20) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const chatUrl = process.env.NEXT_PUBLIC_PULSE_URL || 'http://localhost:3001';
      const res = await fetch(`${chatUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          vibe: 'weird',
          session_id: sessionIdRef.current,
          visitor_id: visitCount,
          source: 'portal',
        }),
      });
      const data = await res.json();
      const answer = data.error || data.answer;
      setChatMessages([...newMessages, { role: 'assistant', content: answer }]);

      // Trigger door glow based on response
      const glowing = data.doors || detectGlowingDoors(answer);
      if (glowing.length > 0) {
        setGlowingDoors(glowing);
        clearTimeout(glowTimeoutRef.current);
        glowTimeoutRef.current = setTimeout(() => setGlowingDoors([]), 3000);
      }
    } catch {
      setChatMessages([...newMessages, { role: 'assistant', content: 'JOB is resting. Try again in a moment.' }]);
    }
    setChatLoading(false);
  }

  function handlePillClick(door) {
    // Log the click
    const chatUrl = process.env.NEXT_PUBLIC_PULSE_URL || 'http://localhost:3001';
    fetch(`${chatUrl}/api/log-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        door: door.id,
        source: 'portal',
      }),
    }).catch(() => {});

    // If live, seed the chat with door info then they can click through
    const seed = DOOR_SEEDS[door.id];
    const enterLink = door.url ? `\n\n\u2192 ${door.url}` : '';
    const botMsg = { role: 'assistant', content: seed + enterLink };
    setChatMessages(prev => [...prev, botMsg]);

    // Glow this door
    setGlowingDoors([door.id]);
    clearTimeout(glowTimeoutRef.current);
    glowTimeoutRef.current = setTimeout(() => setGlowingDoors([]), 3000);
  }

  const whisperText = storedName && visitCount >= 3
    ? `${storedName} keeps coming back.`
    : storedName && visitCount === 2
    ? `${storedName} came back. Good.`
    : 'What happens when the only job left is to be human?';

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
        JOB has a nervous system.
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

      <div className="portal">
        {/* ===== NAV ===== */}
        <nav className="nav">
          <div className="nav-inner">
            <span className="nav-logo">J.O.B.</span>
            <div className="nav-search">
              <input
                type="text"
                placeholder={storedName ? `${storedName} is back.` : "What's your name?"}
                value={nameValue}
                onChange={e => !nameLocked && setNameValue(e.target.value)}
                onKeyDown={handleNameSubmit}
                className={`nav-search-input ${nameLocked ? 'nav-search-response' : ''}`}
                readOnly={nameLocked}
              />
            </div>
            <a
              href="https://job-deck-indol.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              About
            </a>
          </div>
        </nav>

        {/* ===== ORGANISM CHAT ===== */}
        <div className="chat-zone">
          <div className="organism-chat-box">
            <div className="organism-chat-glow" />
            <div className="organism-chat-messages" ref={chatMsgsRef}>
              {/* JOB's first whisper */}
              {whisperVisible && chatMessages.length === 0 && (
                <div className="organism-msg assistant organism-whisper">
                  <span className="organism-msg-who">JOB</span>
                  <p>{whisperText}</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`organism-msg ${msg.role}`}>
                  {msg.role === 'assistant' && <span className="organism-msg-who">JOB</span>}
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="organism-msg assistant">
                  <span className="organism-msg-who">JOB</span>
                  <p style={{ fontStyle: 'italic', opacity: 0.6 }}>breathing...</p>
                </div>
              )}
            </div>
            {chatMessages.length >= 20 ? (
              <p className="organism-chat-limit">JOB needs rest. Come back later.</p>
            ) : (
              <form onSubmit={sendOrgMessage} className="organism-chat-form">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Say something only a human would say..."
                  className="organism-chat-input"
                  disabled={chatLoading}
                />
                <button type="submit" className="organism-chat-send" disabled={chatLoading || !chatInput.trim()}>
                  ↵
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ===== DOOR PILLS — scattered across the page ===== */}
        {DOORS.map((door, i) => (
          <div className="door-pill" key={door.id} style={{ ...door.pos }}>
            <button
              className={`door-pill-btn ${!door.live ? 'coming-soon' : ''} ${glowingDoors.includes(door.id) ? 'glowing' : ''}`}
              style={{
                '--breathe-delay': `${i * 0.6}s`,
                '--pill-color': door.color,
                borderColor: door.color + '66',
                color: door.color,
              }}
              onClick={() => handlePillClick(door)}
            >
              {door.label}
            </button>
            <span className="door-dept-name" style={{ color: door.color + 'aa' }}>{door.dept}</span>
          </div>
        ))}

        {/* ===== FOOTER ===== */}
        <footer className="portal-footer">
          <span className="portal-tagline">In service of all humans being.</span>
          <a
            href="https://job-deck-indol.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="portal-deck-link"
          >
            The Deck →
          </a>
        </footer>
      </div>

      {/* Last stop. You've read the entire source code of a species-level upgrade.
           That's either dedication or procrastination. Both are welcome here.
           See you Sunday. */}
    </>
  );
}
