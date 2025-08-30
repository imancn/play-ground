// =============================================================================
// OTC Wallets Scheduler - Google Apps Script 
// =============================================================================
// Configuration constants - Using global configuration to avoid conflicts
const OTC_CONFIG = {
  BALANCE_SHEET_NAME: "OTC Wallets Balances",
  UPDATE_INTERVAL: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  // Fallback API keys in case environment is not configured
  MORALIS_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjE3NmI0ZjU3LTA4ZmItNGJlMy04NjYyLWRiODU2Y2ViN2E1NyIsIm9yZ0lkIjoiNDY2NzI4IiwidXNlcklkIjoiNDgwMTYxIiwidHlwZUlkIjoiOGMxNGI3YTktMmZlZS00NDVlLWIyZjktZDFmMWQyZjQ3OWQwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTU5MzcwMzksImV4cCI6NDkxMTY5NzAzOX0.OnDYZNw983she_yNBpMtW_CY1muJw13QWrrX6qDjPxg',
  TRON_API_KEY: ''
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

// Contract addresses - Using global configuration to avoid conflicts
const CONTRACT_ADDRESSES = {
  BSC: '0x55d398326f99059fF775485246999027B3197955', // BSC USDT
  ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
  TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // Tron USDT
};

// USDT_CONTRACTS constant for backward compatibility with tests
const USDT_CONTRACTS = CONTRACT_ADDRESSES;

// Network configurations - Using global configuration to avoid conflicts
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
      for (const [key, value] of Object.entries(options.headers)) {
        if (value !== null && value !== undefined) {
          cleanHeaders[key] = value;
        }
      }
      options.headers = cleanHeaders;
    }
    
    const res = UrlFetchApp.fetch(url, options || {});
    return {
      code: (typeof res.getResponseCode === 'function') ? res.getResponseCode() : 0,
      text: (typeof res.getContentText === 'function') ? res.getContentText() : '',
      headers: (typeof res.getAllHeaders === 'function') ? res.getAllHeaders() : {}
    };
  } catch (e) {
    console.log(`HTTP fetch failed for ${url}: ${e}`);
    return { code: -1, text: '', headers: {} };
  }
}

function parseJsonSafe(text, fallback) {
  if (!text || typeof text !== 'string') return fallback;
  try {
    return JSON.parse(text);
  } catch (e) {
    const snippet = text.length > 240 ? (text.slice(0, 200) + `... [len=${text.length}]`) : text;
    console.log(`JSON parse failed: ${e} | snippet: ${snippet}`);
    return fallback;
  }
}

function fetchJson(url, options, fallback) {
  const { code, text } = safeFetchContent(url, options);
  if (code >= 400) {
    console.log(`HTTP ${code} for ${url}`);
  }
  return parseJsonSafe(text, fallback);
}

function sleep(ms) {
  Utilities.sleep(ms);
}

function retryOperation(operation, maxRetries = OTC_CONFIG.MAX_RETRIES) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return operation();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed: ${error.message}`);
      if (i < maxRetries - 1) {
        sleep(OTC_CONFIG.RETRY_DELAY);
      }
    }
  }
  throw new Error(`Operation failed after ${maxRetries} attempts`);
}

// ======= BALANCE FETCHING FUNCTIONS =======
/**
 * Fetch ALL token balances for BSC wallet using Moralis API
 */
function fetchBSCAllBalances(address) {
  try {
    if (!OTC_CONFIG.MORALIS_API_KEY) {
      console.log(`⚠️ BSC balance fetch failed for ${address}: Moralis API key not configured`);
      return { total: 0, tokens: [] };
    }
    
    // Fetch all ERC20 tokens
    const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=bsc`;
    const options = {
      method: 'get',
      headers: {'X-API-Key': OTC_CONFIG.MORALIS_API_KEY},
      muteHttpExceptions: true
    };
    
    const response = fetchJson(url, options, []);
    
    if (Array.isArray(response) && response.length > 0) {
      const tokens = response.map(token => {
        const balance = parseFloat(token.balance || 0) / Math.pow(10, token.decimals || 18);
        return {
          symbol: token.symbol || 'UNKNOWN',
          address: token.token_address,
          balance: balance,
          decimals: token.decimals || 18
        };
      }).filter(token => token.balance > 0);
      
      const total = tokens.reduce((sum, token) => sum + token.balance, 0);
      console.log(`✅ BSC balances fetched for ${address}: ${tokens.length} tokens, Total: ${total.toFixed(2)}`);
      return { total: total, tokens: tokens };
    } else {
      console.log(`ℹ️ BSC balance response empty for ${address} - Wallet may have no tokens`);
      return { total: 0, tokens: [] };
    }
  } catch (error) {
    console.log(`❌ Error fetching BSC balances for ${address}: ${error.message}`);
    return { total: 0, tokens: [] };
  }
}

/**
 * Fetch USDT balance for BSC wallet using Moralis API (for backward compatibility)
 */
function fetchBSCUSDTBalance(address) {
  try {
    if (!OTC_CONFIG.MORALIS_API_KEY) {
      console.log(`⚠️ BSC USDT balance fetch failed for ${address}: Moralis API key not configured`);
      return 0;
    }
    
    // Use the current Moralis API v2.2 endpoint
    const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=bsc&token_addresses=${CONTRACT_ADDRESSES.BSC}`;
    const options = {
      method: 'get',
      headers: {'X-API-Key': OTC_CONFIG.MORALIS_API_KEY},
      muteHttpExceptions: true
    };
    
    const response = fetchJson(url, options, []);
    
    if (Array.isArray(response) && response.length > 0) {
      const usdtToken = response.find(token => 
        token.token_address.toLowerCase() === CONTRACT_ADDRESSES.BSC.toLowerCase()
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
 * Fetch ALL token balances for Ethereum wallet using Moralis API
 */
function fetchETHAllBalances(address) {
  try {
    if (!OTC_CONFIG.MORALIS_API_KEY) {
      console.log(`⚠️ ETH balance fetch failed for ${address}: Moralis API key not configured`);
      return { total: 0, tokens: [] };
    }
    
    // Fetch all ERC20 tokens
    const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=eth`;
    const options = {
      method: 'get',
      headers: {'X-API-Key': OTC_CONFIG.MORALIS_API_KEY},
      muteHttpExceptions: true
    };
    
    const response = fetchJson(url, options, []);
    
    if (Array.isArray(response) && response.length > 0) {
      const tokens = response.map(token => {
        const balance = parseFloat(token.balance || 0) / Math.pow(10, token.decimals || 18);
        return {
          symbol: token.symbol || 'UNKNOWN',
          address: token.token_address,
          balance: balance,
          decimals: token.decimals || 18
        };
      }).filter(token => token.balance > 0);
      
      const total = tokens.reduce((sum, token) => sum + token.balance, 0);
      console.log(`✅ ETH balances fetched for ${address}: ${tokens.length} tokens, Total: ${total.toFixed(2)}`);
      return { total: total, tokens: tokens };
    } else {
      console.log(`ℹ️ ETH balance response empty for ${address} - Wallet may have no tokens`);
      return { total: 0, tokens: [] };
    }
  } catch (error) {
    console.log(`❌ Error fetching ETH balances for ${address}: ${error.message}`);
    return { total: 0, tokens: [] };
  }
}

/**
 * Fetch USDT balance for Ethereum wallet using Moralis API (for backward compatibility)
 */
function fetchETHUSDTBalance(address) {
  try {
    if (!OTC_CONFIG.MORALIS_API_KEY) {
      console.log(`⚠️ ETH USDT balance fetch failed for ${address}: Moralis API key not configured`);
      return 0;
    }
    
    // Use the current Moralis API v2.2 endpoint
    const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=eth&token_addresses=${CONTRACT_ADDRESSES.ETH}`;
    const options = {
      method: 'get',
      headers: {'X-API-Key': OTC_CONFIG.MORALIS_API_KEY},
      muteHttpExceptions: true
    };
    
    const response = fetchJson(url, options, []);
    
    if (Array.isArray(response) && response.length > 0) {
      const usdtToken = response.find(token => 
        token.token_address.toLowerCase() === CONTRACT_ADDRESSES.ETH.toLowerCase()
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
 * Fetch ALL token balances for Tron wallet using Tronscan API
 */
function fetchTRXAllBalances(address) {
  try {
    // Use Tronscan API which is more reliable than TronGrid for TRC20 tokens
    const url = `https://apilist.tronscan.org/api/account?address=${address}`;
    const data = fetchJson(url, { muteHttpExceptions: true }, {});
    
    if (!data || !data.trc20token_balances) {
      console.log(`ℹ️ TRX balance response empty for ${address} - Wallet may have no TRC20 tokens`);
      return { total: 0, tokens: [] };
    }
    
    // Process all TRC20 tokens
    const tokens = data.trc20token_balances.map(token => {
      const balance = typeof token.balance === 'string' ? Number(token.balance) : Number(token.balance || token.tokenBalance || 0);
      const decimals = Number(token.tokenDecimal || token.decimals || 6);
      const finalBalance = balance / Math.pow(10, decimals);
      
      return {
        symbol: token.tokenAbbr || token.symbol || 'UNKNOWN',
        address: token.contract_address,
        balance: finalBalance,
        decimals: decimals
      };
    }).filter(token => token.balance > 0);
    
    const total = tokens.reduce((sum, token) => sum + token.balance, 0);
    console.log(`✅ TRX balances fetched for ${address}: ${tokens.length} tokens, Total: ${total.toFixed(2)}`);
    return { total: total, tokens: tokens };
  } catch (error) {
    console.log(`❌ Error fetching TRX balances for ${address}: ${error.message}`);
    return { total: 0, tokens: [] };
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
      token.contract_address && token.contract_address.toLowerCase() === CONTRACT_ADDRESSES.TRX.toLowerCase()
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
 * Fetch ALL asset balances for a specific wallet type (not just USDT)
 */
function fetchWalletTypeAllBalances(walletType) {
  const balances = {};
  const wallets = WALLET_CONFIG[walletType];
  
  if (!wallets) {
    console.log(`No wallets found for type: ${walletType}`);
    return balances;
  }
  
  // Fetch BSC all balances
  if (wallets.BSC) {
    balances.BSC = retryOperation(() => fetchBSCAllBalances(wallets.BSC));
    console.log(`${walletType} BSC total balance: ${balances.BSC.total.toFixed(2)} (${balances.BSC.tokens.length} tokens)`);
  }
  
  // Fetch ETH all balances
  if (wallets.ETH) {
    balances.ETH = retryOperation(() => fetchETHAllBalances(wallets.ETH));
    console.log(`${walletType} ETH total balance: ${balances.ETH.total.toFixed(2)} (${balances.ETH.tokens.length} tokens)`);
  }
  
  // Fetch TRX all balances
  if (wallets.TRX) {
    balances.TRX = retryOperation(() => fetchTRXAllBalances(wallets.TRX));
    console.log(`${walletType} TRX total balance: ${balances.TRX.total.toFixed(2)} (${balances.TRX.tokens.length} tokens)`);
  }
  
  return balances;
}

/**
 * Fetch all USDT balances for a specific wallet type (for backward compatibility)
 */
function fetchWalletTypeBalances(walletType) {
  const balances = {};
  const wallets = WALLET_CONFIG[walletType];
  
  if (!wallets) {
    console.log(`No wallets found for type: ${walletType}`);
    return balances;
  }
  
  // Fetch BSC balance
  if (wallets.BSC) {
    balances.BSC = retryOperation(() => fetchBSCUSDTBalance(wallets.BSC));
    console.log(`${walletType} BSC USDT balance: ${balances.BSC}`);
  }
  
  // Fetch ETH balance
  if (wallets.ETH) {
    balances.ETH = retryOperation(() => fetchETHUSDTBalance(wallets.ETH));
    console.log(`${walletType} ETH USDT balance: ${balances.ETH}`);
  }
  
  // Fetch TRX balance
  if (wallets.TRX) {
    balances.TRX = retryOperation(() => fetchTRXUSDTBalance(wallets.TRX));
    console.log(`${walletType} TRX USDT balance: ${balances.TRX}`);
  }
  
  return balances;
}

// ======= SHEET MANAGEMENT =======
/**
 * Initialize the OTC Wallets Balances sheet
 */
function initializeOTCBalancesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(OTC_CONFIG.BALANCE_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(OTC_CONFIG.BALANCE_SHEET_NAME);
    
    // Set up headers
    const headers = [
      'Timestamp', 'Wallet Type', 'Network', 'Address', 'Total Balance', 'Token Count', 'Last Updated'
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
 * Update the OTC Wallets Balances sheet with new data
 */
function updateOTCBalancesSheet(balances) {
  const sheet = initializeOTCBalancesSheet();
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  
  // Clear existing data (keep headers)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).clearContent();
  }
  
  const rows = [];
  
  // Process dirty wallet balances
  Object.entries(balances.DIRTY_WALLETS).forEach(([network, balanceData]) => {
    const address = WALLET_CONFIG.DIRTY_WALLETS[network];
    if (address && balanceData && balanceData.total !== undefined) {
      rows.push([
        now,
        'DIRTY',
        network,
        address,
        balanceData.total,
        balanceData.tokens.length,
        now
      ]);
    }
  });
  
  // Process clean wallet balances
  Object.entries(balances.CLEAN_WALLETS).forEach(([network, balanceData]) => {
    const address = WALLET_CONFIG.CLEAN_WALLETS[network];
    if (address && balanceData && balanceData.total !== undefined) {
      rows.push([
        now,
        'CLEAN',
        network,
        address,
        balanceData.total,
        balanceData.tokens.length,
        now
      ]);
    }
  });
  
  // Write data to sheet
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
    
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
 * Main function to run the OTC Wallets balance updater
 */
function run_otc_wallets_updater_impl() {
  try {
    // Initialize configuration
    initializeOTCConfig();
    
    console.log('Starting OTC Wallets balance update...');
    
    // Fetch ALL asset balances for both wallet types (not just USDT)
    const dirtyBalances = fetchWalletTypeAllBalances('DIRTY_WALLETS');
    const cleanBalances = fetchWalletTypeAllBalances('CLEAN_WALLETS');
    const allBalances = {
      DIRTY_WALLETS: dirtyBalances,
      CLEAN_WALLETS: cleanBalances
    };
    
    // Update the sheet
    updateOTCBalancesSheet(allBalances);
    
    // Log summary
    const totalDirty = Object.values(dirtyBalances).reduce((sum, balanceData) => sum + (balanceData.total || 0), 0);
    const totalClean = Object.values(cleanBalances).reduce((sum, balanceData) => sum + (balanceData.total || 0), 0);
    
    console.log('OTC Wallets balance update completed successfully!');
    console.log(`Total DIRTY wallets ALL assets: ${totalDirty.toFixed(2)}`);
    console.log(`Total CLEAN wallets ALL assets: ${totalClean.toFixed(2)}`);
    console.log(`Total combined ALL assets: ${(totalDirty + totalClean).toFixed(2)}`);
    
    return {
      success: true,
      dirtyTotal: totalDirty,
      cleanTotal: totalClean,
      combinedTotal: totalDirty + totalClean,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`Error in OTC Wallets balance updater: ${error.message}`);
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
  console.log('Testing OTC Wallets Scheduler...');
  
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
  console.log('Manual OTC Wallets balance update triggered');
  return run_otc_wallets_updater_impl();
}

/**
 * Get current OTC Wallets balances without updating the sheet
 */
function get_current_otc_balances() {
  try {
    const dirtyBalances = fetchWalletTypeBalances('DIRTY_WALLETS');
    const cleanBalances = fetchWalletTypeBalances('CLEAN_WALLETS');
    
    return {
      dirty: dirtyBalances,
      clean: cleanBalances,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`Error getting current balances: ${error.message}`);
    return null;
  }
}

/**
 * Get current ALL asset balances with detailed breakdown
 */
function get_current_all_asset_balances() {
  try {
    const dirtyBalances = fetchWalletTypeAllBalances('DIRTY_WALLETS');
    const cleanBalances = fetchWalletTypeAllBalances('CLEAN_WALLETS');
    
    return {
      dirty: dirtyBalances,
      clean: cleanBalances,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`Error getting current all asset balances: ${error.message}`);
    return null;
  }
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
    
    console.log('OTC Wallets scheduler trigger set up successfully - will run every 6 hours');
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
        console.log('OTC Wallets scheduler trigger removed');
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
 * Comprehensive diagnostic function to identify balance loading issues
 */
function diagnose_balance_issues() {
  try {
    console.log('🔍 Starting comprehensive balance issue diagnosis...\n');
    
    // Initialize configuration
    console.log('Initializing OTC_CONFIG...');
    initializeOTCConfig();
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      apiKeys: {},
      networkTests: {},
      walletTests: {},
      recommendations: []
    };
    
    // Check API key configuration
    console.log('1. Checking API Key Configuration...');
    diagnosis.apiKeys.moralis = !!OTC_CONFIG.MORALIS_API_KEY;
    diagnosis.apiKeys.tron = !!OTC_CONFIG.TRON_API_KEY;
    
    console.log(` - Moralis API Key: ${diagnosis.apiKeys.moralis ? '✅ Configured' : '❌ NOT CONFIGURED'}`);
    console.log(` - Tron API Key: ${diagnosis.apiKeys.tron ? '✅ Configured' : '❌ NOT CONFIGURED'}`);
    
    if (!diagnosis.apiKeys.moralis) {
      diagnosis.recommendations.push('Moralis API key is required for BSC and ETH balance fetching');
    }
    
    if (!diagnosis.apiKeys.tron) {
      diagnosis.recommendations.push('Tron API key is recommended for better TRX balance fetching');
    }
    
    // Test network connectivity
    console.log('\n2. Testing Network Connectivity...');
    
    // Test BSC connectivity
    try {
      const bscTestUrl = 'https://deep-index.moralis.io/api/v2.2/0x0000000000000000000000000000000000000000/erc20?chain=bsc&token_addresses=0x55d398326f99059fF775485246999027B3197955';
      const bscResponse = UrlFetchApp.fetch(bscTestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': OTC_CONFIG.MORALIS_API_KEY || 'test'
        },
        muteHttpExceptions: true
      });
      
      diagnosis.networkTests.bsc = {
        status: bscResponse.getResponseCode(),
        accessible: bscResponse.getResponseCode() === 200 || bscResponse.getResponseCode() === 401
      };
      
      console.log(` - BSC Network: ${diagnosis.networkTests.bsc.accessible ? '✅ Accessible' : '❌ Not Accessible'} (Status: ${bscResponse.getResponseCode()})`);
    } catch (error) {
      diagnosis.networkTests.bsc = { status: 'ERROR', accessible: false, error: error.message };
      console.log(` - BSC Network: ❌ Error - ${error.message}`);
    }
    
    // Test ETH connectivity
    try {
      const ethTestUrl = 'https://deep-index.moralis.io/api/v2.2/0x0000000000000000000000000000000000000000/erc20?chain=eth&token_addresses=0xdAC17F958D2ee523a2206206994597C13D831ec7';
      const ethResponse = UrlFetchApp.fetch(ethTestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': OTC_CONFIG.MORALIS_API_KEY || 'test'
        },
        muteHttpExceptions: true
      });
      
      diagnosis.networkTests.eth = {
        status: ethResponse.getResponseCode(),
        accessible: ethResponse.getResponseCode() === 200 || ethResponse.getResponseCode() === 401
      };
      
      console.log(` - ETH Network: ${diagnosis.networkTests.eth.accessible ? '✅ Accessible' : '❌ Not Accessible'} (Status: ${ethResponse.getResponseCode()})`);
    } catch (error) {
      diagnosis.networkTests.eth = { status: 'ERROR', accessible: false, error: error.message };
      console.log(` - ETH Network: ❌ Error - ${error.message}`);
    }
    
    // Test TRX connectivity
    try {
      const trxTestUrl = 'https://apilist.tronscan.org/api/account?address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      const trxResponse = UrlFetchApp.fetch(trxTestUrl, {
        method: 'GET',
        muteHttpExceptions: true
      });
      
      diagnosis.networkTests.trx = {
        status: trxResponse.getResponseCode(),
        accessible: trxResponse.getResponseCode() === 200
      };
      
      console.log(` - TRX Network: ${diagnosis.networkTests.trx.accessible ? '✅ Accessible' : '❌ Not Accessible'} (Status: ${trxResponse.getResponseCode()})`);
    } catch (error) {
      diagnosis.networkTests.trx = { status: 'ERROR', accessible: false, error: error.message };
      console.log(` - TRX Network: ❌ Error - ${error.message}`);
    }
    
    // Test individual wallet balance fetching
    console.log('\n3. Testing Individual Wallet Balance Fetching...');
    
    // Test DIRTY BSC wallet
    try {
      const dirtyBscBalance = fetchBSCUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.BSC);
      diagnosis.walletTests.dirtyBsc = {
        address: WALLET_CONFIG.DIRTY_WALLETS.BSC,
        balance: dirtyBscBalance,
        success: dirtyBscBalance !== undefined
      };
      
      console.log(` - DIRTY BSC (${WALLET_CONFIG.DIRTY_WALLETS.BSC}): ${dirtyBscBalance !== undefined ? '✅ Success' : '❌ Failed'} - Balance: ${dirtyBscBalance}`);
    } catch (error) {
      diagnosis.walletTests.dirtyBsc = {
        address: WALLET_CONFIG.DIRTY_WALLETS.BSC,
        error: error.message,
        success: false
      };
      
      console.log(` - DIRTY BSC (${WALLET_CONFIG.DIRTY_WALLETS.BSC}): ❌ Error - ${error.message}`);
    }
    
    // Test DIRTY ETH wallet
    try {
      const dirtyEthBalance = fetchETHUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.ETH);
      diagnosis.walletTests.dirtyEth = {
        address: WALLET_CONFIG.DIRTY_WALLETS.ETH,
        balance: dirtyEthBalance,
        success: dirtyEthBalance !== undefined
      };
      
      console.log(` - DIRTY ETH (${WALLET_CONFIG.DIRTY_WALLETS.ETH}): ${dirtyEthBalance !== undefined ? '✅ Success' : '❌ Failed'} - Balance: ${dirtyEthBalance}`);
    } catch (error) {
      diagnosis.walletTests.dirtyEth = {
        address: WALLET_CONFIG.DIRTY_WALLETS.ETH,
        error: error.message,
        success: false
      };
      
      console.log(` - DIRTY ETH (${WALLET_CONFIG.DIRTY_WALLETS.ETH}): ❌ Error - ${error.message}`);
    }
    
    // Test DIRTY TRX wallet
    try {
      const dirtyTrxBalance = fetchTRXUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.TRX);
      diagnosis.walletTests.dirtyTrx = {
        address: WALLET_CONFIG.DIRTY_WALLETS.TRX,
        balance: dirtyTrxBalance,
        success: dirtyTrxBalance !== undefined
      };
      
      console.log(` - DIRTY TRX (${WALLET_CONFIG.DIRTY_WALLETS.TRX}): ${dirtyTrxBalance !== undefined ? '✅ Success' : '❌ Failed'} - Balance: ${dirtyTrxBalance}`);
    } catch (error) {
      diagnosis.walletTests.dirtyTrx = {
        address: WALLET_CONFIG.DIRTY_WALLETS.TRX,
        error: error.message,
        success: false
      };
      
      console.log(` - DIRTY TRX (${WALLET_CONFIG.DIRTY_WALLETS.TRX}): ❌ Error - ${error.message}`);
    }
    
    // Test CLEAN BSC wallet
    try {
      const cleanBscBalance = fetchBSCUSDTBalance(WALLET_CONFIG.CLEAN_WALLETS.BSC);
      diagnosis.walletTests.cleanBsc = {
        address: WALLET_CONFIG.CLEAN_WALLETS.BSC,
        balance: cleanBscBalance,
        success: cleanBscBalance !== undefined
      };
      
      console.log(` - CLEAN BSC (${WALLET_CONFIG.CLEAN_WALLETS.BSC}): ${cleanBscBalance !== undefined ? '✅ Success' : '❌ Failed'} - Balance: ${cleanBscBalance}`);
    } catch (error) {
      diagnosis.walletTests.cleanBsc = {
        address: WALLET_CONFIG.CLEAN_WALLETS.BSC,
        error: error.message,
        success: false
      };
      
      console.log(` - CLEAN BSC (${WALLET_CONFIG.CLEAN_WALLETS.BSC}): ❌ Error - ${error.message}`);
    }
    
    // Test CLEAN TRX wallet
    try {
      const cleanTrxBalance = fetchTRXUSDTBalance(WALLET_CONFIG.CLEAN_WALLETS.TRX);
      diagnosis.walletTests.cleanTrx = {
        address: WALLET_CONFIG.CLEAN_WALLETS.TRX,
        balance: cleanTrxBalance,
        success: cleanTrxBalance !== undefined
      };
      
      console.log(` - CLEAN TRX (${WALLET_CONFIG.CLEAN_WALLETS.TRX}): ${cleanTrxBalance !== undefined ? '✅ Success' : '❌ Failed'} - Balance: ${cleanTrxBalance}`);
    } catch (error) {
      diagnosis.walletTests.cleanTrx = {
        address: WALLET_CONFIG.CLEAN_WALLETS.TRX,
        error: error.message,
        success: false
      };
      
      console.log(` - CLEAN TRX (${WALLET_CONFIG.CLEAN_WALLETS.TRX}): ❌ Error - ${error.message}`);
    }
    
    // Generate recommendations based on findings
    console.log('\n4. Analysis and Recommendations...');
    
    if (!diagnosis.apiKeys.moralis) {
      diagnosis.recommendations.push('🔑 Moralis API key is required for BSC and ETH balance fetching');
    }
    
    if (!diagnosis.apiKeys.tron) {
      diagnosis.recommendations.push('🔑 Tron API key is recommended for TRX balance fetching');
    }
    
    if (!diagnosis.networkTests.bsc.accessible) {
      diagnosis.recommendations.push('🌐 BSC network is not accessible - Check internet connection and Moralis API status');
    }
    
    if (!diagnosis.networkTests.eth.accessible) {
      diagnosis.recommendations.push('🌐 ETH network is not accessible - Check internet connection and Moralis API status');
    }
    
    if (!diagnosis.networkTests.trx.accessible) {
      diagnosis.recommendations.push('🌐 TRX network is not accessible - Check internet connection and Tronscan API status');
    }
    
    // Check for successful vs failed balance fetches
    const successfulFetches = Object.values(diagnosis.walletTests).filter(test => test.success).length;
    const totalFetches = Object.keys(diagnosis.walletTests).length;
    
    console.log(`\n📊 Summary: ${successfulFetches}/${totalFetches} balance fetches successful`);
    
    if (successfulFetches === 0) {
      diagnosis.recommendations.push('🚨 All balance fetches failed - Check API keys and network connectivity');
    } else if (successfulFetches < totalFetches) {
      diagnosis.recommendations.push('⚠️ Some balance fetches failed - Check individual network issues above');
    }
    
    // Display recommendations
    if (diagnosis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      diagnosis.recommendations.forEach((rec, index) => {
        console.log(` ${index + 1}. ${rec}`);
      });
    } else {
      console.log('\n✅ No issues detected - All systems appear to be working correctly');
    }
    
    console.log('\n🔍 Diagnosis completed!');
    return diagnosis;
  } catch (error) {
    console.error('❌ Diagnosis failed with error:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

/**
 * Test the OTC Wallets scheduler
 */
function test_otc_wallets_scheduler() {
  try {
    console.log('🧪 Testing OTC Wallets Scheduler...');
    
    // Initialize configuration
    initializeOTCConfig();
    
    // Test individual balance fetching functions
    console.log('\n📊 Testing BSC USDT balance fetching...');
    const bscBalance = fetchBSCUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.BSC);
    console.log(`BSC Dirty wallet USDT balance: ${bscBalance}`);
    
    console.log('\n📊 Testing ETH USDT balance fetching...');
    const ethBalance = fetchETHUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.ETH);
    console.log(`ETH Dirty wallet USDT balance: ${ethBalance}`);
    
    console.log('\n📊 Testing TRX USDT balance fetching...');
    const trxBalance = fetchTRXUSDTBalance(WALLET_CONFIG.DIRTY_WALLETS.TRX);
    console.log(`TRX Dirty wallet USDT balance: ${trxBalance}`);
    
    // Test sheet initialization
    console.log('\n📋 Testing sheet initialization...');
    const sheet = initializeOTCBalancesSheet();
    console.log(`Sheet initialized: ${sheet.getName()}`);
    
    // Test wallet type balance fetching
    console.log('\n💰 Testing wallet type balance fetching...');
    const dirtyBalances = fetchWalletTypeBalances('DIRTY_WALLETS');
    const cleanBalances = fetchWalletTypeBalances('CLEAN_WALLETS');
    
    console.log('DIRTY WALLETS balances:', dirtyBalances);
    console.log('CLEAN WALLETS balances:', cleanBalances);
    
    console.log('\n✅ OTC Wallets Scheduler test completed successfully!');
    return true;
  } catch (error) {
    console.log(`❌ OTC Wallets Scheduler test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test the ALL assets scheduler (fetches and sums all tokens, not just USDT)
 */
function test_all_assets_scheduler() {
  try {
    console.log('🧪 Testing ALL Assets Scheduler...');
    
    // Initialize configuration
    initializeOTCConfig();
    
    // Test individual all-balance fetching functions
    console.log('\n📊 Testing BSC ALL balances fetching...');
    const bscAllBalances = fetchBSCAllBalances(WALLET_CONFIG.DIRTY_WALLETS.BSC);
    console.log(`BSC Dirty wallet ALL balances: ${bscAllBalances.total.toFixed(2)} (${bscAllBalances.tokens.length} tokens)`);
    
    console.log('\n📊 Testing ETH ALL balances fetching...');
    const ethAllBalances = fetchETHAllBalances(WALLET_CONFIG.DIRTY_WALLETS.ETH);
    console.log(`ETH Dirty wallet ALL balances: ${ethAllBalances.total.toFixed(2)} (${ethAllBalances.tokens.length} tokens)`);
    
    console.log('\n📊 Testing TRX ALL balances fetching...');
    const trxAllBalances = fetchTRXAllBalances(WALLET_CONFIG.DIRTY_WALLETS.TRX);
    console.log(`TRX Dirty wallet ALL balances: ${trxAllBalances.total.toFixed(2)} (${trxAllBalances.tokens.length} tokens)`);
    
    // Test wallet type all-balance fetching
    console.log('\n💰 Testing wallet type ALL balance fetching...');
    const dirtyAllBalances = fetchWalletTypeAllBalances('DIRTY_WALLETS');
    const cleanAllBalances = fetchWalletTypeAllBalances('CLEAN_WALLETS');
    
    console.log('DIRTY WALLETS ALL balances:', dirtyAllBalances);
    console.log('CLEAN WALLETS ALL balances:', cleanAllBalances);
    
    // Calculate totals
    const totalDirty = Object.values(dirtyAllBalances).reduce((sum, balanceData) => sum + (balanceData.total || 0), 0);
    const totalClean = Object.values(cleanAllBalances).reduce((sum, balanceData) => sum + (balanceData.total || 0), 0);
    
    console.log(`\n📊 Total DIRTY wallets ALL assets: ${totalDirty.toFixed(2)}`);
    console.log(`📊 Total CLEAN wallets ALL assets: ${totalClean.toFixed(2)}`);
    console.log(`📊 Total combined ALL assets: ${(totalDirty + totalClean).toFixed(2)}`);
    
    console.log('\n✅ ALL Assets Scheduler test completed successfully!');
    return true;
  } catch (error) {
    console.log(`❌ ALL Assets Scheduler test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run the OTC Wallets balance updater
 */
function run_otc_wallets_updater() {
  try {
    console.log('🚀 Running OTC Wallets Balance Updater...');
    
    // Initialize configuration
    initializeOTCConfig();
    
    // Run the main updater
    const result = run_otc_wallets_updater_impl();
    
    console.log('✅ OTC Wallets Balance Updater completed!');
    return result;
  } catch (error) {
    console.error('❌ OTC Wallets Balance Updater failed:', error);
    return { success: false, error: error.message, timestamp: new Date().toISOString() };
  }
}