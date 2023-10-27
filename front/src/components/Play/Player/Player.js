import './Player.scss';
export default function Player({ actions, timeline, name, width, numQs, heightDivide, highlight, leftMargin }) {

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

  let qWidth = width / 4;
  if (numQs > 4) {
    qWidth = width * (12 / (12 * 4 + 5 * (numQs - 4)))
  }

  // console.log(actions.filter(a => a.actionType === 'Substitution'));
  let dots = actions
  .filter(a => a.actionType !== 'Substitution' && a.actionType !== 'Jump Ball' && a.actionType !==  'Violation')
  .map(a => {
    let pos = leftMargin + (((a.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(a.clock)) / (4 * 12 * 60)) * (qWidth * 4);
    if (a.period > 4) {
      pos = leftMargin + ((4 * 12 * 60 + 5 * (a.period - 4) * 60 - timeToSeconds(a.clock)) / (4 * 12 * 60)) * (qWidth * 4);
    }
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
    let style = {
      left: `${pos - 0}px`,
      backgroundColor: color
    };
    if (highlight.includes(a.actionId)) {
      style.width = '10px';
      style.height = '10px';
      style.top = '7.5px';
      style.left = `${pos - 2.5}px`;
    }
    return (
      <div key={a.actionId} className="dot" style={style}></div>
    );
  });

  const playTimeLines = timeline.map((t, i) => {
    let x1 = (((t.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(t.start)) / (4 * 12 * 60)) * (qWidth * 4);
    if (t.period > 4) {
      x1 = ((4 * 12 * 60 + 5 * (t.period - 4) * 60 - timeToSeconds(t.start)) / (4 * 12 * 60)) * (qWidth * 4);
    }
    let x2 = (((t.period - 1) * 12 * 60 + 12 * 60 - timeToSeconds(t.end)) / (4 * 12 * 60)) * (qWidth * 4);
    if (t.period > 4) {
      x2 = ((4 * 12 * 60 + 5 * (t.period - 4) * 60 - timeToSeconds(t.end)) / (4 * 12 * 60)) * (qWidth * 4);
    }
    x2 = isNaN(x2) ? x1 : x2; 
    return <line key={i} x1={x1} y1={12} x2={x2} y2={12} style={{ stroke: 'rgb(0,0,255)', strokeWidth: 1 }} />
  });

  return (
    <div className='player' style={{ height: `${275/heightDivide}px`}}>
      <div className='playerName' style={{ width: 90 }}>{playerName}</div>
      {dots}
      <svg width={width} height="20" className='line' style={{left: leftMargin}}>
        {playTimeLines}
      </svg>
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
