import React from 'react';
import * as XLSX from 'xlsx';

const Table = ({ sheet }) => {
  const jsonSheet = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  return (
    <table border="1">
      <tbody>
        {jsonSheet.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell !== undefined ? cell : ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
