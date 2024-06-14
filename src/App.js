import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import LargeContainer from './components/large-container';
import SmallContainer from './components/small-container';
import ChatboxContainer from './components/ChatboxContainer';
import FileUpload from './components/FileUpload';
import About from './AboutPage'; // Ensure you have the About component
import './App.css'; // Add a CSS file for global styles

const App = () => {
  useEffect(() => {
    document.title = 'HEXSUT';
  }, []);

  const [sheet, setSheet] = useState(null);
  const [data, setData] = useState(null);
  const [chatboxes, setChatboxes] = useState([]);
  const [columnNames, setColumnNames] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]); // Ensure this is initialized as an array
  const [queries, setQueries] = useState({});
  const navigate = useNavigate();

  const handleFileUpload = (files) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      setSheet(firstSheet);
      setData(data);

      const worksheet = workbook.Sheets[firstSheetName];
      const columnNamesArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
      const newChatboxes = columnNamesArray.map((columnName, index) => ({
        id: index + 1,
        name: columnName
      }));

      setChatboxes(newChatboxes);
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
        dropdowns: newSelected
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

  const getCellValue = (sheet, row, col) => {
    const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
    const cell = sheet[cellAddress];
    return cell ? cell.v : undefined;
  };

  const segue = () => {
    navigate('/about', { state: { queries, data } });
  };

  useEffect(() => {
    setQueries((prevQueries) => ({
      ...prevQueries,
      allSelected: [...new Set([...selectedColumns])]
    }));
  }, [selectedColumns]);

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
    </div>
  );
};

const MainApp = () => (
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </Router>
);

export default MainApp;
