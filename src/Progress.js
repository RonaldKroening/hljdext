import React, { useEffect, useRef, useState } from 'react';

const Progress = ({ initialIntervals = 20, initialWidth = 20 }) => {
  const progressBarRef = useRef(null);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    const intervalTime = 1000 / initialIntervals; // in milliseconds
    const frame = () => {
      const progressBar = progressBarRef.current;
      let width = progressBar.style.width;
      width = parseInt(width, 10) + 1;

      if (width > 100) {
        clearInterval(intervalId);
        console.log("Progress bar has reached 100%");
      } else {
        progressBar.style.width = width + '%';
        progressBar.textContent = width + '%';
      }
    };

    const id = setInterval(frame, intervalTime);
    setIntervalId(id);

    // Set the initial width of the progress bar
    progressBarRef.current.style.width = initialWidth + '%';
    progressBarRef.current.textContent = initialWidth + '%';

    // Clean up
    return () => clearInterval(intervalId);
  }, [initialIntervals, initialWidth]);

  return (
    <div className="gear-container">
      <div className="Progressr"></div>
      <div className="progress-container">
        <div className="progress-bar" ref={progressBarRef}></div>
      </div>
    </div>
  );
};

export default Progress;