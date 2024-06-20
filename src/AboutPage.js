import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './AboutPage.css'; 
import HOBJECT from './HOBJect.js';
import { useLocation } from 'react-router-dom';
import Table from './components/Table';
import LargeContainer from './components/large-container';
import SmallContainer from './components/small-container';
import ChatboxContainer from './components/ChatboxContainer';

const { saveAs } = require('file-saver');


const AboutPage = () => {
  const location = useLocation();
  const { queries, data, fileName } = location.state || {};
  const [sheet, setSheet] = useState(null);

  
  return (
    <div>
      <h1>About Page</h1>
      <LargeContainer text1={"Results"} text2={"View Table with Results from Search"}>
        <Table sheet={sheet}></Table>
      </LargeContainer>
      
    </div>
  );

};
