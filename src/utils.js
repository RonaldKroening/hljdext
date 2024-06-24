import * as XLSX from 'xlsx';
import HOBJECT from './HOBJect.js';
// const fs = require('fs').promises;

function extractIdentifier(url) {
  const regex = /\/alma\/(\d+)\/catalog/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
}

export function rowAsList(sheet, r) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const row = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ c: col, r: r });
    const cell = sheet[cellAddress];
    row.push(cell ? cell.v : null); // If cell is empty, push null
  }
  return row;
}

function similarities(array1, array2) {
  const set1 = new Set(array1);
  const set2 = new Set(array2);
  let commonCount = 0;
  set1.forEach(value => {
    if (set2.has(value)) {
      commonCount++;
    }
  });
  return commonCount;
}

function getColValues(sheet, columnName) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const columnNames = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
  const colIndex = columnNames.indexOf(columnName);

  if (colIndex === -1) {
    throw new Error(`Column ${columnName} not found.`);
  }

  const values = [];
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: row });
    const cell = sheet[cellAddress];
    values.push(cell ? cell.v : null);
  }

  return values;
}

function format_word(word) {
  let new_word = "";
  for (var i in word) {
    let letter = word[i];
    if (i != 0 && ((letter.toLowerCase() != letter.toUpperCase()) || ":/.,'!@#$%^&*()-_+=".includes(letter))) {
      letter = letter.toLowerCase();
      new_word += letter;
    } else {
      new_word += letter;
    }
  }
  return new_word;
}
let callCache = {};

// Function to load cache from tempCache.txt and convert to JSON
async function loadCache() {
    const input = document.getElementById('fileInput');
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            callCache = JSON.parse(event.target.result);
            console.log('Cache loaded successfully:', callCache);
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };

    if (file) {
        reader.readAsText(file);
    } else {
        console.log('No file selected');
    }
}

// Function to save a call to the cache
function saveCall(url, json) {
    callCache[url] = json;
}

// Function to write the cache to tempCache.txt
function saveCacheToFile() {
    const blob = new Blob([JSON.stringify(callCache, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tempCache.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to check if a URL is in the cache and return associated JSON
function checkCache(url) {
    return callCache.hasOwnProperty(url) ? callCache[url] : null;
}
function format_title(title) {
  var new_title = "";

  for (var word of title.split(" ")) {
    new_title += (format_word(word) + " ");
  }

  return new_title.trim();
}

function overrideCol(sheet, colIndex, columnName, values) {
  const range = XLSX.utils.decode_range(sheet['!ref']);

  const headerAddress = XLSX.utils.encode_cell({ c: colIndex, r: range.s.r });
  sheet[headerAddress] = { v: columnName, t: 's' };

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: row });
    const valueIndex = row - range.s.r - 1; // Adjust index for 0-based array

    sheet[cellAddress] = { v: values[valueIndex] !== undefined ? values[valueIndex] : null, t: 's' };
  }

  sheet['!ref'] = XLSX.utils.encode_range(range);
}

export function moveColumnToFirst(sheet, colName) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const columnNames = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
  const colIndex = columnNames.indexOf(colName);
  const old_n = columnNames[0];
  const old_v = getColValues(sheet, old_n);

  if (colIndex === -1) {
    throw new Error(`Column ${colName} not found.`);
  }

  const firstColHeaderAddress = XLSX.utils.encode_cell({ c: 0, r: 0 });
  const targetColHeaderAddress = XLSX.utils.encode_cell({ c: colIndex, r: 0 });

  const firstColHeader = sheet[firstColHeaderAddress];
  sheet[firstColHeaderAddress] = sheet[targetColHeaderAddress];
  sheet[targetColHeaderAddress] = firstColHeader;

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const firstCellAddress = XLSX.utils.encode_cell({ c: 0, r: row });
    const targetCellAddress = XLSX.utils.encode_cell({ c: colIndex, r: row });

    const firstCell = sheet[firstCellAddress];
    sheet[firstCellAddress] = sheet[targetCellAddress];
    sheet[targetCellAddress] = firstCell;
  }

  for (let col = colIndex; col > 0; col--) {
    for (let row = range.s.r; row <= range.e.r; row++) {
      const fromCellAddress = XLSX.utils.encode_cell({ c: col - 1, r: row });
      const toCellAddress = XLSX.utils.encode_cell({ c: col, r: row });

      sheet[toCellAddress] = sheet[fromCellAddress];
    }
  }

  for (let row = range.s.r; row <= range.e.r; row++) {
    const firstCellAddress = XLSX.utils.encode_cell({ c: 0, r: row });
    const targetCellAddress = XLSX.utils.encode_cell({ c: colIndex, r: row });

    sheet[firstCellAddress] = sheet[targetCellAddress];
    delete sheet[targetCellAddress];
  }

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: range.e.c, r: range.e.r },
  });
  let values1 = getColValues(sheet, "HOLLIS Search");
  overrideCol(sheet, 0, "HOLLIS Search", values1);
  overrideCol(sheet, 1, old_n, old_v);
}

function notcols(a, b) {
  var c = [];
  console.log("a ",a," and b ",b);
  for (var element of a) {
    if (b.includes(element) === false) {
      c.push(element);
    }
  }
  return c;
}

function getCell(sheet, row, column) {
  const cell_address = XLSX.utils.encode_cell({ c: column, r: row });
  const cell = sheet[cell_address];
  if (cell) {
    return cell.v;
  }
  return null;
}

function colIndex(sheet, columnName) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ c: col, r: range.s.r });
    const cell = sheet[cellAddress];
    if (cell && cell.v === columnName) {
      console.log("Found column name: ",cell.v);
      return col;
    }
  }
  return -1;
}

export function createColumn(name, sheet, values = []) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const columnIndex = range.e.c + 1;

  const firstRowAddress = XLSX.utils.encode_cell({ c: columnIndex, r: range.s.r });
  sheet[firstRowAddress] = { v: name, t: 's' };

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: row });
    if (values.length >= row - range.s.r) {
      sheet[cellAddress] = { v: values[row - range.s.r - 1], t: 'n' };
    } else {
      sheet[cellAddress] = { v: 0, t: 'n' };
    }
  }

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: columnIndex, r: range.e.r },
  });
}

async function search_by_isbn(isbn) {
  var all_json = [];
  if (isbn.toString().includes(";")) {
    for (var singleIsbn of isbn.split(";")) {
      const urls = [
        `https://api.lib.harvard.edu/v2/items.json?identifier=${singleIsbn}`,
        `https://api.lib.harvard.edu/v2/items.json?q=${singleIsbn}`
      ];

      for (var url of urls) {
        console.log("trying url: ", url);
        try {
          const response = await fetch(url);
          const jsonText = await response.text();
          let json = JSON.parse(jsonText);

          const nf = parseInt(json['pagination']['numFound'], 10);
          if (nf > 0) {
            if (nf === 1) {
              let jso = json['items']['mods'];
              let test_h = new HOBJECT(jso);
              test_h.process(jso);
              if (test_h.check_identifier('isbn', singleIsbn.toString())) {
                return [test_h];
              }
            } else if (nf > 1) {
              for (var jso of json['items']['mods']) {
                let test_h = new HOBJECT(jso);
                test_h.process(jso);
                if (test_h.isbn === singleIsbn) {
                  return [test_h];
                }
              }
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }
  } else {
    const urls = [
      `https://api.lib.harvard.edu/v2/items.json?identifier=${isbn}`,
      `https://api.lib.harvard.edu/v2/items.json?identifier=${isbn}&facets=name,resourceType`,
      `https://api.lib.harvard.edu/v2/items.json?q=${isbn}`
    ];

    for (var url of urls) {
      console.log("trying url: ", url);
      try {
        const response = await fetch(url);
        const jsonText = await response.text();
        let json = JSON.parse(jsonText);

        const nf = parseInt(json['pagination']['numFound'], 10);
        if (nf > 0) {
          if (nf === 1) {
            let jso = json['items']['mods'];
            let test_h = new HOBJECT(jso);
            test_h.process(jso);
            if (test_h.check_identifier('isbn', isbn.toString())) {
              return [test_h];
            }
          } else if (nf > 1) {
            for (var jso of json['items']['mods']) {
              let test_h = new HOBJECT(jso);
              test_h.process(jso);
              if (test_h.isbn === isbn) {
                return [test_h];
              }
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
  return null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function search_one_item(sheet, queries, r) {
    let isbn_column = colIndex(sheet, queries['dropdowns'][0]);
    console.log("Before title index");
    let title_column = colIndex(sheet, queries['dropdowns'][1]);
    let author_column = colIndex(sheet, queries['dropdowns'][2]);
    console.log("after all before remaining");
    let remaining_columns = notcols(queries['allSelected'], queries['dropdowns']);
    
    console.log("ISBN: ", isbn_column, "\n");
    console.log("Title: ", title_column, "\n");
    console.log("Author: ", author_column, "\n");
    console.log("Remaining: ", remaining_columns, "\n");

    for (var i in remaining_columns) {
      remaining_columns[i] = colIndex(sheet, remaining_columns[i]);
    }

    var values = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    let isbn_cell = getCell(sheet, r, isbn_column);
    let title_cell = getCell(sheet, r, title_column);
    let author_cell = getCell(sheet, r, author_column);
    var value = "";
    console.log("ISBN: ", isbn_cell);
    console.log("Title: ", title_cell);
    console.log("Author: ", author_cell);

    if (isbn_cell) {
      await delay(3000);
      let isbn_res = await search_by_isbn(isbn_cell);
      console.log("ISBN Results", isbn_res);
      if (isbn_res) {
        value = "Red: Hollis ID No. " + isbn_res[0].hollisID;
      }
    }

    if (value === "") {
      if (title_cell) {
        await delay(3000);
        title_cell = format_title(title_cell);
        console.log("Title: ", title_cell);
        let title_res = await search_by_title(title_cell);
        if (title_res) {
          if (title_res.length > 1) {
            value = "Yellow: Multiple Matches Detected.";
          } else {
            value = "Yellow: Hollis ID No. " + title_res[0].hollisID;
          }
        }
      }
      console.log("Done with Title", value);
    }

    if (value === "") {
      if (author_cell) {
        await delay(3000);
        let author_res = await search_by_author(author_cell);
        if (author_res) {
          if (author_res.length > 1) {
            value = "Yellow: Multiple Matches Detected.";
          } else {
            value = "Yellow: Hollis ID No. " + author_res[0].hollisID;
          }
        }
      }
    }

    if (value === "") {
      var valid_res = [];
      for (var col of remaining_columns) {
        let query_cell = getCell(sheet, r, col);
        if (query_cell) {
          await delay(3000);
          let query_res = await search_by_query(query_cell);
          if (query_res) {
            if (query_res.length === 1) {
              let g = query_res[0].asList();
              let threshold = 3;
              let row = rowAsList(sheet, r);
              if (similarities(row, g) >= threshold) {
                value = "Yellow: Possible Match Found with Hollis ID No." + query_res[0].hollisID;
                continue;
              }
            } else if (query_res.length > 1) {
              for (var res of query_res) {
                let g = res.asList();
                let threshold = 3;
                let row = rowAsList(sheet, r);
                if (similarities(row, g) >= threshold) {
                  valid_res.push(res);
                }
              }
            }
          }
        }
      }
      if (valid_res.length === 1) {
        value = "Yellow: Possible Match Found with Hollis ID No." + valid_res[0].hollisID;
      } else if (valid_res.length > 1) {
        value = "Yellow: Multiple Potential Matches Found";
      }
    }

    if (value === "") {
      value = "Green: No matches found.";
    }
    return value;
}


async function search_by_author(author) {
  var all_json = [];
  const query = author.toString().replace(/ /g, "%20");
  const url_1 = `https://api.lib.harvard.edu/v2/items.json?identifier=${query}`;
  const url_2 = `https://api.lib.harvard.edu/v2/items.json?title=${query}&facets=name,resourceType`;

  for (var url of [url_2]) { //Yes, this is improper, but has option to add urls
    try {
      const response = await fetch(url);
      const jsonText = await response.text();
      let json = JSON.parse(jsonText);

      const nf = parseInt(json['pagination']['numFound'], 10);
      if (nf > 0) {
        if (nf === 1) {
          let jso = json['items']['mods'];
          let test_h = new HOBJECT(jso);
          test_h.process(jso);
          if (test_h.check_author(author)) {
            return [test_h];
          }
        } else if (nf > 1) {
          for (var jso of json['items']['mods']) {
            let test_h = new HOBJECT(jso);
            test_h.process(jso);
            if (test_h.check_author(author)) {
              all_json.push(test_h);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  return all_json.length ? all_json : null;
}

async function search_by_query(query) {
  var all_json = [];
  const url_1 = `https://api.lib.harvard.edu/v2/items.json?identifier=${query}`;
  const url_2 = `https://api.lib.harvard.edu/v2/items.json?title=${query}&facets=name,resourceType`;

  for (var url of [url_2]) { //Yes, this is improper, but has option to add urls
    try {
      const response = await fetch(url);
      const jsonText = await response.text();
      let json = JSON.parse(jsonText);

      const nf = parseInt(json['pagination']['numFound'], 10);
      if (nf > 0) {
        if (nf === 1) {
          let jso = json['items']['mods'];
          let test_h = new HOBJECT(jso);
          test_h.process(jso);
          if (query in test_h.asList()) {
            all_json.push(test_h);
          }
        } else if (nf > 1) {
          for (var jso of json['items']['mods']) {
            let test_h = new HOBJECT(jso);
            test_h.process(jso);
            if (query in test_h.asList()) {
              all_json.push(test_h);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  return all_json.length ? all_json : null;
}

const stopwords = [
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
   'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
];

function cleanSentence(sentence) {
  return sentence
    .toLowerCase()
    .split(' ')
    .filter(word => (!stopwords.includes(word) && word.length > 3))
    .join(' ');
}

function splitSentence(sentence) {
    const words = sentence.split(' ');
    const n = words.length;
  
    const part1Length = Math.ceil(n / 3);
    const part2Length = Math.ceil((n - part1Length) / 2);
    const part3Length = n - part1Length - part2Length;
  
    const part1 = words.slice(0, part1Length).join(' ');
    const part2 = words.slice(part1Length, part1Length + part2Length).join(' ');
    const part3 = words.slice(part1Length + part2Length).join(' ');
  
    return [part1, part2, part3];
}
var cache = {};
async function save_cache(url,jso){
  loadCache(url).then(urlData => {
    if (urlData == false) {
        cache[url] = jso;
    } 
  }).catch(error => {
      console.error(`Error loading cache:`, error);
  });
}


async function save_and_return(url){
  //TODO: Load json file and check if url is a key in it. if it isn't run the 
  var urlInFile = false;
  var json = null;
  if(urlInFile == false){
    const response = await fetch(url);
    const jsonText = await response.text();
    json = JSON.parse(jsonText);
  }else{
    json = cache[url];
  }
  return json;
}
async function search_by_title(titl) {
  var all_json = [];
  console.log("Old title: ",titl);
  var title = cleanSentence(titl);
  title = splitSentence(title);
  console.log("Subparts: ",title);

  for (var word of title) {
    console.log("word: ",word);
    const url_1 = `https://api.lib.harvard.edu/v2/items.json?title=${word}`;
    const url_2 = `https://api.lib.harvard.edu/v2/items.json?title=${word}&facets=name,resourceType`;

    for (var url of [url_2]) { //Yes, this is improper, but has option to add urls
      try {
        let json = await save_and_return(url);

        const nf = parseInt(json['pagination']['numFound'], 10);
        console.log("Found ",nf);
        if (nf > 0) {
          if (nf === 1) {
            console.log("Here with ",json['items']['mods']);
            let jso = json['items']['mods'];
            let test_h = new HOBJECT(jso);
            test_h.process(jso);
            for (var obj_title of test_h.titles) {
                if (obj_title.split(" ")[0] === titl.split(" ")[0]) {
                    all_json.push(test_h);
                }
            }
          } else if (nf > 1) {
            for (var jso of json['items']['mods']) {
              let test_h = new HOBJECT(jso);
              test_h.process(jso);
                for (var obj_title of test_h.titles) {
                    if (obj_title.split(" ")[0] === titl.split(" ")[0]) {
                        all_json.push(test_h);
                    }
                }
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
  return all_json.length ? all_json : null;
}