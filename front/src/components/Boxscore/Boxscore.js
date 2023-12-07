import './Boxscore.scss';
export default function Boxscore({ box }) {
  const awayTeamTotals = { fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0,
    freeThrowsMade: 0, freeThrowsAttempted: 0, reboundsOffensive: 0, reboundsDefensive: 0, reboundsTotal: 0,
    assists: 0, steals: 0, blocks: 0, turnovers: 0, foulsPersonal: 0, points: 0, plusMinusPoints:0 };
  const awayBox = box?.awayTeam?.players.filter(p => {
    let minutes = p.statistics.minutes;
    if (minutes.includes('PT')) {
      minutes = minutes.slice(2, -4).replace('M', ':');
    }
    return minutes !== '00:00';
  }).map((p, i) => {
    Object.keys(awayTeamTotals).forEach(k => {
      awayTeamTotals[k] += p.statistics[k];
    });
    let minutes = p.statistics.minutes;
    if (minutes.includes('PT')) {
      minutes = minutes.slice(2, -4).replace('M', ':');
    }
    return (
      <div key={p.personId} className={ "rowGrid stat " + (i % 2 === 0 ? "even" : "odd") }>
        <span className="playerNameCol">{p.firstName} {p.familyName}</span>
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
  const awayTotalRow = awayBox && (
    <div className={ "rowGrid stat " + (awayBox.length % 2 === 0 ? 'even' : 'odd')}>
      <span className="playerNameCol">TEAM</span>
      <span></span>
      <span>{awayTeamTotals.fieldGoalsMade}</span>
      <span>{awayTeamTotals.fieldGoalsAttempted}</span>
      <span>{(awayTeamTotals.fieldGoalsMade / awayTeamTotals.fieldGoalsAttempted) === 1 ? 100 : (Math.round((awayTeamTotals.fieldGoalsMade / awayTeamTotals.fieldGoalsAttempted) * 100 * 10) / 10).toFixed(1)}</span>
      <span>{awayTeamTotals.threePointersMade}</span>
      <span>{awayTeamTotals.threePointersAttempted}</span>
      <span>{(awayTeamTotals.threePointersMade / awayTeamTotals.threePointersAttempted) === 1 ? 100 : (Math.round((awayTeamTotals.threePointersMade / awayTeamTotals.threePointersAttempted) * 100 * 10) / 10).toFixed(1)}</span>
      <span>{awayTeamTotals.freeThrowsMade}</span>
      <span>{awayTeamTotals.freeThrowsAttempted}</span>
      <span>{(awayTeamTotals.freeThrowsMade / awayTeamTotals.freeThrowsAttempted) === 1 ? 100 : (Math.round((awayTeamTotals.freeThrowsMade / awayTeamTotals.freeThrowsAttempted) * 100 * 10) / 10).toFixed(1)}</span>
      <span>{awayTeamTotals.reboundsOffensive}</span>
      <span>{awayTeamTotals.reboundsDefensive}</span>
      <span>{awayTeamTotals.reboundsTotal}</span>
      <span>{awayTeamTotals.assists}</span>
      <span>{awayTeamTotals.steals}</span>
      <span>{awayTeamTotals.blocks}</span>
      <span>{awayTeamTotals.turnovers}</span>
      <span>{awayTeamTotals.foulsPersonal}</span>
      <span>{awayTeamTotals.points}</span>
      <span></span>
    </div>
  );

  const homeTeamTotals = { fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0,
    freeThrowsMade: 0, freeThrowsAttempted: 0, reboundsOffensive: 0, reboundsDefensive: 0, reboundsTotal: 0,
    assists: 0, steals: 0, blocks: 0, turnovers: 0, foulsPersonal: 0, points: 0, plusMinusPoints:0 };
  const homeBox = box?.homeTeam?.players.filter(p => {
    let minutes = p.statistics.minutes;
    if (minutes.includes('PT')) {
      minutes = minutes.slice(2, -4).replace('M', ':');
    }
    return minutes !== '00:00';
  }).map((p, i) => {
    Object.keys(homeTeamTotals).forEach(k => {
      homeTeamTotals[k] += p.statistics[k];
    });
    let minutes = p.statistics.minutes;
    if (minutes.includes('PT')) {
      minutes = minutes.slice(2, -4).replace('M', ':');
    }
    return (
      <div key={p.personId} className={ "rowGrid stat " + (i % 2 === 0 ? "even" : "odd") }>
        <span className="playerNameCol">{p.firstName} {p.familyName}</span>
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
  const homeTotalRow = homeBox && (
    <div className={ "rowGrid stat " + (homeBox.length % 2 === 0 ? 'even' : 'odd')}>
      <span className="playerNameCol">TEAM</span>
      <span></span>
      <span>{homeTeamTotals.fieldGoalsMade}</span>
      <span>{homeTeamTotals.fieldGoalsAttempted}</span>
      <span>{(homeTeamTotals.fieldGoalsMade / homeTeamTotals.fieldGoalsAttempted) === 1 ? 100 : (Math.round((homeTeamTotals.fieldGoalsMade / homeTeamTotals.fieldGoalsAttempted) * 100 * 10) / 10).toFixed(1)}</span>
      <span>{homeTeamTotals.threePointersMade}</span>
      <span>{homeTeamTotals.threePointersAttempted}</span>
      <span>{(homeTeamTotals.threePointersMade / homeTeamTotals.threePointersAttempted) === 1 ? 100 : (Math.round((homeTeamTotals.threePointersMade / homeTeamTotals.threePointersAttempted) * 100 * 10) / 10).toFixed(1)}</span>
      <span>{homeTeamTotals.freeThrowsMade}</span>
      <span>{homeTeamTotals.freeThrowsAttempted}</span>
      <span>{(homeTeamTotals.freeThrowsMade / homeTeamTotals.freeThrowsAttempted) === 1 ? 100 : (Math.round((homeTeamTotals.freeThrowsMade / homeTeamTotals.freeThrowsAttempted) * 100 * 10) / 10).toFixed(1)}</span>
      <span>{homeTeamTotals.reboundsOffensive}</span>
      <span>{homeTeamTotals.reboundsDefensive}</span>
      <span>{homeTeamTotals.reboundsTotal}</span>
      <span>{homeTeamTotals.assists}</span>
      <span>{homeTeamTotals.steals}</span>
      <span>{homeTeamTotals.blocks}</span>
      <span>{homeTeamTotals.turnovers}</span>
      <span>{homeTeamTotals.foulsPersonal}</span>
      <span>{homeTeamTotals.points}</span>
      <span></span>
    </div>
  );

  const statHeadings = (
    <div className="rowGrid statHeadings">
      <span>PLAYER</span>
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

  return (
    <div className='box'>
      <div className="rowGrid teamRow">
        <div className="team">
          {box ? <img height="30" width="30" src={`img/teams/${box?.awayTeam?.teamTricode}.png`}></img> : ''}
          <span>{box?.awayTeam?.teamName}</span>
        </div>
      </div>
      {statHeadings}
      {awayBox}
      {awayTotalRow}
      <div className="rowGrid teamRow">
        <div className="team">
          {box ? <img height="30" width="30" src={`img/teams/${box?.homeTeam?.teamTricode}.png`}></img> : ''}
          <span>{box?.homeTeam?.teamName}</span>
        </div>
      </div>
      {statHeadings}
      {homeBox}
      {homeTotalRow}
    </div>
  );
}