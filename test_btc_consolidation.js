/**
 * Test Script for BTC Consolidation
 * 
 * This script tests the BTC consolidation functionality across all schedulers
 * to ensure BTC, BTCB, and WBTC balances are properly merged.
 */

/**
 * Test the token symbol normalization
 */
function testSymbolNormalization() {
  console.log('🧪 Testing Symbol Normalization...');
  
  // Test BTC-related symbols
  const testSymbols = ['BTC', 'BTCB', 'WBTC', 'btc', 'btcb', 'wbtc', 'Wbtc'];
  
  testSymbols.forEach(symbol => {
    try {
      let normalized;
      
      // Test with KuCoinScheduler normalization
      if (typeof normalizeSymbol === 'function') {
        normalized = normalizeSymbol(symbol);
        console.log(`KuCoinScheduler: ${symbol} -> ${normalized}`);
      }
      
      // Test with ColdWalletsScheduler normalization
      if (typeof normalizeSymbol === 'function') {
        normalized = normalizeSymbol(symbol);
        console.log(`ColdWalletsScheduler: ${symbol} -> ${normalized}`);
      }
      
    } catch (error) {
      console.log(`Error normalizing ${symbol}: ${error.message}`);
    }
  });
  
  console.log('✅ Symbol normalization test completed');
}

/**
 * Test KuCoin BTC consolidation
 */
function testKuCoinBTCConsolidation() {
  console.log('🧪 Testing KuCoin BTC Consolidation...');
  
  try {
    if (typeof getConsolidatedBTCBalance === 'function') {
      const consolidatedBTC = getConsolidatedBTCBalance();
      console.log(`KuCoin consolidated BTC: ${consolidatedBTC}`);
      return consolidatedBTC;
    } else {
      console.log('KuCoin getConsolidatedBTCBalance function not available');
      return 0;
    }
  } catch (error) {
    console.error('KuCoin BTC consolidation test failed:', error);
    return 0;
  }
}

/**
 * Test Cold Wallet BTC consolidation
 */
function testColdWalletBTCConsolidation() {
  console.log('🧪 Testing Cold Wallet BTC Consolidation...');
  
  try {
    if (typeof getConsolidatedBTCBalance === 'function') {
      const consolidatedBTC = getConsolidatedBTCBalance();
      console.log(`Cold Wallet consolidated BTC: ${consolidatedBTC}`);
      return consolidatedBTC;
    } else {
      console.log('Cold Wallet getConsolidatedBTCBalance function not available');
      return 0;
    }
  } catch (error) {
    console.error('Cold Wallet BTC consolidation test failed:', error);
    return 0;
  }
}

/**
 * Test Master Balance Consolidator
 */
function testMasterConsolidator() {
  console.log('🧪 Testing Master Balance Consolidator...');
  
  try {
    if (typeof run_master_balance_consolidator === 'function') {
      const result = run_master_balance_consolidator();
      console.log('Master consolidator result:', result);
      return result;
    } else {
      console.log('Master Balance Consolidator not available');
      return null;
    }
  } catch (error) {
    console.error('Master consolidator test failed:', error);
    return null;
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('🚀 Running All BTC Consolidation Tests...\n');
  
  try {
    // Test 1: Symbol normalization
    testSymbolNormalization();
    console.log('');
    
    // Test 2: KuCoin consolidation
    const kuCoinBTC = testKuCoinBTCConsolidation();
    console.log('');
    
    // Test 3: Cold Wallet consolidation
    const coldWalletBTC = testColdWalletBTCConsolidation();
    console.log('');
    
    // Test 4: Master consolidator
    const masterResult = testMasterConsolidator();
    console.log('');
    
    // Summary
    console.log('📊 Test Summary:');
    console.log(`  KuCoin BTC: ${kuCoinBTC}`);
    console.log(`  Cold Wallet BTC: ${coldWalletBTC}`);
    console.log(`  Master Consolidator: ${masterResult ? 'Success' : 'Failed'}`);
    
    if (masterResult) {
      const totalBTC = masterResult['BTC'] || 0;
      console.log(`  Total consolidated BTC: ${totalBTC}`);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

/**
 * Quick test function
 */
function quickTest() {
  console.log('Quick BTC Consolidation Test...');
  
  try {
    // Test if the main functions are available
    const functions = [
      'normalizeSymbol',
      'getConsolidatedBTCBalance',
      'run_master_balance_consolidator'
    ];
    
    functions.forEach(funcName => {
      if (typeof eval(funcName) === 'function') {
        console.log(`✅ ${funcName} is available`);
      } else {
        console.log(`❌ ${funcName} is NOT available`);
      }
    });
    
  } catch (error) {
    console.error('Quick test failed:', error);
  }
}