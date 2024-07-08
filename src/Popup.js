import React, { useState, useEffect, useCallback } from 'react';
import './Popup.css'; // Import CSS for styling if necessary
import * as XLSX from 'xlsx';
import * as utils from './utils.js';
import { saveAs } from 'file-saver';

const searchResults = { Red: [], Yellow: [], Green: [] };

var maxCount = 150;
const testing = true;
const Popup = ({ sheet, queries, onClose, workbook, fileInput }) => {
  const [count, setCount] = useState(1);
  const [resList, setResList] = useState([]);
  const range = XLSX.utils.decode_range(sheet['!ref']);
  if(testing){
    maxCount = range.e.r;
  }

  const addColumnToSheet = (sheet, data) => {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const colIndex = 0; 
    
    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = range.e.c; C >= 0; --C) {
        const newCellIndex = XLSX.utils.encode_cell({ r: R, c: C + 1 });
        const oldCellIndex = XLSX.utils.encode_cell({ r: R, c: C });
        sheet[newCellIndex] = sheet[oldCellIndex];
        if (R === 0) {
          delete sheet[oldCellIndex];
        }
      }
    }


    sheet[XLSX.utils.encode_cell({ r: 0, c: colIndex })] = { v: 'HOLLIS Search', t: 's' };

    for (let R = 1; R <= range.e.r; ++R) {
      sheet[XLSX.utils.encode_cell({ r: R, c: colIndex })] = { v: data[R - 1] || '', t: 's' };
    }

    const newRange = XLSX.utils.decode_range(sheet['!ref']);
    newRange.e.c = range.e.c + 1;
    sheet['!ref'] = XLSX.utils.encode_range(newRange);

    return sheet;
  };

  const saveSheet = (sheet, data, title) => {
    const updatedSheet = addColumnToSheet(sheet, data);

    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, updatedSheet, 'Sheet1');

    const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), "Modified" + title + ".xlsx");
  };

  const arrayToCheck = [12, 19, 20, 28, 2938, 39, 41, 42];
  const openHollisSearch = useCallback((qu) => {
    setTimeout(() => {
      const query = utils.getCell(sheet, count, utils.colIndex(sheet, qu));
      const url = `https://hollis.harvard.edu/primo-explore/search?query=any,contains,${query}&tab=books&search_scope=default_scope&vid=HVD2&lang=en_US&offset=0`;
      window.open(url, '_blank');
    }, 500);
  }, [count, sheet]);

  useEffect(() => {
    const performSearch = async () => {
      if (count <= range.e.r && count <= maxCount) {
        const searchValue = await utils.search_one_item(sheet, queries, count);
      

        var newResList = resList.filter(() => true);
        newResList.push(searchValue)
        setResList(newResList);

        try {
          if (searchValue && searchValue.includes('Red')) {
            updateResults('Red', searchValue);
          } else if (searchValue && searchValue.includes('Green')) {
            updateResults('Green', searchValue);
          } else if (searchValue && searchValue.includes('Yellow')) {
            updateResults('Yellow', searchValue);
          }
        } catch {
          console.error('Error found with includes: ', searchValue);
        }

        setCount(prevCount => prevCount + 1);
      } else {
        updateResults('Green', "Not Searched");
        setCount(prevCount => prevCount + 1);
      }

      const title = workbook.SheetNames[0];
      if (count === range.e.r) {
        console.log("RESULTS");
        console.log(resList);
        console.log(sheet);
        console.log(title);
        saveSheet(sheet, resList, title);

        clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(async () => {
      document.getElementById('numSearched').innerHTML = `${count} of ${Math.min(range.e.r, maxCount)}`;
      await performSearch();
    }, 7000);

    return () => clearInterval(intervalId);
  }, [count, sheet, queries, workbook, fileInput, range.e.r, range.e.c, openHollisSearch]);

  const updateResults = (key, value) => {
    searchResults[key].push(value);
    document.getElementById(key + 'count').innerHTML = `${key} : ${searchResults[key].length}`;
  };

  const handleDoubleClick = () => {
    onClose();
  };

  return (
    <div className="popup-background" onDoubleClick={handleDoubleClick}>
      <div className="popup">
        <div className="popup-inner">
          <h2>Searching</h2>
          <p id="numSearched">1 of {Math.min(range.e.r, maxCount)}</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${((count - 1) / Math.min(range.e.r, maxCount)) * 100}%` }}></div>
          </div>
          <table>
            <tbody>
              <tr>
                <td id="Redcount" className="titleTable">Red: 0</td>
                <td>
                  <button style={{ backgroundColor: 'crimson' }} className="info-button">
                    Info
                  </button>
                </td>
              </tr>
              <tr>
                <td id="Yellowcount" className="titleTable">Yellow: 0</td>
                <td>
                  <button style={{ backgroundColor: 'gold' }} className="info-button">
                    Info
                  </button>
                </td>
              </tr>
              <tr>
                <td id="Greencount" className="titleTable">Green: 0</td>
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
