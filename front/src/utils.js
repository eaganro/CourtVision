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

export function sortActions(actions) {
  return actions.slice().sort((a, b) => {
    if (a.period < b.period) {
      return -1;
    } else if (a.period > b.period) {
      return 1;
    } else {
      if (timeToSeconds(a.clock) > timeToSeconds(b.clock)) {
        return -1;
      } else {
        return 1;
      }
    }
  });
}