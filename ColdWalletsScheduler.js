// ======= CONFIG =======
// Prefer storing keys in Script Properties (Project Settings > Script properties)
const MORALIS_API_KEY = PropertiesService.getScriptProperties().getProperty('MORALIS_API_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjE3NmI0ZjU3LTA4ZmItNGJlMy04NjYyLWRiODU2Y2ViN2E1NyIsIm9yZ0lkIjoiNDY2NzI4IiwidXNlcklkIjoiNDgwMTYxIiwidHlwZUlkIjoiOGMxNGI3YTktMmZlZS00NDVlLWIyZjktZDFmMWQyZjQ3OWQwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTU5MzcwMzksImV4cCI6NDkxMTY5NzAzOX0.OnDYZNw983she_yNBpMtW_CY1muJw13QWrrX6qDjPxg'; // ETH/BSC ERC20
const BLOCKFROST_API_KEY = PropertiesService.getScriptProperties().getProperty('BLOCKFROST_API_KEY') || '';

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

// ======= MAIN =======
function run_cold_wallets_balances_updater() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cold Wallet Balances');
  if(!sheet) throw new Error('Sheet "Cold Wallet Balances" not found!');

  const balances = {};
  const add = (symbol, amount) => {
    if (!symbol || !isFinite(amount)) return;
    const key = normalizeSymbol(symbol);
    if (!key) return;
    balances[key] = (balances[key] || 0) + Number(amount);
  };

  ASSETS.forEach(asset => {
    if (!asset.address || asset.address === '?') return;
    const net = asset.network.toUpperCase();
    try {
      switch(net) {
        case 'ETH':
        case 'BSC': {
          const chain = net.toLowerCase();
          add(NATIVE_SYMBOLS_BY_NETWORK[net], fetchEvmNative(asset.address, chain, net));
          const tokens = fetchEvmTokens(asset.address, chain);
          tokens.forEach(t => add(t.symbol, t.amount));
          break;
        }
        case 'BTC':
          add('BTC', fetchBTC(asset.address));
          break;
        case 'DOGE':
          add('DOGE', fetchDOGE(asset.address));
          break;
        case 'TRX': {
          add('TRX', fetchTRX(asset.address));
          const tokens = fetchTRXTokens(asset.address);
          tokens.forEach(t => add(t.symbol, t.amount));
          break;
        }
        case 'SOL': {
          add('SOL', fetchSOL(asset.address));
          const tokens = fetchSOLTokens(asset.address);
          tokens.forEach(t => add(t.symbol, t.amount));
          break;
        }
        case 'ADA': {
          add('ADA', fetchADA(asset.address));
          if (BLOCKFROST_API_KEY) {
            const tokens = fetchADATokens(asset.address);
            tokens.forEach(t => add(t.symbol, t.amount));
          }
          break;
        }
        case 'TON': {
          add('TON', fetchTON(asset.address));
          const tokens = fetchTONJettons(asset.address);
          tokens.forEach(t => add(t.symbol, t.amount));
          break;
        }
        case 'XRP': {
          const tokens = fetchXRPAll(asset.address);
          tokens.forEach(t => add(t.symbol, t.amount));
          break;
        }
      }
    } catch (e) {
      Logger.log(`Error fetching ${net} for ${asset.address}: ${e}`);
    }
  });

  // Write to sheet
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // Pre-fill ordered tokens
  const inOrder = TOKENS_ORDER.map(tok => [tok, Number(balances[tok] || 0), now]);

  // Append any extra discovered tokens not present in TOKENS_ORDER
  const extras = Object.keys(balances)
    .filter(k => !TOKENS_ORDER.includes(k))
    .sort()
    .map(tok => [tok, Number(balances[tok] || 0), now]);

  const rows = inOrder.concat(extras);

  if(sheet.getLastRow() > 1) {
    sheet.getRange(2,1,sheet.getLastRow()-1,3).clearContent();
  }
  if (rows.length) {
    sheet.getRange(2,1,rows.length,3).setValues(rows);
  }
  Logger.log("Balances (native + tokens) updated successfully!");
}

// ======= FETCHERS =======

// EVM native via Moralis
function fetchEvmNative(address, chain, net) {
  const url = `https://deep-index.moralis.io/api/v2/${address}/balance?chain=${chain}`;
  const options = { method:'get', headers:{'X-API-Key': MORALIS_API_KEY}, muteHttpExceptions:true };
  const resp = fetchJson(url, options, {});
  const raw = Number(resp.balance || 0);
  return raw / Math.pow(10, DECIMALS[net]);
}

// EVM tokens via Moralis
function fetchEvmTokens(address, chain) {
  const url = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${chain}`;
  const options = { method:'get', headers:{'X-API-Key': MORALIS_API_KEY}, muteHttpExceptions:true };
  const data = fetchJson(url, options, []);
  const arr = Array.isArray(data) ? data : [];
  return arr
    .map(t => {
      const decimals = Number(t.decimals || 0);
      const sym = normalizeSymbol(t.symbol);
      const amt = Number(t.balance || 0) / Math.pow(10, decimals);
      return { symbol: sym, amount: amt };
    })
    .filter(t => t.symbol && t.amount > 0);
}

// BTC via BlockCypher (public)
function fetchBTC(address) {
  const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`;
  const resp = fetchJson(url, {muteHttpExceptions:true}, {});
  return Number(resp.final_balance || 0) / Math.pow(10, DECIMALS['BTC']);
}

// DOGE via BlockCypher (public)
function fetchDOGE(address) {
  const url = `https://api.blockcypher.com/v1/doge/main/addrs/${address}/balance`;
  const resp = fetchJson(url, {muteHttpExceptions:true}, {});
  return Number(resp.final_balance || 0) / Math.pow(10, DECIMALS['DOGE']);
}

// TRX native via Tronscan
function fetchTRX(address) {
  const url = `https://apilist.tronscan.org/api/account?address=${address}`;
  const resp = fetchJson(url, {muteHttpExceptions:true}, {});
  const raw = Number(resp.balance || 0);
  return raw / Math.pow(10, DECIMALS['TRX']);
}

// TRX tokens (TRC20) via Tronscan
function fetchTRXTokens(address) {
  const url = `https://apilist.tronscan.org/api/account?address=${address}`;
  const data = fetchJson(url, {muteHttpExceptions:true}, {});
  const list = (data.trc20token_balances || data.tokenBalances || []);
  return list.map(t => {
      const decimals = Number(t.tokenDecimal || t.decimals || 0);
      const sym = normalizeSymbol(t.symbol || t.tokenAbbr);
      const raw = typeof t.balance === 'string' ? Number(t.balance) : Number(t.balance || t.tokenBalance || 0);
      const amt = raw / Math.pow(10, decimals);
      return { symbol: sym, amount: amt };
    })
    .filter(t => t.symbol && t.amount > 0);
}

// SOL native via Solana RPC
function fetchSOL(address) {
  const payload = { method:"getBalance", jsonrpc:"2.0", id:1, params:[address] };
  const options = { method:'post', contentType:'application/json', payload:JSON.stringify(payload), muteHttpExceptions:true };
  const resp = fetchJson('https://api.mainnet-beta.solana.com', options, {});
  const lamports = (((resp || {}).result || {}).value) || 0;
  return Number(lamports) / Math.pow(10, DECIMALS['SOL']);
}

// SOL tokens via Solana RPC + Jupiter tokens list (for symbols)
function fetchSOLTokens(address) {
  const payload = {
    method:"getTokenAccountsByOwner", jsonrpc:"2.0", id:1,
    params:[
      address,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding:"jsonParsed", commitment:"finalized" }
    ]
  };
  const options = { method:'post', contentType:'application/json', payload:JSON.stringify(payload), muteHttpExceptions:true };
  const resp = fetchJson('https://api.mainnet-beta.solana.com', options, {});
  const accounts = ((((resp || {}).result || {}).value) || []);
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
    } catch (e) {}
  });
  return out;
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
function fetchADA(address) {
  if (!BLOCKFROST_API_KEY) return 0;
  const options = { headers:{project_id:BLOCKFROST_API_KEY}, muteHttpExceptions:true };
  const resp = fetchJson(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, options, {});
  const lovelace = ((resp.amount || []).find(a => a.unit === 'lovelace') || {quantity:'0'}).quantity;
  return Number(lovelace || 0) / 1e6;
}

// ADA native tokens via Blockfrost (optional)
function fetchADATokens(address) {
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
function fetchTON(address) {
  const resp = fetchJson(`https://toncenter.com/api/v2/getAddressBalance?address=${address}`, {muteHttpExceptions:true}, {});
  const balanceNano = Number(resp.result || 0);
  if (isNaN(balanceNano)) return 0;
  return balanceNano / 1e9;
}

// TON Jettons via tonapi.io
function fetchTONJettons(address) {
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
function fetchXRPAll(address) {
  const url = `https://data.ripple.com/v2/accounts/${address}/balances?limit=400`;
  const resp = fetchJson(url, {muteHttpExceptions:true}, {});
  let arr = resp && (resp.balances || resp.result);
  if (!Array.isArray(arr)) arr = [];
  let out = [];
  if (arr.length) {
    arr.forEach(b => {
      const cur = decodeXrpCurrencyCode(b.currency);
      const val = Number(b.value || 0);
      if (val > 0 && cur) out.push({symbol: cur, amount: val});
    });
    return out;
  }
  // Fallback to rippled JSON-RPC via public cluster
  try {
    const rpcUrl = 'https://xrplcluster.com';
    const infoPayload = { method: 'account_info', params: [{ account: address, ledger_index: 'validated', strict: true }] };
    const info = fetchJson(rpcUrl, { method:'post', contentType:'application/json', payload: JSON.stringify(infoPayload), muteHttpExceptions:true }, {});
    const drops = Number((((info || {}).result || {}).account_data || {}).Balance || 0);
    if (isFinite(drops) && drops > 0) out.push({ symbol:'XRP', amount: drops / 1e6 });

    const linesPayload = { method: 'account_lines', params: [{ account: address, ledger_index: 'validated', limit: 400 }] };
    const lines = fetchJson(rpcUrl, { method:'post', contentType:'application/json', payload: JSON.stringify(linesPayload), muteHttpExceptions:true }, {});
    const lineArr = (((lines || {}).result || {}).lines) || [];
    lineArr.forEach(l => {
      const cur = decodeXrpCurrencyCode(l.currency);
      const val = Number(l.balance || 0);
      if (val > 0 && cur && cur !== 'XRP') out.push({ symbol: cur, amount: val });
    });
  } catch(e) {}
  return out;
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