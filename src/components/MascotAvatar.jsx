// src/components/MascotAvatar.jsx

export default function MascotAvatar({ size = 'md', mood = 'happy', className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    hero: 'w-32 h-32'
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      role="img"
      className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 via-teal-300 to-amber-200 p-0.5 shadow-sm transition-transform hover:scale-105 ${dim} ${className}`}
      aria-label="Foggy Mascot Avatar"
    >
      <div className="w-full h-full rounded-[14px] bg-slate-900/90 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-4/5 h-4/5 drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft outer mist cloud shape */}
          <path
            d="M26 62C21.03 62 17 57.97 17 53C17 48.35 20.53 44.53 25.07 44.06C26.31 35.03 34.02 28 43.5 28C48.65 28 53.28 30.13 56.6 33.56C59.78 31.33 63.68 30 67.89 30C78.44 30 87 38.56 87 49.11C87 49.77 86.96 50.42 86.89 51.06C90.45 52.82 93 56.54 93 61C93 66.52 88.52 71 83 71H28C22.48 71 18 66.52 18 61"
            fill="url(#cloudGrad)"
            opacity="0.95"
          />

          {/* Friendly eyes */}
          <ellipse cx="45" cy="50" rx="3.5" ry="4.5" fill="#0F172A" />
          <ellipse cx="63" cy="50" rx="3.5" ry="4.5" fill="#0F172A" />

          {/* Eye sparkles */}
          <circle cx="43.5" cy="48.5" r="1.2" fill="#FFFFFF" />
          <circle cx="61.5" cy="48.5" r="1.2" fill="#FFFFFF" />

          {/* Rosy cheeks */}
          <circle cx="39" cy="56" r="3" fill="#FB7185" opacity="0.6" />
          <circle cx="69" cy="56" r="3" fill="#FB7185" opacity="0.6" />

          {/* Cheerful reassuring smile */}
          {mood === 'thinking' ? (
            <path d="M49 57Q54 55 59 57" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
          ) : (
            <path
              d="M48 56C51 60 57 60 60 56"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Gradients */}
          <defs>
            <linearGradient
              id="cloudGrad"
              x1="17"
              y1="28"
              x2="93"
              y2="71"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#E0F2FE" />
              <stop offset="0.6" stopColor="#BAE6FD" />
              <stop offset="1" stopColor="#FDE68A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Little floating mist particles badge */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
      </span>
    </div>
  );
}
