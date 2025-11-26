import { EVENT_TYPES, LegendShape } from '../../helpers/eventStyles.jsx';
import './StatButtons.scss';

export default function StatButtons({ statOn, changeStatOn, isLoading, statusMessage }) {

  const eventKeys = Object.keys(EVENT_TYPES);

  const buttons = eventKeys.map((key, i) => {
    if (isLoading || statusMessage) {
      return <div key={key}></div>;
    }
    
    const isActive = statOn[i];
    
    return (
      <div 
        className={`buttonGroup ${isActive ? '' : 'off'}`} 
        key={key}
        onClick={() => changeStatOn(i)}
      >
        <div className="shapeContainer">
          <LegendShape eventType={key} size={18} />
        </div>
        <span className="label">{EVENT_TYPES[key].label}</span>
      </div>
    );
  });

  return (
    <div className='statButtons'>
      {buttons}
    </div>
  );
}
