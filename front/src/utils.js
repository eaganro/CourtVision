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

export function fixPlayerName(a) {
  let playerName = a.playerName;
  let nameLoc = a.description.indexOf(a.playerName);
  if (nameLoc > 0 && a.description[nameLoc - 2] === '.') {
    playerName = a.description.slice(a.description.slice(0, nameLoc - 2).lastIndexOf(' ') + 1, nameLoc + a.playerName.length);
  }
  return playerName;
}

export function processScoreTimeline(data) {
  const scoreTimeline = [];
  let sAway = '0';
  let sHome = '0';
  data.forEach(a => {
    if (a.scoreAway !== '') {
      if (a.scoreAway !== sAway) {
        scoreTimeline.push({
          away: a.scoreAway,
          home: a.scoreHome,
          clock: a.clock,
          period: a.period
        });
        sAway = a.scoreAway;
      }
      if (a.scoreHome !== sHome) {
        scoreTimeline.push({
          away: a.scoreAway,
          home: a.scoreHome,
          clock: a.clock,
          period: a.period
        });
        sHome = a.scoreHome;
      }
    }
  });
  return scoreTimeline;
}

export function addAssistActions(a, players) {
  let startName = a.description.lastIndexOf('(') + 1;
  let lastSpace = a.description.lastIndexOf(' ');
  let endName = startName + a.description.slice(startName, lastSpace).lastIndexOf(' ');
  let name = a.description.slice(startName, endName);
  if (name === 'Porter' && a.teamTricode === 'CLE') {
    name = "Porter Jr."
  }
  // if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
  //   name = name.split(' ')[1];
  // }
  if (players[name] === undefined) {
    players[name] = [];
  }
  players[name].push({
    actionType: 'Assist',
    clock: a.clock,
    description: a.description.slice(startName, -1),
    actionId: a.actionId ? a.actionId + 'a' : a.actionNumber + 'a',
    actionNumber: a.actionNumber + 'a',
    teamId: a.teamId,
    scoreHome: a.scoreHome,
    scoreAway: a.scoreAway,
    personId: players[name][0]?.personId,
    playerName: players[name][0]?.playerName,
    playerNameI: players[name][0]?.playerNameI,
    period: a.period
  });
}

export function filterActions(a, statOn) {
  if (a.description.includes('PTS') && statOn[0]) {
    return true; 
  } else if (a.description.includes('MISS') && statOn[1]) {
    return true;
  } else if (a.description.includes('REBOUND') && statOn[2]) {
    return true;
  } else if (a.actionType === 'Assist' && statOn[3]) {
    return true;
  } else if (a.description.includes('TO)') && statOn[4]) {
    return true;
  } else if (a.description.includes('BLK') && statOn[5]) {
    return true;
  } else if (a.description.includes('STL') && statOn[6]) {
    return true;
  } else if (a.description.includes('PF)') && statOn[7]) {
    return true;
  } 
  return false;
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