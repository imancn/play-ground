# BTC Balance Consolidation

This implementation consolidates balances for BTC-related tokens (BTC, BTCB, and WBTC) across all schedulers and writes them into sheets by the 'BTC' symbol name.

## Overview

The system automatically merges balances from the following sources:
- **KuCoin Scheduler**: Exchange balances
- **Cold Wallets Scheduler**: Cold wallet balances across multiple networks
- **CMC Price Scheduler**: Price data (for reference)

All BTC-related tokens (BTC, BTCB, WBTC) are automatically normalized and consolidated into a single 'BTC' balance.

## Key Features

### 1. Automatic Symbol Normalization
- `BTC` → `BTC` (native Bitcoin)
- `BTCB` → `BTC` (Binance-Pegged Bitcoin)
- `WBTC` → `BTC` (Wrapped Bitcoin)

### 2. Balance Consolidation
- Merges balances from all schedulers
- Automatically handles different token representations
- Provides both consolidated and breakdown views

### 3. Sheet Output
- **Consolidated Balances**: Single view with total balances per symbol
- **Balance Breakdown**: Detailed view showing balances from each source

## Files Modified

### 1. `ColdWalletsScheduler.js`
- Added `BTCB` to `TOKEN_SYMBOL_ALIASES`
- Added `getConsolidatedBTCBalance()` function
- Updated `TOKENS_ORDER` array to include `BTCB`

### 2. `KuCoinScheduler.js`
- Added `BTCB` to `TOKEN_SYMBOL_ALIASES`
- Added `normalizeSymbol()` function
- Updated `mergeBalances()` to use symbol normalization
- Added `getConsolidatedBTCBalance()` function
- Updated `CURRENCY_LIST` to include `BTCB`

### 3. `CmcPriceScheduler.js`
- Updated token list to include `BTCB`

### 4. `MasterBalanceConsolidator.js` (New)
- Master script that consolidates balances from all schedulers
- Creates consolidated balance sheets
- Provides detailed breakdown views

## Usage

### Basic Usage

```javascript
// Run the master consolidation
run_master_balance_consolidator();

// Get consolidated BTC balance
getConsolidatedBTCBalance();
```

### Individual Scheduler Functions

```javascript
// KuCoin consolidation
getConsolidatedBTCBalance(); // From KuCoinScheduler.js

// Cold Wallet consolidation  
getConsolidatedBTCBalance(); // From ColdWalletsScheduler.js
```

### Testing

```javascript
// Run all tests
runAllTests();

// Quick function availability check
quickTest();
```

## Sheet Output

### Consolidated Balances Sheet
| Timestamp | Symbol | Total Balance | Source Breakdown |
|-----------|--------|---------------|------------------|
| 2024-01-15 10:00:00 | BTC | 1.23456789 | Consolidated from all schedulers |
| 2024-01-15 10:00:00 | ETH | 5.67890123 | Consolidated from all schedulers |

### Balance Breakdown Sheet
| Symbol | KuCoin | Cold Wallets | CMC Prices | Total |
|--------|--------|---------------|------------|-------|
| BTC | 0.5 | 0.73456789 | 0 | 1.23456789 |
| ETH | 2.5 | 3.17890123 | 0 | 5.67890123 |

## How It Works

### 1. Symbol Normalization
When balances are fetched from any source, the system automatically normalizes BTC-related symbols:
- `BTCB` balances are treated as `BTC`
- `WBTC` balances are treated as `BTC`
- All balances are summed under the `BTC` symbol

### 2. Balance Merging
The `mergeBalances()` function in each scheduler automatically applies symbol normalization:
```javascript
function mergeBalances(target, source) {
  for (const [currency, amount] of Object.entries(source)) {
    const normalizedCurrency = normalizeSymbol(currency);
    
    if (!target[normalizedCurrency]) {
      target[normalizedCurrency] = 0;
    }
    target[normalizedCurrency] += amount;
  }
}
```

### 3. Master Consolidation
The `MasterBalanceConsolidator.js` script:
- Fetches balances from all schedulers
- Applies symbol normalization
- Merges all balances
- Creates formatted output sheets

## Configuration

### Token Aliases
The system uses these aliases for symbol normalization:
```javascript
const TOKEN_SYMBOL_ALIASES = {
  'WETH': 'ETH',
  'WBNB': 'BNB', 
  'WBTC': 'BTC',
  'BTCB': 'BTC'
};
```

### Adding New BTC Variants
To add support for new BTC variants (e.g., `HBTC`, `PBTC`):
1. Add to `TOKEN_SYMBOL_ALIASES` in all schedulers
2. Add to token lists (`CURRENCY_LIST`, `TOKENS_ORDER`)
3. The system will automatically handle normalization

## Error Handling

The system includes comprehensive error handling:
- Graceful fallbacks if individual schedulers fail
- Logging of all operations and errors
- Continues processing even if some sources fail

## Scheduling

### Automatic Updates
- **KuCoin**: Hourly updates via `run_ku_coin_balances_updater()`
- **Cold Wallets**: Hourly updates via `run_cold_wallets_balances_updater()`
- **CMC Prices**: Hourly updates via `run_cmc_price_updater()`

### Manual Updates
- Run `run_master_balance_consolidator()` anytime for fresh consolidation
- Individual scheduler functions can be called independently

## Monitoring

### Console Logs
All operations are logged with emojis for easy identification:
- 🚀 Starting operations
- 📊 Balance information
- ✅ Successful completions
- ❌ Errors
- 🔄 Processing operations

### Sheet Validation
- Automatic column formatting
- Number formatting for balances (8 decimal places)
- Auto-resized columns
- Sorted data for easy reading

## Troubleshooting

### Common Issues

1. **Functions Not Available**
   - Ensure all scheduler files are loaded
   - Check function names match exactly

2. **Sheet Not Found**
   - Verify sheet names match expected values
   - Check if sheets exist in the spreadsheet

3. **Balance Mismatches**
   - Verify symbol normalization is working
   - Check individual scheduler outputs
   - Review console logs for errors

### Debug Functions

```javascript
// Test symbol normalization
testSymbolNormalization();

// Test individual schedulers
testKuCoinBTCConsolidation();
testColdWalletBTCConsolidation();

// Test master consolidator
testMasterConsolidator();
```

## Future Enhancements

### Potential Improvements
- Support for more BTC variants
- Real-time balance updates
- Historical balance tracking
- Balance change notifications
- Multi-currency consolidation (ETH variants, etc.)

### API Integration
- Webhook support for real-time updates
- REST API endpoints for external access
- Database storage for historical data

## Support

For issues or questions:
1. Check console logs for error messages
2. Run test functions to identify problems
3. Verify all scheduler files are properly loaded
4. Check sheet permissions and names

---

**Note**: This implementation ensures that all BTC-related tokens are automatically consolidated, providing a single source of truth for Bitcoin balances across your entire portfolio.