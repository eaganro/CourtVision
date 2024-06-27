import './Score.scss';

export default function Score({ homeTeam, awayTeam, score, date, changeDate}) {

  const gameDate = new Date(date)

  const changeToGameDate = () => {
    let month = gameDate.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    let day = gameDate.getDate();
    if (day < 10) {
      day = '0' + day;
    }
    let val = `${gameDate.getFullYear()}-${month}-${day}`
    changeDate({ target: { value: val }});
  }

  return (
    <div className='scoreElement'>
      <div onClick={changeToGameDate} className='gameDate'>{gameDate.toDateString().slice(4)}</div>
      <div className='scoreArea'>
        <div>{score ? score.away : '--'}</div>
        <img height="80" width="80" className='awayImg' src={`img/teams/${awayTeam}.png`}></img>
        <div className='at'>AT</div>
        <img height="80" width="80" className='homeImg' src={`img/teams/${homeTeam}.png`}></img>
        <div>{score ? score.home : '--'}</div>
      </div>
    </div>
  );
}