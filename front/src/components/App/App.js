import { useState, useEffect } from 'react';

import Schedule from '../Schedule/Schedule';
import Boxscore from '../Boxscore/Boxscore';
import Play from '../Play/Play';
import StatButtons from '../StatButtons/StatButtons';

import './App.scss';
export default function App() {

  const [date, setDate] = useState("2022-11-28");
  const [games, setGames] = useState([]);
  const [box, setBox] = useState({});
  const [playByPlay, setPlayByPlay] = useState([]);
  const [gameId, setGameId] = useState("0022200299");
  const [awayTeamId, setAwayTeamId] = useState(null);
  const [homeTeamId, setHomeTeamId] = useState(null);

  const [awayActions, setAwayActions] = useState([]);
  const [homeActions, setHomeActions] = useState([]);

  const [allActions, setAllActions] = useState([]);

  const [scoreTimeline, setScoreTimeline] = useState([]);
  const [homePlayerTimeline, setHomePlayerTimeline] = useState([]);
  const [awayPlayerTimeline, setAwayPlayerTimeline] = useState([]);



  const [statOn, setStatOn] = useState([true, false, true, true, false, false, false, false]);



  useEffect(() => {
    fetch(`/games?date=${date}`).then(r =>  {
      if (r.status === 404) {
        return [];
      } else {
        return r.json()
      }
    }).then(gamesData => {
      setGames(gamesData);
    });
  }, [date]);

  useEffect(() => {
    Promise.all([fetch(`/data/boxData/${gameId}`), fetch(`/data/playByPlayData/${gameId}`)]).then(d => {
      return Promise.all(d.map(r => r.json()));
    }).then(d => {
      const boxData = d[0];
      setBox(boxData);
      setAwayTeamId(boxData.awayTeamId);
      setHomeTeamId(boxData.homeTeamId);

      const play = d[1];
      setPlayByPlay(play);
      // processPlayData(play);
    })
  }, [gameId]);

  useEffect(() => {
    processPlayData(playByPlay);
  }, [playByPlay, statOn]);

  const changeDate = (e) => {
    setDate(e.target.value);
  }

  const changeGame = (id) => {
    setGameId(id);
  }

  const processPlayData = (data) => {
    if (data.length === 0) {
      return [];
    }
    let awayPlayers = {

    };
    let homePlayers = {
  
    };

    let awayAssistActions = []
    let homeAssistActions = []

    let scoreTimeline = [];
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

      if(a.teamId === awayTeamId) {
        if (!awayPlayers[a.playerName]) {
          awayPlayers[a.playerName] = [a];
        } else {
          awayPlayers[a.playerName].push(a);
        }
        if (a.description.includes('AST')) {
          awayAssistActions.push(a);
        }
      } else if(a.teamId === homeTeamId) {
        if (!homePlayers[a.playerName]) {
          homePlayers[a.playerName] = [a];
        } else {
          homePlayers[a.playerName].push(a);
        }
        if (a.description.includes('AST')) {
          homeAssistActions.push(a);
        }
      }
    });

    const awayPlaytimes = {};
    Object.keys(awayPlayers).forEach(player => {
      awayPlaytimes[player] = {
        times: [],
        on: false,
      };
    });
    const homePlaytimes = {};
    Object.keys(homePlayers).forEach(player => {
      homePlaytimes[player] = {
        times: [],
        on: false,
      };
    });
    // Object.keys(awayPlayers).forEach(player => {
    //   awayPlayers[player].forEach(action => {
    //     if (action.actionType === 'Substitution') {

    //     } else {
    //       if (awayPlaytimes[player].on === false) {
    //         awayPlaytimes[player].on = true;
            
    //       }
    //     }
    //   });
    // });

    let currentQ = 1;
    data.forEach(a => {


      if(a.teamId === awayTeamId) {
        if(a.period !== currentQ) {
          Object.keys(awayPlaytimes).forEach(player => {
            if(awayPlaytimes[player].on === true) {
              let t = awayPlaytimes[player].times;
              t[t.length - 1].end = currentQ * 12 * 60;
              awayPlaytimes[player].on = false;
            }
          });
          Object.keys(homePlaytimes).forEach(player => {
            if(homePlaytimes[player].on === true) {
              let t = homePlaytimes[player].times;
              t[t.length - 1].end = currentQ * 12 * 60;
              homePlaytimes[player].on = false;
            }
          });
          currentQ = a.period;
        }
        if (a.actionType === 'Substitution') {
          let startName = a.description.indexOf('SUB:') + 5;
          let endName = a.description.indexOf('FOR') - 1;
          let name = a.description.slice(startName, endName);
          if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
            name = name.split(' ')[1];
          }
          if(awayPlaytimes[name]) {
            awayPlaytimes[name].times.push({ start: (a.period) * 12 * 60 - timeToSeconds(a.clock) });
            awayPlaytimes[name].on = true;
          } else {
            console.log('PROBLEM: Player Name Not Found');
          }
          
          let t = awayPlaytimes[a.playerName].times;
          if (t.length === 0) {
            t.push({ start: (a.period - 1) * 12 * 60 });
          }
          t[t.length - 1].end = (a.period) * 12 * 60 - timeToSeconds(a.clock);
          awayPlaytimes[a.playerName].on = false;
        } else {
          if (a.playerName && awayPlaytimes[a.playerName].on === false) {
            awayPlaytimes[a.playerName].on = true;
            awayPlaytimes[a.playerName].times.push({ start: (a.period - 1) * 12 * 60 });
            
          } else if(a.playerName && awayPlaytimes[a.playerName].on === true) {
            let t = awayPlaytimes[a.playerName].times;
            t[t.length - 1].end = (a.period) * 12 * 60 - timeToSeconds(a.clock);
          }
        }
      }





      if(a.teamId === homeTeamId) {
        if(a.period !== currentQ) {
          Object.keys(homePlaytimes).forEach(player => {
            if(homePlaytimes[player].on === true) {
              let t = homePlaytimes[player].times;
              t[t.length - 1].end = currentQ * 12 * 60;
              homePlaytimes[player].on = false;
            }
          });
          Object.keys(awayPlaytimes).forEach(player => {
            if(awayPlaytimes[player].on === true) {
              let t = awayPlaytimes[player].times;
              t[t.length - 1].end = currentQ * 12 * 60;
              awayPlaytimes[player].on = false;
            }
          });
          currentQ = a.period;
        }
        if (a.actionType === 'Substitution') {
          let startName = a.description.indexOf('SUB:') + 5;
          let endName = a.description.indexOf('FOR') - 1;
          let name = a.description.slice(startName, endName);
          if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
            name = name.split(' ')[1];
          }
          if(homePlaytimes[name]) {
            homePlaytimes[name].times.push({ start: (a.period) * 12 * 60 - timeToSeconds(a.clock) });
            homePlaytimes[name].on = true;
          } else {
            console.log('PROBLEM: Player Name Not Found');
          }

          let t = homePlaytimes[a.playerName].times;
          if (t.length === 0) {
            t.push({ start: (a.period - 1) * 12 * 60 });
          }
          t[t.length - 1].end = (a.period) * 12 * 60 - timeToSeconds(a.clock);
          homePlaytimes[a.playerName].on = false;
        } else {
          if (a.playerName && homePlaytimes[a.playerName].on === false) {
            homePlaytimes[a.playerName].on = true;
            homePlaytimes[a.playerName].times.push({ start: (a.period - 1) * 12 * 60 });
            
          } else if(a.playerName && homePlaytimes[a.playerName].on === true) {
            let t = homePlaytimes[a.playerName].times;
            t[t.length - 1].end = (a.period) * 12 * 60 - timeToSeconds(a.clock);
          }
        }
      }
    });
    Object.keys(homePlaytimes).forEach(player => {
      if(homePlaytimes[player].on === true) {
        let t = homePlaytimes[player].times;
        t[t.length - 1].end = currentQ * 12 * 60;
      }
      homePlaytimes[player] = homePlaytimes[player].times;
    });
    Object.keys(awayPlaytimes).forEach(player => {
      if(awayPlaytimes[player].on === true) {
        let t = awayPlaytimes[player].times;
        t[t.length - 1].end = currentQ * 12 * 60;
      }
      awayPlaytimes[player] = awayPlaytimes[player].times;
    });
    setAwayPlayerTimeline(awayPlaytimes);
    setHomePlayerTimeline(homePlaytimes);



    setScoreTimeline(scoreTimeline);

    awayAssistActions.forEach(a => {
      let startName = a.description.lastIndexOf('(') + 1;
      let lastSpace = a.description.lastIndexOf(' ');
      let endName = startName + a.description.slice(startName, lastSpace).lastIndexOf(' ');
      let name = a.description.slice(startName, endName);
      if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
        name = name.split(' ')[1];
      }
      awayPlayers[name].push({
        actionType: 'Assist',
        clock: a.clock,
        description: a.description.slice(startName, -1),
        actionId: a.actionId + 'a',
        actionNumber: a.actionNumber,
        teamId: a.teamId,
        scoreHome: a.scoreHome,
        scoreAway: a.scoreAway,
        personId: awayPlayers[name][0].personId,
        playerName: awayPlayers[name][0].playerName,
        playerNameI: awayPlayers[name][0].playerNameI,
        period: a.period
      });
    });

    homeAssistActions.forEach(a => {
      let startName = a.description.lastIndexOf('(') + 1;
      let lastSpace = a.description.lastIndexOf(' ');
      let endName = startName + a.description.slice(startName, lastSpace).lastIndexOf(' ');
      let name = a.description.slice(startName, endName);
      if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
        name = name.split(' ')[1];
      }
      homePlayers[name].push({
        actionType: 'Assist',
        clock: a.clock,
        description: a.description.slice(startName, -1),
        actionId: a.actionId + 'a',
        actionNumber: a.actionNumber,
        teamId: a.teamId,
        scoreHome: a.scoreHome,
        scoreAway: a.scoreAway,
        personId: homePlayers[name][0].personId,
        playerName: homePlayers[name][0].playerName,
        playerNameI: homePlayers[name][0].playerNameI,
        period: a.period
      })
    });

    console.log('x', awayPlayers);
    let allAct = [];

    Object.entries(awayPlayers).forEach(([k, v]) => {
      allAct = [...allAct, ...v];
      let filterPlayer = [];
      for (let pI = 0; pI < v.length; pI += 1) {
        let a = v[pI];
        if (a.description.includes('PTS') && statOn[0]) {
          filterPlayer.push(a);
        } else if (a.description.includes('MISS') && statOn[1]) {
          filterPlayer.push(a);
        } else if (a.description.includes('REBOUND') && statOn[2]) {
          filterPlayer.push(a);
        } else if (a.actionType === 'Assist' && statOn[3]) {
          filterPlayer.push(a);
        } else if (a.actionType === 'Turnover' && statOn[4]) {
          filterPlayer.push(a);
        } else if (a.description.includes('BLK') && statOn[5]) {
          filterPlayer.push(a);
        } else if (a.description.includes('STL') && statOn[6]) {
          filterPlayer.push(a);
        } else if (a.actionType === 'Foul' && statOn[7]) {
          filterPlayer.push(a);
        } 
      }
      awayPlayers[k] = filterPlayer;
    });
    Object.entries(homePlayers).forEach(([k, v]) => {
      allAct = [...allAct, ...v];
      let filterPlayer = [];
      for (let pI = 0; pI < v.length; pI += 1) {
        let a = v[pI];
        if (a.description.includes('PTS') && statOn[0]) {
          filterPlayer.push(a);
        } else if (a.description.includes('MISS') && statOn[1]) {
          filterPlayer.push(a);
        } else if (a.description.includes('REBOUND') && statOn[2]) {
          filterPlayer.push(a);
        } else if (a.actionType === 'Assist' && statOn[3]) {
          filterPlayer.push(a);
        } else if (a.actionType === 'Turnover' && statOn[4]) {
          filterPlayer.push(a);
        } else if (a.description.includes('BLK') && statOn[5]) {
          filterPlayer.push(a);
        } else if (a.description.includes('STL') && statOn[6]) {
          filterPlayer.push(a);
        } else if (a.actionType === 'Foul' && statOn[7]) {
          filterPlayer.push(a);
        } 
      }
      homePlayers[k] = filterPlayer;
    });
    console.log(awayPlayers);

    allAct.sort((a, b) => a.actionNumber - b.actionNumber);
    console.log(allAct)

    setAllActions(allAct);
    setAwayActions(awayPlayers);
    setHomeActions(homePlayers);
  }

  const changeStatOn = (index) => {
    const statOnNew = statOn.slice();
    statOnNew[index] = !statOnNew[index];
    setStatOn(statOnNew);
  }

  return (
    <div className=''>
      <Schedule games={games} date={date} changeDate={changeDate} changeGame={changeGame}></Schedule>
      <Play 
        awayPlayers={awayActions}
        homePlayers={homeActions}
        allActions={allActions}
        scoreTimeline={scoreTimeline}
        awayPlayerTimeline={awayPlayerTimeline}
        homePlayerTimeline={homePlayerTimeline}></Play>
      <StatButtons statOn={statOn} changeStatOn={changeStatOn}></StatButtons>
      <Boxscore box={box}></Boxscore>
    </div>
  );
}

function timeToSeconds(time) {
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