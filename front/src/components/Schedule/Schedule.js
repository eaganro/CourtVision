import './Schedule.scss';

import Button from '@mui/material/Button';

export default function Schedule({ games, date, changeDate, changeGame }) {

  const gamesList = games.map(g => {
    return (
      <div key={g.gameId} onClick={() => changeGame(g.gameId)}>
        <div>{g.away} - {g.home}</div>
      </div>
    )
  });

  return (
    <div className='schedule'>
      <input type="date" value={date} onChange={changeDate}></input>
      {gamesList}
      <Button variant="text">Text</Button>
    </div>
  );
}