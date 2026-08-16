import { useState } from "react";

const SCREENS = {
  HOME: "home",
  EVENT: "event",
  SCORING: "scoring",
  LEADERBOARD: "leaderboard",
  PRIZES: "prizes",
  MERIT: "merit",
  PAYMENTS: "payments",
  SOCIAL: "social",
};

const colors = {
  primary: "#1B5E20",
  primaryLight: "#2E7D32",
  primaryBg: "#E8F5E9",
  gold: "#F9A825",
  goldLight: "#FFF8E1",
  dark: "#212121",
  medium: "#616161",
  light: "#9E9E9E",
  veryLight: "#F5F5F5",
  white: "#FFFFFF",
  accent: "#0D47A1",
  accentLight: "#E3F2FD",
  red: "#C62828",
  orange: "#E65100",
  border: "#E0E0E0",
  success: "#43A047",
  whatsapp: "#25D366",
};

function Phone({ children, title }) {
  return (
    <div style={{
      width: 375, minHeight: 720, background: colors.white,
      borderRadius: 40, border: `3px solid ${colors.dark}`,
      overflow: "hidden", position: "relative",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      fontFamily: "'SF Pro Display', -apple-system, system-ui, sans-serif",
    }}>
      <div style={{
        height: 44, background: colors.white, display: "flex",
        alignItems: "center", justifyContent: "center", padding: "0 20px",
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.dark }}>9:41</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: colors.medium }}>●●●● 5G</span>
      </div>
      {children}
    </div>
  );
}

function NavBar({ active, onNav }) {
  const items = [
    { id: SCREENS.HOME, icon: "🏠", label: "Home" },
    { id: SCREENS.EVENT, icon: "📅", label: "Events" },
    { id: SCREENS.SCORING, icon: "⛳", label: "Score" },
    { id: SCREENS.MERIT, icon: "🏆", label: "Merit" },
    { id: SCREENS.SOCIAL, icon: "💬", label: "Social" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", padding: "8px 0 20px",
      background: colors.white, borderTop: `1px solid ${colors.border}`,
      position: "absolute", bottom: 0, left: 0, right: 0,
    }}>
      {items.map(i => (
        <button key={i.id} onClick={() => onNav(i.id)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          opacity: active === i.id ? 1 : 0.5,
        }}>
          <span style={{ fontSize: 22 }}>{i.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: active === i.id ? 700 : 400,
            color: active === i.id ? colors.primary : colors.medium,
          }}>{i.label}</span>
        </button>
      ))}
    </div>
  );
}

function HomeScreen({ onNav }) {
  return (
    <div style={{ padding: 20, paddingBottom: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24, background: colors.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: colors.white, fontWeight: 700,
        }}>FC</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>FairwayConnect</div>
          <div style={{ fontSize: 12, color: colors.light }}>The Balbriggan Bashers</div>
        </div>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
        borderRadius: 16, padding: 20, marginBottom: 16, color: colors.white,
      }}>
        <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>Next Event</div>
        <div style={{ fontSize: 20, fontWeight: 700, margin: "6px 0" }}>Spring Classic</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>📍 Portmarnock Links</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>📅 Sat 5 Apr • 09:30 Tee Off</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <span style={{
            background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 600,
          }}>18 / 24 Confirmed</span>
          <span style={{
            background: colors.gold, borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, color: colors.dark,
          }}>Stableford</span>
        </div>
        <button onClick={() => onNav(SCREENS.EVENT)} style={{
          marginTop: 14, background: colors.white, border: "none", borderRadius: 12,
          padding: "10px 0", width: "100%", fontSize: 15, fontWeight: 700,
          color: colors.primary, cursor: "pointer",
        }}>View Event Details →</button>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Quick Actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { icon: "📝", label: "Enter Scores", screen: SCREENS.SCORING, bg: colors.primaryBg },
          { icon: "📊", label: "Leaderboard", screen: SCREENS.LEADERBOARD, bg: colors.accentLight },
          { icon: "🏅", label: "Order of Merit", screen: SCREENS.MERIT, bg: colors.goldLight },
          { icon: "💳", label: "Payments", screen: SCREENS.PAYMENTS, bg: "#FBE9E7" },
        ].map(a => (
          <button key={a.label} onClick={() => onNav(a.screen)} style={{
            background: a.bg, border: "none", borderRadius: 14, padding: 16,
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            textAlign: "left",
          }}>
            <span style={{ fontSize: 26 }}>{a.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Recent Activity</div>
      {[
        { icon: "🟢", text: "Mick confirmed for Spring Classic", time: "2m ago" },
        { icon: "💰", text: "Dave paid €60 green fee", time: "1hr ago" },
        { icon: "📢", text: "Tee times posted for Saturday", time: "3hr ago" },
      ].map((a, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
          borderBottom: i < 2 ? `1px solid ${colors.border}` : "none",
        }}>
          <span style={{ fontSize: 16 }}>{a.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: colors.dark }}>{a.text}</div>
            <div style={{ fontSize: 11, color: colors.light }}>{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventScreen({ onNav }) {
  const [rsvp, setRsvp] = useState(null);
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary}, #388E3C)`,
        padding: "16px 20px 20px", color: colors.white,
      }}>
        <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Event Details</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: "4px 0" }}>Spring Classic 2026</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>📍 Portmarnock Links  •  🕐 09:30</div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{
          background: colors.veryLight, borderRadius: 14, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Format", value: "Stableford" },
              { label: "Cost", value: "€60 pp" },
              { label: "Prize Fund", value: "€120" },
              { label: "Confirmed", value: "18 / 24" },
            ].map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 11, color: colors.light, textTransform: "uppercase" }}>{d.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Your RSVP</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { id: "in", label: "✅ I'm In", color: colors.success },
            { id: "out", label: "❌ Can't", color: colors.red },
            { id: "maybe", label: "🤔 Maybe", color: colors.orange },
          ].map(b => (
            <button key={b.id} onClick={() => setRsvp(b.id)} style={{
              flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 700,
              border: rsvp === b.id ? `2px solid ${b.color}` : `2px solid ${colors.border}`,
              background: rsvp === b.id ? `${b.color}15` : colors.white,
              color: rsvp === b.id ? b.color : colors.medium,
              cursor: "pointer",
            }}>{b.label}</button>
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Your Tee Time</div>
        <div style={{
          background: colors.accentLight, borderRadius: 14, padding: 16, marginBottom: 16,
          border: `1px solid ${colors.accent}20`,
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.accent }}>09:50 — Tee 1</div>
          <div style={{ fontSize: 13, color: colors.medium, marginTop: 4 }}>
            Playing with: Dave Murphy, Liam Byrne, Noel Kelly
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Prizes</div>
        {[
          { pos: "🥇 1st", prize: "€50 Pro Shop Voucher" },
          { pos: "🥈 2nd", prize: "€30 Pro Shop Voucher" },
          { pos: "🥉 3rd", prize: "€20 Pro Shop Voucher" },
          { pos: "🎯 NTP H7", prize: "Bottle of Wine" },
          { pos: "🎯 NTP H12", prize: "Bottle of Wine" },
          { pos: "💥 LD H3", prize: "€10 Voucher" },
        ].map((p, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", padding: "8px 0",
            borderBottom: i < 5 ? `1px solid ${colors.border}` : "none",
          }}>
            <span style={{ fontSize: 13, color: colors.dark }}>{p.pos}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>{p.prize}</span>
          </div>
        ))}

        <button onClick={() => onNav(SCREENS.PAYMENTS)} style={{
          marginTop: 16, background: colors.primary, border: "none", borderRadius: 14,
          padding: "14px 0", width: "100%", fontSize: 15, fontWeight: 700,
          color: colors.white, cursor: "pointer",
        }}>💳 Pay €60 Green Fee</button>
      </div>
    </div>
  );
}

function ScoringScreen() {
  const [scores, setScores] = useState(Array(18).fill(null));
  const [currentHole, setCurrentHole] = useState(0);
  const pars = [4,3,5,4,4,3,4,5,4,4,3,4,5,4,4,3,4,5];
  const sis = [7,15,3,11,1,17,9,5,13,8,16,4,12,2,18,10,6,14];

  const setScore = (val) => {
    const next = [...scores];
    next[currentHole] = val;
    setScores(next);
    if (currentHole < 17) setTimeout(() => setCurrentHole(currentHole + 1), 300);
  };

  const stableford = (gross, par) => {
    if (gross === null) return 0;
    const diff = gross - par + 1;
    if (diff <= 0) return Math.max(0, 2 - (gross - par));
    return Math.max(0, 2 - (gross - par));
  };

  const totalPts = scores.reduce((sum, s, i) => {
    if (s === null) return sum;
    const net = s - 1;
    const diff = net - pars[i];
    return sum + Math.max(0, 2 - diff);
  }, 0);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
        padding: "12px 20px 16px", color: colors.white,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>SCORING — Portmarnock Links</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Spring Classic 2026</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{totalPts}</div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>POINTS</div>
        </div>
      </div>

      <div style={{
        display: "flex", overflowX: "auto", padding: "12px 16px", gap: 6,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        {pars.map((_, i) => (
          <button key={i} onClick={() => setCurrentHole(i)} style={{
            minWidth: 36, height: 36, borderRadius: 18, border: "none",
            background: currentHole === i ? colors.primary : scores[i] !== null ? colors.primaryBg : colors.veryLight,
            color: currentHole === i ? colors.white : scores[i] !== null ? colors.primary : colors.light,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{i + 1}</button>
        ))}
      </div>

      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: colors.dark }}>
          Hole {currentHole + 1}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "8px 0 24px" }}>
          <div>
            <div style={{ fontSize: 11, color: colors.light }}>PAR</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.primary }}>{pars[currentHole]}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: colors.light }}>S.I.</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.accent }}>{sis[currentHole]}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: colors.light }}>YARDS</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.medium }}>{320 + currentHole * 15}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: colors.medium, marginBottom: 12 }}>
          TAP YOUR SCORE
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {[1,2,3,4,5,6,7,8].map(v => {
            const par = pars[currentHole];
            const diff = v - par;
            let bg = colors.veryLight;
            let col = colors.dark;
            if (v === scores[currentHole]) { bg = colors.primary; col = colors.white; }
            else if (diff <= -2) { bg = "#FFF9C4"; col = "#F57F17"; }
            else if (diff === -1) { bg = "#C8E6C9"; col = colors.primary; }
            else if (diff === 0) { bg = colors.veryLight; col = colors.dark; }
            else if (diff === 1) { bg = "#FFECB3"; col = colors.orange; }
            else if (diff >= 2) { bg = "#FFCDD2"; col = colors.red; }

            return (
              <button key={v} onClick={() => setScore(v)} style={{
                width: 56, height: 56, borderRadius: 28, border: "none",
                background: bg, color: col, fontSize: 24, fontWeight: 800,
                cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>{v}</button>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: colors.light, marginTop: 10 }}>
          🟡 Eagle or better  🟢 Birdie  ⬜ Par  🟠 Bogey  🔴 Double+
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))} style={{
            padding: "10px 24px", borderRadius: 12, border: `2px solid ${colors.border}`,
            background: colors.white, fontSize: 14, fontWeight: 600,
            color: colors.medium, cursor: "pointer",
          }}>← Prev</button>
          <button onClick={() => setCurrentHole(Math.min(17, currentHole + 1))} style={{
            padding: "10px 24px", borderRadius: 12, border: "none",
            background: colors.primary, fontSize: 14, fontWeight: 600,
            color: colors.white, cursor: "pointer",
          }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardScreen() {
  const players = [
    { pos: 1, name: "Pat Murphy", pts: 42, thru: 18, trend: "🔥" },
    { pos: 2, name: "Liam Byrne", pts: 40, thru: 18, trend: "↑" },
    { pos: 3, name: "Noel Kelly", pts: 40, thru: 18, trend: "↓" },
    { pos: 4, name: "Sean Flynn", pts: 39, thru: 16, trend: "↑" },
    { pos: 5, name: "You", pts: 38, thru: 14, trend: "→" },
    { pos: 6, name: "Tom Walsh", pts: 37, thru: 18, trend: "↓" },
    { pos: 7, name: "Gerry Doyle", pts: 36, thru: 15, trend: "↑" },
    { pos: 8, name: "Brian Keane", pts: 35, thru: 18, trend: "→" },
  ];
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
        padding: "12px 20px 16px", color: colors.white,
      }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>LIVE LEADERBOARD</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Spring Classic 2026</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Portmarnock Links • Stableford</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        {players.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "12px 8px",
            borderBottom: `1px solid ${colors.border}`,
            background: p.name === "You" ? colors.primaryBg : "transparent",
            borderRadius: p.name === "You" ? 10 : 0,
            margin: p.name === "You" ? "4px 0" : 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16, display: "flex",
              alignItems: "center", justifyContent: "center", fontWeight: 800,
              fontSize: 14, marginRight: 12,
              background: i < 3 ? [colors.gold, "#CFD8DC", "#D7CCC8"][i] : colors.veryLight,
              color: i < 3 ? colors.dark : colors.medium,
            }}>{p.pos}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 15, fontWeight: p.name === "You" ? 800 : 600,
                color: colors.dark,
              }}>{p.name}</div>
              <div style={{ fontSize: 11, color: colors.light }}>
                Thru {p.thru} {p.thru < 18 && "• Playing"}
              </div>
            </div>
            <span style={{ fontSize: 16, marginRight: 8 }}>{p.trend}</span>
            <div style={{
              fontSize: 22, fontWeight: 900,
              color: i < 3 ? colors.primary : colors.dark,
            }}>{p.pts}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 20px" }}>
        <div style={{
          background: colors.goldLight, borderRadius: 12, padding: 12,
          border: `1px solid ${colors.gold}40`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.gold }}>🎯 SIDE COMPETITIONS</div>
          <div style={{ fontSize: 13, color: colors.dark, marginTop: 6 }}>
            NTP Hole 7: Brian Keane (1.8m) • NTP Hole 12: TBD
          </div>
          <div style={{ fontSize: 13, color: colors.dark, marginTop: 2 }}>
            Longest Drive H3: Liam Byrne (278 yds)
          </div>
        </div>
      </div>
    </div>
  );
}

function MeritScreen() {
  const players = [
    { pos: 1, name: "Pat Murphy", pts: 287, events: 7, trend: "→", badge: "🔥" },
    { pos: 2, name: "You", pts: 264, events: 6, trend: "↑", badge: "⭐" },
    { pos: 3, name: "Liam Byrne", pts: 251, events: 7, trend: "↓", badge: "" },
    { pos: 4, name: "Noel Kelly", pts: 243, events: 6, trend: "↑", badge: "" },
    { pos: 5, name: "Sean Flynn", pts: 238, events: 7, trend: "→", badge: "" },
    { pos: 6, name: "Dave Murphy", pts: 229, events: 5, trend: "↑", badge: "🆕" },
  ];
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, #F57F17, ${colors.gold})`,
        padding: "12px 20px 16px", color: colors.dark,
      }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>SEASON 2026</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Order of Merit</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Best 6 of 10 events • F1 Points</div>
      </div>

      <div style={{
        display: "flex", gap: 8, padding: "12px 16px",
        overflowX: "auto", borderBottom: `1px solid ${colors.border}`,
      }}>
        {["Overall", "Div A (0-12)", "Div B (13-28)", "Most Improved", "Stats"].map((tab, i) => (
          <button key={tab} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", whiteSpace: "nowrap",
            background: i === 0 ? colors.primary : colors.veryLight,
            color: i === 0 ? colors.white : colors.medium,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: "8px 16px" }}>
        {players.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "14px 8px",
            borderBottom: `1px solid ${colors.border}`,
            background: p.name === "You" ? colors.goldLight : "transparent",
            borderRadius: p.name === "You" ? 12 : 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, display: "flex",
              alignItems: "center", justifyContent: "center", fontWeight: 800,
              fontSize: 15, marginRight: 12,
              background: i < 3 ? [colors.gold, "#CFD8DC", "#D7CCC8"][i] : colors.veryLight,
            }}>{p.pos}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>
                {p.name} {p.badge}
              </div>
              <div style={{ fontSize: 11, color: colors.light }}>
                {p.events} events played • {p.trend === "↑" ? "Up" : p.trend === "↓" ? "Down" : "Steady"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: colors.dark }}>{p.pts}</div>
              <div style={{ fontSize: 10, color: colors.light }}>PTS</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 20px" }}>
        <div style={{
          background: colors.veryLight, borderRadius: 14, padding: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 8 }}>
            Points System (F1 Style)
          </div>
          <div style={{ fontSize: 12, color: colors.medium, lineHeight: 1.6 }}>
            1st: 25 • 2nd: 18 • 3rd: 15 • 4th: 12 • 5th: 10 • 6th: 8 • 7th: 6 • 8th: 4 • 9th: 2 • 10th: 1
            <br />+1 bonus for NTP or LD win
            <br />Best 6 of 10 events count
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentsScreen() {
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, ${colors.accent}, #1565C0)`,
        padding: "12px 20px 16px", color: colors.white,
      }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>PAYMENTS</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Society Wallet</div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{
          background: colors.veryLight, borderRadius: 16, padding: 20, marginBottom: 16,
          display: "flex", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: colors.light }}>YOUR BALANCE</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: colors.success }}>€0.00</div>
            <div style={{ fontSize: 12, color: colors.success }}>✅ All paid up</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: colors.light }}>SEASON TOTAL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>€360</div>
            <div style={{ fontSize: 12, color: colors.light }}>6 events paid</div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Upcoming Payments</div>
        <div style={{
          background: colors.white, borderRadius: 14, border: `2px solid ${colors.primary}`,
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>Spring Classic</div>
              <div style={{ fontSize: 12, color: colors.light }}>Due by: 3 Apr 2026</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: colors.primary }}>€60</div>
          </div>
          <button style={{
            marginTop: 12, background: colors.primary, border: "none", borderRadius: 12,
            padding: "12px 0", width: "100%", fontSize: 15, fontWeight: 700,
            color: colors.white, cursor: "pointer",
          }}>💳 Pay with Stripe</button>
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>💳</span>
            <span style={{ fontSize: 20 }}>🍎</span>
            <span style={{ fontSize: 20 }}>📱</span>
            <span style={{ fontSize: 11, color: colors.light, alignSelf: "center" }}>
              Card • Apple Pay • Google Pay
            </span>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 10 }}>Payment History</div>
        {[
          { event: "Captain's Prize", date: "15 Mar", amount: "€75", status: "✅ Paid" },
          { event: "February Medal", date: "22 Feb", amount: "€55", status: "✅ Paid" },
          { event: "Opening Day", date: "18 Jan", amount: "€60", status: "✅ Paid" },
          { event: "Annual Membership", date: "2 Jan", amount: "€50", status: "✅ Paid" },
        ].map((p, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: `1px solid ${colors.border}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{p.event}</div>
              <div style={{ fontSize: 11, color: colors.light }}>{p.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{p.amount}</div>
              <div style={{ fontSize: 11, color: colors.success }}>{p.status}</div>
            </div>
          </div>
        ))}

        <div style={{
          background: `${colors.whatsapp}15`, borderRadius: 14, padding: 14,
          marginTop: 16, border: `1px solid ${colors.whatsapp}30`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>💬</span>
          <div style={{ fontSize: 12, color: colors.dark }}>
            <strong>Auto-reminders active:</strong> Unpaid members get WhatsApp
            reminders at 7 days, 3 days, and 24hrs before event.
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialScreen() {
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, #6A1B9A, #8E24AA)`,
        padding: "12px 20px 16px", color: colors.white,
      }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>SOCIETY FEED</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>The Balbriggan Bashers</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>24 members • Est. 2019</div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        {[
          {
            author: "FairwayConnect", avatar: "🏆", time: "2hrs ago",
            text: "🏆 RESULTS: Captain's Prize\n🥇 Pat Murphy (42 pts)\n🥈 Liam Byrne (40 pts)\n🥉 Noel Kelly (40 pts, CB B9)\n🎯 NTP H7: Brian Keane",
            type: "result",
          },
          {
            author: "Mick Dunne", avatar: "🏌️", time: "3hrs ago",
            text: "What a day! Can't believe I holed out from the bunker on 14. Society golf at its finest 🍺⛳",
            type: "post",
          },
          {
            author: "Dave Murphy", avatar: "😂", time: "5hrs ago",
            text: "Anyone seen Gerry's drive on the 8th? Still looking for it in the car park 🤣",
            type: "post",
            likes: 12, comments: 4,
          },
        ].map((post, i) => (
          <div key={i} style={{
            background: post.type === "result" ? colors.primaryBg : colors.white,
            borderRadius: 16, padding: 16, marginBottom: 12,
            border: `1px solid ${post.type === "result" ? colors.primary + "30" : colors.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18, background: colors.veryLight,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{post.avatar}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{post.author}</div>
                <div style={{ fontSize: 11, color: colors.light }}>{post.time}</div>
              </div>
            </div>
            <div style={{
              fontSize: 14, color: colors.dark, whiteSpace: "pre-line", lineHeight: 1.5,
            }}>{post.text}</div>
            <div style={{
              display: "flex", gap: 16, marginTop: 12, paddingTop: 10,
              borderTop: `1px solid ${colors.border}`,
            }}>
              <span style={{ fontSize: 13, color: colors.light, cursor: "pointer" }}>
                ❤️ {post.likes || 0}
              </span>
              <span style={{ fontSize: 13, color: colors.light, cursor: "pointer" }}>
                💬 {post.comments || 0}
              </span>
              <span style={{ fontSize: 13, color: colors.light, cursor: "pointer" }}>📤 Share</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrizesScreen({ onNav }) {
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        background: `linear-gradient(135deg, #F57F17, ${colors.gold})`,
        padding: "12px 20px 20px", color: colors.dark,
      }}>
        <div style={{ fontSize: 11, opacity: 0.6 }}>AUTO-GENERATED</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Prize Results</div>
        <div style={{ fontSize: 13 }}>Spring Classic • Portmarnock Links</div>
        <div style={{
          background: "rgba(0,0,0,0.1)", borderRadius: 10, padding: "6px 12px",
          fontSize: 11, marginTop: 8, display: "inline-block",
        }}>⚡ Calculated in 0.3 seconds</div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        {[
          { cat: "OVERALL", prizes: [
            { pos: "🥇", name: "Pat Murphy", detail: "42 pts", prize: "€50 Voucher" },
            { pos: "🥈", name: "Liam Byrne", detail: "40 pts (CB B9)", prize: "€30 Voucher" },
            { pos: "🥉", name: "Noel Kelly", detail: "40 pts (CB B6)", prize: "€20 Voucher" },
          ]},
          { cat: "SIDE COMPETITIONS", prizes: [
            { pos: "🎯", name: "Brian Keane", detail: "NTP Hole 7 (1.8m)", prize: "Wine" },
            { pos: "🎯", name: "Mick Dunne", detail: "NTP Hole 12 (2.3m)", prize: "Wine" },
            { pos: "💥", name: "Liam Byrne", detail: "LD Hole 3 (278 yds)", prize: "€10 Voucher" },
            { pos: "🏅", name: "Noel Kelly", detail: "Back 9 Winner (23 pts)", prize: "Sleeve" },
            { pos: "🪵", name: "Declan Fitz", detail: "Booby Prize (18 pts)", prize: "Golf Towel" },
          ]},
        ].map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: colors.primary,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
            }}>{cat.cat}</div>
            {cat.prizes.map((p, pi) => (
              <div key={pi} style={{
                display: "flex", alignItems: "center", padding: "10px 0",
                borderBottom: `1px solid ${colors.border}`,
              }}>
                <span style={{ fontSize: 22, marginRight: 10 }}>{p.pos}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: colors.light }}>{p.detail}</div>
                </div>
                <div style={{
                  background: colors.primaryBg, borderRadius: 8, padding: "4px 10px",
                  fontSize: 12, fontWeight: 700, color: colors.primary,
                }}>{p.prize}</div>
              </div>
            ))}
          </div>
        ))}

        <div style={{
          background: `${colors.whatsapp}15`, borderRadius: 14, padding: 14,
          border: `1px solid ${colors.whatsapp}30`, marginTop: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginBottom: 4 }}>
            📤 Results sent automatically via:
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 12, color: colors.whatsapp, fontWeight: 600 }}>✅ WhatsApp</span>
            <span style={{ fontSize: 12, color: colors.accent, fontWeight: 600 }}>✅ Email</span>
            <span style={{ fontSize: 12, color: colors.medium, fontWeight: 600 }}>✅ Push</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [info, setInfo] = useState(null);

  const screenMap = {
    [SCREENS.HOME]: <HomeScreen onNav={setScreen} />,
    [SCREENS.EVENT]: <EventScreen onNav={setScreen} />,
    [SCREENS.SCORING]: <ScoringScreen />,
    [SCREENS.LEADERBOARD]: <LeaderboardScreen />,
    [SCREENS.PRIZES]: <PrizesScreen onNav={setScreen} />,
    [SCREENS.MERIT]: <MeritScreen />,
    [SCREENS.PAYMENTS]: <PaymentsScreen />,
    [SCREENS.SOCIAL]: <SocialScreen />,
  };

  const screenLabels = {
    [SCREENS.HOME]: "Home Dashboard",
    [SCREENS.EVENT]: "Event Details + RSVP",
    [SCREENS.SCORING]: "Live Scorecard Entry",
    [SCREENS.LEADERBOARD]: "Live Leaderboard",
    [SCREENS.PRIZES]: "Auto Prize Results",
    [SCREENS.MERIT]: "Season Order of Merit",
    [SCREENS.PAYMENTS]: "Stripe Payments",
    [SCREENS.SOCIAL]: "Society Social Feed",
  };

  const annotations = {
    [SCREENS.HOME]: [
      "Society branding + next event hero card",
      "One-tap quick actions grid — max 4 items",
      "Real-time activity feed from all members",
      "Bottom nav: 5 core sections (56pt tap targets)",
    ],
    [SCREENS.EVENT]: [
      "3-button RSVP mirrors WhatsApp quick-reply template",
      "Tee time card with playing partners highlighted",
      "Prize structure visible before the event — motivates attendance",
      "Integrated Stripe payment CTA with Apple Pay / Google Pay",
    ],
    [SCREENS.SCORING]: [
      "Hole selector ribbon — scrollable, shows completion state",
      "Massive hole number for at-a-glance reading (on-course, sunlight)",
      "56pt circular score buttons — one-tap entry, colour-coded to par",
      "Offline-first: scores queue locally if signal drops",
    ],
    [SCREENS.LEADERBOARD]: [
      "Your position highlighted green — always visible",
      "Live 'Playing' indicator for in-progress rounds",
      "Trend arrows show position changes during round",
      "Side competitions panel with NTP/LD running results",
    ],
    [SCREENS.PRIZES]: [
      "Auto-generated in <1 second after last scorecard",
      "Countback noted alongside tied positions (CB B9, CB B6)",
      "Side comps and booby prize included automatically",
      "Auto-sent via WhatsApp + Email + Push — no organiser action needed",
    ],
    [SCREENS.MERIT]: [
      "Tab bar: divisions, Most Improved, stats breakdown",
      "F1-style points table visible at bottom for transparency",
      "Best 6 of 10 events — encourages attendance without penalising absences",
      "Badges: 🔥 leader, ⭐ rising, 🆕 newcomer",
    ],
    [SCREENS.PAYMENTS]: [
      "Balance card shows individual + season totals",
      "Stripe Checkout integration with Apple Pay / Google Pay",
      "Full payment history with receipts",
      "WhatsApp auto-reminders for outstanding payments",
    ],
    [SCREENS.SOCIAL]: [
      "Auto-posted results from Prize Engine — no manual entry",
      "Member posts with likes, comments, share — banter-friendly",
      "Photo sharing tagged to events",
      "Private society timeline — only members can see",
    ],
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f0f0f0",
      fontFamily: "-apple-system, system-ui, sans-serif",
      padding: "20px 0",
    }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: colors.dark, margin: 0 }}>
          FairwayConnect — Mobile UX Wireframes
        </h1>
        <p style={{ fontSize: 14, color: colors.medium, margin: "4px 0 16px" }}>
          Interactive prototype • Tap through all 8 screens • Designed for golfers aged 25–75+
        </p>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6,
        }}>
          {Object.entries(screenLabels).map(([id, label]) => (
            <button key={id} onClick={() => setScreen(id)} style={{
              padding: "8px 16px", borderRadius: 20, border: "none",
              background: screen === id ? colors.primary : colors.white,
              color: screen === id ? colors.white : colors.dark,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "center", gap: 40,
        alignItems: "flex-start", flexWrap: "wrap", padding: "0 20px",
      }}>
        <Phone title={screenLabels[screen]}>
          <div style={{ height: 620, overflowY: "auto", position: "relative" }}>
            {screenMap[screen]}
          </div>
          <NavBar active={screen} onNav={setScreen} />
        </Phone>

        <div style={{ maxWidth: 400, minWidth: 300 }}>
          <div style={{
            background: colors.white, borderRadius: 20, padding: 24,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}>
            <div style={{
              fontSize: 12, fontWeight: 800, color: colors.primary,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
            }}>UX ANNOTATIONS</div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 16,
            }}>{screenLabels[screen]}</div>
            {(annotations[screen] || []).map((note, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 12, background: colors.primaryBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: colors.primary, flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: colors.dark, lineHeight: 1.5 }}>{note}</div>
              </div>
            ))}

            <div style={{
              marginTop: 20, padding: 16, background: colors.veryLight,
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary, marginBottom: 6 }}>
                ACCESSIBILITY DESIGN RULES
              </div>
              <div style={{ fontSize: 12, color: colors.medium, lineHeight: 1.6 }}>
                • Min tap target: 48×48pt (we use 56pt)<br/>
                • Min font: 13pt body, 22pt score entry<br/>
                • Contrast ratio: 7:1 minimum (WCAG AAA)<br/>
                • Single-tap only — no swipe gestures required<br/>
                • Colour-coding + text labels (never colour alone)<br/>
                • Offline-first: full functionality with no signal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
