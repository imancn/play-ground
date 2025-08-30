# Scheduler Format Standardization Guide

## Overview
All three schedulers (CMC Price, KuCoin Balances, and Cold Wallet Balances) now use a **standardized column format** to ensure consistency across your Google Sheets.

## Standardized Column Format
All schedulers now write data using this exact column order:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| **Date** | **Token** | **Price/Balance** |

## Scheduler Details

### 1. CMC Price Scheduler (`CmcPriceScheduler.js`)
- **Sheet Name**: Uses existing sheet or creates new one
- **Columns**: `[Date, Token, Price]`
- **Data Source**: CoinMarketCap API
- **Update Frequency**: Hourly (via `run_cmc_price_updater()`)
- **Sorting**: Automatically sorts by Token, then Date

### 2. KuCoin Balances Scheduler (`KuCoinScheduler.js`)
- **Sheet Name**: "KuCoin Balances" (creates if doesn't exist)
- **Columns**: `[Date, Token, Balance]`
- **Data Source**: KuCoin API (2 accounts)
- **Update Frequency**: Hourly (via `run_ku_coin_balances_updater()`)
- **Sorting**: Automatically sorts by Token, then Date

### 3. Cold Wallet Balances Scheduler (`ColdWalletsScheduler.js`)
- **Sheet Name**: "Cold Wallet Balances"
- **Columns**: `[Date, Token, Balance]`
- **Data Source**: Multiple blockchain APIs (ETH, BSC, BTC, DOGE, TRX, SOL, ADA, TON, XRP)
- **Update Frequency**: Hourly (via `run_cold_wallets_balances_updater()`)
- **Sorting**: Automatically sorts by Token, then Date

## Key Improvements Made

### ✅ Column Order Standardization
- **Before**: Each scheduler had different column orders
- **After**: All schedulers use `[Date, Token, Value]` format

### ✅ Consistent Headers
- All sheets now have proper headers: `["Date", "Token", "Price/Balance"]`
- Headers are automatically bolded for better visibility

### ✅ Automatic Sorting
- All schedulers now automatically sort data by Token (ascending), then Date (descending)
- This ensures tokens stay grouped together and latest data appears first

### ✅ Symbol Consistency
- All three schedulers use the same token symbol list
- Symbol normalization handles common aliases (e.g., WETH → ETH, WBNB → BNB)

## How to Use

### 1. Set Up Triggers
```javascript
// In Google Apps Script, create hourly triggers for each scheduler:
ScriptApp.newTrigger('run_cmc_price_updater')
  .timeBased()
  .everyHours(1)
  .create();

ScriptApp.newTrigger('run_ku_coin_balances_updater')
  .timeBased()
  .everyHours(1)
  .create();

ScriptApp.newTrigger('run_cold_wallets_balances_updater')
  .timeBased()
  .everyHours(1)
  .create();
```

### 2. Manual Updates
```javascript
// Run any scheduler manually:
run_cmc_price_updater();
run_ku_coin_balances_updater();
run_cold_wallets_balances_updater();
```

### 3. Sheet Structure
Each scheduler will create/maintain its sheet with this structure:

```
| Date                | Token | Price/Balance |
|---------------------|-------|---------------|
| 2024-01-15 14:00:00| BTC   | 45000.00     |
| 2024-01-15 14:00:00| ETH   | 2800.50      |
| 2024-01-15 14:00:00| USDT  | 1.00         |
```

## Troubleshooting

### Issue: Cold Wallet Balances Showing Wrong Tokens
**Cause**: Symbol mapping issues when token list changes
**Solution**: The scheduler now automatically handles symbol normalization and maintains consistent ordering

### Issue: Data Not Updating
**Check**: 
1. Verify API keys are valid
2. Check script execution logs
3. Ensure triggers are properly set up

### Issue: Column Order Wrong
**Solution**: All schedulers now use the standardized format. If you see wrong order, run the scheduler again to refresh the data.

## API Requirements

### CMC Price Scheduler
- **API Key**: CoinMarketCap Pro API key required
- **Rate Limit**: Respects API limits with batch processing

### KuCoin Scheduler
- **API Credentials**: Requires API key, secret, and passphrase for each account
- **Rate Limit**: Built-in rate limiting and error handling

### Cold Wallet Scheduler
- **API Keys**: 
  - Moralis API key (for ETH/BSC)
  - Blockfrost API key (for ADA - optional)
- **Public APIs**: Uses public APIs for BTC, DOGE, TRX, SOL, TON, XRP

## Maintenance

### Token List Updates
To add/remove tokens, update the `TOKENS_ORDER` array in all three schedulers to maintain consistency.

### Symbol Aliases
Add new symbol mappings in the `TOKEN_SYMBOL_ALIASES` object in `ColdWalletsScheduler.js` if needed.

### Error Handling
All schedulers include comprehensive error handling and logging. Check the execution logs for any issues.

## Best Practices

1. **Run schedulers during off-peak hours** to avoid API rate limits
2. **Monitor execution logs** for any errors or warnings
3. **Keep API keys secure** and rotate them regularly
4. **Test schedulers manually** before setting up automated triggers
5. **Backup your sheets** before major changes

## Support

If you encounter issues:
1. Check the execution logs in Google Apps Script
2. Verify all API keys and credentials are correct
3. Ensure your Google Sheets have the correct permissions
4. Test each scheduler individually to isolate issues