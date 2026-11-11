// Hero illustration: a tiled-roof house with a coconut palm and a provider checking in
export default function HomeScene() {
  return (
    <svg viewBox="0 0 520 420" role="img" aria-label="A LankaLink provider outside a house with a coconut palm">
      <circle cx="285" cy="205" r="185" fill="var(--il-sky)" />
      <circle cx="410" cy="88" r="26" fill="var(--accent)" opacity="0.85" />
      <ellipse cx="275" cy="362" rx="235" ry="26" fill="var(--il-ground)" />

      {/* Coconut palm */}
      <path d="M120 362 C114 300 104 238 126 168" stroke="var(--il-trunk)" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M116 330h10M113 300h11M111 270h11M112 240h11M116 210h10" stroke="var(--il-trunk-dark)" strokeWidth="3" strokeLinecap="round" />
      <path d="M126 168 C96 146 62 152 38 182 C70 166 98 168 126 168Z" fill="var(--il-leaf)" />
      <path d="M126 168 C108 136 76 120 48 128 C82 134 106 148 126 168Z" fill="var(--il-leaf-2)" />
      <path d="M126 168 C128 132 148 108 176 100 C156 120 140 142 126 168Z" fill="var(--il-leaf)" />
      <path d="M126 168 C156 146 192 146 214 168 C184 160 154 160 126 168Z" fill="var(--il-leaf-2)" />
      <path d="M126 168 C150 172 172 192 180 222 C162 198 146 184 126 168Z" fill="var(--il-leaf)" />
      <circle cx="122" cy="176" r="6" fill="var(--il-trunk-dark)" />
      <circle cx="132" cy="178" r="6" fill="var(--il-trunk-dark)" />

      {/* House */}
      <rect x="190" y="252" width="204" height="100" fill="var(--il-wall)" />
      <polygon points="168,258 416,258 372,198 212,198" fill="var(--il-roof)" />
      <polygon points="168,258 416,258 410,266 174,266" fill="var(--il-roof-dark)" />
      <path d="M212 198h160" stroke="var(--il-roof-dark)" strokeWidth="4" />
      <path d="M200 214h184M190 230h204M180 244h224" stroke="var(--il-roof-dark)" strokeWidth="1.5" opacity="0.45" />
      <rect x="198" y="266" width="9" height="86" fill="var(--il-pillar)" />
      <rect x="377" y="266" width="9" height="86" fill="var(--il-pillar)" />
      <rect x="220" y="286" width="38" height="32" rx="2" fill="var(--il-window)" />
      <rect x="326" y="286" width="38" height="32" rx="2" fill="var(--il-window)" />
      <path d="M239 286v32M220 302h38M345 286v32M326 302h38" stroke="var(--il-wall)" strokeWidth="3" />
      <rect x="273" y="290" width="38" height="62" rx="3" fill="var(--primary)" />
      <circle cx="303" cy="323" r="2.6" fill="var(--accent)" />
      <rect x="262" y="352" width="60" height="7" rx="2" fill="var(--il-step)" />

      {/* Garden */}
      <circle cx="196" cy="350" r="14" fill="var(--il-leaf-2)" />
      <circle cx="214" cy="354" r="11" fill="var(--il-leaf)" />
      <circle cx="372" cy="352" r="12" fill="var(--il-leaf)" />
      <circle cx="390" cy="349" r="15" fill="var(--il-leaf-2)" />
      <circle cx="200" cy="341" r="3" fill="var(--accent)" />
      <circle cx="388" cy="339" r="3" fill="var(--accent)" />

      {/* Provider with phone and bucket */}
      <rect x="431" y="318" width="10" height="42" rx="4" fill="var(--il-pants)" />
      <rect x="445" y="318" width="10" height="42" rx="4" fill="var(--il-pants)" />
      <path d="M428 360h15M443 360h15" stroke="var(--il-hair)" strokeWidth="5" strokeLinecap="round" />
      <rect x="425" y="262" width="36" height="64" rx="15" fill="var(--primary)" />
      <path d="M458 272 L466 310" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" />
      <circle cx="467" cy="313" r="5" fill="var(--il-skin)" />
      <path d="M430 274 L416 294" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" />
      <rect x="403" y="280" width="15" height="24" rx="3" fill="var(--il-line)" />
      <rect x="405.5" y="283" width="10" height="16" rx="1.5" fill="var(--il-window)" />
      <circle cx="416" cy="296" r="5" fill="var(--il-skin)" />
      <circle cx="443" cy="244" r="15" fill="var(--il-skin)" />
      <path d="M428 243 a15 15 0 0 1 30 0 c-5 -7 -10 -9 -15 -9 s-10 2 -15 9z" fill="var(--il-hair)" />
      <path d="M470 338h24l-3 22h-18z" fill="var(--accent)" />
      <path d="M471 338 a11 10 0 0 1 22 0" stroke="var(--il-line)" strokeWidth="2.5" fill="none" />
    </svg>
  )
}
