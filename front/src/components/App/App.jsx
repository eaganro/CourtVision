import { useState, useEffect, useRef, useCallback } from 'react';
import { fixPlayerName } from '../../helpers/utils';
import { sortActions, filterActions, processScoreTimeline, createPlayers,
  createPlaytimes, updatePlaytimesWithAction, quarterChange, endPlaytimes } from '../../helpers/dataProcessing';


import Schedule from '../Schedule/Schedule';
import Score from '../Score/Score';
import Boxscore from '../Boxscore/Boxscore';
import Play from '../Play/Play';
import StatButtons from '../StatButtons/StatButtons';

import { wsLocation, PREFIX } from '../../environment';

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

  // Read optional query params on load
  const initialParams = new URLSearchParams(window.location.search);
  const initialDate = initialParams.get('date') || val;
  const initialGameId = initialParams.get('gameid') || "0042400212";

  const [date, setDate] = useState(initialDate);
  const [games, setGames] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [box, setBox] = useState({});
  const [playByPlay, setPlayByPlay] = useState([]);
  // const [gameId, setGameId] = useState("0022300216");
  const [gameId, setGameId] = useState(initialGameId);
  const [awayTeamId, setAwayTeamId] = useState(null);
  const [homeTeamId, setHomeTeamId] = useState(null);

  const [awayActions, setAwayActions] = useState([]);
  const [homeActions, setHomeActions] = useState([]);

  const [allActions, setAllActions] = useState([]);

  const [scoreTimeline, setScoreTimeline] = useState([]);
  const [homePlayerTimeline, setHomePlayerTimeline] = useState([]);
  const [awayPlayerTimeline, setAwayPlayerTimeline] = useState([]);

  const [isBoxLoading, setIsBoxLoading] = useState(true);
  const [isPlayLoading, setIsPlayLoading] = useState(true);

  const latestBoxRef = useRef(box);
  const latestPlayByPlayRef = useRef(playByPlay);


  const [playByPlaySectionWidth, setPlayByPlaySectionWidth] = useState(0);



  // const [statOn, setStatOn] = useState([true, false, true, true, false, false, false, false]);
  const [statOn, setStatOn] = useState([true, true, true, true, true, true, true, true]);
  const [numQs, setNumQs] = useState(4);
  const [lastAction, setLastAction] = useState(null);

  const [ws, setWs] = useState(null);

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const newWs = new WebSocket(wsLocation);
    setWs(newWs);

    newWs.onopen = () => {
      console.log('Connected to WebSocket');
      newWs.send(JSON.stringify({ action: 'followGame', gameId }));
      newWs.send(JSON.stringify({ action: 'followDate', date }));
    };

    newWs.onmessage = async (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("Malformed WS message", event.data, err);
        return;
      }
    
      try {
        if (msg.key?.includes("playByPlayData")) {
          const url = `${PREFIX}/${encodeURIComponent(msg.key)}?v=${msg.version}`;
          getPlayByPlay(url);
        } else if (msg.key?.includes("boxData")) {
          const url = `${PREFIX}/${encodeURIComponent(msg.key)}?v=${msg.version}`;
          getBox(url);
        } else if (msg.type === "date") {
          setGames(msg.data);
          setIsScheduleLoading(false);
        }
      } catch (err) {
        console.error("Error handling WS message", msg, err);
      }
    };

    newWs.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

  };

  useEffect(() => {
    connect();
    // return () => ws?.close();
  }, []);

  useEffect(() => {
    latestBoxRef.current = box;
  }, [box]);

  useEffect(() => {
    latestPlayByPlayRef.current = playByPlay;
  }, [playByPlay]);

  // Keep query params in sync when date or game changes
  const updateQueryParams = useCallback((newDate, newGameId) => {
    const params = new URLSearchParams(window.location.search);
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }
    if (newGameId) {
      params.set('gameid', newGameId);
    } else {
      params.delete('gameid');
    }
    const query = params.toString();
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  // On initial mount, ensure URL reflects initial state
  useEffect(() => {
    updateQueryParams(date, gameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'followDate', date }));
    } else if (ws !== null) {
      connect();
    }
    updateQueryParams(date, gameId);
  }, [date]);

  useEffect(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'followGame', gameId }));
    } else if (ws !== null) {
      connect();
    }
    getBoth();
    updateQueryParams(date, gameId);
  }, [gameId]);



  useEffect(() => {
    processPlayData(playByPlay);
  }, [playByPlay, statOn]);

  const getBoth = async () => {
    const boxUrl  = `${PREFIX}/data/boxData/${gameId}.json.gz`;
    const playUrl = `${PREFIX}/data/playByPlayData/${gameId}.json.gz`;

    setIsBoxLoading(true);
    setIsPlayLoading(true);

    try {
      const [boxRes, playRes] = await Promise.all([
        fetch(boxUrl),
        fetch(playUrl).then(res => {
          if (!res.ok && res.status === 404) {
            setPlayByPlay([]);
            setLastAction(null);
            setNumQs(4);
            return null;
          }
          if (!res.ok) throw new Error(`S3 fetch failed: ${res.status}`);
          return res.json();
        }),
      ]);

      if (!boxRes.ok) throw new Error(`S3 fetch failed: ${boxRes.status}`);
      const box = await boxRes.json();
      setBox(box);
      setAwayTeamId(box.awayTeamId ?? box.awayTeam.teamId);
      setHomeTeamId(box.homeTeamId ?? box.homeTeam.teamId);
      setIsBoxLoading(false);

      const play = playRes;
      if (play) {
        const last = play[play.length - 1] || null;
        setNumQs(last?.period > 4 ? last?.period : 4);
        setLastAction(last);
        setPlayByPlay(play);
      }
      setIsPlayLoading(false);
    } catch (err) {
      console.error('Error in getBoth:', err);
      setIsBoxLoading(false);
      setIsPlayLoading(false);
    }
  };

  const getPlayByPlay = async (url) => {
    if (!latestPlayByPlayRef.current.length) {
      setIsPlayLoading(true);
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          setPlayByPlay([]);  
          setLastAction(null);
          setNumQs(4);
          return;
        }
        throw new Error(`S3 fetch failed: ${res.status}`);
      }
      let play = await res.json()

      const last = play[play.length - 1] || null;
      setNumQs(last?.period > 4 ? last?.period : 4);
      setLastAction(last);


      if (last?.status?.trim().startsWith('Final')) {
        await getBox(`${PREFIX}/data/boxData/${gameId}.json.gz`);
        ws?.close();
      }
      setPlayByPlay(play);
    } catch (err) {
      console.error('Error in getPlayByPlay:', err);
    } finally {
      setIsPlayLoading(false);
    }
  }

  const getBox = async (url) => {
    if (!latestBoxRef.current || Object.keys(latestBoxRef.current).length === 0) {
      setIsBoxLoading(true);
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`S3 fetch failed: ${res.status}`);
      const box = await res.json();
      setBox(box);
      setAwayTeamId(box.awayTeamId ?? box.awayTeam.teamId);
      setHomeTeamId(box.homeTeamId ?? box.homeTeam.teamId);
    } catch (err) {
      console.error('Error in getBox:', err);
    } finally {
      setIsBoxLoading(false);
    }
  }

  const changeDate = (e) => {
    const newDate = e.target.value;
    if (newDate === date) {
      return;
    }
    setIsScheduleLoading(true);
    setDate(newDate);
    updateQueryParams(newDate, gameId);
  }

  const changeGame = (id) => {
    setIsBoxLoading(true);
    setIsPlayLoading(true);
    setGameId(id);
    updateQueryParams(date, id);
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
    
    console.log(homePlayers)
    console.log(awayPlayers)
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
    const element = playByPlaySectionRef.current;
    if (!element) {
      return () => {};
    }
    observer.observe(element);
    return () => {
      observer.unobserve(element);
    }
  }, []);


  let awayTeamName = {
    name: box?.awayTeam?.teamName || 'Away Team',
    abr: box?.awayTeam?.teamTricode || '',
  };
  let homeTeamName = {
    name: box?.homeTeam?.teamName || 'Away Team',
    abr: box?.homeTeam?.teamTricode || '',
  };

  const isGameDataLoading = isBoxLoading || isPlayLoading;

  return (
    <div className='topLevel'>
      <Schedule
        games={games}
        date={date}
        changeDate={changeDate}
        changeGame={changeGame}
        isLoading={isScheduleLoading}
      ></Schedule>
      <Score
        homeTeam={box?.homeTeam?.teamTricode}
        awayTeam={box?.awayTeam?.teamTricode}
        score={scoreTimeline[scoreTimeline.length - 1]}
        date={box.gameEt}
        changeDate={changeDate}
        isLoading={isGameDataLoading}></Score>
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
          lastAction={lastAction}
          isLoading={isPlayLoading}></Play>
        <StatButtons statOn={statOn} changeStatOn={changeStatOn}></StatButtons>
      </div>
      <Boxscore box={box} isLoading={isBoxLoading}></Boxscore>
    </div>
  );
}
