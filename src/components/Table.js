import React from 'react';
import * as XLSX from 'xlsx';
import './Table.css';

const Table = ({ sheet }) => {
  if (!sheet) {
    return <div>No data available</div>;
  }

  const jsonSheet = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!jsonSheet || jsonSheet.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="table-container">
      <table className="styled-table">
        <thead>
          <tr>
            {jsonSheet[0].map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jsonSheet.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell !== undefined ? cell : ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
