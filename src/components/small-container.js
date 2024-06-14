import React from 'react';
import './small-container.css'; 
const SmallContainer = ({ id, cid, title, options, selectedOption, onSelectChange }) => {
  return (
    <div id={id} className="mincont-holder">
      <div className="mincont-hold-box1">
        <h3>{title}</h3>
      </div>
      <div className='mincont-hold-main-container'>
        <select
          id={cid}
          value={selectedOption}
          onChange={(e) => onSelectChange(e.target.value)}
          className={selectedOption ? 'selected' : ''}
        >
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SmallContainer;

