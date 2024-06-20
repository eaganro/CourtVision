import { useRef } from 'react';
import { NavigateNext, NavigateBefore } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { dateAdd, dateMinus } from '../../environment';


import './Schedule.scss';

export default function Schedule({ games, date, changeDate, changeGame }) {

  const scrollRef = useRef(null);

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
    if (!g.status.endsWith('ET')) {
      return (
        <div className='game' key={g.id} onClick={() => changeGame(g.id)}>
          <div class="iconRow">
            <img height="16" width="16" src={`img/teams/${g.awayteam}.png`}></img>
            {g.awayteam} - {g.hometeam}
            <img height="16" width="16" src={`img/teams/${g.hometeam}.png`}></img>
          </div>
          <div>{g.awayscore} - {g.homescore}</div>
          <div>{g.status}</div>
        </div>
      )
    } else {
      return (
        <div className='game' key={g.id} onClick={() => changeGame(g.id)}>
          <div class="iconRow">
            <img height="16" width="16" src={`img/teams/${g.awayteam}.png`}></img>
            {g.awayteam} - {g.hometeam}
            <img height="16" width="16" src={`img/teams/${g.hometeam}.png`}></img>
          </div>
          <div class="recordRow">
            <span>{g.awayrecord}</span>
            <span>{g.homerecord}</span>
          </div>
          <div>{g.status}</div>
        </div>
      )
    }

  });
  const scrollScheduleRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += 100;
    }
  }
  const scrollScheduleLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft -= 100;
    }
  }

  const dateDown = () => {
    const downdate = new Date(date);
    downdate.setDate(downdate.getDate() - dateMinus);
    let month = downdate.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    let day = downdate.getDate();
    if (day < 10) {
      day = '0' + day;
    }
    let val = `${downdate.getFullYear()}-${month}-${day}`
    changeDate({ target: { value: val }});
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }
  const dateUp = () => {
    const update = new Date(date);
    update.setDate(update.getDate() + dateAdd);
    let month = update.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    let day = update.getDate();
    if (day < 10) {
      day = '0' + day;
    }
    let val = `${update.getFullYear()}-${month}-${day}`
    changeDate({ target: { value: val }})
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }

  const here = (x,y,z) => {
    console.log(x,y,z);
  }

  console.log(date);

  return (
    <div className='schedule'>
      <div className='scheduleContent'>
        <div className='datePick'>
          <IconButton className='scheduleButton' onClick={dateDown}><NavigateBefore /></IconButton>
          <input className='dateInput' type="date" value={date} onChange={(e) => changeDate(e)}></input>
          <IconButton className='scheduleButton' onClick={dateUp}><NavigateNext /></IconButton>
        </div>
        <div className='gamePick'>
          <IconButton className='scheduleButton' onClick={scrollScheduleLeft}><NavigateBefore /></IconButton>
          {gamesList.length ?
            <div className="games" ref={scrollRef}>
              {gamesList}
            </div> :
            <div className='noGames'>No Games Scheduled</div>
          }
          <IconButton className='scheduleButton end' onClick={scrollScheduleRight}><NavigateNext /></IconButton>
        </div>
      </div>
    </div>
  );
}