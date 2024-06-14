import React from 'react';
import './ChatboxContainer.css';

const ChatboxContainer = ({ chatboxes, selectedColumns, onCheckboxChange }) => {
  return (
    <div className="cb-container">
      {chatboxes.map(chatbox => (
        <div key={chatbox.id} className="cb-chatbox">
          <input
            type="checkbox"
            id={`chatbox-${chatbox.id}`}
            value={chatbox.name}
            checked={selectedColumns.includes(chatbox.name)}
            onChange={onCheckboxChange}
          />
          <label htmlFor={`chatbox-${chatbox.id}`}>
            {chatbox.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default ChatboxContainer;

