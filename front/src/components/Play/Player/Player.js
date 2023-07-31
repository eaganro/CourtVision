import './Player.scss';
export default function Player({ actions, timeline, name }) {

  const playerName = name;

  const dotActions = {
    'Made Shot': 1,
    'Missed Shot': 1,
    'Rebound': 1,
    'Missed Shot': 1,
    'Foul': 1,
    'Turnover': 1,
    'Free Throw': 1,
  }

  // console.log(actions.filter(a => a.actionType === 'Substitution'));
  let dots = actions.filter(a => a.actionType !== 'Substitution' && a.actionType !== 'Jump Ball' && a.actionType !==  'Violation').map(a => {
    let pos = 97.5 + 350 * (a.period - 1) + (((12 - Number(a.clock.slice(2, 4))) * 60) - Number(a.clock.slice(5, 7))) * (350 / (12 * 60));
    let color = 'orange';
    if (a.description.includes('MISS')) {
      color = 'brown';
    } else if (a.description.includes('PTS')) {
      color = 'gold';
    } else if (a.description.includes('REBOUND')) {
      color = 'blue';
    } else if (a.description.includes('AST')) {
      color = 'green';
    } else if (a.actionType === 'Turnover') {
      color = 'red';
    } else if (a.description.includes('BLK')) {
      color = 'purple';
    } else if (a.description.includes('STL')) {
      color = 'pink';
    } else if (a.actionType === 'Foul') {
      color = 'black';
    } 
    return (
      <div key={a.actionId} className="dot" style={{ left: `${pos}px`, backgroundColor: color }}></div>
    )
  });

  const playTimeLines = timeline.map((t, i) => {
    let x1 = 1400 * (t.start / (12 * 60 * 4));
    let x2 = 1400 * (t.end / (12 * 60 * 4));
    x2 = isNaN(x2) ? x1 : x2; 
    return <line key={i} x1={x1} y1={12} x2={x2} y2={12} style={{ stroke: 'rgb(0,0,255)', strokeWidth: 1 }} />
  });

  return (
    <div className='player'>
      <div className='playerName'>{playerName}</div>
      {dots}
      <svg width="1400" className='line'>
        {playTimeLines}
      </svg>
    </div>
  );
}