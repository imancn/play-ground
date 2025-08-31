function doGet() {
  return HtmlService.createHtmlOutputFromFile('monitor')
      .setTitle('Sheets Monitor')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

// Returns all sheet names and metadata
function getSheetData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!sheetName) {
      // Return all sheet names
      const sheets = ss.getSheets().map(s => s.getName());
      return { success: true, sheets };
    }

    // Get the requested sheet
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: 'Sheet not found', sheetName };

    const values = sheet.getDataRange().getValues(); // Get raw values
    const displayValues = sheet.getDataRange().getDisplayValues(); // Get display values for formatting
    if (values.length === 0) {
      return { success: true, sheetName, headers: [], data: [], isEmpty: true, totalRows: 0 };
    }

    // Treat first row as headers
    const headers = values[0].map(String); // Ensure all headers are strings

    // Determine which columns contain dates with stricter criteria
    const columnIsDate = headers.map((_, colIndex) => {
      const sampleValues = values.slice(1, Math.min(values.length, 11)); // Check up to 10 rows
      const columnValues = sampleValues.map(row => row[colIndex]);
      const dateCount = columnValues.filter(val => 
        val instanceof Date || 
        (typeof val === 'string' && 
         /^\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2})?$/.test(val) && 
         !isLikelyNumeric(val) && 
         !isNaN(Date.parse(val)))
      ).length;
      return dateCount / sampleValues.length > 0.7; // Require 70% of values to be dates
    });

    // Remaining rows as data
    const data = values.slice(1).map((row, rowIndex) => {
      const obj = {};
      headers.forEach((h, i) => {
        const cellValue = row[i];
        const displayValue = displayValues[rowIndex + 1][i];
        obj[h] = cellValue != null ? formatCellValue(cellValue, displayValue, columnIsDate[i], h) : '';
      });
      return obj;
    });

    return {
      success: true,
      sheetName,
      headers,
      data,
      totalRows: data.length,
      isEmpty: data.length === 0,
      columnIsDate // Include columnIsDate for front-end use
    };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Helper function to determine if a value is likely a number (not a date)
function isLikelyNumeric(value) {
  if (value === null || value === undefined) return false;
  const strValue = String(value).trim();
  const numValue = parseFloat(strValue.replace(/,/g, '')); // Remove commas for parsing
  return !isNaN(numValue) && (strValue.includes('.') || strValue.includes('e') || strValue.replace(/[^0-9]/g, '').length > 0);
}

// Format cell values consistently
function formatCellValue(value, displayValue, isDateColumn, header) {
  if (value === null || value === undefined) return '';

  Logger.log(`Processing: header=${header}, value=${value}, displayValue=${displayValue}, isDateColumn=${isDateColumn}, type=${typeof value}`);

  // Handle financial numbers stored as strings with commas
  if (typeof value === 'string' && value.includes(',')) {
    return displayValue || value.replace(/"/g, ''); // Prefer displayValue to preserve sheet formatting
  }

  // Override date formatting for values with high decimal precision or specific headers (e.g., "Price")
  const isNumericOverride = (typeof value === 'number' && !isNaN(value)) || 
                           (typeof value === 'string' && !isNaN(parseFloat(value.replace(/,/g, ''))) && 
                            (value.includes('.') || value.includes('e')) && 
                            header.toLowerCase().includes('price'));

  if (isNumericOverride) {
    return displayValue || value.toString(); // Preserve as string to avoid precision loss
  }

  // Handle dates only if explicitly identified as a date column and not overridden
  if (isDateColumn && value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }

  // Handle strings that might be dates but aren't explicitly identified as date columns
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2})?$/.test(value)) {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    }
  }

  // Return display value if available, otherwise the original value
  return displayValue || value;
}

// Function to handle CSV uploads
function uploadCSV(csvContent, sheetName) {
  try {
    if (!csvContent || typeof csvContent !== 'string') {
      throw new Error('CSV content must be a non-empty string');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Parse CSV content
    const csvRows = csvContent.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    
    if (csvRows.length === 0) {
      throw new Error('CSV content is empty');
    }

    // Get headers from first row
    const headers = csvRows[0].map(String);
    
    // Get existing data if any
    const existingValues = sheet.getDataRange().getValues();
    const existingHeaders = existingValues.length > 0 ? existingValues[0].map(String) : [];
    
    // If headers don't match, clear the sheet and start fresh
    if (existingHeaders.length > 0 && !arraysEqual(headers, existingHeaders)) {
      sheet.clear();
      existingValues.length = 0;
    }

    // Prepare data for writing
    const dataToWrite = csvRows;
    
    // Write data to sheet
    if (dataToWrite.length > 0) {
      const range = sheet.getRange(1, 1, dataToWrite.length, headers.length);
      range.setValues(dataToWrite);
      
      // Auto-resize columns
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
    }

    return {
      success: true,
      message: `CSV uploaded successfully to ${sheetName}`,
      rowsProcessed: dataToWrite.length,
      columnsProcessed: headers.length
    };

  } catch (error) {
    Logger.log(`Error uploading CSV: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to handle CSV downloads
function downloadCSV(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found`);
    }

    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      throw new Error('Sheet is empty');
    }

    // Convert to CSV format
    const csvContent = data.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    return {
      success: true,
      csvContent: csvContent,
      filename: `${sheetName}.csv`,
      rows: data.length,
      columns: data[0].length
    };

  } catch (error) {
    Logger.log(`Error downloading CSV: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to merge new data with existing data based on key columns
function mergeData(newData, sheetName, keyColumns) {
  try {
    if (!Array.isArray(newData) || newData.length === 0) {
      throw new Error('New data must be a non-empty array');
    }

    if (!Array.isArray(keyColumns) || keyColumns.length === 0) {
      throw new Error('Key columns must be a non-empty array');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Get existing data
    const existingValues = sheet.getDataRange().getValues();
    const existingHeaders = existingValues.length > 0 ? existingValues[0].map(String) : [];
    
    // If no existing data, just write the new data
    if (existingValues.length === 0) {
      const headers = Object.keys(newData[0]);
      const dataToWrite = [headers, ...newData.map(row => headers.map(header => row[header] || ''))];
      
      const range = sheet.getRange(1, 1, dataToWrite.length, headers.length);
      range.setValues(dataToWrite);
      
      // Auto-resize columns
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
      
      return {
        success: true,
        message: 'New sheet created with data',
        rowsProcessed: newData.length
      };
    }

    // Find key column indices in existing data
    const keyIndicesInExistingData = keyColumns.map(key => existingHeaders.indexOf(key));
    if (keyIndicesInExistingData.some(index => index === -1)) {
      throw new Error('Some key columns not found in existing data');
    }

    // Find key column indices in new data
    const newDataHeaders = Object.keys(newData[0]);
    const keyIndicesInNewData = keyColumns.map(key => newDataHeaders.indexOf(key));
    if (keyIndicesInNewData.some(index => index === -1)) {
      throw new Error('Some key columns not found in new data');
    }

    // Process each new row
    let updatedRows = 0;
    let newRows = 0;
    
    for (const newRow of newData) {
      const existingRowIndex = findMatchingRow(newRow, newDataHeaders, keyIndicesInNewData, existingValues, keyIndicesInExistingData);
      
      if (existingRowIndex !== -1) {
        // Update existing row
        const rowData = newDataHeaders.map(header => newRow[header] || '');
        const range = sheet.getRange(existingRowIndex + 1, 1, 1, rowData.length);
        range.setValues([rowData]);
        updatedRows++;
      } else {
        // Add new row
        const rowData = newDataHeaders.map(header => newRow[header] || '');
        sheet.appendRow(rowData);
        newRows++;
      }
    }

    // Auto-resize columns
    for (let i = 1; i <= newDataHeaders.length; i++) {
      sheet.autoResizeColumn(i);
    }

    return {
      success: true,
      message: `Data merged successfully`,
      rowsUpdated: updatedRows,
      rowsAdded: newRows,
      totalProcessed: newData.length
    };

  } catch (error) {
    Logger.log(`Error merging data: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to find matching row in existing data
function findMatchingRow(newRow, newDataHeaders, keyIndicesInNewData, existingValues, keyIndicesInExistingData) {
  for (let i = 1; i < existingValues.length; i++) { // Skip header row
    let isMatch = true;
    
    for (let j = 0; j < keyIndicesInNewData.length; j++) {
      const newKeyIndex = keyIndicesInNewData[j];
      const existingKeyIndex = keyIndicesInExistingData[j];
      
      if (newKeyIndex === -1 || existingKeyIndex === -1) continue;
      
      const existingValue = formatCellValue(existingValues[i][existingKeyIndex], existingValues[i][existingKeyIndex], false, '');
      const newValue = formatCellValue(newRow[newDataHeaders[newKeyIndex]], newRow[newDataHeaders[newKeyIndex]], false, '');
      
      if (existingValue !== newValue) {
        isMatch = false;
        break;
      }
    }
    
    if (isMatch) {
      return i; // Return row index (0-based, including header)
    }
  }
  
  return -1; // No match found
}

// For testing: log all sheet data
function test() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    const res = getSheetData(sheet.getName());
    Logger.log('Sheet: ' + sheet.getName());
    Logger.log('Data: ' + JSON.stringify(res));
  });
}

// Helper function to compare arrays
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}