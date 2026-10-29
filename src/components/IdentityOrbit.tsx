const ticks = Array.from({ length: 72 }, (_, index) => {
  const angle = (index * 5 - 90) * Math.PI / 180;
  const major = index % 6 === 0;
  const inner = major ? 249 : 253;
  return {
    index,
    major,
    x1: 280 + Math.cos(angle) * inner,
    y1: 280 + Math.sin(angle) * inner,
    x2: 280 + Math.cos(angle) * 258,
    y2: 280 + Math.sin(angle) * 258,
  };
});

export function IdentityOrbit() {
  return (
    <div className="identity-orbit" aria-hidden="true">
      <svg className="identity-orbit__drawing" viewBox="0 0 560 560" fill="none">
        <defs>
          <radialGradient id="identity-core" cx=".42" cy=".28" r=".8">
            <stop stopColor="#15313f" />
            <stop offset="1" stopColor="#091620" />
          </radialGradient>
          <linearGradient id="identity-arc" x1="38" y1="80" x2="520" y2="460" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60d9ef" stopOpacity=".12" />
            <stop offset=".48" stopColor="#60d9ef" />
            <stop offset="1" stopColor="#60d9ef" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <circle className="identity-orbit__outer" cx="280" cy="280" r="258" stroke="#294451" />
        <g className="identity-orbit__ticks" stroke="#375764">
          {ticks.map((tick) => <line key={tick.index} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} opacity={tick.major ? .85 : .38} />)}
        </g>
        <circle cx="280" cy="280" r="223" stroke="#294451" strokeDasharray="1 7" />
        <ellipse cx="280" cy="280" rx="239" ry="197" transform="rotate(-35 280 280)" stroke="#325664" strokeOpacity=".6" />
        <path d="M 68 133 A 258 258 0 0 1 297 23 M 472 451 A 258 258 0 0 1 251 537" stroke="url(#identity-arc)" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="151" fill="url(#identity-core)" stroke="#335665" />
        <circle cx="280" cy="280" r="161" stroke="#1c3847" strokeOpacity=".65" />
        <g fill="#60d9ef">
          <circle cx="68" cy="133" r="3.6" />
          <circle cx="472" cy="451" r="3.6" />
          <circle cx="422" cy="107" r="2.3" />
        </g>
        <g stroke="#60d9ef" strokeOpacity=".18">
          <path d="M280 0v12 M280 548v12 M0 280h12 M548 280h12" />
          <path d="M28 28h18 M28 28v18 M532 532h-18 M532 532v-18" />
        </g>
      </svg>
      <div className="identity-orbit__core">
        <span className="identity-orbit__discipline">Mathematics × technology</span>
        <strong translate="no">GZ</strong>
        <span className="identity-orbit__coordinates">36.85° S / 174.76° E</span>
      </div>
      <span className="identity-orbit__note identity-orbit__note--one">Modelling</span>
      <span className="identity-orbit__note identity-orbit__note--two">Building</span>
    </div>
  );
}
