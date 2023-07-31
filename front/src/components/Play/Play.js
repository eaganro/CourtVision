import Player from './Player/Player';

import './Play.scss';

export default function Play({ awayPlayers, homePlayers, allActions, scoreTimeline, awayPlayerTimeline, homePlayerTimeline }) {

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

  const awayRows = Object.keys(awayPlayers).map(name => {
    return (
      <Player key={name} actions={awayPlayers[name]} timeline={awayPlayerTimeline[name]} name={name}></Player>
    );
  });

  const homeRows = Object.keys(homePlayers).map(name => {
    return (
      <Player key={name} actions={homePlayers[name]} timeline={homePlayerTimeline[name]} name={name}></Player>
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
    // let x2 = 350 * (t.period - 1) + (((12 - Number(t.clock.slice(2, 4))) * 60) - Number(t.clock.slice(5, 7))) * (350 / (12 * 60));
    let x2 =  (((t.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(t.clock)) / (4 * 12 * 60)) * (350 * 4);
    startx = x2;

    let y1 = starty;
    let y2 = t.scoreDiff * -250 / maxY;
    starty = y2;
    return ([
      <line key={'one' + i} x1={100 + x1} y1={250 + y1} x2={100 + x2} y2={250 + y1} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />,
      <line key={'two' + i} x1={100 + x2} y1={250 + y1} x2={100 + x2} y2={250 + y2} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
    ])
  }).flat();

  timeline.push(<line key={'secondLast'} x1={100 + startx} y1={250 + starty} x2={100 + 350 * 4} y2={250 + starty} style={{ stroke: 'rgb(255,0,0)', strokeWidth:2 }} />)
  timeline.unshift(<line key={'Last'} x1={0} y1={250} x2={1500} y2={250} style={{ stroke: 'black', strokeWidth:1 }} />)
  // timeline.unshift(<line x1={100} y1={10} x2={100} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)
  timeline.unshift(<line key={'q1'} x1={100 + 350} y1={10} x2={100 + 350} y2={490} style={{ stroke:'black', strokeWidth:1 }} />)
  timeline.unshift(<line key={'q2'} x1={100 + 350 * 2} y1={10} x2={100 + 350 * 2} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)
  timeline.unshift(<line key={'q3'} x1={100 + 350 * 3} y1={10} x2={100 + 350 * 3} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)
  // timeline.unshift(<line x1={100 + 350 * 4} y1={10} x2={100 + 350 * 4} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)

  let showMouse = true;
  const mouseOver = (e) => {
    if (showMouse) {
      let el = e.target;
      while (el.className !== 'play') {
        el = el.parentElement;
      }
      let pos = e.clientX - el.offsetLeft - 100;

      let a = allActions[0];

      let goneOver = false;
      for (let i = 1; i < allActions.length && goneOver === false; i += 1) {
        const actionPos = (((a.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(a.clock)) / (4 * 12 * 60)) * (350 * 4);
        if (actionPos > pos) {
          goneOver = true;
        } else {
          a = allActions[i];
        }
      }
      console.log(a.description);


      showMouse = false;
      setTimeout(() => showMouse = true, 200);
    }
  }

  return (
    <div onMouseMove={mouseOver} className='play'>
      
      <svg height="500" width="1500" className='line'>
        {timeline}
      </svg>
      <div className='teamSection'>
        away
        {awayRows}
      </div>
      <div className='teamSection'>
        home
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