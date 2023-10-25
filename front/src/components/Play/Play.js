import { useState } from 'react';
// import getWindowDimensions from '../hooks/windowDimensions';

import Player from './Player/Player';

import './Play.scss';

export default function Play({ awayTeamName, homeTeamName, awayPlayers, homePlayers, allActions, scoreTimeline, awayPlayerTimeline, homePlayerTimeline, numQs }) {

  const [descriptionArray, setDescriptionArray] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMouse, setShowMouse] = useState(true);
  const [mouseLinePos, setMouseLinePos] = useState(null);
  const [highlightActionIds, setHighlightActionIds] = useState([]);


  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const playtimes = {};
  Object.keys(awayPlayers).forEach(player => {
    playtimes[player] = {
      times: [],
      on: false
    };
  });
  Object.keys(awayPlayers).forEach(player => {
    awayPlayers[player].forEach(action => {
      if (action.actionType === 'Substitution') {

      } else {
        if (playtimes[player].on === false) {
          playtimes[player].on = true;
        }
      }
    });
  });
  const width = Math.min(windowWidth * 0.9 - 100, 1135);
  console.log(width);
  
  let qWidth = width / 4;
  if (numQs > 4) {
    qWidth = width * (12 / (12 * 4 + 5 * (numQs - 4)))
  }

  const awayLength = Object.keys(awayPlayers).length;
  const awayRows = Object.keys(awayPlayers).map(name => {
    return (
      <Player key={name} actions={awayPlayers[name]} timeline={awayPlayerTimeline[name]}
        name={name} width={width} numQs={numQs} heightDivide={awayLength}
        highlight={highlightActionIds}></Player>
    );
  });

  const homeLength = Object.keys(homePlayers).length;
  const homeRows = Object.keys(homePlayers).map(name => {
    return (
      <Player key={name} actions={homePlayers[name]} timeline={homePlayerTimeline[name]}
        name={name} width={width} numQs={numQs} heightDivide={homeLength}
        highlight={highlightActionIds}></Player>
    );
  });

  let maxAwayLead = 0;
  let maxHomeLead = 0;
  scoreTimeline.forEach(t => {
    const scoreDiff = Number(t.away) - Number(t.home);
    maxAwayLead = Math.max(maxAwayLead, scoreDiff);
    maxHomeLead = Math.min(maxHomeLead, scoreDiff);
    t.scoreDiff = scoreDiff;
  });

  let maxLead = Math.max(maxAwayLead, maxHomeLead * -1);

  let maxY = Math.floor(maxLead / 5) * 5 + 10

  let startx = 0;
  let starty = 0;
  const timeline = scoreTimeline.map((t, i) => {
    let x1 = startx;
    let x2 = (((t.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (qWidth * 4);
    if (t.period > 4) {
      x2 = ((4 * 12 * 60 + 5 * (t.period - 4) * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (qWidth * 4);
    }
    startx = x2;

    let y1 = starty;
    let y2 = t.scoreDiff * - 300 / maxY;
    starty = y2;
    return ([
      <line period={t.period} key={'one' + i} x1={100 + x1} y1={300 + y1} x2={100 + x2} y2={300 + y1} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />,
      <line period={t.period} key={'two' + i} x1={100 + x2} y1={300 + y1} x2={100 + x2} y2={300 + y2} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
    ])
  }).flat();

  timeline.push(<line key={'secondLast'} x1={100 + startx} y1={300 + starty} x2={100 + width} y2={300 + starty} style={{ stroke: 'rgb(255,0,0)', strokeWidth:2 }} />)
  timeline.unshift(<line key={'Last'} x1={0} y1={300} x2={width + 100} y2={300} style={{ stroke: 'black', strokeWidth:1 }} />)
  timeline.unshift(<line key={'q1'} x1={100 + qWidth} y1={10} x2={100 + qWidth} y2={590} style={{ stroke:'black', strokeWidth:1 }} />)
  timeline.unshift(<line key={'q2'} x1={100 + qWidth * 2} y1={10} x2={100 + qWidth * 2} y2={590} style={{ stroke: 'black', strokeWidth: 1 }} />)
  timeline.unshift(<line key={'q3'} x1={100 + qWidth * 3} y1={10} x2={100 + qWidth * 3} y2={590} style={{ stroke: 'black', strokeWidth: 1 }} />)
  for (let q = 4; q < numQs; q += 1) {
    let x1 = 100 + qWidth * 4 + (5/12 * qWidth) * (q - 4);
    let x2 = 100 + qWidth * 4 + (5/12 * qWidth) * (q - 4);
    timeline.unshift(<line key={`q${q}`} x1={x1} y1={10} x2={x2} y2={590} style={{ stroke: 'black', strokeWidth: 1 }} />)
  }

  const descriptionList = descriptionArray.map(a => (<div>{a.description}</div>));
  descriptionArray[0] && descriptionArray[0] && descriptionList.unshift(<div>{descriptionArray[0].clock} - {descriptionArray[0].scoreAway} - {descriptionArray[0].scoreHome}</div>)

  let mouseLine = null;
  const mouseOver = (e) => {
    if (showMouse) {
      let el = e.target;
      while (el.className !== 'play') {
        el = el.parentElement;
      }
      let pos = e.clientX - el.offsetLeft - 100;

      let a = 0;

      let goneOver = false;
      let sameTime = 1;
      for (let i = 1; i < allActions.length && goneOver === false; i += 1) {
        let actionPos = (((allActions[i].period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(allActions[i].clock)) / (4 * 12 * 60)) * (qWidth * 4);
        if (allActions[i].period > 4) {
          actionPos = ((4 * 12 * 60 + 5 * (allActions[i].period - 4) * 60 - timeToSeconds(allActions[i].clock)) / (4 * 12 * 60)) * (qWidth * 4);
        }
        if (actionPos > pos) {
          goneOver = true;
        } else {
          if (allActions[a].clock === allActions[i].clock) {
            sameTime += 1;
          } else {
            sameTime = 1;
          }
          a = i;
        }
      }
      const hoverActions = [];
      const hoverActionIds = [];
      for (let i = 0; i < sameTime; i += 1) {
        hoverActions.push(allActions[a - i]);
        hoverActionIds.push(allActions[a - i].actionId);
      }
      setHighlightActionIds(hoverActionIds);
      setDescriptionArray(hoverActions);
      if (pos < 0 || pos > width) {
        setMouseLinePos(null);
      } else {
        setMouseLinePos(pos + 100);
      }


      // setShowMouse(false);
      // setTimeout(() => setShowMouse(true), 100);
    }
  }

  const mouseOut = (e) => {
    setMouseLinePos(null);
    setDescriptionArray([]);
  }

  return (
    <div onMouseMove={mouseOver} onMouseOut={mouseOut} className='play' style={{ width: width + 100 }}>
      <div className="descriptionArea">{descriptionList}</div>
      <svg height="600" width={width + 100} className='line'>
        {timeline}
      </svg>
      <svg height="600" width={width + 100} className='line'>
        {mouseLinePos !== null ? 
          <line x1={mouseLinePos} y1={10} x2={mouseLinePos} y2={590} style={{ stroke: 'grey', strokeWidth: 1 }} />
          : ''}
      </svg>
      <div class="teamName">{awayTeamName}</div>
      <div className='teamSection'>
        {awayRows}
      </div>
      <div class="teamName">{homeTeamName}</div>
      <div className='teamSection'>
        {homeRows}
      </div>
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
