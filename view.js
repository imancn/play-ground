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
  if (isDateColumn && !isNumericOverride && 
      (value instanceof Date || 
       (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2})?$/.test(value) && 
        !isLikelyNumeric(value) && 
        !isNaN(Date.parse(value))))) {
    return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  }

  // Handle numbers
  if (typeof value === 'number' && !isNaN(value)) {
    return displayValue || value.toString();
  }

  // Handle string numbers or other cases
  if (typeof value === 'string') {
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(numValue) && value.trim() !== '') {
      if (value.includes('.')) {
        return displayValue || value.replace(/"/g, ''); // Preserve decimal strings as-is
      }
      return displayValue || numValue.toString();
    }
  }

  // Return as string for other cases
  return displayValue || String(value);
}

// Get keyword suggestions for a specific column
function getColumnSuggestions(sheetName, columnName, searchTerm = '') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: 'Sheet not found' };
    
    const values = sheet.getDataRange().getValues();
    const displayValues = sheet.getDataRange().getDisplayValues();
    if (values.length === 0) return { success: true, suggestions: [] };
    
    const headers = values[0].map(String);
    const columnIndex = headers.indexOf(columnName);
    if (columnIndex === -1) return { success: false, error: 'Column not found' };

    // Determine if this column contains dates
    const isDateColumn = values.slice(1, Math.min(values.length, 11))
        .every(row => row[columnIndex] instanceof Date || 
                     (typeof row[columnIndex] === 'string' && 
                      /^\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2})?$/.test(row[columnIndex]) && 
                      !isLikelyNumeric(row[columnIndex]) && 
                      !isNaN(Date.parse(row[columnIndex]))));

    // Extract column values and filter by search term
    const columnValues = values.slice(1)
      .map((row, i) => formatCellValue(row[columnIndex], displayValues[i + 1][columnIndex], isDateColumn, columnName))
      .filter(value => value && value.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Count frequency of each value
    const valueCounts = {};
    columnValues.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    // Convert to array and sort by frequency (descending)
    const suggestions = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Limit to top 20
      .map(([value, count]) => ({ value, count }));
    
    return { success: true, suggestions };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function testview(){
  uploadCSVData("test","currency_type,sum\nADA,685.2")
}

function uploadCSVData(sheetName, csvData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if sheet exists, create if not
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      return { success: true, processed: 0, updated: 0, added: 0, message: `Created new sheet: ${sheetName}` };
    }
    
    // Parse CSV data
    const csvRows = Utilities.parseCsv(csvData);
    if (csvRows.length < 2) return { success: false, error: 'CSV contains no data rows' };
    
    const headers = csvRows[0].map(String);
    const dataRows = csvRows.slice(1);
    
    // Get existing data
    const existingValues = sheet.getDataRange().getValues();
    const existingDisplayValues = sheet.getDataRange().getDisplayValues();
    const existingHeaders = existingValues.length > 0 ? existingValues[0].map(String) : [];
    
    // NEW: Ensure all headers from the CSV exist in the target sheet – add any missing columns
    const missingHeaders = headers.filter(h => !existingHeaders.includes(h));
    if (missingHeaders.length > 0 && existingValues.length > 0) {
      // Insert new columns at the end of the existing header row
      const startCol = existingHeaders.length + 1; // 1-based index for Apps Script
      sheet.insertColumnsAfter(existingHeaders.length, missingHeaders.length);
      sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
      // Update local header list so subsequent logic sees the new columns
      existingHeaders.push(...missingHeaders);
    }
    
    // If sheet is empty, add headers first
    if (existingValues.length === 0) {
      sheet.appendRow(headers);
      // Set the second column (sum) to plain text format to persist values as strings
      sheet.getRange(1, 2).setNumberFormat('@');
      // Refresh existing data after adding headers
      const newExistingValues = sheet.getDataRange().getValues();
      const newExistingDisplayValues = sheet.getDataRange().getDisplayValues();
      
      // Append all data rows since there's nothing to update
      dataRows.forEach(row => {
        sheet.appendRow(row);
        // Set the second column (sum) to plain text format for each row
        sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
      });
      
      return { 
        success: true, 
        processed: dataRows.length,
        updated: 0,
        added: dataRows.length,
        message: `Added headers and appended ${dataRows.length} rows to new sheet ${sheetName}`
      };
    }
    
    // Check if first column exists in both datasets
    const firstColumnHeader = headers[0];
    if (!existingHeaders.includes(firstColumnHeader)) {
      return { success: false, error: `First column "${firstColumnHeader}" not found in target sheet headers` };
    }
    
    // Get indices of first column (primary key) in both datasets
    const keyIndexInNewData = 0; // First column is always the key
    const keyIndexInExistingData = existingHeaders.indexOf(firstColumnHeader);
    
    // Determine which columns contain dates
    const columnIsDate = existingHeaders.map((_, colIndex) => {
      const sampleValues = existingValues.slice(1, Math.min(existingValues.length, 11))
          .map(row => row[colIndex]);
      const dateCount = sampleValues.filter(val => 
        val instanceof Date || 
        (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2})?$/.test(val) && 
         !isNaN(Date.parse(val)))
      ).length;
      return dateCount / sampleValues.length > 0.7; // Require 70% of values to be dates
    });

    // Process each row from the CSV
    let updatedCount = 0;
    let addedCount = 0;
    
    for (const newRow of dataRows) {
      // Find matching existing row based on first column (primary key)
      const matchingRowIndex = findMatchingRowByFirstColumn(
        existingValues, 
        newRow, 
        keyIndexInExistingData, 
        keyIndexInNewData
      );
      
      if (matchingRowIndex !== -1) {
        // Update existing row
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          const existingColIndex = existingHeaders.indexOf(header);
          
          if (existingColIndex !== -1 && newRow[i] !== undefined) {
            const formattedValue = formatCellValueForSheet(
              newRow[i], 
              existingDisplayValues[matchingRowIndex][existingColIndex], 
              columnIsDate[existingColIndex]
            );
            sheet.getRange(matchingRowIndex + 1, existingColIndex + 1).setValue(formattedValue);
            // Set the second column (sum) to plain text format
            if (existingColIndex === 1) {
              sheet.getRange(matchingRowIndex + 1, 2).setNumberFormat('@');
            }
          }
        }
        updatedCount++;
      } else {
        // Add new row
        const newRowData = [];
        for (let i = 0; i < existingHeaders.length; i++) {
          const header = existingHeaders[i];
          const newDataIndex = headers.indexOf(header);
          const value = newDataIndex !== -1 ? formatCellValueForSheet(
            newRow[newDataIndex], 
            newRow[newDataIndex], 
            columnIsDate[i]
          ) : '';
          newRowData.push(value);
        }
        sheet.appendRow(newRowData);
        // Set the second column (sum) to plain text format
        sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
        addedCount++;
      }
    }
    
    return { 
      success: true, 
      processed: dataRows.length,
      updated: updatedCount,
      added: addedCount,
      message: `Processed ${dataRows.length} rows: ${updatedCount} updated, ${addedCount} added`
    };
    
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Helper function to find matching row by first column
function findMatchingRowByFirstColumn(existingValues, newRow, keyIndexInExistingData, keyIndexInNewData) {
  const newKeyValue = newRow[keyIndexInNewData];
  
  for (let i = 1; i < existingValues.length; i++) { // Start from 1 to skip header row
    const existingKeyValue = existingValues[i][keyIndexInExistingData];
    
    // Compare values (handle different data types)
    if (String(existingKeyValue) === String(newKeyValue)) {
      return i; // Return row index (0-based, including header)
    }
  }
  
  return -1; // No match found
}

// Format cell value for writing to sheet
function formatCellValueForSheet(value, displayValue, isDateColumn) {
  if (!value) return '';

  // Handle dates
  if (isDateColumn) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Handle financial numbers (strings with commas or high-precision decimals)
  if (typeof value === 'string' && value.includes(',')) {
    // Preserve strings with commas as-is (e.g., "980,698,339,174.07")
    return value.replace(/"/g, ''); // Remove quotes if present
  }

  // Try to parse numbers (only for strings without commas or actual numbers)
  if (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '') {
    // Check if the string has decimal places or is a simple integer
    const numValue = parseFloat(value);
    const strValue = value.trim();
    if (strValue.includes('.') || strValue.includes('e')) {
      // Preserve decimal precision for floats
      return strValue; // Keep as string to avoid precision loss
    }
    return numValue; // Convert to number for integers
  }

  // Handle actual numbers
  if (typeof value === 'number' && !isNaN(value)) {
    return value; // Preserve as number
  }

  // Return as string for other cases
  return String(value);
}

// Helper function to check if value is likely numeric (preserve existing implementation)
function isLikelyNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

// Helper function to find matching row based on key columns
function findMatchingRow(existingData, newRow, keyIndicesInExistingData, keyIndicesInNewData) {
  for (let i = 1; i < existingData.length; i++) { // Start from 1 to skip header
    let isMatch = true;
    
    for (let j = 0; j < keyIndicesInExistingData.length; j++) {
      const existingColIndex = keyIndicesInExistingData[j];
      const newDataColIndex = keyIndicesInNewData[j];
      
      if (existingColIndex === -1 || newDataColIndex === -1) {
        isMatch = false;
        break;
      }
      
      const existingValue = formatCellValue(existingData[i][existingColIndex], existingData[i][existingColIndex], false, '');
      const newValue = formatCellValue(newRow[newDataColIndex], newRow[newDataColIndex], false, '');
      
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

// ======= CENTRALIZED SYMBOL MANAGEMENT =======
/**
 * Get the centralized symbols list from the env tab
 * @return {Array} Array of symbol strings
 */
function getCentralizedSymbols() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const envSheet = ss.getSheetByName('env');
    
    if (!envSheet) {
      // Create the env sheet if it doesn't exist
      return createEnvSheet();
    }
    
    const dataRange = envSheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      // Only header row exists, populate with default symbols
      return populateDefaultSymbols(envSheet);
    }
    
    // Get symbols from the first column (Symbols column)
    const symbols = values.slice(1, values.length).map(row => row[0]).filter(symbol => symbol && symbol.toString().trim() !== '');
    
    if (symbols.length === 0) {
      // No symbols found, populate with default symbols
      return populateDefaultSymbols(envSheet);
    }
    
    return symbols;
  } catch (error) {
    console.error('Error getting centralized symbols:', error);
    // Fallback to default symbols if there's an error
    return getDefaultSymbols();
  }
}

/**
 * Create the env sheet with Symbols column
 * @return {Array} Array of default symbols
 */
function createEnvSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const envSheet = ss.insertSheet('env');
    
    // Set up headers
    envSheet.getRange(1, 1).setValue('Symbols');
    envSheet.getRange(1, 1).setFontWeight('bold');
    
    // Populate with default symbols
    return populateDefaultSymbols(envSheet);
  } catch (error) {
    console.error('Error creating env sheet:', error);
    return getDefaultSymbols();
  }
}

/**
 * Populate the env sheet with default symbols
 * @param {Sheet} envSheet - The env sheet to populate
 * @return {Array} Array of default symbols
 */
function populateDefaultSymbols(envSheet) {
  try {
    const defaultSymbols = getDefaultSymbols();
    
    // Clear existing data (except header)
    if (envSheet.getLastRow() > 1) {
      envSheet.getRange(2, 1, envSheet.getLastRow() - 1, 1).clear();
    }
    
    // Add symbols to the sheet
    if (defaultSymbols.length > 0) {
      const symbolRange = envSheet.getRange(2, 1, defaultSymbols.length, 1);
      symbolRange.setValues(defaultSymbols.map(symbol => [symbol]));
    }
    
    // Auto-resize column
    envSheet.autoResizeColumn(1);
    
    console.log(`Populated env sheet with ${defaultSymbols.length} symbols`);
    return defaultSymbols;
  } catch (error) {
    console.error('Error populating default symbols:', error);
    return getDefaultSymbols();
  }
}

/**
 * Get the default symbols list (consolidated from all schedulers)
 * @return {Array} Array of default symbols
 */
function getDefaultSymbols() {
  return [
    '1INCH','AAVE','ACE','ACH','ACS','ADA','AEG','AERGO','AERO','AFG','AGLD','AIOZ','AITECH','AKT','ALGO','ALICE','AMB','AMP','ANKR','APE','APP','APT','AR','ARB','ARC','ARCA','ARKM','ASTR','ATH','ATOM','AUCTION','AURORA','AURY','AVA','AVAIL','AVAX','AXS','AZERO','BABYDOGE','BAL','BAN','BB','BBL','BCH','BCUT','BICO','BIGTIME','BLAST','BLOCK','BLUR','BNB','BOB','BOBA','BOME','BONK','BRAWL','BRETT','BSV','BTC','BTT','C98','CAKE','CARV','CAS','CAT','CATI','CATS','CELO','CELR','CFG','CFX','CGPT','CHILLGUY','CHZ','CKB','COOKIE','COQ','CPOOL','CRV','CSIX','CSPR','CTA','CTC','CVC','CVX','CXT','CYBER','DAI','DASH','DBR','DCK','DCR','DEEP','DEFI','DEGEN','DEXE','DGB','DMAIL','DOG','DOGE','DOGS','DOT','DRIFT','DYDX','DYM','EDU','EGLD','EGO','EIGEN','ELA','ELON','ENA','ENS','EOS','ERTHA','ETC','ETH','ETHFI','ETHW','EUL','EVER','F','FET','FIDA','FIL','FIRE','FITFI','FLIP','FLOKI','FLOW','FLR','FLUX','FORTH','FOXY','FRED','FTT','G','G3','GALA','GAME','GIGA','GLM','GLMR','GMRX','GMT','GMX','GODS','GRASS','GRT','GST','GTAI','GTC','HBAR','HFT','HIFI','HLG','HMSTR','HNT','HTX','HYPE','ICP','ICX','ID','ILV','IMX','INJ','INSP','IO','IOST','IRL','IRR','IZI','JASMY','JST','JTO','JUP','KAIA','KARATE','KAS','KAVA','KCS','KDA','KMNO','KSM','L3','LADYS','LAI','LAYER','LBR','LDO','LFT','LINK','LL','LMWR','LOOKS','LOOM','LPT','LQTY','LRC','LTC','LUCE','LUNA','LUNC','MAGIC','MAJOR','MAK','MANA','MANTA','MASA','MASK','MAVIA','MDT','ME','MELANIA','MEME','MEMEFI','MERL','MEW','MICHI','MIGGLES','MINA','MKR','MLK','MNT','MOCA','MOG','MON','MOODENG','MORPHO','MOVE','MOVR','MOZ','MPLX','MV','MXM','MYRIA','MYRO','NAKA','NAVX','NEAR','NEIRO','NEIROCTO','NEO','NEON','NFT','NGL','NIBI','NLK','NOT','NOTAI','NRN','NS','NYM','OAS','OBI','OGN','OM','OMNI','ONDO','ONE','OP','ORAI','ORBS','ORDER','ORDI','PAXG','PBUX','PEAQ','PENDLE','PEOPLE','PEPE','PERP','PIP','PIXEL','PNUT','POKT','POL','PONKE','POPCAT','PORTAL','PRCL','PSTAKE','PUFFER','PUMLX','PYTH','PYUSD','QKC','QNT','QORPO','QTUM','RACA','RATS','RAY','RDNT','REEF','REN','RENDER','RIO','RNDR','ROOT','ROSE','RPK','RPL','RSR','RUNE','RVN','S','SAFE','SAND','SAROS','SATS','SCA','SCR','SCRT','SD','SEI','SFP','SFUND','SHIB','SHRAP','SIDUS','SKL','SKY','SLF','SLP','SMILE','SNX','SOCIAL','SOL','SON','SPX','SQD','SQR','SSV','STG','STRAX','STRK','STX','SUI','SUN','SUNDOG','SUPRA','SUSHI','SWEAT','SWELL','SYRUP','TADA','TAIKO','TAO','TAP','TEL','TENET','THETA','TIA','TIME','TNSR','TOKEN','TOKO','TOMI','TON','TOSHI','TRB','TRUMP','TRVL','TRX','TST','TT','TURBO','TURBOS','TWT','ULTI','UMA','UNI','USDC','USDT','USTC','UXLINK','VANRY','VELO','VENOM','VET','VINU','VIRTUAL','VRA','VRTX','W','WAVES','WBTC','WELL','WEMIX','WEN','WIF','WLD','WLKN','WMTX','WOO','X','XAI','XAVA','XCAD','XCH','XCN','XDC','XEC','XEM','XETA','XION','XLM','XMR','XNO','XPR','XR','XRP','XTZ','XYM','YFI','ZBCN','ZEC','ZEN','ZEND','ZEREBRO','ZETA','ZEX','ZIL','ZK','ZKF','ZKJ','ZKL','ZRC','ZRO','ZRX'
  ];
}

/**
 * Update the centralized symbols list
 * @param {Array} newSymbols - Array of new symbols to set
 * @return {boolean} Success status
 */
function updateCentralizedSymbols(newSymbols) {
  try {
    if (!Array.isArray(newSymbols)) {
      throw new Error('newSymbols must be an array');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let envSheet = ss.getSheetByName('env');
    
    if (!envSheet) {
      envSheet = createEnvSheet();
    }
    
    // Clear existing data (except header)
    if (envSheet.getLastRow() > 1) {
      envSheet.getRange(2, 1, envSheet.getLastRow() - 1, 1).clear();
    }
    
    // Add new symbols to the sheet
    if (newSymbols.length > 0) {
      const symbolRange = envSheet.getRange(2, 1, newSymbols.length, 1);
      symbolRange.setValues(newSymbols.map(symbol => [symbol]));
    }
    
    // Auto-resize column
    envSheet.autoResizeColumn(1);
    
    console.log(`Updated centralized symbols list with ${newSymbols.length} symbols`);
    return true;
  } catch (error) {
    console.error('Error updating centralized symbols:', error);
    return false;
  }
}

/**
 * Add a single symbol to the centralized list
 * @param {string} symbol - Symbol to add
 * @return {boolean} Success status
 */
function addSymbolToCentralizedList(symbol) {
  try {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('symbol must be a non-empty string');
    }
    
    const currentSymbols = getCentralizedSymbols();
    const upperSymbol = symbol.toUpperCase().trim();
    
    if (currentSymbols.includes(upperSymbol)) {
      console.log(`Symbol ${upperSymbol} already exists in centralized list`);
      return true;
    }
    
    const newSymbols = [...currentSymbols, upperSymbol];
    return updateCentralizedSymbols(newSymbols);
  } catch (error) {
    console.error('Error adding symbol to centralized list:', error);
    return false;
  }
}

/**
 * Remove a symbol from the centralized list
 * @param {string} symbol - Symbol to remove
 * @return {boolean} Success status
 */
function removeSymbolFromCentralizedList(symbol) {
  try {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('symbol must be a non-empty string');
    }
    
    const currentSymbols = getCentralizedSymbols();
    const upperSymbol = symbol.toUpperCase().trim();
    
    if (!currentSymbols.includes(upperSymbol)) {
      console.log(`Symbol ${upperSymbol} not found in centralized list`);
      return true;
    }
    
    const newSymbols = currentSymbols.filter(s => s !== upperSymbol);
    return updateCentralizedSymbols(newSymbols);
  } catch (error) {
    console.error('Error removing symbol from centralized list:', error);
    return false;
  }
}

/**
 * Initialize the centralized symbol management system
 * This function should be run once to set up the system
 */
function initializeCentralizedSymbols() {
  try {
    console.log('Initializing centralized symbol management system...');
    
    // Get or create the env sheet and populate with default symbols
    const symbols = getCentralizedSymbols();
    
    console.log(`Centralized symbol management system initialized with ${symbols.length} symbols`);
    console.log('Symbols:', symbols.slice(0, 10).join(', ') + (symbols.length > 10 ? '...' : ''));
    
    return {
      success: true,
      symbolCount: symbols.length,
      symbols: symbols
    };
  } catch (error) {
    console.error('Error initializing centralized symbols:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Simple setup function for users to run once
 * This will create the env tab and populate it with the default symbols
 */
function setupCentralizedSymbols() {
  try {
    console.log('🚀 Setting up centralized symbol management system...');
    
    const result = initializeCentralizedSymbols();
    
    if (result.success) {
      console.log('✅ Setup completed successfully!');
      console.log(`📊 Created env tab with ${result.symbolCount} symbols`);
      console.log('🔧 All schedulers will now use the centralized symbol list');
      console.log('');
      console.log('💡 To add/remove symbols, edit the "Symbols" column in the "env" tab');
      console.log('💡 Or use the functions: addSymbolToCentralizedList() and removeSymbolFromCentralizedList()');
    } else {
      console.log('❌ Setup failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Setup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}