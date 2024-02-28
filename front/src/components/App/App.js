import { useState, useEffect, useRef } from 'react';
import { timeToSeconds, sortActions, filterActions, addAssistActions } from '../../utils';

import Schedule from '../Schedule/Schedule';
import Score from '../Score/Score';
import Boxscore from '../Boxscore/Boxscore';
import Play from '../Play/Play';
import StatButtons from '../StatButtons/StatButtons';

import './App.scss';
export default function App() {

  let today = new Date();
  today.setDate(today.getDate());
  let month = today.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  let day = today.getDate();
  if (day < 10) {
    day = '0' + day;
  }
  let val = `${today.getFullYear()}-${month}-${day}`
  const [date, setDate] = useState(val);
  const [games, setGames] = useState([]);
  const [box, setBox] = useState({});
  const [playByPlay, setPlayByPlay] = useState([]);
  // const [gameId, setGameId] = useState("0022300216");
  const [gameId, setGameId] = useState("0022300779");
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
    // const newWs = new WebSocket('wss://roryeagan.com/nba/wss');
    const newWs = new WebSocket('ws://localhost:3001');
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
        gameDataReceiver(data);
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
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'date', date }));
    } else {
      fetch(`/games?date=${date}`).then(r =>  {
        if (r.status === 404) {
          return [];
        } else {
          return r.json()
        }
      }).then(gamesData => {
        setGames(gamesData.data);
      });
    }
  }, [date]);

  useEffect(() => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'gameId', gameId }));
    } else {
      console.log('no ws');
      fetch(`/game?gameId=${gameId}`).then(r =>  {
        if (r.status === 404) {
          return [];
        } else {
          return r.json()
        }
      }).then(gameData => {
        console.log(gameData);
        gameDataReceiver(gameData);
      });
    }
  }, [gameId]);

  useEffect(() => {
    processPlayData(playByPlay);
  }, [playByPlay, statOn]);

  const gameDataReceiver = (data) => {
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
    let awayPlayers = {};
    let homePlayers = {};

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

    awayAssistActions.forEach((a) => addAssistActions(a, awayPlayers));
    homeAssistActions.forEach((a) => addAssistActions(a, homePlayers));
    
    let allAct = [];
    Object.entries(awayPlayers).forEach(([name, actions]) => {
      allAct = [...allAct, ...actions];
      awayPlayers[name] = awayPlayers[name].filter((a) => filterActions(a, statOn));
    });
    Object.entries(homePlayers).forEach(([name, actions]) => {
      allAct = [...allAct, ...actions];
      homePlayers[name] = homePlayers[name].filter((a) => filterActions(a, statOn));
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