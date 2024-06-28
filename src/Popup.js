import React, { useState, useEffect, useCallback } from 'react';
import './Popup.css'; // Import CSS for styling if necessary
import * as XLSX from 'xlsx';
import * as utils from './utils.js';
import { saveAs } from 'file-saver';

const searchResults = { Red: [], Yellow: [], Green: [] };

const maxCount = 50;

const Popup = ({ sheet, queries, onClose, workbook, fileInput }) => {
  const [count, setCount] = useState(1);
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const resList = []; 

  const handleFile = (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const range = XLSX.utils.decode_range(sheet['!ref']);

        const firstColumn = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: range.s.c });
          const cell = sheet[cellAddress];
          firstColumn.push(cell ? cell.v : null);
        }

        resolve(firstColumn);
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const saveSheet = async (sheet, file, title) => {
    console.log(sheet);

    const isbnCol = await handleFile(file);

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const data = [];

    const headerRow = [];
    for (let C = 0; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        headerRow.push(cell ? cell.v : '');
    }
    headerRow.splice(1, 0, 'ISBN'); 
    data.push(headerRow);

    for (let R = 1; R <= range.e.r; ++R) {
        const row = [];
        for (let C = 0; C <= range.e.c; ++C) {
            const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
            row.push(cell ? cell.v : '');
        }
        row.splice(1, 0, isbnCol[R - 1] || ''); 
        data.push(row);
    }

    const newSheet = XLSX.utils.aoa_to_sheet(data);

    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Sheet1');

    const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), "Modified"+title+".xlsx");
};


  const arrayToCheck = [12,19,20,28,2938,39,41,42];
  const openHollisSearch = useCallback((qu) => {
    setTimeout(() => {
      const query = utils.getCell(sheet, count, utils.colIndex(sheet, qu));
      const url = `https://hollis.harvard.edu/primo-explore/search?query=any,contains,${query}&tab=books&search_scope=default_scope&vid=HVD2&lang=en_US&offset=0`;
      window.open(url, '_blank');
    }, 1000);
  }, [count, sheet]);

  useEffect(() => {
    const performSearch = async () => {

      if (count <= range.e.r && count <= maxCount) {
        const searchValue = await utils.search_one_item(sheet, queries, count);

        resList.push(searchValue);

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
      }else{
        updateResults('Green', "Not Searched");
        setCount(prevCount => prevCount + 1);
      }
      const title = workbook.SheetNames[0];
      if (count > range.e.r) {
        console.log("RESULTS");
        console.log(resList);
        console.log(sheet);
        utils.createColumn("HOLLIS Search",sheet,resList);
        console.log(title);
        saveSheet(sheet, fileInput,title);

        clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(async () => {
      document.getElementById('numSearched').innerHTML = `${count} of ${Math.min(range.e.r, maxCount)}`;
      await performSearch();
    }, 5000);

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
