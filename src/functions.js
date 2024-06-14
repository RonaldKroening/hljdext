import HOBJECT from './HOBJect.js'


function extractIdentifier(url) {
    const regex = /\/alma\/(\d+)\/catalog/;
    const match = url.match(regex);
    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}
var limit = 250;
var currentIteration = 0;
function moveColumnToFirst(sheet, colName) {
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

    // Shift other columns to the right
    for (let col = colIndex; col > 0; col--) {
        for (let row = range.s.r; row <= range.e.r; row++) {
            const fromCellAddress = XLSX.utils.encode_cell({ c: col - 1, r: row });
            const toCellAddress = XLSX.utils.encode_cell({ c: col, r: row });

            sheet[toCellAddress] = sheet[fromCellAddress];
        }
    }

    // Fix the first column after shifting
    for (let row = range.s.r; row <= range.e.r; row++) {
        const firstCellAddress = XLSX.utils.encode_cell({ c: 0, r: row });
        const targetCellAddress = XLSX.utils.encode_cell({ c: colIndex, r: row });

        sheet[firstCellAddress] = sheet[targetCellAddress];
        delete sheet[targetCellAddress];
    }

    // Update the range
    sheet['!ref'] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: range.e.c, r: range.e.r },
    });
    let values1 = getColValues(sheet,"HOLLIS Search");
    overrideCol(sheet, 0, "HOLLIS Search", values1);
    overrideCol(sheet,1,old_n, old_v);
}


function obtain_value(all_json, values) {
    let val = "GREEN- No matches in HOLLIS found.";
    for (const search of all_json) {
        //arrays of all searches for search param search
        try{
            for (const obj of search) {
                // console.log("OBJECT");
                // console.log(obj);
                let titles = extract_title(obj);
                for(var title of titles){
                    for(var ch of values){
                        if(title[0] == ch[0]){
                            for(var poss of obj['relatedItem']){
                                if(poss['@otherType'] == 'HOLLIS record'){
                                    let holl = extractIdentifier(poss['location']['url']);
                                    val = "YELLOW- Potential Title Match With "+ch+". HOLLIS ID No. "+holl;
                                    matchFound = true;

                                }
                            }
                            
                        }
                    }
                }
                    for (var identifiers in obj['identifier']){
                        console.log(identifiers);
                        if(identifiers['@type'] == 'isbn'){
                            var isbn = identifiers['#text']
                            console.log("Compare ",isbn, "  ",values);
                            if(values.includes(isbn)){
                                for(var poss of obj['relatedItem']){
                                    if(poss['@otherType'] == 'HOLLIS record'){
                                        let holl = extractIdentifier(poss['location']['url']);
                                            val = "RED- HOLLIS ID No. "+holl;
                                            matchFound = true;
                                            break;
                                        }
                                    }
                                }
                        }
                    }
                }
                
        }catch{
            let titles = extract_title(search);
            for(var title of titles){
                console.log(title);
                for(var ch of values){
                    if(title[0] == ch[0]){
                        for(var poss of search['relatedItem']){
                            if(poss['@otherType'] == 'HOLLIS record'){
                                let holl = extractIdentifier(poss['location']['url']);
                                val = "YELLOW- Potential Title Match With "+ch+". HOLLIS ID No. "+holl;
                                matchFound = true;

                            }
                        }
                        
                    }
                }
            }
            let identifiers = search['identifier']
            for(var identifier of identifiers){
                if(identifier['@type'] == 'isbn'){
                                var isbn = identifier['#text']
                                console.log("Compare ",isbn, "  ",values);
                                if(values.includes(isbn)){
                                    try{
                                        for(var poss of search['relatedItem']){
                                            if(poss['@otherType'] == 'HOLLIS record'){
                                                let holl = extractIdentifier(poss['location']['url']);
                                                val = "RED- HOLLIS ID No. "+holl;
                                                matchFound = true;
                                                break;
                                            }
                                        }
                                    }catch {
                                        let poss = search['relatedItem'];
                                            if(poss['@otherType'] == 'HOLLIS record'){
                                                let holl = extractIdentifier(poss['location']['url']);
                                                val = "RED- HOLLIS ID No. "+holl;
                                                matchFound = true;
                                                break;
                                            }else{
                                                val = "RED- HOLLIS ID Not Detected ";
                                            }
                                    }
                                }
                            }
                        }
                    
                
        }
    }

    return val;
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

async function fetchAllItems(items) {
    var all_json = [];
    for (const item of items) {
        try{
            item = format_title(item);
        }catch{
            let l = 1;
        }
        const query = item.toString().replace(/ /g, "%20");
        const url_1 = `https://api.lib.harvard.edu/v2/items.json?identifier=${query}`;
        const url_2 = `https://api.lib.harvard.edu/v2/items.json?title=${query}&facets=name,resourceType`;
        
        // console.log("Searched URL");
        // console.log(url);
        currentIteration += 1;
        for(var url of [url_1,url_2]){
            try {
                const response = await fetch(url);
                const jsonText = await response.text();
                let json = JSON.parse(jsonText);

                try{
                    const nf = parseInt(json['pagination']['numFound'], 10);
                    if (nf > 0) {
                        if(nf == 1){
                            let jso = json['items']['mods'];
                            let test_h = new HOBJECT(jso);
                            if(query in test_h.asList()){
                                val = "Red "+test_h.hollisID;
                            }
                            test_h.process(jso);
                            console.log("Test Hobject Time!");          
                            console.log(test_h.asList());
                        }else{
                            for(var jso of json['items']['mods']){
                                let test_h = new HOBJECT(jso);
                                test_h.process(jso);
                                console.log("Test Hobject Time!");          
                                console.log(test_h.asList());
                            }
                        }
                    } else {
                        let i2 = 1;
                    }
                }catch (error) {
                    console.error('Error:', error, "with url: ", url, " and item ", item);
                }
                

            } catch (error) {
                console.error('Error:', error, "with url: ", url, " and item ", item);
            }
        }
    }
    // console.log("JSON Returning");
    console.log(all_json);
    return all_json;
}

function obtain_column_names(sheet, inputs) {
    const columnNames = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
    const idx = [];
    // console.log("COLNAME FROM OCN: ", columnNames);
    for (const inputId of inputs) {
        const inp = document.getElementById(inputId).value;
        if (columnNames.includes(inp)) {
            idx.push(columnNames.indexOf(inp) + 1);
        }
    }
    return idx;
}

function obtain_rowItems(sheet, columnArray, row_index) {
    const row_data = [];
    for (const column_index of columnArray) {
        const cell_address = XLSX.utils.encode_cell({ c: column_index - 1, r: row_index });
        const cell = sheet[cell_address];
        if (cell) {
            var cell_val = cell.v;
            try{
                cell_val = format_title(cell.v);
            }catch{
                cell_val = cell.v;
            }
            row_data.push(cell_val);
        }
    }
    return row_data;
}

document.addEventListener('DOMContentLoaded', function () {
    hideProgressBar();
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('input', handleFileChange);
    const modifyButton = document.getElementById("modifyButton");
    modifyButton.addEventListener("click", modifyExcel);
    for (var sel of ["inp_1", "inp_2", "inp_3"]) {
        document.getElementById(sel).addEventListener('input', (event) => {
          const parentDiv = event.target.parentNode;
          const h2Element = parentDiv.querySelector('h2');
          if (h2Element) {
            h2Element.innerText = event.target.value;
          }
        });
      }
});

function createColumn(name, sheet, values = []) {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const columnIndex = range.e.c + 1; // increment column index to add a new column

    const firstRowAddress = XLSX.utils.encode_cell({ c: columnIndex, r: range.s.r });
    sheet[firstRowAddress] = { v: name, t: 's' }; // set value and type for the header

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: row });
        if (values.length >= row - range.s.r) { // check if values array has enough elements
            sheet[cellAddress] = { v: values[row - range.s.r - 1], t: 'n' }; // set value and type
        } else {
            sheet[cellAddress] = { v: 0, t: 'n' }; // set default value and type
        }
    }
    
    sheet['!ref'] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: columnIndex, r: range.e.r },
    });
}

function handleFileChange() {
    // console.log("HERE");
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        let columnNames = [" "];
        columnNames = columnNames.concat(XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0]);

        const ASelect = document.getElementById("inp_1");
        const BSelect = document.getElementById("inp_2");
        const CSelect = document.getElementById("inp_3");

        // Clear existing options
        ASelect.innerHTML = '';
        BSelect.innerHTML = '';
        CSelect.innerHTML = '';

        columnNames.forEach((columnName) => {
            const option = document.createElement("option");
            option.text = columnName;
            option.value = columnName;
            ASelect.add(option.cloneNode(true));
            BSelect.add(option.cloneNode(true));
            CSelect.add(option.cloneNode(true));
        });

        ASelect.style.width = "120px";
        BSelect.style.width = "120px";
        CSelect.style.width = "120px";
    };

    reader.readAsArrayBuffer(file);
}

function update_progbar(curr, tot) {
    const progressBar = document.getElementById('progress-bar');
    const progressBarInner = document.getElementById('progress-bar-inner');
    const progressPercentage = document.getElementById('progress-percentage');
    const progress = (curr / tot) * 100;
    progressBarInner.style.width = `${progress}%`;
    progressPercentage.textContent = `${progress.toFixed(2)}%`;
}

function showProgressBar() {
    document.getElementById('progress-bar').style.display = 'block';
}

function hideProgressBar() {
    document.getElementById('progress-bar').style.display = 'none';
}

async function modifyExcel() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Please select a file.');
        return;
    }

    const reader = new FileReader();
    const file = fileInput.files[0];

    reader.onload = async function (e) {
        if(localStorage.getItem("key") == null){
            localStorage.setItem("key",1);
        }else{
            localStorage.setItem('key', localStorage.getItem('key')+1);
        }
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const range = XLSX.utils.decode_range(sheet['!ref']);
        const columnArray = obtain_column_names(sheet, ["inp_1", "inp_2", "inp_3"]);
        const nextCol = range.e.c + 1;

        let values = [];
        let totalIterations = columnArray.length * 200;
        currentIteration = 0;
        showProgressBar();
        if(limit == 0 || localStorage.getItem('key') > 0){
            limit = range.e.r;
        }

        for (let r = 1; r <= limit; r++) {
            const row_items = obtain_rowItems(sheet, columnArray, r);
            console.log(row_items);
            if(row_items.every(element => element === null) == false){ //Ignore empty rows
                const all_search_data = await fetchAllItems(row_items);
                const value = obtain_value(all_search_data, row_items);
                values.push(value);
                console.log("Value for "+row_items[1]+" : "+value);
            }
            

            update_progbar(currentIteration, totalIterations);
        }

        update_progbar(totalIterations, totalIterations);
        createColumn("HOLLIS Search", sheet, values);
        moveColumnToFirst(sheet, "HOLLIS Search");

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Modified_${file.name}`);
        console.log("File saved!");
    };

    reader.readAsArrayBuffer(file);
}
