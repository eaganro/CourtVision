import { fixPlayerName, timeToSeconds } from './utils';

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
    name = "Porter Jr.";
  }
  if (name === 'Jokic') {
    name = "Jokić";
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
  return players;
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

export function createPlayers(actions, awayTeamId, homeTeamId) {
  let awayPlayers = {};
  let homePlayers = {};
  actions.forEach(a => {
    let playerName = fixPlayerName(a);
    if (playerName) {
      if(a.teamId === awayTeamId) {
        if (!awayPlayers[playerName]) {
          awayPlayers[playerName] = [a];
        } else {
          awayPlayers[playerName].push(a);
        }
        if (a.description.includes('AST')) {
          awayPlayers = addAssistActions(a, awayPlayers);
        }
        if (a.actionType === 'Substitution') {
          let startName = a.description.indexOf('SUB:') + 5;
          let endName = a.description.indexOf('FOR') - 1;
          let name = a.description.slice(startName, endName);
          if (name === 'Porter' && a.teamTricode === 'CLE') {
            name = "Porter Jr."
          }
          if (name === 'Jokic') {
            name = "Jokić";
          }
          if (awayPlayers[name] === undefined) {
            awayPlayers[name] = [];
          }
        }
      } else if(a.teamId === homeTeamId) {
        if (!homePlayers[playerName]) {
          homePlayers[playerName] = [a];
        } else {
          homePlayers[playerName].push(a);
        }
        if (a.description.includes('AST')) {
          homePlayers = addAssistActions(a, homePlayers);
        }
        if (a.actionType === 'Substitution') {
          let startName = a.description.indexOf('SUB:') + 5;
          let endName = a.description.indexOf('FOR') - 1;
          let name = a.description.slice(startName, endName);
          if (name === 'Porter' && a.teamTricode === 'CLE') {
            name = "Porter Jr."
          }
          if (name === 'Jokic') {
            name = "Jokić";
          }
          if (homePlayers[name] === undefined) {
            homePlayers[name] = [];
          }
        }
      }
    }
  });
  return { awayPlayers, homePlayers };
}

export function createPlaytimes(players) {
  const playtimes = {};
  Object.keys(players).forEach(player => {
    playtimes[player] = {
      times: [],
      on: false,
    };
  });
  return playtimes;
}

export function updatePlaytimesWithAction(a, playtimes) {
  let playerName = fixPlayerName(a);
  if (a.actionType === 'Substitution') {
    let startName = a.description.indexOf('SUB:') + 5;
    let endName = a.description.indexOf('FOR') - 1;
    let name = a.description.slice(startName, endName);
    if (name === 'Porter' && a.teamTricode === 'CLE') {
      name = "Porter Jr."
    }
    if (name === 'Jokic') {
      name = "Jokić"
    }
    if(playtimes[name]) {
      playtimes[name].times.push({ start: a.clock, period: a.period });
      playtimes[name].on = true;
    } else {
      playtimes[name] = {
        times: [],
        on: false,
      };
      playtimes[name].times.push({ start: a.clock, period: a.period });
      playtimes[name].on = true;
      console.log('PROBLEM: Player Name Not Found', name);
    }
    
    let t = playtimes[playerName].times;
    if (playtimes[playerName].on === false) {
      if (a.period <= 4) {
        t.push({ start: "PT12M00.00S", period: a.period });
      } else {
        t.push({ start: "PT05M00.00S", period: a.period });
      }
    }
    t[t.length - 1].end = a.clock;
    playtimes[playerName].on = false;
  } else if (a.actionType === 'substitution') {
    let name = a.description.slice(a.description.indexOf(':') + 2);
    let t = playtimes[name].times;
    if (a.description.includes('out:')) {
      if (playtimes[name].on === false) {
        if (a.period <= 4) {
          t.push({ start: "PT12M00.00S", period: a.period });
        } else {
          t.push({ start: "PT05M00.00S", period: a.period });
        }
      }
      t[t.length - 1].end = a.clock;
      playtimes[name].on = false;
    } else if (a.description.includes('in:')) {
      if(playtimes[name]) {
        playtimes[name].times.push({ start: a.clock, period: a.period });
        playtimes[name].on = true;
      } else {
        playtimes[name] = {
          times: [],
          on: false,
        };
        playtimes[name].times.push({ start: a.clock, period: a.period });
        playtimes[name].on = true;
        console.log('PROBLEM: Player Name Not Found', name);
      }
    }
  } else {
    if (playerName && playtimes[playerName].on === false) {
      playtimes[playerName].on = true;
      playtimes[playerName].times.push({ start: "PT12M00.00S", period: a.period, end: a.clock });     
    } else if(playerName && playtimes[playerName].on === true) {
      let t = playtimes[playerName].times;
      t[t.length - 1].end = a.clock;
    }
  }
  return playtimes;
}

export function quarterChange(playtimes) {
  Object.keys(playtimes).forEach(player => {
    if(playtimes[player].on === true) {
      let t = playtimes[player].times;
      t[t.length - 1].end = "PT00M00.00S";
      playtimes[player].on = false;
    }
  });
  return playtimes;
}

export function endPlaytimes(playtimes, lastAction) {
  Object.keys(playtimes).forEach(player => {
    if(playtimes[player].on === true) {
      let t = playtimes[player].times;
      t[t.length - 1].end = lastAction.clock;
    }
    playtimes[player] = playtimes[player].times;
  });
  return playtimes;
}
