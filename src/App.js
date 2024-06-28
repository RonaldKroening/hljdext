import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Route, Routes } from 'react-router-dom';
import LargeContainer from './components/large-container';
import SmallContainer from './components/small-container';
import ChatboxContainer from './components/ChatboxContainer';
import FileUpload from './components/FileUpload';
import Popup from './Popup.js';
import './App.css';
import { Modal } from 'react-bootstrap';

function testMode(sheet, num_test) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const totalRows = range.e.r;
  const totalCols = range.e.c + 1;
  const selectedRows = new Set();

  // Ensure we don't select more rows than available
  num_test = Math.min(num_test, totalRows); // Adjust to include header row

  // Generate random unique row indices
  while (selectedRows.size < num_test) {
    const randomRow = Math.floor(Math.random() * (totalRows - 1)) + 1; // from row 2 to the end
    selectedRows.add(randomRow);
  }

  // Prepare new sheet data
  const newSheetData = [];

  // Add header row
  const headerRow = [];
  for (let col = 0; col < totalCols; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })]; // header row is 0
    headerRow.push(cell ? cell.v : null);
  }
  newSheetData.push(headerRow);

  // Add selected rows
  selectedRows.forEach(row => {
    const rowData = [];
    for (let col = 0; col < totalCols; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      rowData.push(cell ? cell.v : null);
    }
    newSheetData.push(rowData);
  });

  // Create new sheet
  const newSheet = XLSX.utils.aoa_to_sheet(newSheetData);
  return newSheet;
}
const test = false;
const App = () => {
  useEffect(() => {
    document.title = 'HEXSUT';
  }, []);

  const [sheet, setSheet] = useState(null);
  const [data, setData] = useState(null);
  const [chatboxes, setChatboxes] = useState([]);
  const [columnNames, setColumnNames] = useState([" "]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [queries, setQueries] = useState({});
  const [fileInput,setfileInput] = useState(null);
  const [workbook,setWorkbook] = useState(null);
  const [showPopup, setShowPopup] = useState(false); // State for showing the popup

  const handleFileUpload = (files) => {
    const file = files[0];
    setfileInput(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      setWorkbook(workbook);
      const firstSheetName = workbook.SheetNames[0];
      setfileInput(file);
      var firstSheet = workbook.Sheets[firstSheetName];
      if(test){
        firstSheet = testMode(firstSheet,100);
      }
      console.log("First sheet: ",firstSheet);
      setSheet(firstSheet);
      setData(data);

      const worksheet = workbook.Sheets[firstSheetName];
      var columnNamesArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

      const newChatboxes = columnNamesArray.map((columnName, index) => ({
        id: index + 1,
        name: columnName
      }));

      setChatboxes(newChatboxes);
      columnNamesArray.unshift("None");
      setColumnNames(columnNamesArray);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSelectChange = (value, columnId) => {
    setSelectedColumns((prevSelected) => {
      const newSelected = [...prevSelected];
      newSelected[columnId] = value;
      setQueries({
        ...queries,
        dropdowns: newSelected,
        allSelected: newSelected
      });
      return newSelected;
    });
  };

  const handleCheckboxChange = (event) => {
    const value = event.target.value;
    setSelectedColumns((prevSelected) => {
      const newSelected = prevSelected.includes(value)
        ? prevSelected.filter((col) => col !== value)
        : [...prevSelected, value];
      setQueries({
        ...queries,
        checkboxes: newSelected
      });
      return newSelected;
    });
  };

  const segue = () => {
    console.log(sheet);
    if(queries['allSelected'] != undefined){
      console.log("pressed. queries: ", queries);
      setShowPopup(true); // Show the popup
    }else{
      alert("Please select at least one column before searching.");
    }
    
  };

  const handleClosePopup = () => {
    setShowPopup(false); // Close the popup
  };

  return (
    <div className="App">
      <h1>HEXSUT</h1>
      <LargeContainer id="large-container-1" text1="Upload File" text2="Click or Drag & Drop the Excel Spreadsheet to get started.">
        <FileUpload id="file-upload" onFilesSelected={handleFileUpload} />
      </LargeContainer>
      <LargeContainer id="large-container-2" text1="Main Column Selection" text2="Select key columns for search functions.">
        <SmallContainer
          id="mini-container-1"
          cid="bcc"
          title="ISBN/EISBN Column"
          options={columnNames}
          selectedOption={selectedColumns[0] || ''}
          onSelectChange={(value) => handleSelectChange(value, 0)}
        />
        <SmallContainer
          id="mini-container-2"
          cid="ttc"
          title="Title Column"
          options={columnNames}
          selectedOption={selectedColumns[1] || ''}
          onSelectChange={(value) => handleSelectChange(value, 1)}
        />
        <SmallContainer
          id="mini-container-3"
          cid="atc"
          title="Author Column"
          options={columnNames}
          selectedOption={selectedColumns[2] || ''}
          onSelectChange={(value) => handleSelectChange(value, 2)}
        />
      </LargeContainer>
      <LargeContainer id="large-container-3" text1="Add Columns" text2="Check off other columns to be included in the search.">
        <ChatboxContainer
          chatboxes={chatboxes}
          selectedColumns={selectedColumns}
          onCheckboxChange={handleCheckboxChange}
        />
      </LargeContainer>
      <button className="searchButton" onClick={segue}>Search</button>
      {showPopup && <Popup sheet={sheet} queries={queries} onClose={handleClosePopup} workbook={workbook} fileInput={fileInput}/>} {/* Conditionally render the popup */}
    </div>
  );
};

const MainApp = () => (
  <Routes>
    <Route path="/" element={<App />} />
  </Routes>
);

export default MainApp;
