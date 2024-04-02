import './Boxscore.scss';
import processTeamStats from './processTeamStats';
import { useState } from 'react';


export default function Boxscore({ box }) {
  const [showMore, setShowMore] = useState(false);
  const [scrollPos, setScrollPos] = useState(100);
  console.log('state', scrollPos)

  const awayBox = processTeamStats(box?.awayTeam, false, showMore, setShowMore, scrollPos, setScrollPos)
  const homeBox = processTeamStats(box?.homeTeam, true, showMore, setShowMore, scrollPos, setScrollPos)

  return (
    <div className='box'>
      {awayBox}
      {homeBox}
    </div>
  );
}