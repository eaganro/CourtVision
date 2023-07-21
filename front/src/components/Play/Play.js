import Player from './Player/Player';

import './Play.scss';

export default function Play({ awayPlayers, homePlayers, scoreTimeline, awayPlayerTimeline, homePlayerTimeline }) {

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
      <Player key={awayPlayers[name][0].actionId} actions={awayPlayers[name]} timeline={awayPlayerTimeline[name]}></Player>
    );
  });

  const homeRows = Object.keys(homePlayers).map(name => {
    return (
      <Player key={homePlayers[name][0].actionId} actions={homePlayers[name]} timeline={homePlayerTimeline[name]}></Player>
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
  const timeline = scoreTimeline.map(t => {
    let x1 = startx;
    let x2 = 350 * (t.period - 1) + (((12 - Number(t.clock.slice(2, 4))) * 60) - Number(t.clock.slice(5, 7))) * (350 / (12 * 60));
    startx = x2;

    let y1 = starty;
    let y2 = t.scoreDiff * -250 / maxY;
    starty = y2;
    return ([
      <line x1={100 + x1} y1={250 + y1} x2={100 + x2} y2={250 + y1} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />,
      <line x1={100 + x2} y1={250 + y1} x2={100 + x2} y2={250 + y2} style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }} />
    ])
  }).flat();

  timeline.push(<line x1={100 + startx} y1={250 + starty} x2={100 + 350 * 4} y2={250 + starty} style={{ stroke: 'rgb(255,0,0)', strokeWidth:2 }} />)
  timeline.unshift(<line x1={0} y1={250} x2={1500} y2={250} style={{ stroke: 'black', strokeWidth:1 }} />)
  // timeline.unshift(<line x1={100} y1={10} x2={100} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)
  timeline.unshift(<line x1={100 + 350} y1={10} x2={100 + 350} y2={490} style={{ stroke:'black', strokeWidth:1 }} />)
  timeline.unshift(<line x1={100 + 350 * 2} y1={10} x2={100 + 350 * 2} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)
  timeline.unshift(<line x1={100 + 350 * 3} y1={10} x2={100 + 350 * 3} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)
  // timeline.unshift(<line x1={100 + 350 * 4} y1={10} x2={100 + 350 * 4} y2={490} style={{ stroke: 'black', strokeWidth: 1 }} />)

  return (
    <div className='play'>
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