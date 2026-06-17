// Cảnh quan biểu tượng vẽ bằng SVG: núi Phú Sĩ, mặt trời đỏ,
// chùa năm tầng (Tō-ji) và cổng torii (Fushimi Inari) — tông màu washi/Kyoto
export default function JapanScenery() {
  return (
    <svg
      className="scenery"
      viewBox="0 0 800 230"
      role="img"
      aria-label="Núi Phú Sĩ, cổng torii và chùa năm tầng"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* mặt trời đỏ */}
      <circle cx="610" cy="62" r="34" fill="#c93527" opacity="0.9" />

      {/* dải mây kasumi (霞) */}
      <g fill="#b8963e" opacity="0.3">
        <rect x="40" y="48" width="150" height="9" rx="4.5" />
        <rect x="90" y="65" width="90" height="9" rx="4.5" />
        <rect x="560" y="118" width="130" height="9" rx="4.5" />
        <rect x="610" y="135" width="80" height="9" rx="4.5" />
      </g>

      {/* núi Phú Sĩ */}
      <path d="M150 205 L295 62 Q310 50 325 62 L470 205 Z" fill="#4a6f8a" opacity="0.85" />
      <path
        d="M252 105 L295 62 Q310 50 325 62 L368 105 L348 95 L332 112 L310 96 L288 113 L270 97 Z"
        fill="#fcf8ee"
      />

      {/* đồi matcha */}
      <path d="M0 230 Q120 160 260 230 Z" fill="#6b8e4e" opacity="0.4" />
      <path d="M520 230 Q650 170 800 222 L800 230 Z" fill="#6b8e4e" opacity="0.35" />

      {/* chùa năm tầng (silhouette) */}
      <g fill="#3a4a56" opacity="0.85">
        <rect x="117" y="78" width="4" height="14" />
        <path d="M96 106 L119 88 L142 106 Z" />
        <rect x="108" y="106" width="22" height="12" />
        <path d="M90 132 L119 112 L148 132 Z" />
        <rect x="105" y="132" width="28" height="14" />
        <path d="M82 164 L119 142 L156 164 Z" />
        <rect x="101" y="164" width="36" height="33" />
        <rect x="92" y="197" width="54" height="8" />
      </g>

      {/* cổng torii */}
      <g>
        <path d="M652 96 Q708 84 764 96 L764 104 Q708 92 652 104 Z" fill="#c93527" />
        <rect x="660" y="104" width="96" height="7" fill="#a52a1f" />
        <rect x="703" y="111" width="10" height="27" fill="#a52a1f" />
        <rect x="672" y="104" width="10" height="106" fill="#c93527" />
        <rect x="734" y="104" width="10" height="106" fill="#c93527" />
        <rect x="664" y="138" width="88" height="8" fill="#c93527" />
        <g fill="#2e2a23" opacity="0.45">
          <rect x="668" y="202" width="18" height="8" rx="2" />
          <rect x="730" y="202" width="18" height="8" rx="2" />
        </g>
      </g>

      {/* chim én */}
      <path d="M500 80 q8 -8 16 0 q8 -8 16 0" stroke="#2e2a23" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M545 100 q6 -6 12 0 q6 -6 12 0" stroke="#2e2a23" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />

      {/* đường chân trời */}
      <rect x="0" y="208" width="800" height="2" rx="1" fill="#b8963e" opacity="0.35" />
    </svg>
  )
}
