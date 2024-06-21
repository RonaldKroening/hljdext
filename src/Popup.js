import React, { useState, useEffect } from 'react';
import './Popup.css'; // Import CSS for styling if necessary
import * as XLSX from 'xlsx';
import * as utils from './utils.js';
import { saveAs } from 'file-saver';
import { Route, Routes } from 'react-router-dom';
import LargeContainer from './components/large-container';
import SmallContainer from './components/small-container';
import ChatboxContainer from './components/ChatboxContainer';
import FileUpload from './components/FileUpload';

var searchResults = {};
var resList = [];
var maxCount = 258;
var let_continue = true;
const Popup = ({ sheet, queries, onClose, workbook }) => {
  const [count, setCount] = useState(0);
  const range = XLSX.utils.decode_range(sheet['!ref']);
  maxCount = range.e.r;
  let intervalId;

  const file = { name: 'example.xlsx' }; // Define the file object

  useEffect(() => {
    const performSearch = async () => {
      if (count <= maxCount) {
        const searchValue = await utils.search_one_item(sheet, queries, count + 1);
        console.log(searchValue);
        resList.push(searchValue);

        try {
          if (searchValue.includes('Red')) {
            updateResults('Red', searchValue);
          } else if (searchValue.includes('Green')) {
            updateResults('Green', searchValue);
          } else if (searchValue.includes('Yellow')) {
            updateResults('Yellow', searchValue);
          }
        } catch {
          console.error('Error found with includes: ', searchValue);
        }

        setCount((prevCount) => prevCount + 1);

        if (count == maxCount) {
          utils.createColumn('HOLLIS Search', sheet, resList);
          utils.moveColumnToFirst(sheet, 'HOLLIS Search');
          const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Modified_${file.name}`);
          console.log('File saved!');
          clearInterval(intervalId);
        }
      } 
    };

    intervalId = setInterval(() => {
      document.getElementById('numSearched').innerHTML = `${count} of ${maxCount}`;
      console.log('queries: ', queries);
      performSearch();
    }, 50);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [count, sheet, queries, maxCount]);

  const updateResults = (key, value) => {
    var list = [];
    if (key in searchResults) {
      list = searchResults[key];
    }
    list.push(value);
    console.log(searchResults);
    searchResults[key] = list;
    console.log('id: ' + (key + 'count') + ' search res ' + searchResults[key].length.toString());
    document.getElementById(key + 'count').innerHTML = `${key} : ${searchResults[key].length}`;
  };

  const handleDoubleClick = () => {
    if (count >= maxCount) {
      onClose();
    }
  };

  return (
    <div className="popup-background" onDoubleClick={handleDoubleClick}>
      <div className="popup">
        <div className="popup-inner">
          <h2>Searching</h2>
          <p id="numSearched">XX of XX</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${(count / maxCount) * 100}%` }}></div>
          </div>
          <table>
            <tbody>
              <tr>
                <td id="Redcount" className="titleTable">Red:</td>
                <td>
                  <button style={{ backgroundColor: 'crimson' }} className="info-button">
                    Info
                  </button>
                </td>
              </tr>
              <tr>
                <td id="Yellowcount" className="titleTable">Yellow:</td>
                <td>
                  <button style={{ backgroundColor: 'gold' }} className="info-button">
                    Info
                  </button>
                </td>
              </tr>
              <tr>
                <td id="Greencount" className="titleTable">Green:</td>
                <td>
                  <button style={{ backgroundColor: 'green' }} className="info-button">
                    Info
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Popup;
