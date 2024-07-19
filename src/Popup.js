import React, { useState, useEffect, useCallback } from 'react';
import './Popup.css'; // Import CSS for styling if necessary
import * as XLSX from 'xlsx';
import * as utils from './utils.js';
import { saveAs } from 'file-saver';

const searchResults = { Red: [], Yellow: [], Green: [] };

var maxCount = 150;
const testing = true;
const Popup = ({ sheet, queries, onClose, workbook, fileInput, fname }) => {
  const [count, setCount] = useState(1);
  const [resList, setResList] = useState([]);
  const [titleList, setTitleList] = useState([]);
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const [name, setName] = useState(fname);
  const [readyToSearch, setReadyToSearch] = useState(false);

  if (testing) {
    maxCount = range.e.r;
  }

  const checkColumnInSheet = (sheet, columnName) => {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const firstRow = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = sheet[cellAddress];
      firstRow.push(cell ? cell.v : undefined);
    }
    const columnIndex = firstRow.indexOf(columnName);
    return columnIndex === -1 ? null : columnIndex;
  }

  const addColumnToSheet = (sheet, data, name) => {
    const ind = checkColumnInSheet(sheet, name) === null;
    if (ind) {
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

      sheet[XLSX.utils.encode_cell({ r: 0, c: colIndex })] = { v: name, t: 's' };

      for (let R = 1; R <= range.e.r; ++R) {
        sheet[XLSX.utils.encode_cell({ r: R, c: colIndex })] = { v: data[R - 1] || '', t: 's' };
      }

      const newRange = XLSX.utils.decode_range(sheet['!ref']);
      newRange.e.c = range.e.c + 1;
      sheet['!ref'] = XLSX.utils.encode_range(newRange);
    }
    return sheet;
  };

  const saveSheet = (sheet, data, title, titleList) => {
    let updatedSheet = addColumnToSheet(sheet, data, "HOLLIS Search");
    updatedSheet = addColumnToSheet(sheet, titleList, "Titles of Found Values");

    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, updatedSheet, 'Sheet1');

    const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), name.replace(".xlsx", "") + "_isbn_searched.xlsx");
  };

  const openHollisSearch = useCallback((qu) => {
    setTimeout(() => {
      const query = utils.getCell(sheet, count, utils.colIndex(sheet, qu));
      const url = `https://hollis.harvard.edu/primo-explore/search?query=any,contains,${query}&tab=books&search_scope=default_scope&vid=HVD2&lang=en_US&offset=0`;
      window.open(url, '_blank');
    }, 500);
  }, [count, sheet]);

  const performSearch = async () => {
    var res_list = [];
    var t_list = [];
    for (let count = 1; count <= range.e.r; count++) {
      console.log(`Row ${count}`);
      delay(500);

      const sv = await utils.search_one_item(sheet, queries, count);
      const searchValue = sv[0];
      const title_found = sv[1];
      t_list.push(title_found);
      res_list.push(searchValue);
      setCount(count);

      setResList(prevResList => [...prevResList, searchValue]);
      setTitleList(prevTitleList => [...prevTitleList, title_found]);

      if (searchValue && searchValue.includes('Red')) {
        console.log("We did it!!!!!");
        updateResults('Red', searchValue);
      } else if (searchValue && searchValue.includes('Yellow')) {
        console.log("we kinda did it!");
        updateResults('Yellow', searchValue);
      } else if (searchValue && searchValue.includes('Green')) {
        console.log("we may be cooked.");
        updateResults('Green', searchValue);
      }
    }
    console.log("RESULTS");
    console.log(resList);
    console.log(res_list);
    console.log(sheet);
    console.log(workbook.SheetNames[0]);
    saveSheet(sheet, res_list, workbook.SheetNames[0], t_list);
  };

  useEffect(() => {
    if (readyToSearch) {
      performSearch();
    }
  }, [readyToSearch]);

  useEffect(() => {
    // When all dependencies are ready, set readyToSearch to true
    setReadyToSearch(true);
  }, [sheet, queries, workbook, fileInput, range.e.r, range.e.c]);

  const updateResults = (key, value) => {
    searchResults[key].push(value);
    document.getElementById(key + 'count').innerHTML = `${key} : ${searchResults[key].length}`;
  };

  const handleDoubleClick = () => {
    onClose();
  };

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return (
    <div className="popup-background" onDoubleClick={handleDoubleClick}>
      <div className="popup">
        <div className="popup-inner">
          <h2>Searching</h2>
          <p id="numSearched">{count} of {Math.min(range.e.r, maxCount)}</p>
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
