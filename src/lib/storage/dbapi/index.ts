import { laGetName } from "./getname";
import { laGetAccount } from "./getaccount";
import { laDefault } from "./default";
import { laGetAccounts } from "./getaccounts";
import { laGetToken } from "./gettoken";
import { laGetTokenInfo } from "./gettokeninfo";
import { laGetTokenPrice } from "./gettokenprice";
import { laGetFortuneRanking } from "./getfortuneranking";
import { laGetTokensByAddress } from "./gettokensbyaddress";
import { laGetTxsByAddress } from "./gettxsbyaddress";
import { laGetTxs } from "./gettxs";
import { laGetTxsByBlock } from "./gettxsbyblock";
import { laGetTx } from "./gettx";
import { laGetBlocks } from "./getblocks";
import { laLatestBlocks } from "./getlatestblocks";
import { laGetChainOverview } from "./getchainoverview";
import { laGetLatestTxCount } from "./getlatesttxcount";
import { laGetCandy } from "./getcandy";

export function getFunc(funName: string) {
  if (funName === 'getName') {
    return laGetName;
  } else if (funName === 'getAccount') {
    return laGetAccount;
  } else if (funName === 'getAccounts') {
    return laGetAccounts;
  } else if (funName === 'getToken') {
    return laGetToken;
  }
  else if (funName === 'getTokenInfo') {
    return laGetTokenInfo;
  }
  else if (funName === 'getTokenPrice') {
    return laGetTokenPrice;
  }
  else if (funName === 'getFortuneRanking') {
    return laGetFortuneRanking;
  }
  else if (funName === 'getTokensByAddress') {
    return laGetTokensByAddress;
  }
  else if (funName === 'getTxsByAddress') {
    return laGetTxsByAddress;
  }
  else if (funName === 'getTxs' || funName === 'getLatestTxs') {
    return laGetTxs;
  }
  else if (funName === 'getTxsByBlock') {
    return laGetTxsByBlock;
  }
  else if (funName === 'getTx') {
    return laGetTx;
  }
  else if (funName === 'getBlocks') {
    return laGetBlocks;
  }
  else if (funName === 'getLatestBlocks') {
    return laLatestBlocks;
  }
  else if (funName === 'getChainOverview') {
    return laGetChainOverview;
  }
  else if (funName === 'getLatestTxCount') {
    return laGetLatestTxCount;
  }
  else if (funName === 'getCandy') {
    return laGetCandy;
  }
  else if (funName === 'default') {
    return laDefault;
  }
  else {
    return laDefault;
  }
}
