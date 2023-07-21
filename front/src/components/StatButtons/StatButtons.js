import './StatButtons.scss';
export default function StatButtons({  }) {

  const color = {
    point: 'gold',
    miss: 'brown',
    rebound: 'blue',
    assist: 'green',
    turnover: 'red',
    block: 'purple',
    steal: 'pink',
    foul: 'black'
  };

  const buttons = Object.keys(color).map(k => {
    return (
      <div className='buttonGroup'>
        <div className={`statCheck ${k}`}></div>
        <span>{k}</span>
      </div>
    );
  });

  return (
    <div className='statButtons'>
      {buttons}
    </div>
  );
}