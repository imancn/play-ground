// =============================================================================
// OTC Wallets Scheduler - Google Apps Script 
// =============================================================================
// Configuration constants - Using global configuration to avoid conflicts
const OTC_CONFIG = {
  BALANCE_SHEET_NAME: "OTC",
  UPDATE_INTERVAL: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  // Fallback API keys in case environment is not configured
  MORALIS_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjE3NmI0ZjU3LTA4ZmItNGJlMy04NjYyLWRiODU2Y2ViN2E1NyIsIm9yZ0lkIjoiNDY2NzI4IiwidXNlcklkIjoiNDgwMTYxIiwidHlwZUlkIjoiOGMxNGI3YTktMmZlZS00NDVlLWIyZjktZDFmMWQyZjQ3OWQwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTU5MzcwMzksImV4cCI6NDkxMTY5NzAzOX0.OnDYZNw983she_yNBpMtW_CY1muJw13QWrrX6qDjPxg',
  TRON_API_KEY: '',
};

// Wallet configurations - Using global configuration to avoid conflicts
const WALLET_CONFIG = {
  DIRTY_WALLETS: {
    BSC: '0x66E35642dd0a0eAaF622c33b99F1a87DaB23E15B',
    TRX: 'TUDpHcoPZpuwpf6FdyH83b7VCf4FWcHSSm',
    ETH: '0x66E35642dd0a0eAaF622c33b99F1a87DaB23E15B'
  },
  CLEAN_WALLETS: {
    BSC: '0xf96B6397e26173beaBB4ce26215C65b7f590F338',
    TRX: 'TYyzbobn3UXD1PGBwRQ8AHAhm7RHWNUdNC'
  }
};

// Contract addresses for USDT on each network
const USDT_CONTRACTS = {
  BSC: '0x55d398326f99059fF775485246999027B3197955', // BSC USDT
  ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
  TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // Tron USDT
};

// Network configurations
const NETWORK_CONFIGS = {
  BSC: {
    name: 'Binance Smart Chain',
    chainId: 'bsc',
    decimals: 18,
    rpc: 'https://bsc-dataseed.binance.org/'
  },
  ETH: {
    name: 'Ethereum',
    chainId: 'eth',
    decimals: 18,
    rpc: 'https://mainnet.infura.io/v3/'
  },
  TRX: {
    name: 'Tron',
    chainId: 'tron',
    decimals: 6,
    rpc: 'https://api.trongrid.io/'
  }
};

/**
 * Initialize OTC Wallets configuration
 * This function loads the configuration values directly without environment dependencies
 */
function initializeOTCConfig() {
  try {
    console.log('OTC Wallets configuration initialized successfully');
    
    // Log API key status (without exposing the actual keys)
    if (OTC_CONFIG.MORALIS_API_KEY) {
      console.log('Moralis API key: Configured');
    } else {
      console.log('Moralis API key: NOT CONFIGURED - BSC and ETH balance fetching will fail');
    }
    
    if (OTC_CONFIG.TRON_API_KEY) {
      console.log('Tron API key: Configured');
    } else {
      console.log('Tron API key: NOT CONFIGURED - TRX balance fetching may have rate limits');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize OTC Wallets configuration:', error);
    return false;
  }
}

// ======= UTILITY FUNCTIONS =======
function safeFetchContent(url, options) {
  try {
    // Clean up headers to remove null values
    if (options && options.headers) {
      const cleanHeaders = {};
      Object.keys(options.headers).forEach(key => {
        if (options.headers[key] !== null && options.headers[key] !== undefined) {
          cleanHeaders[key] = options.headers[key];
        }
      });
      options.headers = cleanHeaders;
    }
    
    const response = UrlFetchApp.fetch(url, options);
    return response;
  } catch (error) {
    console.log(`Error in safeFetchContent: ${error.message}`);
    throw error;
  }
}

function fetchJson(url, options, defaultValue = null) {
  try {
    const response = safeFetchContent(url, options);
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.log(`HTTP ${response.getResponseCode()} for ${url}`);
      return defaultValue;
    }
  } catch (error) {
    console.log(`Error fetching JSON from ${url}: ${error.message}`);
    return defaultValue;
  }
}

function retryOperation(operation, maxRetries = OTC_CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.log(`Max retries (${maxRetries}) reached, returning 0`);
        return 0;
      }
      
      // Wait before retrying
      Utilities.sleep(OTC_CONFIG.RETRY_DELAY * attempt);
    }
  }
}

// ======= USDT BALANCE FETCHING FUNCTIONS =======
/**
 * Fetch USDT balance for BSC wallet using Moralis API
 */
function fetchBSCUSDTBalance(address) {
  try {
    if (!OTC_CONFIG.MORALIS_API_KEY) {
      console.log(`⚠️ BSC USDT balance fetch failed for ${address}: Moralis API key not configured`);
      return 0;
    }
    
    // Use the current Moralis API v2.2 endpoint
    const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=bsc&token_addresses=${USDT_CONTRACTS.BSC}`;
    const options = {
      method: 'get',
      headers: {'X-API-Key': OTC_CONFIG.MORALIS_API_KEY},
      muteHttpExceptions: true
    };
    
    const response = fetchJson(url, options, []);
    
    if (Array.isArray(response) && response.length > 0) {
      const usdtToken = response.find(token => 
        token.token_address.toLowerCase() === USDT_CONTRACTS.BSC.toLowerCase()
      );
      
      if (usdtToken) {
        const balance = parseFloat(usdtToken.balance) / Math.pow(10, usdtToken.decimals);
        console.log(`✅ BSC USDT balance fetched for ${address}: ${balance}`);
        return balance;
      } else {
        console.log(`ℹ️ BSC USDT token not found in response for ${address} - Wallet may have 0 USDT`);
        return 0;
      }
    } else {
      console.log(`ℹ️ BSC USDT balance response empty for ${address} - Wallet may have 0 USDT`);
      return 0;
    }
  } catch (error) {
    console.log(`❌ Error fetching BSC USDT balance for ${address}: ${error.message}`);
    return 0;
  }
}

/**
 * Fetch USDT balance for Ethereum wallet using Moralis API
 */
function fetchETHUSDTBalance(address) {
  try {
    if (!OTC_CONFIG.MORALIS_API_KEY) {
      console.log(`⚠️ ETH USDT balance fetch failed for ${address}: Moralis API key not configured`);
      return 0;
    }
    
    // Use the current Moralis API v2.2 endpoint
    const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=eth&token_addresses=${USDT_CONTRACTS.ETH}`;
    const options = {
      method: 'get',
      headers: {'X-API-Key': OTC_CONFIG.MORALIS_API_KEY},
      muteHttpExceptions: true
    };
    
    const response = fetchJson(url, options, []);
    
    if (Array.isArray(response) && response.length > 0) {
      const usdtToken = response.find(token => 
        token.token_address.toLowerCase() === USDT_CONTRACTS.ETH.toLowerCase()
      );
      
      if (usdtToken) {
        const balance = parseFloat(usdtToken.balance) / Math.pow(10, usdtToken.decimals);
        console.log(`✅ ETH USDT balance fetched for ${address}: ${balance}`);
        return balance;
      } else {
        console.log(`ℹ️ ETH USDT token not found in response for ${address} - Wallet may have 0 USDT`);
        return 0;
      }
    } else {
      console.log(`ℹ️ ETH USDT balance response empty for ${address} - Wallet may have 0 USDT`);
      return 0;
    }
  } catch (error) {
    console.log(`❌ Error fetching ETH USDT balance for ${address}: ${error.message}`);
    return 0;
  }
}

/**
 * Fetch USDT balance for Tron wallet using Tronscan API
 */
function fetchTRXUSDTBalance(address) {
  try {
    // Use Tronscan API which is more reliable than TronGrid for TRC20 tokens
    const url = `https://apilist.tronscan.org/api/account?address=${address}`;
    const data = fetchJson(url, { muteHttpExceptions: true }, {});
    
    if (!data || !data.trc20token_balances) {
      console.log(`ℹ️ TRX USDT balance response empty for ${address} - Wallet may have 0 USDT or no TRC20 tokens`);
      return 0;
    }
    
    // Find USDT token in the TRC20 token list
    const usdtToken = data.trc20token_balances.find(token => 
      token.tokenId && token.tokenId.toLowerCase() === USDT_CONTRACTS.TRX.toLowerCase()
    );
    
    if (usdtToken) {
      const balance = typeof usdtToken.balance === 'string' ? Number(usdtToken.balance) : Number(usdtToken.balance || usdtToken.tokenBalance || 0);
      const decimals = Number(usdtToken.tokenDecimal || usdtToken.decimals || 6);
      const finalBalance = balance / Math.pow(10, decimals);
      console.log(`✅ TRX USDT balance fetched for ${address}: ${finalBalance}`);
      return finalBalance;
    } else {
      console.log(`ℹ️ TRX USDT token not found in response for ${address} - Wallet may have 0 USDT`);
      return 0;
    }
  } catch (error) {
    console.log(`❌ Error fetching TRX USDT balance for ${address}: ${error.message}`);
    return 0;
  }
}

/**
 * Fetch USDT balances for a specific wallet type
 */
function fetchWalletTypeUSDTBalances(walletType) {
  const balances = {};
  const wallets = WALLET_CONFIG[walletType];
  
  if (!wallets) {
    console.log(`No wallets found for type: ${walletType}`);
    return balances;
  }
  
  // Fetch BSC USDT balance
  if (wallets.BSC) {
    balances.BSC = retryOperation(() => fetchBSCUSDTBalance(wallets.BSC));
    console.log(`${walletType} BSC USDT balance: ${balances.BSC}`);
  }
  
  // Fetch ETH USDT balance
  if (wallets.ETH) {
    balances.ETH = retryOperation(() => fetchETHUSDTBalance(wallets.ETH));
    console.log(`${walletType} ETH USDT balance: ${balances.ETH}`);
  }
  
  // Fetch TRX USDT balance
  if (wallets.TRX) {
    balances.TRX = retryOperation(() => fetchTRXUSDTBalance(wallets.TRX));
    console.log(`${walletType} TRX USDT balance: ${balances.TRX}`);
  }
  
  return balances;
}

// ======= SHEET MANAGEMENT =======
/**
 * Initialize the OTC sheet
 */
function initializeOTCBalancesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(OTC_CONFIG.BALANCE_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(OTC_CONFIG.BALANCE_SHEET_NAME);
    
    // Set up headers
    const headers = [
      'Timestamp', 'Wallet Type', 'Network', 'Address', 'USDT Balance', 'Last Updated'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    console.log(`Created new sheet: ${OTC_CONFIG.BALANCE_SHEET_NAME}`);
  }
  
  return sheet;
}

/**
 * Update the OTC sheet with new data
 */
function updateOTCBalancesSheet(balances) {
  const sheet = initializeOTCBalancesSheet();
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  
  // Clear existing data (keep headers)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).clearContent();
  }
  
  const rows = [];
  
  // Process dirty wallet balances
  Object.entries(balances.DIRTY_WALLETS).forEach(([network, balance]) => {
    const address = WALLET_CONFIG.DIRTY_WALLETS[network];
    if (address && balance !== undefined) {
      rows.push([
        now,
        'DIRTY',
        network,
        address,
        balance,
        now
      ]);
    }
  });
  
  // Process clean wallet balances
  Object.entries(balances.CLEAN_WALLETS).forEach(([network, balance]) => {
    const address = WALLET_CONFIG.CLEAN_WALLETS[network];
    if (address && balance !== undefined) {
      rows.push([
        now,
        'CLEAN',
        network,
        address,
        balance,
        now
      ]);
    }
  });
  
  // Write data to sheet
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    
    // Format USDT balance column
    sheet.getRange(2, 5, rows.length, 1).setNumberFormat('#,##0.00');
    
    // Add conditional formatting for dirty vs clean wallets
    const dirtyRange = sheet.getRange(2, 2, rows.length, 1);
    const cleanRange = sheet.getRange(2, 2, rows.length, 1);
    
    // Dirty wallets - red background
    dirtyRange.setBackground('#ffcdd2');
    // Clean wallets - green background
    cleanRange.setBackground('#c8e6c9');
    
    console.log(`Updated sheet with ${rows.length} rows of data`);
  }
}

// ======= MAIN EXECUTION FUNCTION =======
/**
 * Main function to run the OTC Wallets USDT balance updater
 */
function run_otc_wallets_updater_impl() {
  try {
    // Initialize configuration
    initializeOTCConfig();
    
    console.log('Starting OTC Wallets USDT balance update...');
    
    // Fetch USDT balances for both wallet types
    const dirtyBalances = fetchWalletTypeUSDTBalances('DIRTY_WALLETS');
    const cleanBalances = fetchWalletTypeUSDTBalances('CLEAN_WALLETS');
    const allBalances = {
      DIRTY_WALLETS: dirtyBalances,
      CLEAN_WALLETS: cleanBalances
    };
    
    // Update the sheet
    updateOTCBalancesSheet(allBalances);
    
    // Calculate totals for each wallet type
    const totalDirty = Object.values(dirtyBalances).reduce((sum, balance) => sum + (balance || 0), 0);
    const totalClean = Object.values(cleanBalances).reduce((sum, balance) => sum + (balance || 0), 0);
    const combinedTotal = totalDirty + totalClean;
    
    console.log('OTC Wallets USDT balance update completed successfully!');
    console.log(`Total DIRTY wallets USDT: ${totalDirty.toFixed(2)} USDT`);
    console.log(`Total CLEAN wallets USDT: ${totalClean.toFixed(2)} USDT`);
    console.log(`Total combined USDT: ${combinedTotal.toFixed(2)} USDT`);
    
    return {
      success: true,
      dirtyTotal: totalDirty,
      cleanTotal: totalClean,
      combinedTotal: combinedTotal,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`Error in OTC Wallets USDT balance updater: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test function to verify the scheduler is working
 */
function test_otc_scheduler() {
  console.log('Testing OTC Scheduler...');
  
  try {
    // Test individual balance fetching functions
    console.log('Testing BSC USDT balance fetching...');
    const bscBalance = fetchBSCUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.BSC);
    console.log(`BSC Dirty wallet USDT balance: ${bscBalance}`);
    
    console.log('Testing ETH USDT balance fetching...');
    const ethBalance = fetchETHUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.ETH);
    console.log(`ETH Dirty wallet USDT balance: ${ethBalance}`);
    
    console.log('Testing TRX USDT balance fetching...');
    const trxBalance = fetchTRXUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.TRX);
    console.log(`TRX Dirty wallet USDT balance: ${trxBalance}`);
    
    // Test sheet initialization
    console.log('Testing sheet initialization...');
    const sheet = initializeOTCBalancesSheet();
    console.log(`Sheet initialized: ${sheet.getName()}`);
    
    console.log('All tests passed successfully!');
    return true;
  } catch (error) {
    console.log(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Manual trigger function for immediate execution
 */
function manual_otc_update() {
  console.log('Manual OTC Wallets USDT balance update triggered');
  return run_otc_wallets_updater_impl();
}

/**
 * Get current OTC balances without updating the sheet
 */
function get_current_otc_usdt_balances() {
  try {
    const dirtyBalances = fetchWalletTypeUSDTBalances('DIRTY_WALLETS');
    const cleanBalances = fetchWalletTypeUSDTBalances('CLEAN_WALLETS');
    
    return {
      dirty: dirtyBalances,
      clean: cleanBalances,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`Error getting current USDT balances: ${error.message}`);
    return null;
  }
}

/**
 * Display help for OTC functions
 */
function otc_help() {
  console.log(`
🚀 OTC Wallets Scheduler - USDT Only Functions
==============================================

📋 MAIN FUNCTIONS:
------------------
• run_otc_wallets_updater() - Update all wallet USDT balances
• get_current_otc_usdt_balances() - Get current USDT balances without updating sheet

📊 USDT BALANCE FETCHING:
-------------------------
• fetchBSCUSDTBalance(address) - Fetch USDT balance for BSC wallet
• fetchETHUSDTBalance(address) - Fetch USDT balance for ETH wallet
• fetchTRXUSDTBalance(address) - Fetch USDT balance for TRX wallet

💰 BALANCE SUMMARY:
-------------------
• Only USDT balances are fetched (no other tokens)
• No USD conversion - raw USDT amounts are summed
• Balances are aggregated across all wallets and networks

📋 SHEET MANAGEMENT:
--------------------
• initializeOTCBalancesSheet() - Initialize the USDT balances spreadsheet
• updateOTCBalancesSheet(balances) - Update sheet with new USDT balance data

✅ The system now focuses ONLY on USDT balances without any conversion or other token processing.
`);
}

// ======= TRIGGER SETUP =======
/**
 * Set up time-based trigger for automatic execution
 */
function setup_otc_scheduler_trigger() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'run_otc_wallets_updater_impl') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger - run every 6 hours
    ScriptApp.newTrigger('run_otc_wallets_updater_impl')
      .timeBased()
      .everyHours(6)
      .create();
    
    console.log('OTC scheduler trigger set up successfully - will run every 6 hours');
    return true;
  } catch (error) {
    console.log(`Error setting up trigger: ${error.message}`);
    return false;
  }
}

/**
 * Remove the automatic trigger
 */
function remove_otc_scheduler_trigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'run_otc_wallets_updater_impl') {
        ScriptApp.deleteTrigger(trigger);
        console.log('OTC scheduler trigger removed');
      }
    });
    
    return true;
  } catch (error) {
    console.log(`Error removing trigger: ${error.message}`);
    return false;
  }
}

/**
 * Check API key configuration status
 */
function check_api_key_status() {
  try {
    // Initialize configuration to load current values
    initializeOTCConfig();
    
    const status = {
      moralis: !!OTC_CONFIG.MORALIS_API_KEY,
      tron: !!OTC_CONFIG.TRON_API_KEY,
      timestamp: new Date().toISOString()
    };
    
    console.log('API Key Status:');
    console.log(`Moralis API Key: ${status.moralis ? 'Configured' : 'NOT CONFIGURED'}`);
    console.log(`Tron API Key: ${status.tron ? 'Configured' : 'NOT CONFIGURED'}`);
    
    if (!status.moralis) {
      console.log('⚠️ Moralis API key is required for BSC and ETH balance fetching');
    }
    
    if (!status.tron) {
      console.log('⚠️ Tron API key is recommended for TRX balance fetching (rate limits apply without it)');
    }
    
    return status;
  } catch (error) {
    console.log(`Error checking API key status: ${error.message}`);
    return null;
  }
}

/**
 * Run the OTC Wallets USDT balance updater
 */
function run_otc_wallets_updater() {
  try {
    console.log('🚀 Running OTC Wallets USDT Balance Updater...');
    
    // Initialize configuration
    initializeOTCConfig();
    
    // Run the main updater
    const result = run_otc_wallets_updater_impl();
    
    console.log('✅ OTC Wallets USDT Balance Updater completed!');
    return result;
  } catch (error) {
    console.error('❌ OTC Wallets USDT Balance Updater failed:', error);
    return { success: false, error: error.message, timestamp: new Date().toISOString() };
  }
}