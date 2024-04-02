import './Boxscore.scss';
import processTeamStats from './processTeamStats';
import { useState } from 'react';


export default function Boxscore({ box }) {
  const [showMore, setShowMore] = useState(false);

  const awayBox = processTeamStats(box?.awayTeam, false, showMore)
  const homeBox = processTeamStats(box?.homeTeam, true, showMore, setShowMore)

  return (
    <div className='box'>
      {awayBox}
      {homeBox}
    </div>
  );
}