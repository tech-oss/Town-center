// Elizabeth Line diagram + car/train travel-time cards — Live page section

const carTimes = [
  { dest: "M4 J8/9",   time: "5 mins" },
  { dest: "Heathrow",  time: "22 mins" },
  { dest: "Reading",   time: "25 mins" },
  { dest: "Watford",   time: "45 mins" },
  { dest: "Oxford",    time: "48 mins" },
  { dest: "London",    time: "58 mins" },
];

const trainTimes = [
  { dest: "Slough",             time: "6 mins" },
  { dest: "Reading",            time: "9 mins" },
  { dest: "London Paddington",  time: "18 mins" },
  { dest: "Wokingham",          time: "35 mins" },
  { dest: "Windsor",            time: "35 mins" },
  { dest: "Heathrow",           time: "41 mins" },
  { dest: "Oxford",             time: "42 mins" },
];

const elizabethStops = [
  { name: "Reading",              mins: "12",  current: false },
  { name: "Maidenhead",           mins: "7",   current: true  },
  { name: "Slough",               mins: "7",   current: false },
  { name: "Heathrow",             mins: "23",  current: false, airport: true },
  { name: "Ealing Broadway",      mins: "27",  current: false },
  { name: "London Paddington",    mins: "35",  current: false },
  { name: "Bond Street",          mins: "39",  current: false },
  { name: "Tottenham Court Road", mins: "41",  current: false },
  { name: "Farringdon",           mins: "44",  current: false },
  { name: "Liverpool Street",     mins: "47",  current: false },
  { name: "Canary Wharf",         mins: "54",  current: false },
];

function TravelCard({ icon, title, rows }) {
  return (
    <div
      className="rounded-3xl p-6 md:p-8 flex-1 min-w-0"
      style={{
        backgroundColor: "white",
        boxShadow: "0 4px 32px -8px rgba(28,46,56,0.12)",
        border: "1px solid rgba(28,46,56,0.06)",
      }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: "var(--forest)", color: "white" }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-bold" style={{ color: "var(--forest)" }}>{title}</h3>
      </div>
      <div className="space-y-0">
        {rows.map(({ dest, time }, i) => (
          <div
            key={dest}
            className="flex items-center justify-between py-3"
            style={{
              borderBottom: i < rows.length - 1 ? "1px solid rgba(28,46,56,0.07)" : "none",
            }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{dest}</span>
            <span className="text-sm font-bold" style={{ color: "var(--leaf)" }}>{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConnectivitySection() {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>Connectivity</p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: "var(--forest)" }}>
            London in minutes.<br className="hidden md:block" /> The world on your doorstep.
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--ink)", opacity: 0.75 }}>
            Maidenhead sits on the Elizabeth line and the M4 corridor — giving you fast, direct access to London, Heathrow, Reading and beyond.
          </p>
        </div>

        {/* Car + Train cards */}
        <div className="flex flex-col md:flex-row gap-5 mb-10">
          <TravelCard icon="🚗" title="Travel time by car"   rows={carTimes} />
          <TravelCard icon="🚆" title="Travel time by train" rows={trainTimes} />
        </div>

        {/* Elizabeth line diagram */}
        <div
          className="rounded-3xl p-6 md:p-8 overflow-x-auto"
          style={{
            backgroundColor: "white",
            boxShadow: "0 4px 32px -8px rgba(28,46,56,0.12)",
            border: "1px solid rgba(28,46,56,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: "var(--teal-deep, var(--forest))", color: "white" }}
            >
              🚇
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--forest)" }}>Elizabeth line</h3>
          </div>

          {/* Scrollable diagram — each station is one self-contained column */}
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="flex" style={{ minWidth: "max-content" }}>
              {elizabethStops.map(({ name, mins, current, airport }, i) => (
                <div key={name} className="flex flex-col items-center" style={{ width: "88px", flexShrink: 0 }}>

                  {/* Station name + airport icon */}
                  <div className="flex flex-col items-center mb-3" style={{ height: "52px", justifyContent: "flex-end" }}>
                    {airport && <span className="text-sm leading-none mb-0.5">✈️</span>}
                    <span
                      className="text-center leading-snug px-0.5"
                      style={{
                        fontSize: current ? "12px" : "11px",
                        fontWeight: current ? 700 : 500,
                        color: current ? "var(--forest)" : "var(--ink)",
                        opacity: current ? 1 : 0.72,
                      }}
                    >
                      {name}
                    </span>
                  </div>

                  {/* Rail line row — dot centred, line extending left/right */}
                  <div className="relative flex items-center justify-center w-full" style={{ height: "28px" }}>
                    {/* Left half-line */}
                    {i > 0 && (
                      <div className="absolute left-0 right-1/2" style={{ height: "3px", backgroundColor: "var(--forest)", opacity: 0.8 }} />
                    )}
                    {/* Right half-line */}
                    {i < elizabethStops.length - 1 && (
                      <div className="absolute left-1/2 right-0" style={{ height: "3px", backgroundColor: "var(--forest)", opacity: 0.8 }} />
                    )}
                    {/* Dot */}
                    <div
                      className="relative rounded-full z-10"
                      style={{
                        width: current ? "20px" : "14px",
                        height: current ? "20px" : "14px",
                        backgroundColor: "white",
                        border: current ? "3px solid var(--forest)" : "2.5px solid var(--forest)",
                        boxShadow: current ? "0 0 0 4px rgba(28,46,56,0.12)" : undefined,
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  {/* Minutes */}
                  <div className="mt-3 flex justify-center">
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: current ? 700 : 600,
                        color: current ? "var(--forest)" : "var(--leaf)",
                      }}
                    >
                      {mins} mins
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
