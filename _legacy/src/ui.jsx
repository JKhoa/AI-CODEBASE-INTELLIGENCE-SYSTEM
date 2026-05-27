// UI primitives — Button, Card, Badge, Tabs, Tooltip, Skeleton, Switch, etc.
// Small reusable building blocks themed for the dark Linear/Vercel aesthetic.

const cx = (...xs) => xs.filter(Boolean).join(' ');

function Button({ as: Tag = 'button', variant = 'default', size = 'md', className = '', children, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    default: 'bg-ink-700 hover:bg-ink-600 text-ink-50 border border-ink-600',
    primary: 'bg-teal-500 hover:bg-teal-400 text-ink-950 border border-teal-400/40 shadow-[0_4px_18px_-6px_rgba(20,184,166,0.6)]',
    ghost:   'hover:bg-ink-700 text-ink-100 border border-transparent',
    outline: 'border border-ink-600 hover:border-ink-500 text-ink-100 bg-transparent hover:bg-ink-800',
    subtle:  'bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-700',
    danger:  'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30',
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-xs rounded-lg',
    md: 'h-9 px-3.5 text-sm rounded-lg',
    lg: 'h-11 px-5 text-sm rounded-xl',
    xl: 'h-14 px-6 text-base rounded-xl',
    icon: 'h-9 w-9 rounded-lg',
    iconSm: 'h-7 w-7 rounded-md',
  };
  return <Tag className={cx(base, variants[variant], sizes[size], className)} {...rest}>{children}</Tag>;
}

function Card({ className = '', children, ...rest }) {
  return <div className={cx('bg-ink-800 border border-ink-700 rounded-xl2 shadow-soft', className)} {...rest}>{children}</div>;
}

function Badge({ tone = 'neutral', className = '', children }) {
  const tones = {
    neutral: 'bg-ink-700 text-ink-100 border-ink-600',
    teal:    'bg-teal-500/15 text-teal-400 border-teal-500/30',
    green:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    red:     'bg-red-500/15 text-red-300 border-red-500/30',
    amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    yellow:  'bg-yellow-400/15 text-yellow-200 border-yellow-400/25',
    blue:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
    purple:  'bg-violet-500/15 text-violet-300 border-violet-500/30',
    slate:   'bg-ink-700/70 text-ink-200 border-ink-600',
  };
  return <span className={cx('inline-flex items-center gap-1 px-2 h-5 rounded-md border text-[11px] font-medium tracking-tight', tones[tone], className)}>{children}</span>;
}

function Kbd({ children, className = '' }) {
  return <kbd className={cx('inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10.5px] font-mono font-medium bg-ink-700 border border-ink-600 text-ink-200 rounded-md', className)}>{children}</kbd>;
}

function Skeleton({ className = '' }) {
  return <div className={cx('skel', className)} />;
}

function SegControl({ value, onChange, options, size = 'md' }) {
  const h = size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[12.5px]';
  return (
    <div className={cx('inline-flex items-center bg-ink-900 border border-ink-700 rounded-lg p-0.5', h)}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cx(
            'px-3 h-full rounded-md transition-all font-medium',
            value === opt.value ? 'bg-ink-700 text-ink-50 shadow-soft' : 'text-ink-200 hover:text-ink-50'
          )}
        >{opt.label}</button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      data-on={checked ? 'true' : 'false'}
      onClick={() => onChange(!checked)}
    />
  );
}

function Tooltip({ text, children, side = 'top' }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className={cx(
          'absolute z-50 px-2 py-1 rounded-md bg-ink-600 border border-ink-500 text-ink-50 text-[11px] whitespace-nowrap pointer-events-none shadow-soft',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5',
          side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
        )}>{text}</span>
      )}
    </span>
  );
}

function LangIcon({ lang, size = 14 }) {
  const map = {
    ts:    { color: '#3178C6', label: 'TS' },
    tsx:   { color: '#3178C6', label: 'TSX' },
    js:    { color: '#F7DF1E', label: 'JS' },
    jsx:   { color: '#F7DF1E', label: 'JSX' },
    py:    { color: '#3776AB', label: 'PY' },
    rs:    { color: '#DEA584', label: 'RS' },
    go:    { color: '#00ADD8', label: 'GO' },
    java:  { color: '#EA8A35', label: 'JV' },
    md:    { color: '#8C95A8', label: 'MD' },
    json:  { color: '#A78BFA', label: '{}' },
    yml:   { color: '#FB7185', label: 'Y' },
    css:   { color: '#38BDF8', label: 'C' },
    html:  { color: '#FB923C', label: 'H' },
    sh:    { color: '#10B981', label: '$' },
    sql:   { color: '#F472B6', label: 'SQ' },
    txt:   { color: '#8C95A8', label: 'T' },
  };
  const m = map[lang] || { color: '#5A6273', label: '?' };
  return (
    <span
      className="inline-flex items-center justify-center font-mono font-bold rounded-[3px] text-[8px] flex-shrink-0"
      style={{ width: size, height: size, background: m.color + '22', color: m.color, border: `1px solid ${m.color}55` }}
    >{m.label}</span>
  );
}

function Severity({ level }) {
  const map = {
    critical: { color: '#ef4444', label: 'Critical', tone: 'red' },
    high:     { color: '#ef4444', label: 'High',     tone: 'red' },
    medium:   { color: '#f59e0b', label: 'Medium',   tone: 'amber' },
    low:      { color: '#fbbf24', label: 'Low',      tone: 'yellow' },
    info:     { color: '#60a5fa', label: 'Info',     tone: 'blue' },
  };
  const m = map[level] || map.info;
  return <Badge tone={m.tone}><span className="sev-dot" style={{background: m.color}}/>{m.label}</Badge>;
}

function RiskChip({ level }) {
  const map = {
    Low:    { tone: 'green', dot: '#10b981' },
    Medium: { tone: 'amber', dot: '#f59e0b' },
    High:   { tone: 'red',   dot: '#ef4444' },
  };
  const m = map[level] || map.Low;
  return <Badge tone={m.tone}><span className="sev-dot" style={{background: m.dot}}/>{level}</Badge>;
}

function Spinner({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cx('animate-spin', className)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// Code block with very light token highlighting
function CodeBlock({ code, lang = 'ts', highlightLines = [], className = '' }) {
  const lines = code.split('\n');
  return (
    <div className={cx('code-bg rounded-lg border border-ink-700 overflow-hidden text-[12.5px] font-mono', className)}>
      <div className="flex">
        <div className="py-2 px-3 text-ink-300 select-none border-r border-ink-700 text-right">
          {lines.map((_, i) => <div key={i} className="leading-[1.7]">{i + 1}</div>)}
        </div>
        <pre className="py-2 px-3 overflow-x-auto flex-1">
          {lines.map((ln, i) => (
            <div key={i} className={cx('leading-[1.7]', highlightLines.includes(i + 1) && 'bg-red-500/10 -mx-3 px-3 border-l-2 border-red-500/60')}>
              <TokenLine text={ln} lang={lang} />
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function TokenLine({ text }) {
  // Very crude tokenizer for visual flair only.
  const KW = /\b(import|from|export|const|let|var|function|return|if|else|for|while|class|new|async|await|try|catch|throw|of|in|true|false|null|undefined|def|self|None|True|False|require|module)\b/g;
  const STR = /(['"`])((?:\\.|(?!\1).)*?)\1/g;
  const COM = /(\/\/[^\n]*|#[^\n]*)/g;
  const NUM = /\b(\d+(?:\.\d+)?)\b/g;

  // tokenize via splitting indices
  const parts = [];
  let i = 0;
  const tokens = [];
  const findAll = (re, cls) => {
    let m; re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      tokens.push({ start: m.index, end: m.index + m[0].length, cls, text: m[0] });
    }
  };
  findAll(COM, 'tok-c');
  findAll(STR, 'tok-s');
  findAll(KW, 'tok-k');
  findAll(NUM, 'tok-n');
  tokens.sort((a, b) => a.start - b.start);
  // Remove overlaps (comment > string > kw > num via sorted start; but we filter)
  const filtered = [];
  let cursor = 0;
  for (const t of tokens) {
    if (t.start < cursor) continue;
    filtered.push(t);
    cursor = t.end;
  }
  const out = [];
  let pos = 0;
  filtered.forEach((t, idx) => {
    if (pos < t.start) out.push(<span key={'p'+idx}>{text.slice(pos, t.start)}</span>);
    out.push(<span key={'t'+idx} className={t.cls}>{t.text}</span>);
    pos = t.end;
  });
  if (pos < text.length) out.push(<span key="last">{text.slice(pos)}</span>);
  if (out.length === 0) return <span>{text || '\u00A0'}</span>;
  return <>{out}</>;
}

// ===== INTERACTIVE COMPONENTS =====

// Slide-in detail panel used by Architecture, Flow, and Module tabs
function DetailPanel({ children, onClose, className = '' }) {
  return (
    <div className={cx('detail-panel border-t border-ink-700 bg-ink-800/95 backdrop-blur-sm', className)}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink-700/60">
        <span className="text-[11.5px] uppercase tracking-wider text-teal-400 font-medium">Chi tiết / Details</span>
        {onClose && (
          <button onClick={onClose} className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-ink-700 text-ink-300 hover:text-ink-100 transition-colors">
            <Icon name="x" size={14}/>
          </button>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// Mini donut chart for severity summary
function MiniDonut({ segments, size = 56, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="#1d222c" strokeWidth={strokeWidth} fill="none"/>
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference;
        const el = (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="donut-ring"
            style={{ transition: `stroke-dasharray .6s ease-out ${i * 0.1}s` }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// Impact meter bar
function ImpactMeter({ value, max = 100, color = '#ef4444' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="impact-meter">
      <div className="impact-meter-fill" style={{ width: pct + '%', background: color }}/>
    </div>
  );
}

// Animated number counter
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = React.useState(0);
  const numValue = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
  React.useEffect(() => {
    if (isNaN(numValue)) { setDisplay(value); return; }
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (numValue - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [numValue, duration]);
  return <>{typeof display === 'number' ? display.toLocaleString() : display}</>;
}

// Sparkline mini chart
function Sparkline({ data, width = 60, height = 20, color = '#14B8A6' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M ${points.join(' L ')}`;
  return (
    <svg width={width} height={height} className="sparkline">
      <path d={d} stroke={color} opacity="0.7"/>
    </svg>
  );
}

// AI Assessment Components
function ConfidenceGauge({ score }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#14B8A6' : score >= 60 ? '#F59E0B' : '#EF4444';
  
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="transform -rotate-90 w-16 h-16">
        <circle cx="32" cy="32" r={radius} stroke="#262C37" strokeWidth="4" fill="none" />
        <circle cx="32" cy="32" r={radius} stroke={color} strokeWidth="4" fill="none" 
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-ink-100"><AnimatedNumber value={score}/>%</span>
      </div>
    </div>
  );
}

function ContradictionAlert({ item, t, lang }) {
  const isHigh = item.type === 'high';
  return (
    <div className={cx("flex gap-3 p-4 rounded-lg border", isHigh ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20")}>
      <Icon name="alert-triangle" size={18} className={isHigh ? "text-red-400 mt-0.5 flex-shrink-0" : "text-amber-400 mt-0.5 flex-shrink-0"} />
      <div>
        <h4 className={cx("text-sm font-medium mb-1", isHigh ? "text-red-400" : "text-amber-400")}>
          {t.ass.contradiction}
        </h4>
        <p className="text-sm text-ink-200 leading-relaxed">{item[lang]}</p>
      </div>
    </div>
  );
}

function SuitabilityCard({ type, items, t, lang }) {
  const isGood = type === 'good';
  return (
    <div className="flex-1 bg-ink-900/50 rounded-xl p-4 border border-ink-800">
      <div className="flex items-center gap-2 mb-3">
        <div className={cx("w-6 h-6 rounded-full flex items-center justify-center", isGood ? "bg-teal-500/20 text-teal-400" : "bg-ink-700 text-ink-300")}>
          <Icon name={isGood ? "check" : "x"} size={12} />
        </div>
        <span className="text-sm font-medium text-ink-100">
          {isGood ? t.ass.goodFor : t.ass.badFor}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-start gap-2 text-[13px] text-ink-200">
            <span className={cx("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", isGood ? "bg-teal-500" : "bg-ink-600")} />
            <span className="leading-relaxed">{it[lang]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RichQACard({ item, lang }) {
  const { q, a, icon, status, tags } = item;
  
  return (
    <div className="bg-ink-900/40 rounded-xl p-4 border border-ink-800 hover:border-teal-500/30 transition-all duration-300 group flex flex-col h-full">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/10 group-hover:border-teal-500/30 group-hover:text-teal-400 transition-colors text-ink-300">
          <Icon name={icon || 'info'} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-medium text-ink-50 mb-1 leading-snug">{q}</h4>
          {status && (
            <div className={cx("inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full",
              status.color === 'teal' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
              status.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              status.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-ink-800 text-ink-300 border border-ink-700'
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {status.text}
            </div>
          )}
        </div>
      </div>
      
      <div className="text-[13px] text-ink-200 leading-relaxed flex-1">
        {a[lang]}
      </div>
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-ink-800/50">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-ink-800/80 border border-ink-700 rounded text-[11px] text-ink-300 font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BeginnerGuideCard({ guide, lang, repoName }) {
  if (!guide) return null;
  const isVi = lang === 'vi';
  
  // Thay thế các từ khóa Next.js bằng tên repo thật nếu có
  const analogy = guide.analogy[lang].replace(/Next\.js/gi, repoName || 'Dự án này');
  const purpose = guide.simplePurpose[lang].replace(/Next\.js/gi, repoName || 'Dự án này');

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 to-ink-900/40 rounded-xl p-5 border border-indigo-500/20 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Icon name="lightbulb" size={16} />
        </div>
        <h3 className="text-[15px] font-semibold text-indigo-300">
          {isVi ? 'Góc giải thích cho người mới (ELI5)' : 'Beginner\'s Corner (ELI5)'}
        </h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400/70 mb-1">
            {isVi ? 'Ví von (Analogy)' : 'Analogy'}
          </div>
          <div className="text-[13.5px] text-ink-50 leading-relaxed bg-ink-900/50 p-3 rounded-lg border border-indigo-500/10 italic">
            "{analogy}"
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400/70 mb-1">
            {isVi ? 'Thực chất làm gì?' : 'What does it do?'}
          </div>
          <div className="text-[13px] text-ink-200 leading-relaxed">
            {purpose}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400/70 mb-1">
            {isVi ? 'Tại sao nên dùng?' : 'Why use it?'}
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
            {guide.coreValue.map((cv, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-100 bg-ink-900/30 p-2 rounded-md border border-ink-800">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>{cv[lang]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

window.cx = cx;
window.Button = Button;
window.Card = Card;
window.Badge = Badge;
window.Kbd = Kbd;
window.Skeleton = Skeleton;
window.SegControl = SegControl;
window.Switch = Switch;
window.Tooltip = Tooltip;
window.LangIcon = LangIcon;
window.Severity = Severity;
window.RiskChip = RiskChip;
window.Spinner = Spinner;
window.CodeBlock = CodeBlock;
window.DetailPanel = DetailPanel;
window.MiniDonut = MiniDonut;
window.ImpactMeter = ImpactMeter;
window.AnimatedNumber = AnimatedNumber;
window.Sparkline = Sparkline;
window.ConfidenceGauge = ConfidenceGauge;
window.ContradictionAlert = ContradictionAlert;
window.SuitabilityCard = SuitabilityCard;
window.RichQACard = RichQACard;
window.BeginnerGuideCard = BeginnerGuideCard;

