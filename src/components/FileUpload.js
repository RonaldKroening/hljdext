import React, { useRef, useState } from 'react';
import './FileUpload.css'; // Import the CSS file for styling

const FileUpload = ({ id, onFilesSelected }) => {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(''); // State to hold the file name

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleChange = (event) => {
    handleFiles(event.target.files);
  };

  const handleFiles = (files) => {
    if (files.length > 0) {
      console.log('Uploaded file:', files[0]);
      setFileName(files[0].name);
      onFilesSelected(files); // Call the prop function with the selected files
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload ${dragging ? 'dragover' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        Drag and drop files here or click to upload
      </div>
      
      <input
        type="file"
        className="file-input"
        ref={fileInputRef}
        onChange={handleChange}
        multiple
      />
      <h2 className="forBox" id="fileUpload_name">{fileName || 'No file uploaded yet'}</h2>
    </div>
  );
};

export default FileUpload;
