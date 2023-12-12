import './Score.scss';

export default function Score({ homeTeam, awayTeam, score }) {

  return (
    <div className=''>
      <div className='scoreArea'>
        <div>{score ? score.away : '--'}</div>
        <img height="80" width="80" src={`img/teams/${awayTeam}.png`}></img>
        <div className='at'>AT</div>
        <img height="80" width="80" src={`img/teams/${homeTeam}.png`}></img>
        <div>{score ? score.home : '--'}</div>
      </div>
    </div>
  );
}