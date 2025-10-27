import CircularProgress from '@mui/material/CircularProgress';
import './Score.scss';
import { PREFIX } from '../../environment';

export default function Score({ homeTeam, awayTeam, score, date, changeDate, isLoading }) {

  if (isLoading) {
    return (
      <div className='scoreElement'>
        <div className='loadingIndicator'>
          <CircularProgress size={24} thickness={5} />
          <span>Loading game...</span>
        </div>
      </div>
    );
  }

  const gameDate = date ? new Date(date) : null;

  const changeToGameDate = () => {
    if (!gameDate) {
      return;
    }
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
      <div
        onClick={gameDate ? changeToGameDate : undefined}
        className='gameDate'
        style={{ cursor: gameDate ? 'pointer' : 'default' }}
      >
        {gameDate ? gameDate.toDateString().slice(4) : '---'}
      </div>
      <div className='scoreArea'>
        <div>{score ? score.away : '--'}</div>
        {awayTeam && (
          <img height="80" width="80" className='awayImg' src={`${PREFIX ? PREFIX : ''}/img/teams/${awayTeam}.png`} alt={awayTeam} />
        )}
        <div className='at'>AT</div>
        {homeTeam && (
          <img height="80" width="80" className='homeImg' src={`${PREFIX ? PREFIX : ''}/img/teams/${homeTeam}.png`} alt={homeTeam} />
        )}
        <div>{score ? score.home : '--'}</div>
      </div>
    </div>
  );
}
