import { useState } from 'react';
// import getWindowDimensions from '../hooks/windowDimensions';

import Player from './Player/Player';

import './Play.scss';

export default function Play({ awayTeamNames, homeTeamNames, awayPlayers, homePlayers, allActions, scoreTimeline, awayPlayerTimeline, homePlayerTimeline, numQs, sectionWidth, lastAction }) {

  const [descriptionArray, setDescriptionArray] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMouse, setShowMouse] = useState(true);
  const [mouseLinePos, setMouseLinePos] = useState(null);
  const [highlightActionIds, setHighlightActionIds] = useState([]);

  const leftMargin = 120;

  const awayTeamName = awayTeamNames.name;
  const homeTeamName = homeTeamNames.name;

  const teamColor = {
    ATL: 'rgb(224 58 62)',
    BKN: 'rgb(0 0 0)',
    BOS: 'rgb(0 122 51)',
    CHA: 'rgb(29 17 96)',
    CHI: 'rgb(206 17 65)',
    CLE: 'rgb(134 0 56)',
    DAL: 'rgb(0 83 140)',
    DEN: 'rgb(14 34 64)',
    DET: 'rgb(200 16 46)',
    GSW: 'rgb(29 66 138)',
    HOU: 'rgb(206 17 65)',
    IND: 'rgb(0 45 98)',
    LAC: 'rgb(200 16 46)',
    LAL: 'rgb(85 37 131)',
    MEM: 'rgb(93 118 169)',
    MIA: 'rgb(152 0 46)',
    MIL: 'rgb(0 71 27)',
    MIN: 'rgb(12 35 64)',
    NOP: 'rgb(12 35 64)',
    NYK: 'rgb(0 107 182)',
    OKC: 'rgb(0 122 193)',
    ORL: 'rgb(0 119 192)',
    PHI: 'rgb(0 107 182)',
    PHX: 'rgb(29 17 96)',
    POR: 'rgb(224 58 62)',
    SAC: 'rgb(90 45 129)',
    SAS: 'rgb(196 206 212)',
    TOR: 'rgb(206 17 65)',
    UTA: 'rgb(0 43 92)',
    WAS: 'rgb(0 43 92)',
  };


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
  const width = sectionWidth * 1 - leftMargin;
  
  let qWidth = width / 4;
  if (numQs > 4) {
    qWidth = width * (12 / (12 * 4 + 5 * (numQs - 4)))
  }

  const awayLength = Object.keys(awayPlayers).length;
  const awayRows = Object.keys(awayPlayers).map(name => {
    return (
      <Player key={name} actions={awayPlayers[name]} timeline={awayPlayerTimeline[name]}
        name={name} width={width} numQs={numQs} heightDivide={awayLength}
        highlight={highlightActionIds} leftMargin={leftMargin}></Player>
    );
  });

  const homeLength = Object.keys(homePlayers).length;
  const homeRows = Object.keys(homePlayers).map(name => {
    return (
      <Player key={name} actions={homePlayers[name]} timeline={homePlayerTimeline[name]}
        name={name} width={width} numQs={numQs} heightDivide={homeLength}
        highlight={highlightActionIds} leftMargin={leftMargin}></Player>
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

  let maxY = Math.floor(maxLead / 5) * 5 + 10;


  let startx = 0;
  let starty = 0;
  let pospoints = [`${leftMargin},300`];
  let negpoints = [`${leftMargin},300`];

  let pos = true; 
  scoreTimeline.forEach((t, i) => {
      let x1 = startx;
      let x2 = (((t.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (qWidth * 4);
      if (t.period > 4) {
        x2 = ((4 * 12 * 60 + 5 * (t.period - 4) * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (qWidth * 4);
      }
      
      let y1 = starty;
      let y2 = t.scoreDiff * -300 / maxY;

      if (y1 <= 0) {
        pos = true;
        pospoints.push(`${leftMargin + x2},${300 + y1}`);
        if (y2 <= 0) {
          pospoints.push(`${leftMargin + x2},${300 + y2}`);
        } else {
          pospoints.push(`${leftMargin + x2},${300}`);
          negpoints.push(`${leftMargin + x2},${300}`);
          negpoints.push(`${leftMargin + x2},${300 + y2}`);
        }
      } else {
        pos = false;
        negpoints.push(`${leftMargin + x2},${300 + y1}`);
        if (y2 >= 0) {
          negpoints.push(`${leftMargin + x2},${300 + y2}`);
        } else {
          negpoints.push(`${leftMargin + x2},${300}`);
          pospoints.push(`${leftMargin + x2},${300}`);
          pospoints.push(`${leftMargin + x2},${300 + y2}`);
        }
      }
      
      startx = x2;
      starty = y2;
  });

  if (lastAction) {
    let lastX = (((lastAction.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(lastAction.clock)) / (4 * 12 * 60)) * (qWidth * 4);
    if (lastAction.period > 4) {
      lastX = ((4 * 12 * 60 + 5 * (lastAction.period - 4) * 60 - timeToSeconds(lastAction.clock)) / (4 * 12 * 60)) * (qWidth * 4);
    }
    if(pos) {
      pospoints.push(`${leftMargin + lastX},${300 + starty}`);
      pospoints.push(`${leftMargin + lastX},300`);
      negpoints.push(`2000,300`);
    } else{
      negpoints.push(`${leftMargin + lastX},${300 + starty}`);
      negpoints.push(`${leftMargin + lastX},300`);
      pospoints.push(`2000,300`);
    }
  }


  // let startx = 0;
  // let starty = 0;
  // const timeline = scoreTimeline.map((t, i) => {
  //   let x1 = startx;
  //   let x2 = (((t.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (qWidth * 4);
  //   if (t.period > 4) {
  //     x2 = ((4 * 12 * 60 + 5 * (t.period - 4) * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (qWidth * 4);
  //   }
  //   startx = x2;

  //   let y1 = starty;
  //   let y2 = t.scoreDiff * - 300 / maxY;
  //   starty = y2;
  //   return ([
  //     <line period={t.period} key={'one' + i} x1={leftMargin + x1} y1={300 + y1} x2={leftMargin + x2} y2={300 + y1} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />,
  //     <line period={t.period} key={'two' + i} x1={leftMargin + x2} y1={300 + y1} x2={leftMargin + x2} y2={300 + y2} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
  //   ])
  // }).flat();

  const timeline = [];
  // timeline.push(<line key={'secondLast'} x1={leftMargin + startx} y1={300 + starty} x2={leftMargin + width} y2={300 + starty} style={{ stroke: 'rgb(255,0,0)', strokeWidth:2 }} />)
  timeline.unshift(<line key={'Last'} x1={0} y1={300} x2={leftMargin + width} y2={300} style={{ stroke: 'black', strokeWidth:1 }} />)
  timeline.unshift(<line key={'q1'} x1={leftMargin + qWidth} y1={10} x2={leftMargin + qWidth} y2={590} style={{ stroke:'black', strokeWidth:1 }} />)
  timeline.unshift(<line key={'q2'} x1={leftMargin + qWidth * 2} y1={10} x2={leftMargin + qWidth * 2} y2={590} style={{ stroke: 'black', strokeWidth: 1 }} />)
  timeline.unshift(<line key={'q3'} x1={leftMargin + qWidth * 3} y1={10} x2={leftMargin + qWidth * 3} y2={590} style={{ stroke: 'black', strokeWidth: 1 }} />)
  for (let q = 4; q < numQs; q += 1) {
    let x1 = leftMargin + qWidth * 4 + (5/12 * qWidth) * (q - 4);
    let x2 = leftMargin + qWidth * 4 + (5/12 * qWidth) * (q - 4);
    timeline.unshift(<line key={`q${q}`} x1={x1} y1={10} x2={x2} y2={590} style={{ stroke: 'black', strokeWidth: 1 }} />)
  }


  let numLines = 0;
  let lineJump = 0;
  if ((maxLead / 5) < 5) {
    numLines = Math.floor(maxLead / 5)
    lineJump = 5;
  } else if ((maxLead / 10) < 5) {
    numLines = Math.floor(maxLead / 10)
    lineJump = 10;
  } else if ((maxLead / 15) < 5) {
    numLines = Math.floor(maxLead / 15)
    lineJump = 15;
  } else if ((maxLead / 20) < 5) {
    numLines = Math.floor(maxLead / 20)
    lineJump = 20;
  }

  let lineLabelStyle = {
    // textAlign: 'right',
  };
  for (let i = 0; i < numLines; i += 1) {
    let posy = 300 + ((i + 1) * lineJump) * - 300 / maxY
    timeline.unshift(<line key={`sp${i}-${awayTeamName}-${homeTeamName}`} x1={leftMargin - 5} y1={posy} x2={leftMargin + width} y2={posy} strokeDasharray={"5,5"} style={{ stroke: 'darkgrey', strokeWidth: 0.5 }} />)
    timeline.unshift(<text x={leftMargin - 10} y={posy + 5} text-anchor="end">{(i + 1) * lineJump}</text>)
    
    let negy = 300 + (-1 * (i + 1) * lineJump) * - 300 / maxY
    timeline.unshift(<line key={`sn${i}-${awayTeamName}-${homeTeamName}`} x1={leftMargin - 5} y1={negy} x2={leftMargin + width} y2={negy} strokeDasharray={"5,5"} style={{ stroke: 'darkgrey', strokeWidth: 0.5 }} />)
    timeline.unshift(<text x={leftMargin - 10} y={negy + 5} text-anchor="end">{-1 * (i + 1) * lineJump}</text>)
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
      let pos = e.clientX - el.offsetLeft - leftMargin;

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
        hoverActionIds.push(allActions[a - i].actionNumber);
      }
      setHighlightActionIds(hoverActionIds);
      setDescriptionArray(hoverActions);
      if (pos < 0 || pos > width) {
        setMouseLinePos(null);
      } else {
        setMouseLinePos(pos + leftMargin);
      }


      // setShowMouse(false);
      // setTimeout(() => setShowMouse(true), 200);
    }
  }

  const mouseOut = (e) => {
    setMouseLinePos(null);
    setDescriptionArray([]);
  }

  let awayColor = awayTeamNames.abr ? rgbToRgba(teamColor[awayTeamNames.abr], 0.3) : '';
  let homeColor = homeTeamNames.abr ? rgbToRgba(teamColor[homeTeamNames.abr], 0.3) : '';
  return (
    <div onMouseMove={mouseOver} onMouseOut={mouseOut} className='play' style={{ width: width + leftMargin }}>
      <div className="descriptionArea">{descriptionList}</div>
      <svg height="600" width={width + leftMargin} className='line'>
        {timeline}
        <polyline points={pospoints.join(' ')} style={{"fill": awayColor}}/>
        <polyline points={negpoints.join(' ')} style={{"fill": homeColor}}/>
      </svg>
      <svg height="600" width={width + leftMargin} className='line'>
        {mouseLinePos !== null ? 
          <line x1={mouseLinePos} y1={10} x2={mouseLinePos} y2={590} style={{ stroke: 'grey', strokeWidth: 1 }} />
          : ''}
      </svg>
      <div class="teamName" style={{color: teamColor[awayTeamNames?.abr]?.replaceAll(' ', ', ')}}>{awayTeamName}</div>
      <div className='teamSection'>
        {awayRows}
      </div>
      <div class="teamName" style={{color: teamColor[homeTeamNames?.abr]?.replaceAll(' ', ', ')}}>{homeTeamName}</div>
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

function rgbToRgba(rgb, a) {
  return rgb.replaceAll(' ', ', ').replace('rgb', 'rgba').replace(')', `, ${a})`);
}