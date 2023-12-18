import { useState, useEffect, useRef } from 'react';

import Schedule from '../Schedule/Schedule';
import Score from '../Score/Score';
import Boxscore from '../Boxscore/Boxscore';
import Play from '../Play/Play';
import StatButtons from '../StatButtons/StatButtons';

import './App.scss';
export default function App() {

  let today = new Date();
  const [date, setDate] = useState(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
  const [games, setGames] = useState([]);
  const [box, setBox] = useState({});
  const [playByPlay, setPlayByPlay] = useState([]);
  // const [gameId, setGameId] = useState("0022300216");
  const [gameId, setGameId] = useState("0062300001");
  const [awayTeamId, setAwayTeamId] = useState(null);
  const [homeTeamId, setHomeTeamId] = useState(null);

  const [awayActions, setAwayActions] = useState([]);
  const [homeActions, setHomeActions] = useState([]);

  const [allActions, setAllActions] = useState([]);

  const [scoreTimeline, setScoreTimeline] = useState([]);
  const [homePlayerTimeline, setHomePlayerTimeline] = useState([]);
  const [awayPlayerTimeline, setAwayPlayerTimeline] = useState([]);


  const [playByPlaySectionWidth, setPlayByPlaySectionWidth] = useState(0);



  // const [statOn, setStatOn] = useState([true, false, true, true, false, false, false, false]);
  const [statOn, setStatOn] = useState([true, true, true, true, true, true, true, true]);
  const [numQs, setNumQs] = useState(4);
  const [lastAction, setLastAction] = useState(null);

  const [ws, setWs] = useState(null);

  useEffect(() => {
    // const newWs = new WebSocket('ws://roryeagan.com:3000');
    const newWs = new WebSocket('ws://localhost:3000');
    setWs(newWs);

    newWs.onopen = () => {
      console.log('Connected to WebSocket');
      newWs.send(JSON.stringify({ type: 'gameId', gameId }));
      newWs.send(JSON.stringify({ type: 'date', date }));
    };

    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if(data.type === 'playByPlayData') {
        const play = JSON.parse(data.data);
        if (play[play.length - 1] && play[play.length - 1].period > 4) {
          setNumQs(play[play.length - 1].period);
        } else {
          setNumQs(4);
        }
        setLastAction(play[play.length - 1])
        setPlayByPlay(play);
        setPlayByPlay(play);
      } else if (data.type === 'boxData') {
        const box = JSON.parse(data.data);
        setBox(box);
        setAwayTeamId(box.awayTeamId ? box.awayTeamId : box.awayTeam.teamId);
        setHomeTeamId(box.homeTeamId ? box.homeTeamId : box.homeTeam.teamId);
      } else if (data.type === 'date') {
        let scheduleGames = data.data;
        console.log(scheduleGames);
        setGames(scheduleGames);
      } else {
        // console.log('Message from server ', event.data);
        const { play, box } = data;

        setBox(box);
        setAwayTeamId(box.awayTeamId ? box.awayTeamId : box.awayTeam.teamId);
        setHomeTeamId(box.homeTeamId ? box.homeTeamId : box.homeTeam.teamId);

        if (play[play.length - 1] && play[play.length - 1].period > 4) {
          setNumQs(play[play.length - 1].period);
        } else {
          setNumQs(4);
        }
        setLastAction(play[play.length - 1])
        setPlayByPlay(play);
      }
    };

    newWs.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

    return () => {
      newWs.close();
    };
  }, []);

  useEffect(() => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'date', date }));
    } else {
      // fetch(`/games?date=${date}`).then(r =>  {
      //   if (r.status === 404) {
      //     return [];
      //   } else {
      //     return r.json()
      //   }
      // }).then(gamesData => {
      //   setGames(gamesData);
      // });
    }
  }, [date]);

  useEffect(() => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'gameId', gameId }));
    }
    // Promise.all([fetch(`/data/boxData/${gameId}.json`), fetch(`/data/playByPlayData/${gameId}.json`)]).then(d => {
    // Promise.all([fetch(`/data/boxData/${gameId}.json`)]).then(d => {
    //   return Promise.all(d.map(r => r.json()));
    // }).then(d => {
    //   const boxData = d[0];
    //   setBox(boxData);
    //   setAwayTeamId(boxData.awayTeamId);
    //   setHomeTeamId(boxData.homeTeamId);

    //   // const play = d[1];
    //   // if (play[play.length - 1] && play[play.length - 1].period > 4) {
    //   //   setNumQs(play[play.length - 1].period);
    //   // } else {
    //   //   setNumQs(4);
    //   // }
    //   // setLastAction(play[play.length - 1])
    //   // setPlayByPlay(play);
    //   // processPlayData(play);
    // })
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
      setAwayPlayerTimeline([]);
      setHomePlayerTimeline([]);
      setScoreTimeline([]);
      setAllActions([]);
      setAwayActions([]);
      setHomeActions([]);
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

      let playerName = a.playerName;

      let nameLoc = a.description.indexOf(a.playerName);
      if (nameLoc > 0 && a.description[nameLoc - 2] === '.') {
        playerName = a.description.slice(a.description.slice(0, nameLoc - 2).lastIndexOf(' ') + 1, nameLoc + a.playerName.length);
      }

      // debugger;
      if (playerName) {
        if(a.teamId === awayTeamId) {
          if (!awayPlayers[playerName]) {
            awayPlayers[playerName] = [a];
          } else {
            awayPlayers[playerName].push(a);
          }
          if (a.description.includes('AST')) {
            awayAssistActions.push(a);
          }
        } else if(a.teamId === homeTeamId) {
          if (!homePlayers[playerName]) {
            homePlayers[playerName] = [a];
          } else {
            homePlayers[playerName].push(a);
          }
          if (a.description.includes('AST')) {
            homeAssistActions.push(a);
          }
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

      let playerName = a.playerName;

      let nameLoc = a.description.indexOf(a.playerName);
      if (nameLoc > 0 && a.description[nameLoc - 2] === '.') {
        playerName = a.description.slice(a.description.slice(0, nameLoc - 2).lastIndexOf(' ') + 1, nameLoc + a.playerName.length);
      }

      if(a.teamId === awayTeamId) {
        if(a.period !== currentQ) {
          Object.keys(awayPlaytimes).forEach(player => {
            if(awayPlaytimes[player].on === true) {
              let t = awayPlaytimes[player].times;
              t[t.length - 1].end = "PT00M00.00S";
              awayPlaytimes[player].on = false;
            }
          });
          Object.keys(homePlaytimes).forEach(player => {
            if(homePlaytimes[player].on === true) {
              let t = homePlaytimes[player].times;
              t[t.length - 1].end = "PT00M00.00S";
              homePlaytimes[player].on = false;
            }
          });
          currentQ = a.period;
        }
        if (a.actionType === 'Substitution') {
          let startName = a.description.indexOf('SUB:') + 5;
          let endName = a.description.indexOf('FOR') - 1;
          // if (a.actionType === 'substitution') {
          //   startName = a.description.indexOf(':') + 2;
          //   endName = a.description.length;
          // }
          let name = a.description.slice(startName, endName);
          if (name === 'Porter' && a.teamTricode === 'CLE') {
            name = "Porter Jr."
          }
          // if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
          //   name = name.split(' ')[1];
          // }
          if(awayPlaytimes[name]) {
            awayPlaytimes[name].times.push({ start: a.clock, period: a.period });
            awayPlaytimes[name].on = true;
          } else {
            awayPlaytimes[name] = {
              times: [],
              on: false,
            };
            awayPlaytimes[name].times.push({ start: a.clock, period: a.period });
            awayPlaytimes[name].on = true;
            awayPlayers[name] = [];
            console.log('PROBLEM: Player Name Not Found', name);
          }
          
          let t = awayPlaytimes[playerName].times;
          if (awayPlaytimes[playerName].on === false) {
            if (a.period <= 4) {
              t.push({ start: "PT12M00.00S", period: a.period });
            } else {
              t.push({ start: "PT05M00.00S", period: a.period });
            }
          }
          t[t.length - 1].end = a.clock;
          awayPlaytimes[playerName].on = false;
        } else if (a.actionType === 'substitution') {
          let name = a.description.slice(a.description.indexOf(':') + 2);
          let t = awayPlaytimes[name].times;
          if (a.description.includes('out:')) {
            if (awayPlaytimes[name].on === false) {
              if (a.period <= 4) {
                t.push({ start: "PT12M00.00S", period: a.period });
              } else {
                t.push({ start: "PT05M00.00S", period: a.period });
              }
            }
            t[t.length - 1].end = a.clock;
            awayPlaytimes[name].on = false;
          } else if (a.description.includes('in:')) {
            if(awayPlaytimes[name]) {
              awayPlaytimes[name].times.push({ start: a.clock, period: a.period });
              awayPlaytimes[name].on = true;
            } else {
              awayPlaytimes[name] = {
                times: [],
                on: false,
              };
              awayPlaytimes[name].times.push({ start: a.clock, period: a.period });
              awayPlaytimes[name].on = true;
              awayPlayers[name] = [];
              console.log('PROBLEM: Player Name Not Found', name);
            }
          }
        } else {
          if (playerName && awayPlaytimes[playerName].on === false) {
            awayPlaytimes[playerName].on = true;
            awayPlaytimes[playerName].times.push({ start: "PT12M00.00S", period: a.period, end: a.clock });     
          } else if(playerName && awayPlaytimes[playerName].on === true) {
            let t = awayPlaytimes[playerName].times;
            t[t.length - 1].end = a.clock;
          }
        }
      }





      if(a.teamId === homeTeamId) {
        if(a.period !== currentQ) {
          Object.keys(homePlaytimes).forEach(player => {
            if(homePlaytimes[player].on === true) {
              let t = homePlaytimes[player].times;
              t[t.length - 1].end = "PT00M00.00S";
              homePlaytimes[player].on = false;
            }
          });
          Object.keys(awayPlaytimes).forEach(player => {
            if(awayPlaytimes[player].on === true) {
              let t = awayPlaytimes[player].times;
              t[t.length - 1].end = "PT00M00.00S";
              awayPlaytimes[player].on = false;
            }
          });
          currentQ = a.period;
        }
        if (a.actionType === 'Substitution') {
          let startName = a.description.indexOf('SUB:') + 5;
          let endName = a.description.indexOf('FOR') - 1;
          let name = a.description.slice(startName, endName);
          if (name === 'Porter' && a.teamTricode === 'CLE') {
            name = "Porter Jr."
          }
          // if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
          //   name = name.split(' ')[1];
          // }
          if(homePlaytimes[name]) {
            homePlaytimes[name].times.push({ start: a.clock, period: a.period });
            homePlaytimes[name].on = true;
          } else {
            homePlaytimes[name] = {
              times: [],
              on: false,
            };
            homePlaytimes[name].times.push({ start: a.clock, period: a.period });
            homePlaytimes[name].on = true;
            homePlayers[name] = [];
            console.log('PROBLEM: Player Name Not Found', name, homePlaytimes);
          }

          let t = homePlaytimes[playerName].times;
          if (homePlaytimes[playerName].on === false) {
            if (a.period <= 4) {
              t.push({ start: "PT12M00.00S", period: a.period });
            } else {
              t.push({ start: "PT05M00.00S", period: a.period });
            }
          }
          t[t.length - 1].end = a.clock;
          homePlaytimes[playerName].on = false;
        } else if (a.actionType === 'substitution') {
          let name = a.description.slice(a.description.indexOf(':') + 2);
          if (a.description.includes('out:')) {
            let t =  homePlaytimes[name].times;
            if (homePlaytimes[name].on === false) {
              if (a.period <= 4) {
                t.push({ start: "PT12M00.00S", period: a.period });
              } else {
                t.push({ start: "PT05M00.00S", period: a.period });
              }
            }
            t[t.length - 1].end = a.clock;
            homePlaytimes[name].on = false;
          } else if (a.description.includes('in:')) {
            if(homePlaytimes[name]) {
              homePlaytimes[name].times.push({ start: a.clock, period: a.period });
              homePlaytimes[name].on = true;
            } else {
              homePlaytimes[name] = {
                times: [],
                on: false,
              };
              homePlaytimes[name].times.push({ start: a.clock, period: a.period });
              homePlaytimes[name].on = true;
              homePlayers[name] = [];
              console.log('PROBLEM: Player Name Not Found', name);
            }
          }
        } else {
          if (playerName && homePlaytimes[playerName].on === false) {
            homePlaytimes[playerName].on = true;
            if (a.period <= 4) {
              homePlaytimes[playerName].times.push({ start: "PT12M00.00S", period: a.period, end: a.clock });
            } else {
              homePlaytimes[playerName].times.push({ start: "PT05M00.00S", period: a.period, end: a.clock });
            }
          } else if(playerName && homePlaytimes[playerName].on === true) {
            let t = homePlaytimes[playerName].times;
            t[t.length - 1].end = a.clock;
          }
        }
      }
    });
    Object.keys(homePlaytimes).forEach(player => {
      if(homePlaytimes[player].on === true) {
        let t = homePlaytimes[player].times;
        t[t.length - 1].end = lastAction.clock;
      }
      homePlaytimes[player] = homePlaytimes[player].times;
    });
    Object.keys(awayPlaytimes).forEach(player => {
      if(awayPlaytimes[player].on === true) {
        let t = awayPlaytimes[player].times;
        t[t.length - 1].end = lastAction.clock;
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
      if (name === 'Porter' && a.teamTricode === 'CLE') {
        name = "Porter Jr."
      }
      // if (name.includes(' ') && name.split(' ')[1] !== 'Jr.' && name.split(' ')[1].length > 3) {
      //   name = name.split(' ')[1];
      // }
      if (awayPlayers[name] === undefined) {
        awayPlayers[name] = [];
      }
      awayPlayers[name].push({
        actionType: 'Assist',
        clock: a.clock,
        description: a.description.slice(startName, -1),
        actionId: a.actionId ? a.actionId + 'a' : a.actionNumber + 'a',
        actionNumber: a.actionNumber + 'a',
        teamId: a.teamId,
        scoreHome: a.scoreHome,
        scoreAway: a.scoreAway,
        personId: awayPlayers[name][0]?.personId,
        playerName: awayPlayers[name][0]?.playerName,
        playerNameI: awayPlayers[name][0]?.playerNameI,
        period: a.period
      });
    });

    homeAssistActions.forEach(a => {
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
      homePlayers[name].push({
        actionType: 'Assist',
        clock: a.clock,
        description: a.description.slice(startName, -1),
        actionId: a.actionId ? a.actionId + 'a' : a.actionNumber + 'a',
        actionNumber: a.actionNumber + 'a',
        teamId: a.teamId,
        scoreHome: a.scoreHome,
        scoreAway: a.scoreAway,
        personId: homePlayers[name][0]?.personId,
        playerName: homePlayers[name][0]?.playerName,
        playerNameI: homePlayers[name][0]?.playerNameI,
        period: a.period
      })
    });

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
        } else if (a.description.includes('TO)') && statOn[4]) {
          filterPlayer.push(a);
        } else if (a.description.includes('BLK') && statOn[5]) {
          filterPlayer.push(a);
        } else if (a.description.includes('STL') && statOn[6]) {
          filterPlayer.push(a);
        } else if (a.description.includes('PF)') && statOn[7]) {
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
        } else if (a.description.includes('TO)') && statOn[4]) {
          filterPlayer.push(a);
        } else if (a.description.includes('BLK') && statOn[5]) {
          filterPlayer.push(a);
        } else if (a.description.includes('STL') && statOn[6]) {
          filterPlayer.push(a);
        } else if (a.description.includes('PF)') && statOn[7]) {
          filterPlayer.push(a);
        } 
      }
      homePlayers[k] = filterPlayer;
    });

    allAct = sortActions(allAct);

    setAllActions(allAct);
    setAwayActions(awayPlayers);
    setHomeActions(homePlayers);
  }

  const changeStatOn = (index) => {
    const statOnNew = statOn.slice();
    statOnNew[index] = !statOnNew[index];
    setStatOn(statOnNew);
  }
  
  const playByPlaySectionRef = useRef();
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      setPlayByPlaySectionWidth(entries[0].contentRect.width)
    })
    observer.observe(playByPlaySectionRef.current)
    return () => ref.current && observer.unobserve(ref.current)
  }, []);


  let awayTeamName = {
    name: box?.awayTeam?.teamName || 'Away Team',
    abr: box?.awayTeam?.teamTricode || '',
  };
  let homeTeamName = {
    name: box?.homeTeam?.teamName || 'Away Team',
    abr: box?.homeTeam?.teamTricode || '',
  };

  return (
    <div className='topLevel'>
      <Schedule games={games} date={date} changeDate={changeDate} changeGame={changeGame}></Schedule>
      <Score
        homeTeam={box?.homeTeam?.teamTricode}
        awayTeam={box?.awayTeam?.teamTricode}
        score={scoreTimeline[scoreTimeline.length - 1]}
      ></Score>
      <div className='playByPlaySection' ref = {playByPlaySectionRef}>
        <Play
          awayTeamNames={awayTeamName}
          homeTeamNames={homeTeamName}
          awayPlayers={awayActions}
          homePlayers={homeActions}
          allActions={allActions}
          scoreTimeline={scoreTimeline}
          awayPlayerTimeline={awayPlayerTimeline}
          homePlayerTimeline={homePlayerTimeline}
          numQs={numQs}
          sectionWidth={playByPlaySectionWidth}
          lastAction={lastAction}></Play>
        <StatButtons statOn={statOn} changeStatOn={changeStatOn}></StatButtons>
      </div>
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

function sortActions(actions) {
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