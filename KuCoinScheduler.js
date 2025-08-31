/**
 * Multi-Account KuCoin Balance Fetcher for Google Sheets
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project and paste this code
 * 3. Save and authorize the script
 * 4. In your Google Sheet, use: =KucoinBalance("BTC")
 */

// KuCoin API Configuration
const KUCOIN_BASE_URL = 'https://kucoin.sufrom403.com';

// API Credentials (using inline variables from your file)
const API_CREDENTIALS = {
  account1: {
    apiKey: '68a5f274d12f8b0001f035fc',
    apiSecret: 'bfd14289-e533-4223-b931-5c155eb45b33',
    apiPassphrase: 'w3dLrUJ0XVpE6K'
  },
  account2: {
    apiKey: '68a5ed6354d535000172c30e',
    apiSecret: 'fa72eb3a-a403-4472-badb-dc9cc2e3d575',
    apiPassphrase: 'q@poCkj25l#px27'
  }
};

// Get currencies from centralized symbols list
function getCurrencyList() {
  return getCentralizedSymbols();
}

/**
 * Main function to get balance for a specific currency across all accounts
 * @param {string} currency - The currency symbol (e.g., "BTC", "ETH")
 * @return {number} Total balance across all accounts
 * @customfunction
 */
function KucoinBalance(currency = "BTC") {
  if (!currency) {
    throw new Error('Currency parameter is required');
  }
  
  currency = currency.toString().toUpperCase();
  
  try {
    const balances = getAllBalancesFromAllAccounts();
    console.log(`${currency} balance:`, balances[currency] || 0);
    return balances[currency] || 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return `Error: ${error.message}`;
  }
}

/**
 * Get balances from all KuCoin accounts and sum them up
 * @return {Object} Object with currency symbols as keys and total balances as values
 */
function getAllBalancesFromAllAccounts() {
  console.log('Fetching fresh balances from all KuCoin accounts');
  
  const consolidatedBalances = {};
  
  // Get balances from Account 1
  try {
    console.log('Fetching balances from Account 1...');
    const account1Balances = getBalancesFromAccount(1);
    console.log('Account 1 balances:', account1Balances);
    mergeBalances(consolidatedBalances, account1Balances);
  } catch (error) {
    console.error('Failed to get balances from Account 1:', error.message);
  }
  
  // Get balances from Account 2
  try {
    console.log('Fetching balances from Account 2...');
    const account2Balances = getBalancesFromAccount(2);
    console.log('Account 2 balances:', account2Balances);
    mergeBalances(consolidatedBalances, account2Balances);
  } catch (error) {
    console.error('Failed to get balances from Account 2:', error.message);
  }
  
  console.log('Final consolidated balances:', consolidatedBalances);
  
  return consolidatedBalances;
}

/**
 * Get balances from a specific account (including main account and sub-accounts)
 * @param {number} accountNumber - Account number (1 or 2)
 * @return {Object} Balances object
 */
function getBalancesFromAccount(accountNumber) {
  const balances = {};
  
  // Get main account balances
  const mainBalances = getMainAccountBalances(accountNumber);
  mergeBalances(balances, mainBalances);
  
  // Get all sub-accounts
  const subAccounts = getSubAccounts(accountNumber);
  
  // Get balances for each sub-account
  for (const subAccount of subAccounts) {
    const subBalances = getSubAccountBalances(subAccount.userId, accountNumber);
    mergeBalances(balances, subBalances);
  }
  
  return balances;
}

/**
 * Get main account balances for a specific account
 * @param {number} accountNumber - Account number (1 or 2)
 * @return {Object} Balances object
 */
function getMainAccountBalances(accountNumber) {
  // Try the trading account endpoint first (more permissive)
  try {
    const endpoint = '/api/v1/accounts?type=trade';
    const response = makeKucoinRequest('GET', endpoint, {}, accountNumber);
    
    const balances = {};
    
    if (response.data) {
      for (const account of response.data) {
        if (parseFloat(account.available) > 0 || parseFloat(account.holds) > 0) {
          const currency = account.currency;
          if (!balances[currency]) {
            balances[currency] = 0;
          }
          // Add both available and held balances
          balances[currency] += parseFloat(account.available) + parseFloat(account.holds);
        }
      }
    }
    
    return balances;
  } catch (error) {
    console.error(`Failed to get trading account balances for Account ${accountNumber}, trying main account:`, error.message);
    
    // Fallback to main account endpoint
    try {
      const endpoint = '/api/v1/accounts?type=main';
      const response = makeKucoinRequest('GET', endpoint, {}, accountNumber);
      
      const balances = {};
      
      if (response.data) {
        for (const account of response.data) {
          if (parseFloat(account.available) > 0 || parseFloat(account.holds) > 0) {
            const currency = account.currency;
            if (!balances[currency]) {
              balances[currency] = 0;
            }
            balances[currency] += parseFloat(account.available) + parseFloat(account.holds);
          }
        }
      }
      
      return balances;
    } catch (mainError) {
      console.error(`Failed to get main account balances for Account ${accountNumber}:`, mainError.message);
      return {};
    }
  }
}

/**
 * Get list of sub-accounts for a specific account
 * @param {number} accountNumber - Account number (1 or 2)
 * @return {Array} Array of sub-account objects
 */
function getSubAccounts(accountNumber) {
  try {
    const endpoint = '/api/v1/sub/user';
    const response = makeKucoinRequest('GET', endpoint, {}, accountNumber);
    
    return response.data || [];
  } catch (error) {
    console.warn(`Failed to get sub-accounts for Account ${accountNumber} (may not have permission or no sub-accounts):`, error.message);
    return [];
  }
}

/**
 * Get balances for a specific sub-account
 * @param {string} subUserId - The sub-account user ID
 * @param {number} accountNumber - Account number (1 or 2)
 * @return {Object} Balances object
 */
function getSubAccountBalances(subUserId, accountNumber) {
  try {
    const endpoint = `/api/v1/sub-accounts/${subUserId}`;
    const response = makeKucoinRequest('GET', endpoint, {}, accountNumber);
    
    const balances = {};
    
    if (response.data && response.data.tradeAccounts) {
      for (const account of response.data.tradeAccounts) {
        if (parseFloat(account.balance) > 0) {
          const currency = account.currency;
          if (!balances[currency]) {
            balances[currency] = 0;
          }
          balances[currency] += parseFloat(account.balance);
        }
      }
    }

    if (response.data && response.data.mainAccounts) {
      for (const account of response.data.mainAccounts) {
        if (parseFloat(account.balance) > 0) {
          const currency = account.currency;
          if (!balances[currency]) {
            balances[currency] = 0;
          }
          balances[currency] += parseFloat(account.balance);
        }
      }
    }
    
    return balances;
  } catch (error) {
    console.warn(`Failed to get balances for sub-account ${subUserId} in Account ${accountNumber}:`, error.message);
    return {};
  }
}

/**
 * Merge balances from one object into another
 * @param {Object} target - Target balances object
 * @param {Object} source - Source balances object
 */
function mergeBalances(target, source) {
  for (const [currency, amount] of Object.entries(source)) {
    if (!target[currency]) {
      target[currency] = 0;
    }
    target[currency] += amount;
  }
}

/**
 * Make authenticated request to KuCoin API
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters (optional)
 * @param {number} accountNumber - Account number (1 or 2)
 * @return {Object} API response
 */
function makeKucoinRequest(method, endpoint, params = {}, accountNumber = 1) {
  const accountCreds = API_CREDENTIALS[`account${accountNumber}`];
  
  if (!accountCreds) {
    throw new Error(`No credentials found for Account ${accountNumber}`);
  }
  
  const { apiKey, apiSecret, apiPassphrase } = accountCreds;
  
  console.log(`Debug - Account ${accountNumber} API Key exists:`, !!apiKey);
  console.log(`Debug - Account ${accountNumber} API Secret exists:`, !!apiSecret);
  console.log(`Debug - Account ${accountNumber} API Passphrase exists:`, !!apiPassphrase);
  
  if (!apiKey || !apiSecret || !apiPassphrase) {
    throw new Error(`KuCoin API credentials not found for Account ${accountNumber}`);
  }
  
  const timestamp = Date.now().toString();
  
  // Build query string for GET requests
  let queryString = '';
  if (method === 'GET' && Object.keys(params).length > 0) {
    queryString = '?' + Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }
  
  const fullEndpoint = endpoint + queryString;
  
  // Create signature
  const stringToSign = timestamp + method + fullEndpoint + (method === 'POST' ? JSON.stringify(params) : '');
  const signature = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(stringToSign, apiSecret)
  );
  
  // Encrypt passphrase
  const encryptedPassphrase = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(apiPassphrase, apiSecret)
  );
  
  const options = {
    method: method,
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': encryptedPassphrase,
      'KC-API-KEY-VERSION': '2',
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  if (method === 'POST') {
    options.payload = JSON.stringify(params);
  }
  
  const url = KUCOIN_BASE_URL + fullEndpoint;
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      throw new Error(`HTTP ${responseCode}: ${responseText}`);
    }
    
    const responseData = JSON.parse(responseText);
    
    if (responseData.code !== '200000') {
      throw new Error(`KuCoin API Error (${responseData.code}): ${responseData.msg || 'Unknown error'}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`API Request failed for Account ${accountNumber}:`, error);
    throw new Error(`Failed to fetch data from KuCoin Account ${accountNumber}: ${error.message}`);
  }
}

/**
 * Create or update a sheet with currency balances
 * @param {string} sheetName - Name of the sheet to create/update
 */
function createOrUpdateBalanceSheet(sheetName = "KuCoin") {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    console.log(`Created new sheet: ${sheetName}`);
  }
  
  // Clear existing data
  sheet.clear();
  
  // Set up headers
  const headers = ["Date", "Token", "Balance"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  
  // Get current balances
  const balances = getAllBalancesFromAllAccounts();
  const now = new Date();
  
  // Prepare data
  const data = [];
  for (const currency of getCurrencyList()) {
    const balance = balances[currency] || 0;
    data.push([now, currency, balance]);
  }
  
  // Write data to sheet
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    
    // Format the sheet
    sheet.autoResizeColumns(1, headers.length);
    
    // Format Date column (Column A) as date
    sheet.getRange(2, 1, data.length, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    
    // Format Balance column (Column C) as decimal number with 8 decimal places
    sheet.getRange(2, 3, data.length, 1).setNumberFormat("#,##0.00000000");
    
    // Sort sheet by Token then Date to keep tokens grouped and maintain order
    sheet.getRange(2, 1, data.length, headers.length).sort([{column: 2, ascending: true}, {column: 1, ascending: false}]);
    
    console.log(`Updated ${sheetName} with ${data.length} currencies`);
  }
  
  return `Successfully updated ${sheetName}`;
}

/**
 * Scheduled function to update the balance sheet hourly
 */
function run_ku_coin_balances_updater() {
  console.log("Running scheduled hourly update...");
  try {
    const result = createOrUpdateBalanceSheet();
    console.log(result);
    return result;
  } catch (error) {
    console.error("Error in scheduled update:", error);
    return `Error: ${error.message}`;
  }
}

/**
 * Test function to verify the setup for both accounts
 */
function testAllAccounts() {
  try {
    console.log('Testing connection to all KuCoin accounts...');
    
    // Test Account 1
    try {
      console.log('\n=== Testing Account 1 ===');
      const account1Balances = getBalancesFromAccount(1);
      console.log('Account 1 balances:', account1Balances);
    } catch (error) {
      console.error('Account 1 failed:', error.message);
    }
    
    // Test Account 2
    try {
      console.log('\n=== Testing Account 2 ===');
      const account2Balances = getBalancesFromAccount(2);
      console.log('Account 2 balances:', account2Balances);
    } catch (error) {
      console.error('Account 2 failed:', error.message);
    }
    
    // Test consolidated balances
    console.log('\n=== Testing Consolidated Balances ===');
    const allBalances = getAllBalancesFromAllAccounts();
    console.log('Total consolidated balances:', allBalances);
    
    return allBalances;
  } catch (error) {
    console.error('Test failed:', error.message);
    throw error;
  }
}

/**
 * Get individual account balances (for debugging)
 * @param {number} accountNumber - Account number (1 or 2)
 * @param {string} currency - Currency symbol
 * @return {number} Balance for specific account
 */
function getAccountBalance(accountNumber, currency = "USDT") {
  try {
    const balances = getBalancesFromAccount(accountNumber);
    return balances[currency.toUpperCase()] || 0;
  } catch (error) {
    console.error(`Error fetching balance for Account ${accountNumber}:`, error);
    return 0;
  }
}

/**
 * Test function for quick testing
 */
function test() {
  console.log('BTC Total:', KucoinBalance("BTC"));
  console.log('USDT Total:', KucoinBalance("USDT"));
}

/**
 * Initialize the script - run this once to set up
 */
function initialize() {
  console.log("Initializing KuCoin Balance Tracker...");
  
  // Test API connections
  testAllAccounts();
  
  // Create the balance sheet
  createOrUpdateBalanceSheet();
  
  // Set up the hourly trigger
  setupHourlyTrigger();
  
  console.log("Initialization complete!");
  return "KuCoin Balance Tracker initialized successfully";
}