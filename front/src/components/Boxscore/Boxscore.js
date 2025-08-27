import './Boxscore.scss';
import processTeamStats from './processTeamStats';
import { useMemo, useState, useEffect } from 'react';
import { buildPartialBox } from '../../helpers/partialBox';


export default function Boxscore({ box, playByPlay, selectionRangeSecs, awayTeamId, homeTeamId, awayPlayerTimeline, homePlayerTimeline }) {
  const [showMore, setShowMore] = useState(false);
  const [scrollPos, setScrollPos] = useState(100);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    console.log(width);
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width]);

  const partial = useMemo(() => {
    if (!selectionRangeSecs) return null;
    try {
      return buildPartialBox({
        box,
        playByPlay,
        range: selectionRangeSecs,
        awayTeamId,
        homeTeamId,
        awayPlayerTimeline,
        homePlayerTimeline,
      });
    } catch (e) {
      console.warn('Partial box error', e);
      return null;
    }
  }, [box, playByPlay, selectionRangeSecs, awayTeamId, homeTeamId, awayPlayerTimeline, homePlayerTimeline]);

  const awayBox = processTeamStats((partial?.awayTeam || box?.awayTeam), false, showMore, setShowMore, scrollPos, setScrollPos)
  const homeBox = processTeamStats((partial?.homeTeam || box?.homeTeam), true, showMore, setShowMore, scrollPos, setScrollPos)

  return (
    <div className='box'>
      {awayBox}
      {homeBox}
    </div>
  );
}
