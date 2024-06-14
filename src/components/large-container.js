import React from 'react';
import './large-container.css'; 

const LargeContainer = ({ id, children, text1, text2 }) => {
  return (
    <div id={id} className="cont-hold-root-container">
      <div className="cont-hold-top-container">
        <div className="cont-hold-box1">
          <h2>{text1}</h2>
        </div>
        <div className="cont-hold-box2">
          <p>{text2}</p>
        </div>
      </div>
      <div className="cont-hold-main-container" id="chatboxContainer">
        {children}
      </div>
    </div>
  );
};

export default LargeContainer;

