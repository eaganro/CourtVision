import './StatButtons.scss';
export default function StatButtons({ statOn, changeStatOn }) {

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

  const buttons = Object.keys(color).map((k, i) => {
    return (
      <div className='buttonGroup' key={k}>
        <div className={`statCheck ${k} ${statOn[i] ? '' : 'off'}`} onClick={() => changeStatOn(i)}></div>
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