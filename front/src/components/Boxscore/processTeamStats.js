import { UnfoldMore, UnfoldLess } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { useRef, useEffect } from 'react';

export default function(team, showButton, showMore, setShowMore, scrollPos, setScrollPos) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollLeft = scrollPos;
    }
  }, [scrollPos]);
  
  if (!team) return ''
  const teamTotals = { fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0,
    freeThrowsMade: 0, freeThrowsAttempted: 0, reboundsOffensive: 0, reboundsDefensive: 0, reboundsTotal: 0,
    assists: 0, steals: 0, blocks: 0, turnovers: 0, foulsPersonal: 0, points: 0, plusMinusPoints:0 };

  let leftCol = [<div className="statHeadings"><span>PLAYER</span></div>];
  let teamBox = team.players.filter(p => {
    let minutes = p.statistics.minutes;
    if (!minutes) return false;
    if (minutes.includes('PT')) {
      minutes = minutes.slice(2, -4).replace('M', ':');
    }
    return minutes !== '00:00';
  }).sort((a,b) => {
    let minutesA = a.statistics.minutes;
    if (minutesA.includes('PT')) {
      minutesA = minutesA.slice(2, -4).replace('M', ':');
    }
    let minutesB = b.statistics.minutes;
    if (minutesB.includes('PT')) {
      minutesB = minutesB.slice(2, -4).replace('M', ':');
    }
    let [amin, asec] = minutesA.split(':');
    let [bmin, bsec] = minutesB.split(':');
    return (bmin * 100 + bsec) - (amin * 100 + asec);
  }).map((p, i) => {
    Object.keys(teamTotals).forEach(k => {
      teamTotals[k] += p.statistics[k];
    });
    let minutes = p.statistics.minutes;
    if (minutes.includes('PT')) {
      minutes = minutes.slice(2, -4).replace('M', ':');
    }
    leftCol.push(<div className={i % 2 === 0 ? "stat even" : "stat odd"}><span className="playerNameCol">{p.firstName} {p.familyName}</span></div>)
    return (
      <div key={p.personId} className={ "rowGrid stat " + (i % 2 === 0 ? "even" : "odd") }>
        <span>{minutes}</span>
        <span>{p.statistics.fieldGoalsMade}</span>
        <span>{p.statistics.fieldGoalsAttempted}</span>
        <span>{p.statistics.fieldGoalsPercentage === 1 ? 100 : (Math.round(p.statistics.fieldGoalsPercentage * 100 * 10) / 10).toFixed(1)}</span>
        <span>{p.statistics.threePointersMade}</span>
        <span>{p.statistics.threePointersAttempted}</span>
        <span>{p.statistics.threePointersPercentage === 1 ? 100 : (Math.round(p.statistics.threePointersPercentage * 100 * 10) / 10).toFixed(1)}</span>
        <span>{p.statistics.freeThrowsMade}</span>
        <span>{p.statistics.freeThrowsAttempted}</span>
        <span>{p.statistics.freeThrowsPercentage === 1 ? 100 : (Math.round(p.statistics.freeThrowsPercentage * 100 * 10) / 10).toFixed(1)}</span>
        <span>{p.statistics.reboundsOffensive}</span>
        <span>{p.statistics.reboundsDefensive}</span>
        <span>{p.statistics.reboundsTotal}</span>
        <span>{p.statistics.assists}</span>
        <span>{p.statistics.steals}</span>
        <span>{p.statistics.blocks}</span>
        <span>{p.statistics.turnovers}</span>
        <span>{p.statistics.foulsPersonal}</span>
        <span>{p.statistics.points}</span>
        <span>{p.statistics.plusMinusPoints}</span>
      </div>
    )
  });
  if (!showMore) {
    teamBox = teamBox.slice(0, 5);
    leftCol = leftCol.slice(0, 6)
  }
  leftCol.push(<div className={teamBox.length % 2 === 0 ? 'even' : 'odd'}><span className="playerNameCol">TEAM</span></div>)

  let fg;
  if ((teamTotals.fieldGoalsMade / teamTotals.fieldGoalsAttempted) === 1) {
    fg = 100;
  } else {
    fg = (Math.round((teamTotals.fieldGoalsMade / teamTotals.fieldGoalsAttempted) * 100 * 10) / 10).toFixed(1)
  }
  if (fg === 'NaN') {
    fg = 0;
  }
  let pt3;
  if ((teamTotals.threePointersMade / teamTotals.threePointersAttempted) === 1) {
    pt3 = 100;
  } else {
    pt3 = (Math.round((teamTotals.threePointersMade / teamTotals.threePointersAttempted) * 100 * 10) / 10).toFixed(1)
  }
  if (pt3 === 'NaN') {
    pt3 = 0;
  }
  let ft;
  if ((teamTotals.freeThrowsMade / teamTotals.freeThrowsAttempted) === 1) {
    ft = 100;
  } else {
    ft = (Math.round((teamTotals.freeThrowsMade / teamTotals.freeThrowsAttempted) * 100 * 10) / 10).toFixed(1)
  }
  if (ft === 'NaN') {
    ft = 0;
  }
  const totalRow = teamBox && (
    <div className={ "rowGrid stat " + (teamBox.length % 2 === 0 ? 'even' : 'odd')}>
      <span></span>
      <span>{teamTotals.fieldGoalsMade}</span>
      <span>{teamTotals.fieldGoalsAttempted}</span>
      <span>{fg}</span>
      <span>{teamTotals.threePointersMade}</span>
      <span>{teamTotals.threePointersAttempted}</span>
      <span>{pt3}</span>
      <span>{teamTotals.freeThrowsMade}</span>
      <span>{teamTotals.freeThrowsAttempted}</span>
      <span>{ft}</span>
      <span>{teamTotals.reboundsOffensive}</span>
      <span>{teamTotals.reboundsDefensive}</span>
      <span>{teamTotals.reboundsTotal}</span>
      <span>{teamTotals.assists}</span>
      <span>{teamTotals.steals}</span>
      <span>{teamTotals.blocks}</span>
      <span>{teamTotals.turnovers}</span>
      <span>{teamTotals.foulsPersonal}</span>
      <span>{teamTotals.points}</span>
      <span></span>
    </div>
  );

  const statHeadings = (
    <div className="rowGrid statHeadings">
      <span>MIN</span>
      <span>FGM</span>
      <span>FGA</span>
      <span>FG%</span>
      <span>3PM</span>
      <span>3PA</span>
      <span>3P%</span>
      <span>FTM</span>
      <span>FTA</span>
      <span>FT%</span>
      <span>OREB</span>
      <span>DREB</span>
      <span>REB</span>
      <span>AST</span>
      <span>STL</span>
      <span>BLK</span>
      <span>TO</span>
      <span>PF</span>
      <span>PTS</span>
      <span>+/-</span>
    </div>
  );
  teamBox && teamBox.unshift(statHeadings);
  teamBox && teamBox.push(totalRow);

  return (
    <div>
      <div className="teamRow">
        <div className="team">
          {team ? <img height="30" width="30" src={`img/teams/${team?.teamTricode}.png`}></img> : ''}
          <span>{team?.teamName}</span>
          {showButton && <div className='showMore' onClick={() => setShowMore(!showMore)}><IconButton onClick={() =>{}}>{showMore ? <UnfoldLess /> : <UnfoldMore />}</IconButton></div>}
        </div>
      </div>
      <div className="fullTeam">
        <div className="leftCol">
          {leftCol}
        </div>
        <div ref={ref} className="scrollCols" onScroll={e => setScrollPos(e.target.scrollLeft)}>
          {teamBox}
        </div>
      </div>
    </div>
  );
}