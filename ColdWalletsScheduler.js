// ======= CONFIG =======
// Prefer storing keys in Script Properties (Project Settings > Script properties)
const MORALIS_API_KEY = PropertiesService.getScriptProperties().getProperty('MORALIS_API_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjE3NmI0ZjU3LTA4ZmItNGJlMy04NjYyLWRiODU2Y2ViN2E1NyIsIm9yZ0lkIjoiNDY2NzI4IiwidXNlcklkIjoiNDgwMTYxIiwidHlwZUlkIjoiOGMxNGI3YTktMmZlZS00NDVlLWIyZjktZDFmMWQyZjQ3OWQwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTU5MzcwMzksImV4cCI6NDkxMTY5NzAzOX0.OnDYZNw983she_yNBpMtW_CY1muJw13QWrrX6qDjPxg'; // ETH/BSC ERC20
const BLOCKFROST_API_KEY = PropertiesService.getScriptProperties().getProperty('BLOCKFROST_API_KEY') || '';

// Rate limiting and retry configuration
const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  RATE_LIMIT_DELAY: 5000, // 5 seconds for rate limits
  TRON_RATE_LIMIT: 1000, // 1 second between TRX calls
  SOL_RATE_LIMIT: 500, // 0.5 seconds between SOL calls
  XRP_RATE_LIMIT: 2000 // 2 seconds between XRP calls
};

const TOKENS_ORDER = [
  '1INCH','AAVE','ACE','ACH','ACS','ADA','AEG','AERGO','AERO','AFG','AGLD','AIOZ','AITECH','AKT','ALGO','ALICE','AMB','AMP','ANKR','APE','APP','APT','AR','ARB','ARC','ARCA','ARKM','ASTR','ATH','ATOM','AUCTION','AURORA','AURY','AVA','AVAIL','AVAX','AXS','AZERO','BABYDOGE','BAL','BAN','BB','BBL','BCH','BCUT','BICO','BIGTIME','BLAST','BLOCK','BLUR','BNB','BOB','BOBA','BOME','BONK','BRAWL','BRETT','BSV','BTC','BTT','C98','CAKE','CARV','CAS','CAT','CATI','CATS','CELO','CELR','CFG','CFX','CGPT','CHILLGUY','CHZ','CKB','COOKIE','COQ','CPOOL','CRV','CSIX','CSPR','CTA','CTC','CVC','CVX','CXT','CYBER','DAI','DASH','DBR','DCK','DCR','DEEP','DEFI','DEGEN','DEXE','DGB','DMAIL','DOG','DOGE','DOGS','DOT','DRIFT','DYDX','DYM','EDU','EGLD','EGO','EIGEN','ELA','ELON','ENA','ENS','EOS','ERTHA','ETC','ETH','ETHFI','ETHW','EUL','EVER','F','FET','FIDA','FIL','FIRE','FITFI','FLIP','FLOKI','FLOW','FLR','FLUX','FORTH','FOXY','FRED','FTT','G','G3','GALA','GAME','GIGA','GLM','GLMR','GMRX','GMT','GMX','GODS','GRASS','GRT','GST','GTAI','GTC','HBAR','HFT','HIFI','HLG','HMSTR','HNT','HTX','HYPE','ICP','ICX','ID','ILV','IMX','INJ','INSP','IO','IOST','IRL','IRR','IZI','JASMY','JST','JTO','JUP','KAIA','KARATE','KAS','KAVA','KCS','KDA','KMNO','KSM','L3','LADYS','LAI','LAYER','LBR','LDO','LFT','LINK','LL','LMWR','LOOKS','LOOM','LPT','LQTY','LRC','LTC','LUCE','LUNA','LUNC','MAGIC','MAJOR','MAK','MANA','MANTA','MASA','MASK','MAVIA','MDT','ME','MELANIA','MEME','MEMEFI','MERL','MEW','MICHI','MIGGLES','MINA','MKR','MLK','MNT','MOCA','MOG','MON','MOODENG','MORPHO','MOVE','MOVR','MOZ','MPLX','MV','MXM','MYRIA','MYRO','NAKA','NAVX','NEAR','NEIRO','NEIROCTO','NEO','NEON','NFT','NGL','NIBI','NLK','NOT','NOTAI','NRN','NS','NYM','OAS','OBI','OGN','OM','OMNI','ONDO','ONE','OP','ORAI','ORBS','ORDER','ORDI','PAXG','PBUX','PEAQ','PENDLE','PEOPLE','PEPE','PERP','PIP','PIXEL','PNUT','POKT','POL','PONKE','POPCAT','PORTAL','PRCL','PSTAKE','PUFFER','PUMLX','PYTH','PYUSD','QKC','QNT','QORPO','QTUM','RACA','RATS','RAY','RDNT','REEF','REN','RENDER','RIO','RNDR','ROOT','ROSE','RPK','RPL','RSR','RUNE','RVN','S','SAFE','SAND','SAROS','SATS','SCA','SCR','SCRT','SD','SEI','SFP','SFUND','SHIB','SHRAP','SIDUS','SKL','SKY','SLF','SLP','SMILE','SNX','SOCIAL','SOL','SON','SPX','SQD','SQR','SSV','STG','STRAX','STRK','STX','SUI','SUN','SUNDOG','SUPRA','SUSHI','SWEAT','SWELL','SYRUP','TADA','TAIKO','TAO','TAP','TEL','TENET','THETA','TIA','TIME','TNSR','TOKEN','TOKO','TOMI','TON','TOSHI','TRB','TRUMP','TRVL','TRX','TST','TT','TURBO','TURBOS','TWT','ULTI','UMA','UNI','USDC','USDT','USTC','UXLINK','VANRY','VELO','VENOM','VET','VINU','VIRTUAL','VRA','VRTX','W','WAVES','WBTC','WELL','WEMIX','WEN','WIF','WLD','WLKN','WMTX','WOO','X','XAI','XAVA','XCAD','XCH','XCN','XDC','XEC','XEM','XETA','XION','XLM','XMR','XNO','XPR','XR','XRP','XTZ','XYM','YFI','ZBCN','ZEC','ZEN','ZEND','ZEREBRO','ZETA','ZEX','ZIL','ZK','ZKF','ZKJ','ZKL','ZRC','ZRO','ZRX'
];

// ======= YOUR ASSETS =======
const ASSETS = [
  {network:'BTC', address:'bc1qa8rcar95yywvl4rwae9mrpdgujhx0h69ape6qx'},
  {network:'ETH', address:'0xD2af460ae92ECc32003826BB2743aA551ABD5117'},
  {network:'ETH', address:'?'}, // skip dirty ETH
  {network:'TRX', address:'TWQnCyNCdJ1FB8n2GotATtswavip2FBKNN'},
  {network:'TRX', address:'TCyp8KwPJSZzhhLWbyD8ydRv5kf1U7cJvA'},
  {network:'BSC', address:'0xD2af460ae92ECc32003826BB2743aA551ABD5117'},
  {network:'BSC', address:'0xBB1Fd425Dee791A9E989bAbAA24f4eABAaD49d22'},
  {network:'TON', address:'UQAKHKbQc6iXXZ51c3G-AJcGvYma8y5CbbrkvZ5UcsPp8sAD'},
  {network:'SOL', address:'DXow5PZ1MDRZXQoxa293bVCb3fdhboDDPgvz5LHKnHrw'},
  {network:'ADA', address:'addr1q9wll4kzv8ll88yaut9taxt5ey7cd5qk7x8wzql7exs2teznruj9s4am8kfsh39czasfzjat9eqp3uc2u2ct4l6vr23qpdmgjd'},
  {network:'XRP', address:'rsNaMj99sgRJcp2knBpybE14FxvjQBwomL'},
  {network:'DOGE', address:'DTeX9YBqnBR8SLYrDGkURApRft5kP8eDeT'}
];

// ======= DECIMALS (native) =======
const DECIMALS = {
  'BTC': 8, 'DOGE': 8, 'ETH': 18, 'BSC': 18,
  'TRX': 6, 'SOL': 9, 'ADA': 6, 'TON': 9, 'XRP': 6
};

// Map network -> native token symbol used in sheet
const NATIVE_SYMBOLS_BY_NETWORK = {
  BTC: 'BTC', DOGE: 'DOGE', ETH: 'ETH', BSC: 'BNB',
  TRX: 'TRX', SOL: 'SOL', ADA: 'ADA', TON: 'TON', XRP: 'XRP'
};

// Token symbol normalizer/aliases
const TOKEN_SYMBOL_ALIASES = {
  'WETH':'ETH', 'WBNB':'BNB', 'WBTC':'BTC'
};
function normalizeSymbol(sym) {
  if (!sym) return null;
  const s = String(sym).trim().toUpperCase();
  return TOKEN_SYMBOL_ALIASES[s] || s;
}

// ======= SAFE FETCH / JSON HELPERS =======
function safeFetchContent(url, options) {
  try {
    const res = UrlFetchApp.fetch(url, options || {});
    return {
      code: (typeof res.getResponseCode === 'function') ? res.getResponseCode() : 0,
      text: (typeof res.getContentText === 'function') ? res.getContentText() : '',
      headers: (typeof res.getAllHeaders === 'function') ? res.getAllHeaders() : {}
    };
  } catch (e) {
    Logger.log(`HTTP fetch failed for ${url}: ${e}`);
    return { code: -1, text: '', headers: {} };
  }
}

function parseJsonSafe(text, fallback) {
  if (!text || typeof text !== 'string') return fallback;
  try {
    return JSON.parse(text);
  } catch (e) {
    const snippet = text.length > 240 ? (text.slice(0, 200) + ` ... [len=${text.length}]`) : text;
    Logger.log(`JSON parse failed: ${e} | snippet: ${snippet}`);
    return fallback;
  }
}

function fetchJson(url, options, fallback) {
  const { code, text } = safeFetchContent(url, options);
  if (code >= 400) {
    Logger.log(`HTTP ${code} for ${url}`);
  }
  return parseJsonSafe(text, fallback);
}

// Enhanced fetch with retry and rate limiting
function fetchJsonWithRetry(url, options, fallback, retries = API_CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { code, text } = safeFetchContent(url, options);
      
      // Handle rate limiting
      if (code === 429) {
        Logger.log(`Rate limited (429) for ${url}, attempt ${attempt}/${retries}`);
        if (attempt < retries) {
          Utilities.sleep(API_CONFIG.RATE_LIMIT_DELAY);
          continue;
        }
      }
      
      // Handle other HTTP errors
      if (code >= 400 && code !== 429) {
        Logger.log(`HTTP ${code} for ${url}, attempt ${attempt}/${retries}`);
        if (attempt < retries) {
          Utilities.sleep(API_CONFIG.RETRY_DELAY);
          continue;
        }
      }
      
      return parseJsonSafe(text, fallback);
    } catch (error) {
      Logger.log(`Fetch attempt ${attempt} failed for ${url}: ${error.message}`);
      if (attempt < retries) {
        Utilities.sleep(API_CONFIG.RETRY_DELAY);
      }
    }
  }
  
  Logger.log(`All ${retries} attempts failed for ${url}`);
  return fallback;
}

// Rate limiting helper
function rateLimit(delay) {
  if (delay && delay > 0) {
    Utilities.sleep(delay);
  }
}

// ======= MAIN =======
function run_cold_wallets_balances_updater() {
  try {
    Logger.log("🚀 Starting Cold Wallets Balance Update...");
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cold Wallet Balances');
    if(!sheet) {
      throw new Error('Sheet "Cold Wallet Balances" not found!');
    }

    const balances = {};
    const add = (symbol, amount) => {
      if (!symbol || !isFinite(amount)) return;
      const key = normalizeSymbol(symbol);
      if (!key) return;
      balances[key] = (balances[key] || 0) + Number(amount);
    };

    Logger.log(`📋 Processing ${ASSETS.length} assets...`);

    ASSETS.forEach((asset, index) => {
      if (!asset.address || asset.address === '?') {
        Logger.log(`⏭️ Skipping asset ${index + 1}: ${asset.network} (no address)`);
        return;
      }
      
      const net = asset.network.toUpperCase();
      Logger.log(`🔍 Processing ${net} asset ${index + 1}/${ASSETS.length}: ${asset.address}`);
      
      try {
        switch(net) {
          case 'ETH':
          case 'BSC': {
            const chain = net.toLowerCase();
            Logger.log(`  📊 Fetching ${net} native balance...`);
            add(NATIVE_SYMBOLS_BY_NETWORK[net], cold_fetchEvmNative(asset.address, chain, net));
            
            Logger.log(`  🪙 Fetching ${net} tokens...`);
            const tokens = cold_fetchEvmTokens(asset.address, chain);
            tokens.forEach(t => add(t.symbol, t.amount));
            break;
          }
          case 'BTC':
            Logger.log(`  📊 Fetching BTC balance...`);
            add('BTC', cold_fetchBTC(asset.address));
            break;
          case 'DOGE':
            Logger.log(`  📊 Fetching DOGE balance...`);
            add('DOGE', cold_fetchDOGE(asset.address));
            break;
          case 'TRX': {
            Logger.log(`  📊 Fetching TRX native balance...`);
            add('TRX', cold_fetchTRX(asset.address));
            
            Logger.log(`  🪙 Fetching TRX tokens...`);
            const tokens = cold_fetchTRXTokens(asset.address);
            tokens.forEach(t => add(t.symbol, t.amount));
            break;
          }
          case 'SOL': {
            Logger.log(`  📊 Fetching SOL native balance...`);
            add('SOL', cold_fetchSOL(asset.address));
            
            Logger.log(`  🪙 Fetching SOL tokens...`);
            const tokens = cold_fetchSOLTokens(asset.address);
            tokens.forEach(t => add(t.symbol, t.amount));
            break;
          }
          case 'ADA': {
            Logger.log(`  📊 Fetching ADA native balance...`);
            add('ADA', cold_fetchADA(asset.address));
            if (BLOCKFROST_API_KEY) {
              Logger.log(`  🪙 Fetching ADA tokens...`);
              const tokens = cold_fetchADATokens(asset.address);
              tokens.forEach(t => add(t.symbol, t.amount));
            }
            break;
          }
          case 'TON': {
            Logger.log(`  📊 Fetching TON native balance...`);
            add('TON', cold_fetchTON(asset.address));
            
            Logger.log(`  🪙 Fetching TON Jettons...`);
            const tokens = cold_fetchTONJettons(asset.address);
            tokens.forEach(t => add(t.symbol, t.amount));
            break;
          }
          case 'XRP': {
            Logger.log(`  📊 Fetching XRP native balance and tokens...`);
            const tokens = cold_fetchXRPAll(asset.address);
            tokens.forEach(t => add(t.symbol, t.amount));
            break;
          }
          default:
            Logger.log(`⚠️ Unknown network: ${net}`);
        }
      } catch (e) {
        Logger.log(`❌ Error fetching ${net} for ${asset.address}: ${e.message}`);
      }
      
      Logger.log(`✅ Completed ${net} asset ${index + 1}/${ASSETS.length}`);
    });

    Logger.log(`📊 Total balances collected: ${Object.keys(balances).length} tokens`);

    // Write to sheet
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    // Pre-fill ordered tokens
    const inOrder = TOKENS_ORDER.map(tok => [now, tok, Number(balances[tok] || 0)]);

    // Append any extra discovered tokens not present in TOKENS_ORDER
    const extras = Object.keys(balances)
      .filter(k => !TOKENS_ORDER.includes(k))
      .sort()
      .map(tok => [now, tok, Number(balances[tok] || 0)]);

    const rows = inOrder.concat(extras);

    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 3).setValues([["Date", "Token", "Balance"]]);
      sheet.getRange(1, 1, 1, 3).setFontWeight("bold");
    }
    
    if(sheet.getLastRow() > 1) {
      sheet.getRange(2,1,sheet.getLastRow()-1,3).clearContent();
    }
    if (rows.length) {
      sheet.getRange(2,1,rows.length,3).setValues(rows);
    }
    
    // Sort sheet by Token then Date to keep tokens grouped and maintain order
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 3).sort([{column: 2, ascending: true}, {column: 1, ascending: false}]);
    }
    
    Logger.log("✅ Balances (native + tokens) updated successfully!");
    Logger.log(`📈 Updated ${rows.length} token balances in sheet`);
    
  } catch (error) {
    Logger.log(`❌ Critical error in balance update: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
    throw error;
  }
}

// ======= FETCHERS =======

// EVM native via Moralis
function cold_fetchEvmNative(address, chain, net) {
  try {
    // Validate address format
    if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length !== 42) {
      Logger.log(`Invalid EVM address format: ${address}`);
      return 0;
    }
    
    const url = `https://deep-index.moralis.io/api/v2/${address}/balance?chain=${chain}`;
    const options = { method:'get', headers:{'X-API-Key': MORALIS_API_KEY}, muteHttpExceptions:true };
    const resp = fetchJsonWithRetry(url, options, {});
    
    if (!resp || typeof resp.balance === 'undefined') {
      Logger.log(`Invalid EVM response for ${address}: ${JSON.stringify(resp)}`);
      return 0;
    }
    
    const raw = Number(resp.balance || 0);
    if (isNaN(raw)) {
      Logger.log(`Invalid EVM balance for ${address}: ${resp.balance}`);
      return 0;
    }
    
    const result = raw / Math.pow(10, DECIMALS[net]);
    Logger.log(`${net} balance for ${address}: ${result}`);
    
    return result;
  } catch (error) {
    Logger.log(`Error fetching ${net} for ${address}: ${error.message}`);
    return 0;
  }
}

// EVM tokens via Moralis
function cold_fetchEvmTokens(address, chain) {
  try {
    // Validate address format
    if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length !== 42) {
      Logger.log(`Invalid EVM address for tokens: ${address}`);
      return [];
    }
    
    const url = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${chain}`;
    const options = { method:'get', headers:{'X-API-Key': MORALIS_API_KEY}, muteHttpExceptions:true };
    const data = fetchJsonWithRetry(url, options, []);
    
    if (!Array.isArray(data)) {
      Logger.log(`Invalid EVM token data for ${address}: ${JSON.stringify(data)}`);
      return [];
    }
    
    const tokens = data
      .map(t => {
        try {
          const decimals = Number(t.decimals || 0);
          const sym = normalizeSymbol(t.symbol);
          const amt = Number(t.balance || 0) / Math.pow(10, decimals);
          return { symbol: sym, amount: amt };
        } catch (e) {
          Logger.log(`Error processing EVM token: ${e.message}`);
          return null;
        }
      })
      .filter(t => t && t.symbol && t.amount > 0);
    
    Logger.log(`Found ${tokens.length} EVM tokens for ${address}`);
    return tokens;
  } catch (error) {
    Logger.log(`Error fetching EVM tokens for ${address}: ${error.message}`);
    return [];
  }
}

// BTC via BlockCypher (public)
function cold_fetchBTC(address) {
  try {
    // Validate BTC address format
    if (!address || typeof address !== 'string' || address.length < 26 || address.length > 35) {
      Logger.log(`Invalid BTC address format: ${address}`);
      return 0;
    }
    
    const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`;
    const resp = fetchJsonWithRetry(url, {muteHttpExceptions:true}, {});
    
    if (!resp || typeof resp.final_balance === 'undefined') {
      Logger.log(`Invalid BTC response for ${address}: ${JSON.stringify(resp)}`);
      return 0;
    }
    
    const balance = Number(resp.final_balance || 0);
    if (isNaN(balance)) {
      Logger.log(`Invalid BTC balance for ${address}: ${resp.final_balance}`);
      return 0;
    }
    
    const result = balance / Math.pow(10, DECIMALS['BTC']);
    Logger.log(`BTC balance for ${address}: ${result}`);
    
    return result;
  } catch (error) {
    Logger.log(`Error fetching BTC for ${address}: ${error.message}`);
    return 0;
  }
}

// DOGE via BlockCypher (public)
function cold_fetchDOGE(address) {
  try {
    // Validate DOGE address format
    if (!address || typeof address !== 'string' || address.length < 26 || address.length > 35) {
      Logger.log(`Invalid DOGE address format: ${address}`);
      return 0;
    }
    
    const url = `https://api.blockcypher.com/v1/doge/main/addrs/${address}/balance`;
    const resp = fetchJsonWithRetry(url, {muteHttpExceptions:true}, {});
    
    if (!resp || typeof resp.final_balance === 'undefined') {
      Logger.log(`Invalid DOGE response for ${address}: ${JSON.stringify(resp)}`);
      return 0;
    }
    
    const balance = Number(resp.final_balance || 0);
    if (isNaN(balance)) {
      Logger.log(`Invalid DOGE balance for ${address}: ${resp.final_balance}`);
      return 0;
    }
    
    const result = balance / Math.pow(10, DECIMALS['DOGE']);
    Logger.log(`DOGE balance for ${address}: ${result}`);
    
    return result;
  } catch (error) {
    Logger.log(`Error fetching DOGE for ${address}: ${error.message}`);
    return 0;
  }
}

// TRX native via Tronscan
function cold_fetchTRX(address) {
  try {
    // Validate address format
    if (!address || typeof address !== 'string' || address.length < 10) {
      Logger.log(`Invalid TRX address: ${address}`);
      return 0;
    }
    
    const url = `https://apilist.tronscan.org/api/account?address=${address}`;
    const resp = fetchJsonWithRetry(url, {muteHttpExceptions:true}, {});
    
    if (!resp || typeof resp.balance === 'undefined') {
      Logger.log(`Invalid TRX response for ${address}: ${JSON.stringify(resp)}`);
      return 0;
    }
    
    const raw = Number(resp.balance || 0);
    if (isNaN(raw)) {
      Logger.log(`Invalid TRX balance for ${address}: ${resp.balance}`);
      return 0;
    }
    
    const result = raw / Math.pow(10, DECIMALS['TRX']);
    Logger.log(`TRX balance for ${address}: ${result}`);
    
    // Rate limit between TRX calls
    rateLimit(API_CONFIG.TRON_RATE_LIMIT);
    
    return result;
  } catch (error) {
    Logger.log(`Error fetching TRX for ${address}: ${error.message}`);
    return 0;
  }
}

// TRX tokens (TRC20) via Tronscan
function cold_fetchTRXTokens(address) {
  try {
    // Validate address format
    if (!address || typeof address !== 'string' || address.length < 10) {
      Logger.log(`Invalid TRX address for tokens: ${address}`);
      return [];
    }
    
    const url = `https://apilist.tronscan.org/api/account?address=${address}`;
    const data = fetchJsonWithRetry(url, {muteHttpExceptions:true}, {});
    
    if (!data) {
      Logger.log(`No TRX token data for ${address}`);
      return [];
    }
    
    const list = (data.trc20token_balances || data.tokenBalances || []);
    const tokens = list.map(t => {
      try {
        const decimals = Number(t.tokenDecimal || t.decimals || 0);
        const sym = normalizeSymbol(t.symbol || t.tokenAbbr);
        const raw = typeof t.balance === 'string' ? Number(t.balance) : Number(t.balance || t.tokenBalance || 0);
        const amt = raw / Math.pow(10, decimals);
        return { symbol: sym, amount: amt };
      } catch (e) {
        Logger.log(`Error processing TRX token: ${e.message}`);
        return null;
      }
    })
    .filter(t => t && t.symbol && t.amount > 0);
    
    Logger.log(`Found ${tokens.length} TRX tokens for ${address}`);
    
    // Rate limit between TRX calls
    rateLimit(API_CONFIG.TRON_RATE_LIMIT);
    
    return tokens;
  } catch (error) {
    Logger.log(`Error fetching TRX tokens for ${address}: ${error.message}`);
    return [];
  }
}

// SOL native via Solana RPC
function cold_fetchSOL(address) {
  try {
    // Validate SOL address format (base58, 32-44 characters)
    if (!address || typeof address !== 'string' || address.length < 32 || address.length > 44) {
      Logger.log(`Invalid SOL address format: ${address}`);
      return 0;
    }
    
    // Check if address contains only valid base58 characters
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      Logger.log(`Invalid SOL address characters: ${address}`);
      return 0;
    }
    
    const payload = { method:"getBalance", jsonrpc:"2.0", id:1, params:[address] };
    const options = { method:'post', contentType:'application/json', payload:JSON.stringify(payload), muteHttpExceptions:true };
    const resp = fetchJsonWithRetry('https://api.mainnet-beta.solana.com', options, {});
    
    if (!resp || !resp.result) {
      Logger.log(`Invalid SOL response for ${address}: ${JSON.stringify(resp)}`);
      return 0;
    }
    
    const lamports = Number(resp.result.value || 0);
    if (isNaN(lamports)) {
      Logger.log(`Invalid SOL lamports for ${address}: ${resp.result.value}`);
      return 0;
    }
    
    const result = lamports / Math.pow(10, DECIMALS['SOL']);
    Logger.log(`SOL balance for ${address}: ${result}`);
    
    // Rate limit between SOL calls
    rateLimit(API_CONFIG.SOL_RATE_LIMIT);
    
    return result;
  } catch (error) {
    Logger.log(`Error fetching SOL for ${address}: ${error.message}`);
    return 0;
  }
}

// SOL tokens via Solana RPC + Jupiter tokens list (for symbols)
function cold_fetchSOLTokens(address) {
  try {
    // Validate SOL address format
    if (!address || typeof address !== 'string' || address.length < 32 || address.length > 44) {
      Logger.log(`Invalid SOL address for tokens: ${address}`);
      return [];
    }
    
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      Logger.log(`Invalid SOL address characters for tokens: ${address}`);
      return [];
    }
    
    const payload = {
      method:"getTokenAccountsByOwner", jsonrpc:"2.0", id:1,
      params:[
        address,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding:"jsonParsed", commitment:"finalized" }
      ]
    };
    const options = { method:'post', contentType:'application/json', payload:JSON.stringify(payload), muteHttpExceptions:true };
    const resp = fetchJsonWithRetry('https://api.mainnet-beta.solana.com', options, {});
    
    if (!resp || !resp.result) {
      Logger.log(`No SOL token data for ${address}`);
      return [];
    }
    
    const accounts = (resp.result.value || []);
    const jupMap = getJupiterTokenMap(); // mint -> {symbol, decimals}
    const out = [];
    
    accounts.forEach(a => {
      try {
        const info = (((a || {}).account || {}).data || {}).parsed || {};
        const mint = (((info || {}).info || {}).mint) || null;
        const ta = (((info || {}).info || {}).tokenAmount) || {};
        const ui = Number(ta.uiAmount || 0);
        
        if (!mint || !ui) return;
        
        let meta = jupMap[mint];
        let symbol = normalizeSymbol(meta ? meta.symbol : null);
        
        if (!symbol) {
          meta = getSolscanTokenMeta(mint);
          symbol = normalizeSymbol(meta ? meta.symbol : null);
        }
        
        if (symbol && ui > 0) out.push({ symbol, amount: ui });
      } catch (e) {
        Logger.log(`Error processing SOL token: ${e.message}`);
      }
    });
    
    Logger.log(`Found ${out.length} SOL tokens for ${address}`);
    
    // Rate limit between SOL calls
    rateLimit(API_CONFIG.SOL_RATE_LIMIT);
    
    return out;
  } catch (error) {
    Logger.log(`Error fetching SOL tokens for ${address}: ${error.message}`);
    return [];
  }
}

function getJupiterTokenMap() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('JUP_TOKENS_MAP_V2');
  if (cached) return parseJsonSafe(cached, {});
  const sources = [
    'https://token.jup.ag/strict',
    'https://tokens.jup.ag/tokens'
  ];
  let map = {};
  for (var i = 0; i < sources.length; i++) {
    const data = fetchJson(sources[i], {muteHttpExceptions:true}, []);
    const arr = Array.isArray(data) ? data : (data && Array.isArray(data.tokens) ? data.tokens : []);
    if (arr && arr.length) {
      arr.forEach(t => { if (t && t.address && t.symbol) map[t.address] = {symbol: t.symbol, decimals: Number(t.decimals || 0)}; });
      break;
    }
  }
  cache.put('JUP_TOKENS_MAP_V2', JSON.stringify(map), 3600);
  return map;
}

function getSolscanTokenMeta(mint) {
  if (!mint) return null;
  try {
    const cache = CacheService.getScriptCache();
    const key = 'SOLSCAN_META_' + mint;
    const cached = cache.get(key);
    if (cached) return parseJsonSafe(cached, null);
    const url = `https://public-api.solscan.io/token/meta?tokenAddress=${mint}`;
    const data = fetchJson(url, {muteHttpExceptions:true}, {});
    if (data && (data.symbol || data.decimals !== undefined)) {
      cache.put(key, JSON.stringify(data), 21600); // 6 hours
      return data;
    }
  } catch (e) {}
  return null;
}

// ADA native via Blockfrost
function cold_fetchADA(address) {
  if (!BLOCKFROST_API_KEY) return 0;
  const options = { headers:{project_id:BLOCKFROST_API_KEY}, muteHttpExceptions:true };
  const resp = fetchJson(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, options, {});
  const lovelace = ((resp.amount || []).find(a => a.unit === 'lovelace') || {quantity:'0'}).quantity;
  return Number(lovelace || 0) / 1e6;
}

// ADA native tokens via Blockfrost (optional)
function cold_fetchADATokens(address) {
  if (!BLOCKFROST_API_KEY) return [];
  const options = { headers:{project_id:BLOCKFROST_API_KEY}, muteHttpExceptions:true };
  const base = fetchJson(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, options, {});
  const assets = (base.amount || []).filter(a => a.unit !== 'lovelace');
  const out = [];
  assets.forEach(a => {
    try {
      const unit = a.unit;
      const meta = fetchJson(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${unit}`, options, {});
      const decimals = Number((meta.onchain_metadata && meta.onchain_metadata.decimals) || (meta.decimals) || 0);
      const symbol = normalizeSymbol((meta.onchain_metadata && (meta.onchain_metadata.ticker || meta.onchain_metadata.name)) || (meta.metadata && meta.metadata.ticker));
      const amt = Number(a.quantity || 0) / Math.pow(10, decimals);
      if (symbol && amt > 0) out.push({symbol, amount: amt});
    } catch(e) {}
  });
  return out;
}

// TON native via TONCenter
function cold_fetchTON(address) {
  const resp = fetchJson(`https://toncenter.com/api/v2/getAddressBalance?address=${address}`, {muteHttpExceptions:true}, {});
  const balanceNano = Number(resp.result || 0);
  if (isNaN(balanceNano)) return 0;
  return balanceNano / 1e9;
}

// TON Jettons via tonapi.io
function cold_fetchTONJettons(address) {
  const url = `https://tonapi.io/v2/accounts/${address}/jettons`;
  const resp = fetchJson(url, {muteHttpExceptions:true}, {});
  const list = resp.balances || resp.jettons || [];
  return list.map(j => {
    const decimals = Number((j.jetton && j.jetton.decimals) || 0);
    const sym = normalizeSymbol(j.jetton && j.jetton.symbol);
    const amt = Number(j.balance || 0) / Math.pow(10, decimals);
    return {symbol: sym, amount: amt};
  }).filter(t => t.symbol && t.amount > 0);
}

// XRP native + issued tokens via XRPL Data API
function cold_fetchXRPAll(address) {
  try {
    // Validate XRP address format (starts with 'r' and is 25-35 characters)
    if (!address || typeof address !== 'string' || !address.startsWith('r') || address.length < 25 || address.length > 35) {
      Logger.log(`Invalid XRP address format: ${address}`);
      return [];
    }
    
    // Check if address contains only valid XRP characters
    if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)) {
      Logger.log(`Invalid XRP address characters: ${address}`);
      return [];
    }
    
    let out = [];
    
    // Try multiple XRP API endpoints for better reliability
    const xrpApis = [
      'https://s1.ripple.com:51234', // Ripple public cluster
      'https://xrplcluster.com',     // XRPL Cluster
      'https://s2.ripple.com:51234'  // Ripple backup cluster
    ];
    
    for (const apiUrl of xrpApis) {
      try {
        // Get account info (native XRP balance)
        const infoPayload = { 
          method: 'account_info', 
          params: [{ 
            account: address, 
            ledger_index: 'validated', 
            strict: true 
          }] 
        };
        
        const info = fetchJsonWithRetry(apiUrl, { 
          method:'post', 
          contentType:'application/json', 
          payload: JSON.stringify(infoPayload), 
          muteHttpExceptions:true 
        }, {});
        
        if (info && info.result && info.result.account_data) {
          const drops = Number(info.result.account_data.Balance || 0);
          if (isFinite(drops) && drops > 0) {
            out.push({ symbol:'XRP', amount: drops / 1e6 });
            Logger.log(`XRP balance for ${address}: ${drops / 1e6}`);
          }
        }
        
        // Get trust lines (issued tokens)
        const linesPayload = { 
          method: 'account_lines', 
          params: [{ 
            account: address, 
            ledger_index: 'validated', 
            limit: 400 
          }] 
        };
        
        const lines = fetchJsonWithRetry(apiUrl, { 
          method:'post', 
          contentType:'application/json', 
          payload: JSON.stringify(linesPayload), 
          muteHttpExceptions:true 
        }, {});
        
        if (lines && lines.result && lines.result.lines) {
          const lineArr = lines.result.lines || [];
          lineArr.forEach(l => {
            try {
              const cur = decodeXrpCurrencyCode(l.currency);
              const val = Number(l.balance || 0);
              if (val > 0 && cur && cur !== 'XRP') {
                out.push({ symbol: cur, amount: val });
              }
            } catch (e) {
              Logger.log(`Error processing XRP trust line: ${e.message}`);
            }
          });
        }
        
        // If we got data from this API, break
        if (out.length > 0) {
          Logger.log(`XRP data fetched successfully from ${apiUrl}`);
          break;
        }
        
      } catch (apiError) {
        Logger.log(`XRP API ${apiUrl} failed: ${apiError.message}`);
        continue;
      }
    }
    
    Logger.log(`Found ${out.length} XRP assets for ${address}`);
    
    // Rate limit between XRP calls
    rateLimit(API_CONFIG.XRP_RATE_LIMIT);
    
    return out;
    
  } catch (error) {
    Logger.log(`Error fetching XRP for ${address}: ${error.message}`);
    return [];
  }
}

function decodeXrpCurrencyCode(code) {
  if (!code) return null;
  if (/^[A-Za-z0-9]{3,6}$/.test(code)) return normalizeSymbol(code);
  if (/^[A-F0-9]{40}$/i.test(code)) {
    try {
      const bytes = code.match(/.{1,2}/g).map(h => parseInt(h,16));
      let s = '';
      for (var i=0;i<bytes.length;i++) if (bytes[i] !== 0) s += String.fromCharCode(bytes[i]);
      return normalizeSymbol(s);
    } catch(e) { return null; }
  }
  return null;
}

// ======= OPTIONAL: Add menu + scheduler =======

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cold Wallets')
    .addItem('Update Balances Now', 'run_cold_wallets_balances_updater')
    .addToUi();
}

function createHourlyTrigger() {
  ScriptApp.newTrigger('run_cold_wallets_balances_updater')
    .timeBased()
    .everyHours(1)
    .create();
}