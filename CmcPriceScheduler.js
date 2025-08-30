function fetchAndUpdatePrices(tokenList) {
  console.log(tokenList);
  var API_KEY = "e3d2cce1-758b-490d-848a-6123d5473d3d";
  
  var SYMBOL_TO_SLUG = {
    "BABYDOGE": "baby-doge-coin",
    "BBL": "beoble"
  };
  var SYMBOL_TO_NAME = {
    "BABYDOGE": "Baby Doge Coin",
    "BBL": "Beoble"
  };
  
  if (!Array.isArray(tokenList) || tokenList.length === 0) {
    throw new Error("tokenList must be a non-empty array of token symbols.");
  }
  
  // Prepare the symbols string
  var symbols = tokenList.join(",");
  var url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=" + encodeURIComponent(symbols) + "&convert=USD";

  var options = {
    method: "get",
    headers: {
      "X-CMC_PRO_API_KEY": API_KEY,
      "Accept": "application/json"
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode && response.getResponseCode();
  if (responseCode && responseCode !== 200) {
    Logger.log("CMC symbol request returned " + responseCode + ": " + String(response.getContentText()).slice(0, 1000));
  }
  var data = JSON.parse(response.getContentText());

  // Prefetch slug-based quotes to disambiguate symbols like BBL
  var slugPriceMap = {};
  try {
    var slugsToPrefetch = tokenList.map(function(s){ return SYMBOL_TO_SLUG[s]; }).filter(function(sl){ return !!sl; });
    if (slugsToPrefetch.length > 0) {
      var uniqueSlugObj = {};
      for (var si = 0; si < slugsToPrefetch.length; si++) {
        uniqueSlugObj[String(slugsToPrefetch[si]).toLowerCase()] = true;
      }
      var uniqueSlugs = Object.keys(uniqueSlugObj);
      var slugUrl = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=" + encodeURIComponent(uniqueSlugs.join(",")) + "&convert=USD";
      var slugResp = UrlFetchApp.fetch(slugUrl, options);
      var slugRespCode = slugResp.getResponseCode && slugResp.getResponseCode();
      if (slugRespCode && slugRespCode !== 200) {
        Logger.log("CMC slug prefetch returned " + slugRespCode + ": " + String(slugResp.getContentText()).slice(0, 1000));
      }
      var slugData = JSON.parse(slugResp.getContentText());
      var slugKeys = (slugData && slugData.data) ? Object.keys(slugData.data) : [];
      for (var sj = 0; sj < slugKeys.length; sj++) {
        var sobj = slugData.data[slugKeys[sj]];
        if (sobj && sobj.slug && sobj.quote && sobj.quote.USD && typeof sobj.quote.USD.price === "number") {
          slugPriceMap[String(sobj.slug).toLowerCase()] = sobj.quote.USD.price;
        }
      }
    }
  } catch (slugErr) {
    Logger.log("Slug prefetch error: " + slugErr);
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CMC Prices");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("CMC Prices");
    sheet.appendRow(["Date", "Token", "Price"]);
  }

  var now = new Date();
  var timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  
  // Get existing data to find the latest row for each token
  var lastRow = sheet.getLastRow();
  var existingData = {};
  
  if (lastRow > 1) {
    var dataRange = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
    for (var i = 0; i < dataRange.length; i++) {
      existingData[dataRange[i][0]] = i + 2; // Store row number for each token
    }
  }

  // Process each token
  tokenList.forEach(function(symbol) {
    var priceStr = ""; // Default to empty
    
    try {
      var preferredSlug = (SYMBOL_TO_SLUG[symbol] || "").toLowerCase();
      if (preferredSlug && slugPriceMap && typeof slugPriceMap[preferredSlug] === "number") {
        var pslug = slugPriceMap[preferredSlug];
        priceStr = pslug.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
      } else {
        var tokenData = (data && data.data) ? data.data[symbol] : null;
        if (Array.isArray(tokenData)) {
          var desiredSlug = (SYMBOL_TO_SLUG[symbol] || "").toLowerCase();
          var desiredName = (SYMBOL_TO_NAME[symbol] || "").toLowerCase();
          var chosen = tokenData.find(function(item){
            var isSlugMatch = item && item.slug && item.slug.toLowerCase() === desiredSlug;
            var isNameMatch = !isSlugMatch && desiredName && item && item.name && item.name.toLowerCase() === desiredName;
            return isSlugMatch || isNameMatch;
          });
          if (chosen) {
            tokenData = chosen;
          } else if (desiredSlug) {
            // If we expect a specific slug (e.g., BBL -> beoble) but it's not in the array,
            // force the slug-based fallback path below instead of picking the first ambiguous match.
            tokenData = null;
          } else {
            tokenData = tokenData[0];
          }
        }
        if (tokenData && tokenData.quote && tokenData.quote.USD && typeof tokenData.quote.USD.price === "number") {
          var price = tokenData.quote.USD.price;
          priceStr = price.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
        } else {
          // Fallback by slug for ambiguous/missing symbols (e.g., BABYDOGE, BBL)
          var slug = SYMBOL_TO_SLUG[symbol];
          if (slug) {
            var url2 = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=" + encodeURIComponent(slug) + "&convert=USD";
            var resp2 = UrlFetchApp.fetch(url2, options);
            var resp2Code = resp2.getResponseCode && resp2.getResponseCode();
            if (resp2Code && resp2Code !== 200) {
              Logger.log("CMC slug request for " + symbol + " returned " + resp2Code + ": " + String(resp2.getContentText()).slice(0, 1000));
            }
            var data2 = JSON.parse(resp2.getContentText());
            var keys = (data2 && data2.data) ? Object.keys(data2.data) : [];
            if (keys.length > 0) {
              var obj = data2.data[keys[0]];
              if (obj && obj.quote && obj.quote.USD && typeof obj.quote.USD.price === "number") {
                var p2 = obj.quote.USD.price;
                priceStr = p2.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
              }
            }
          }
        }
      }
    } catch (err) {
      Logger.log("Error processing " + symbol + ": " + err);
    }
    
    // Check if token already exists in the sheet
    if (existingData[symbol]) {
      // Update existing row
      var rowNum = existingData[symbol];
      sheet.getRange(rowNum, 1).setValue(timestamp); // Update date
      sheet.getRange(rowNum, 3).setValue(priceStr);  // Update price
    } else {
      // Append new row
      sheet.appendRow([timestamp, symbol, priceStr]);
    }
  });

  // Ensure all tokens are represented (add empty rows for any missing tokens)
  var allTokensRange = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat();
  
  tokenList.forEach(function(symbol) {
    if (!allTokensRange.includes(symbol)) {
      // Token doesn't exist in sheet, add empty row
      sheet.appendRow([timestamp, symbol, ""]);
    }
  });

  // Sort sheet by Token then Date to keep tokens grouped
  lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 3).sort([{column: 2, ascending: true}, {column: 1, ascending: true}]);
  }
}

// Function to run hourly
function run_cmc_price_updater() {
  fetchAndUpdatePrices([
    '1INCH','AAVE','ACE','ACH','ACS','ADA','AEG','AERGO','AERO','AFG','AGLD','AIOZ','AITECH','AKT','ALGO','ALICE','AMB','AMP','ANKR','APE','APP','APT','AR','ARB','ARC','ARCA','ARKM','ASTR','ATH','ATOM','AUCTION','AURORA','AURY','AVA','AVAIL','AVAX','AXS','AZERO','BABYDOGE','BAL','BAN','BB','BBL','BCH','BCUT','BICO','BIGTIME','BLAST','BLOCK','BLUR','BNB','BOB','BOBA','BOME','BONK','BRAWL','BRETT','BSV','BTC','BTT','C98','CAKE','CARV','CAS','CAT','CATI','CATS','CELO','CELR','CFG','CFX','CGPT','CHILLGUY','CHZ','CKB','COOKIE','COQ','CPOOL','CRV','CSIX','CSPR','CTA','CTC','CVC','CVX','CXT','CYBER','DAI','DASH','DBR','DCK','DCR','DEEP','DEFI','DEGEN','DEXE','DGB','DMAIL','DOG','DOGE','DOGS','DOT','DRIFT','DYDX','DYM','EDU','EGLD','EGO','EIGEN','ELA','ELON','ENA','ENS','EOS','ERTHA','ETC','ETH','ETHFI','ETHW','EUL','EVER','F','FET','FIDA','FIL','FIRE','FITFI','FLIP','FLOKI','FLOW','FLR','FLUX','FORTH','FOXY','FRED','FTT','G','G3','GALA','GAME','GIGA','GLM','GLMR','GMRX','GMT','GMX','GODS','GRASS','GRT','GST','GTAI','GTC','HBAR','HFT','HIFI','HLG','HMSTR','HNT','HTX','HYPE','ICP','ICX','ID','ILV','IMX','INJ','INSP','IO','IOST','IRL','IRR','IZI','JASMY','JST','JTO','JUP','KAIA','KARATE','KAS','KAVA','KCS','KDA','KMNO','KSM','L3','LADYS','LAI','LAYER','LBR','LDO','LFT','LINK','LL','LMWR','LOOKS','LOOM','LPT','LQTY','LRC','LTC','LUCE','LUNA','LUNC','MAGIC','MAJOR','MAK','MANA','MANTA','MASA','MASK','MAVIA','MDT','ME','MELANIA','MEME','MEMEFI','MERL','MEW','MICHI','MIGGLES','MINA','MKR','MLK','MNT','MOCA','MOG','MON','MOODENG','MORPHO','MOVE','MOVR','MOZ','MPLX','MV','MXM','MYRIA','MYRO','NAKA','NAVX','NEAR','NEIRO','NEIROCTO','NEO','NEON','NFT','NGL','NIBI','NLK','NOT','NOTAI','NRN','NS','NYM','OAS','OBI','OGN','OM','OMNI','ONDO','ONE','OP','ORAI','ORBS','ORDER','ORDI','PAXG','PBUX','PEAQ','PENDLE','PEOPLE','PEPE','PERP','PIP','PIXEL','PNUT','POKT','POL','PONKE','POPCAT','PORTAL','PRCL','PSTAKE','PUFFER','PUMLX','PYTH','PYUSD','QKC','QNT','QORPO','QTUM','RACA','RATS','RAY','RDNT','REEF','REN','RENDER','RIO','RNDR','ROOT','ROSE','RPK','RPL','RSR','RUNE','RVN','S','SAFE','SAND','SAROS','SATS','SCA','SCR','SCRT','SD','SEI','SFP','SFUND','SHIB','SHRAP','SIDUS','SKL','SKY','SLF','SLP','SMILE','SNX','SOCIAL','SOL','SON','SPX','SQD','SQR','SSV','STG','STRAX','STRK','STX','SUI','SUN','SUNDOG','SUPRA','SUSHI','SWEAT','SWELL','SYRUP','TADA','TAIKO','TAO','TAP','TEL','TENET','THETA','TIA','TIME','TNSR','TOKEN','TOKO','TOMI','TON','TOSHI','TRB','TRUMP','TRVL','TRX','TST','TT','TURBO','TURBOS','TWT','ULTI','UMA','UNI','USDC','USDT','USTC','UXLINK','VANRY','VELO','VENOM','VET','VINU','VIRTUAL','VRA','VRTX','W','WAVES','WBTC','WELL','WEMIX','WEN','WIF','WLD','WLKN','WMTX','WOO','X','XAI','XAVA','XCAD','XCH','XCN','XDC','XEC','XEM','XETA','XION','XLM','XMR','XNO','XPR','XR','XRP','XTZ','XYM','YFI','ZBCN','ZEC','ZEN','ZEND','ZEREBRO','ZETA','ZEX','ZIL','ZK','ZKF','ZKJ','ZKL','ZRC','ZRO','ZRX'
  ]);
}