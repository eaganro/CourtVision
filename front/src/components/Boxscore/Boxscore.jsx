import CircularProgress from '@mui/material/CircularProgress';
import './Boxscore.scss';
import processTeamStats from './processTeamStats';
import { useState, useEffect } from 'react';


export default function Boxscore({ box, isLoading }) {
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

  const awayBox = processTeamStats(box?.awayTeam, false, showMore, setShowMore, scrollPos, setScrollPos)
  const homeBox = processTeamStats(box?.homeTeam, true, showMore, setShowMore, scrollPos, setScrollPos)

  return (
    <div className='box'>
      {isLoading ? (
        <div className='loadingIndicator'>
          <CircularProgress size={24} thickness={5} />
          <span>Loading box score...</span>
        </div>
      ) : (
        <>
          {awayBox}
          {homeBox}
        </>
      )}
    </div>
  );
}
