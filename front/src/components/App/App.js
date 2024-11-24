import { useState, useEffect, useRef } from 'react';
import { fixPlayerName } from '../../utils';
import { sortActions, filterActions, processScoreTimeline, createPlayers,
  createPlaytimes, updatePlaytimesWithAction, quarterChange, endPlaytimes } from '../../dataProcessing';


import Schedule from '../Schedule/Schedule';
import Score from '../Score/Score';
import Boxscore from '../Boxscore/Boxscore';
import Play from '../Play/Play';
import StatButtons from '../StatButtons/StatButtons';

import { wsLocation } from '../../environment';

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
  const [gameId, setGameId] = useState("0022400104");
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
    const newWs = new WebSocket(wsLocation);
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
      fetch(`games?date=${date}`).then(r =>  {
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
      console.log('hereasdf')
      ws.send(JSON.stringify({ type: 'gameId', gameId }));
    } else {
      console.log('no ws');
      fetch(`game?gameId=${gameId}`).then(r =>  {
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
    setScoreTimeline(processScoreTimeline(data));

    let { awayPlayers, homePlayers } = createPlayers(data, awayTeamId, homeTeamId);
    let awayPlaytimes = createPlaytimes(awayPlayers);
    let homePlaytimes = createPlaytimes(homePlayers);

    let currentQ = 1;
    data.forEach(a => {
      if(a.period !== currentQ) {
        awayPlaytimes = quarterChange(awayPlaytimes);
        homePlaytimes = quarterChange(homePlaytimes);
        currentQ = a.period;
      }
      if(a.teamId === awayTeamId) {
        awayPlaytimes = updatePlaytimesWithAction(a, awayPlaytimes);
      }
      if(a.teamId === homeTeamId) {
        homePlaytimes = updatePlaytimesWithAction(a, homePlaytimes);
      }
    });
    homePlaytimes = endPlaytimes(homePlaytimes, lastAction);
    awayPlaytimes = endPlaytimes(awayPlaytimes, lastAction);
    setAwayPlayerTimeline(awayPlaytimes);
    setHomePlayerTimeline(homePlaytimes);

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
        date={box.gameEt}
        changeDate={changeDate}></Score>
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
