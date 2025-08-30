/**
 * Master Balance Consolidator for BTC-related tokens
 * 
 * This script consolidates balances from all schedulers for BTC, BTCB, and WBTC
 * and merges them into a single 'BTC' balance in the sheets.
 * 
 * Usage:
 * - run_master_balance_consolidator() - Main function to run the consolidation
 * - getConsolidatedBTCBalance() - Get the total consolidated BTC balance
 */

// Token symbol normalizer/aliases for BTC-related tokens
const BTC_TOKEN_ALIASES = {
  'WETH':'ETH', 'WBNB':'BNB', 'WBTC':'BTC', 'BTCB':'BTC'
};

/**
 * Normalize token symbols using aliases
 * @param {string} sym - The symbol to normalize
 * @return {string} Normalized symbol
 */
function normalizeSymbol(sym) {
  if (!sym) return null;
  const s = String(sym).trim().toUpperCase();
  return BTC_TOKEN_ALIASES[s] || s;
}

/**
 * Get balances from KuCoin Scheduler
 * @return {Object} Object with normalized symbol balances
 */
function getKuCoinBalances() {
  try {
    console.log('Fetching KuCoin balances...');
    
    // Check if KuCoinScheduler functions are available
    if (typeof getAllBalancesFromAllAccounts === 'function') {
      const balances = getAllBalancesFromAllAccounts();
      console.log('KuCoin balances fetched:', balances);
      return balances;
    } else {
      console.log('KuCoinScheduler functions not available, skipping...');
      return {};
    }
  } catch (error) {
    console.error('Error fetching KuCoin balances:', error);
    return {};
  }
}

/**
 * Get balances from Cold Wallets Scheduler
 * @return {Object} Object with normalized symbol balances
 */
function getColdWalletBalances() {
  try {
    console.log('Fetching Cold Wallet balances...');
    
    // Check if ColdWalletsScheduler functions are available
    if (typeof run_cold_wallets_balances_updater === 'function') {
      // We need to run the cold wallet updater to get fresh balances
      // This will update the sheet, then we'll read from it
      run_cold_wallets_balances_updater();
      
      // Read the updated balances from the sheet
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cold Wallet Balances');
      if (!sheet) {
        console.log('Cold Wallet Balances sheet not found');
        return {};
      }
      
      const data = sheet.getDataRange().getValues();
      const balances = {};
      
      // Skip header row, process data rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length >= 3) {
          const symbol = row[1]; // Symbol column
          const amount = parseFloat(row[2]) || 0; // Amount column
          if (symbol && amount > 0) {
            const normalizedSymbol = normalizeSymbol(symbol);
            if (!balances[normalizedSymbol]) {
              balances[normalizedSymbol] = 0;
            }
            balances[normalizedSymbol] += amount;
          }
        }
      }
      
      console.log('Cold Wallet balances fetched:', balances);
      return balances;
    } else {
      console.log('ColdWalletsScheduler functions not available, skipping...');
      return {};
    }
  } catch (error) {
    console.error('Error fetching Cold Wallet balances:', error);
    return {};
  }
}

/**
 * Get balances from CMC Price Scheduler (if available)
 * @return {Object} Object with normalized symbol balances
 */
function getCMCPrices() {
  try {
    console.log('Fetching CMC prices...');
    
    // Check if CmcPriceScheduler functions are available
    if (typeof run_cmc_price_updater === 'function') {
      // Run the CMC price updater to get fresh data
      run_cmc_price_updater();
      
      // Read the updated prices from the sheet
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CMC Prices');
      if (!sheet) {
        console.log('CMC Prices sheet not found');
        return {};
      }
      
      const data = sheet.getDataRange().getValues();
      const prices = {};
      
      // Skip header row, process data rows
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length >= 3) {
          const symbol = row[1]; // Symbol column
          const price = parseFloat(row[2]) || 0; // Price column
          if (symbol && price > 0) {
            const normalizedSymbol = normalizeSymbol(symbol);
            prices[normalizedSymbol] = price;
          }
        }
      }
      
      console.log('CMC prices fetched:', prices);
      return prices;
    } else {
      console.log('CmcPriceScheduler functions not available, skipping...');
      return {};
    }
  } catch (error) {
    console.error('Error fetching CMC prices:', error);
    return {};
  }
}

/**
 * Merge balances from multiple sources
 * @param {Array} balanceObjects - Array of balance objects to merge
 * @return {Object} Consolidated balances object
 */
function mergeAllBalances(balanceObjects) {
  const consolidated = {};
  
  balanceObjects.forEach(balances => {
    for (const [symbol, amount] of Object.entries(balances)) {
      const normalizedSymbol = normalizeSymbol(symbol);
      
      if (!consolidated[normalizedSymbol]) {
        consolidated[normalizedSymbol] = 0;
      }
      
      if (typeof amount === 'number' && !isNaN(amount)) {
        consolidated[normalizedSymbol] += amount;
      }
    }
  });
  
  return consolidated;
}

/**
 * Create or update the consolidated balances sheet
 * @param {Object} consolidatedBalances - The consolidated balances object
 * @param {string} sheetName - Name of the sheet to create/update
 */
function createOrUpdateConsolidatedSheet(consolidatedBalances, sheetName = 'Consolidated Balances') {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
      console.log(`Created new sheet: ${sheetName}`);
    }
    
    // Clear existing data
    sheet.clear();
    
    // Set up headers
    const headers = ['Timestamp', 'Symbol', 'Total Balance', 'Source Breakdown'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
    
    // Add data rows
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const dataRows = [];
    
    for (const [symbol, balance] of Object.entries(consolidatedBalances)) {
      if (balance > 0) {
        dataRows.push([timestamp, symbol, balance, 'Consolidated from all schedulers']);
      }
    }
    
    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
    }
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    // Format balance column as number with 8 decimal places
    if (dataRows.length > 0) {
      sheet.getRange(2, 3, dataRows.length, 1).setNumberFormat("#,##0.00000000");
    }
    
    // Sort by symbol
    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).sort([{column: 2, ascending: true}]);
    }
    
    console.log(`Updated sheet: ${sheetName} with ${dataRows.length} rows`);
    
  } catch (error) {
    console.error(`Error updating sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Create a detailed breakdown sheet showing balances from each source
 * @param {Object} sourceBalances - Object containing balances from each source
 * @param {string} sheetName - Name of the breakdown sheet
 */
function createBreakdownSheet(sourceBalances, sheetName = 'Balance Breakdown') {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
      console.log(`Created new breakdown sheet: ${sheetName}`);
    }
    
    // Clear existing data
    sheet.clear();
    
    // Set up headers
    const sources = Object.keys(sourceBalances);
    const headers = ['Symbol', ...sources, 'Total'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#34a853');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
    
    // Get all unique symbols
    const allSymbols = new Set();
    sources.forEach(source => {
      Object.keys(sourceBalances[source]).forEach(symbol => {
        allSymbols.add(normalizeSymbol(symbol));
      });
    });
    
    const sortedSymbols = Array.from(allSymbols).sort();
    const dataRows = [];
    
    // Create data rows
    sortedSymbols.forEach(symbol => {
      const row = [symbol];
      let total = 0;
      
      sources.forEach(source => {
        const sourceBalance = sourceBalances[source][symbol] || 0;
        row.push(sourceBalance);
        total += sourceBalance;
      });
      
      row.push(total);
      dataRows.push(row);
    });
    
    if (dataRows.length > 0) {
      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
    }
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    // Format balance columns as numbers with 8 decimal places
    if (dataRows.length > 0) {
      for (let i = 2; i <= headers.length; i++) {
        sheet.getRange(2, i, dataRows.length, 1).setNumberFormat("#,##0.00000000");
      }
    }
    
    console.log(`Updated breakdown sheet: ${sheetName} with ${dataRows.length} rows`);
    
  } catch (error) {
    console.error(`Error updating breakdown sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Main function to run the balance consolidation
 */
function run_master_balance_consolidator() {
  try {
    console.log('🚀 Starting Master Balance Consolidation...');
    
    // Get balances from all sources
    const kuCoinBalances = getKuCoinBalances();
    const coldWalletBalances = getColdWalletBalances();
    const cmcPrices = getCMCPrices();
    
    // Create source balances object for breakdown
    const sourceBalances = {
      'KuCoin': kuCoinBalances,
      'Cold Wallets': coldWalletBalances,
      'CMC Prices': cmcPrices
    };
    
    // Merge all balances
    const allBalanceObjects = [kuCoinBalances, coldWalletBalances, cmcPrices];
    const consolidatedBalances = mergeAllBalances(allBalanceObjects);
    
    console.log('Consolidated balances:', consolidatedBalances);
    
    // Create/update sheets
    createOrUpdateConsolidatedSheet(consolidatedBalances);
    createBreakdownSheet(sourceBalances);
    
    // Log BTC-related token totals
    const btcTotal = consolidatedBalances['BTC'] || 0;
    const btcbTotal = consolidatedBalances['BTCB'] || 0;
    const wbtcTotal = consolidatedBalances['WBTC'] || 0;
    
    console.log('📊 BTC-related token totals:');
    console.log(`  BTC: ${btcTotal}`);
    console.log(`  BTCB: ${btcbTotal}`);
    console.log(`  WBTC: ${wbtcTotal}`);
    console.log(`  Total consolidated BTC: ${btcTotal + btcbTotal + wbtcTotal}`);
    
    console.log('✅ Master Balance Consolidation completed successfully!');
    
    return consolidatedBalances;
    
  } catch (error) {
    console.error('❌ Error in Master Balance Consolidation:', error);
    throw error;
  }
}

/**
 * Get the total consolidated BTC balance (BTC + BTCB + WBTC)
 * @return {number} Total consolidated BTC balance
 */
function getConsolidatedBTCBalance() {
  try {
    const consolidatedBalances = run_master_balance_consolidator();
    
    const btcTotal = consolidatedBalances['BTC'] || 0;
    const btcbTotal = consolidatedBalances['BTCB'] || 0;
    const wbtcTotal = consolidatedBalances['WBTC'] || 0;
    
    const totalBTC = btcTotal + btcbTotal + wbtcTotal;
    
    console.log(`Total consolidated BTC balance: ${totalBTC}`);
    return totalBTC;
    
  } catch (error) {
    console.error('Error getting consolidated BTC balance:', error);
    return 0;
  }
}

/**
 * Test function to verify the consolidation works
 */
function test_consolidation() {
  try {
    console.log('🧪 Testing Master Balance Consolidation...');
    
    const result = run_master_balance_consolidator();
    console.log('Test completed successfully!');
    console.log('Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}