import './Schedule.scss';

export default function Schedule({ games, date, changeDate, changeGame }) {

  console.log(games);
  const gamesList = games.sort((a,b) => {
    let datetimeA = new Date(a.starttime);
    let datetimeB = new Date(b.starttime);
    if (a.status.startsWith('Final') && b.status.startsWith('Final')) {
      if (datetimeA < datetimeB) {
        return -1;
      } else if (datetimeA > datetimeB) {
        return 1;
      } else {
        if (a.hometeam > b.hometeam) {
          return 1;
        } else {
          return -1;
        }
      }
    } else if (a.status.startsWith('Final')) {
        return 1;
    } else if (b.status.startsWith('Final')) {
      return -1;
    } else {
      if (datetimeA < datetimeB) {
        return -1;
      } else if (datetimeA > datetimeB) {
        return 1;
      } else {
        if (a.hometeam > b.hometeam) {
          return 1;
        } else {
          return -1;
        }
      }
    }
  }).map(g => {
    return (
      <div className='game' key={g.id} onClick={() => changeGame(g.id)}>
        <div>{g.awayteam} - {g.hometeam}</div>
        <div>{g.status.endsWith('ET') ? '--' : g.awayscore} - {g.status.endsWith('ET') ? '--' : g.homescore}</div>
        <div>{g.status}</div>
      </div>
    )
  });

  return (
    <div className='schedule'>
      <input className='dateInput' type="date" value={date} onChange={changeDate}></input>
      <div className="games">
        {gamesList}
      </div>
    </div>
  );
}