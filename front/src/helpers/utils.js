export function timeToSeconds(time) {
  // Convert time string in the format "PT12M00.00S" to seconds
  const match = time.match(/PT(\d+)M(\d+)\.(\d+)S/);
  
  if (match) {
    const minutes = parseInt(match[1] || 0);
    const seconds = parseInt(match[2] || 0);
    const milliseconds = parseInt(match[3] || 0);
    return minutes * 60 + seconds + milliseconds / 100;
  }
  
  return 0;
}

// Format a clock like "PT08M13.00S" to "8:13"
export function formatClock(clock) {
  if (!clock || typeof clock !== 'string') return '';
  const match = clock.match(/PT(\d+)M(\d+)(?:\.(\d+))?S/);
  if (!match) return clock;
  const minutes = parseInt(match[1] || '0', 10);
  const seconds = parseInt(match[2] || '0', 10);
  const s = String(seconds).padStart(2, '0');
  return `${minutes}:${s}`;
}

// Format NBA period number to label: 1..4 => Q1..Q4, 5+ => OT, 2OT, 3OT, ...
export function formatPeriod(period) {
  const p = Number(period);
  if (!Number.isFinite(p) || p <= 0) return '';
  if (p <= 4) return `Q${p}`;
  const otNum = p - 4;
  return otNum === 1 ? 'OT' : `${otNum}OT`;
}

export function fixPlayerName(a) {
  let playerName = a.playerName;
  let nameLoc = a.description.indexOf(a.playerName);
  if (nameLoc > 0 && a.description[nameLoc - 2] === '.') {
    playerName = a.description.slice(a.description.slice(0, nameLoc - 2).lastIndexOf(' ') + 1, nameLoc + a.playerName.length);
  }
  return playerName;
}
