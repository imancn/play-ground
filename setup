/**
 * Centralized Symbol Management System Setup
 * This file contains all functions needed to manage centralized cryptocurrency symbols
 */

/**
 * Main setup function - run this once to initialize the centralized symbol system
 */
function setup() {
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
 * Check if env tab exists and show its status
 */
function checkEnvTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const envSheet = ss.getSheetByName('env');
  console.log('env tab exists:', !!envSheet);
  if (envSheet) {
    console.log('Rows in env tab:', envSheet.getLastRow());
    console.log('Columns in env tab:', envSheet.getLastColumn());
    console.log('Header value:', envSheet.getRange(1, 1).getValue());
  }
  return !!envSheet;
}

/**
 * Verify symbol list integrity
 */
function verifySymbolList() {
  const symbols = getCentralizedSymbols();
  console.log('Total symbols:', symbols.length);
  console.log('First 5 symbols:', symbols.slice(0, 5));
  console.log('Last 5 symbols:', symbols.slice(-5));
  console.log('Has duplicates:', symbols.length !== new Set(symbols).size);
  return symbols;
}