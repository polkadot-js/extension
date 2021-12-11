// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';
// import { GenericStorageEntryFunction, PromiseResult, QueryableModuleStorage, QueryableStorageEntry } from '@polkadot/api/types';
import { hexToBn, hexToString } from '@polkadot/util';

import getNetworkInfo from '../getNetwork.ts';

// interface Auction {
//     auctionCounter: number;
//     auctionInfo: [string, string];
//     crowdloans: Crowdloans;
//     winning: string;
// }
// interface Crowdloans {
//     fund: Fund;
//     identity: Identity;
// }
// interface Fund {
//     depositor: string;
//     verifier: string | null;
//     deposit: bigint;
//     raised: bigint;
//     end: bigint;
//     cap: string;
//     lastContribution: { ending: bigint };
//     firstPeriod: number;
//     lastPeriod: number;
//     trieIndex: number
// }

// interface Identity {
//     // 'judgements': [],
//     //  'deposit':202580000000,
//     'info': {
//         // 'additional':[],
//         'display'?: string;
//         'legal'?: string;
//         'web'?: string;
//         //  'riot':{'none':null},
//         'email'?: string;
//         //  'pgpFingerprint':null,
//         //  'image':{'none':null},
//         'twitter'?: string;
//     }
// }

const DEFAULT_IDENTITY = {
  // 'judgements': [],
  //  'deposit':202580000000,
  info: {
    // 'additional':[],
    display: null,
    legal: null,
    web: null,
    //  'riot':{'none':null},
    email: null,
    //  'pgpFingerprint':null,
    //  'image':{'none':null},
    twitter: null
  }
};

async function getIdentities (_chainName, _address) {
  console.log(`getting identity of ${_address} on ${_chainName}`);

  const { url } = getNetworkInfo(null, _chainName);
  // const url='wss://rpc.polkadot.io';

  const wsProvider = new WsProvider(url);
  const api = await ApiPromise.create({ provider: wsProvider });
  const identities = await api.query.identity.identityOf.multi(_address);

  const ids = identities.map((id) => {
    if (!id.toString()) {
      return DEFAULT_IDENTITY;
    }

    const jId = JSON.parse(id.toString());
    // console.log('jId:', jId)

    const info = {
      // 'judgements': [],
      //  'deposit':202580000000,
      info: {
        // 'additional':[],
        display: jId?.info?.display?.raw && hexToString(jId?.info?.display?.raw),
        legal: jId?.info?.legal?.raw && hexToString(jId?.info?.legal?.raw),
        web: jId?.info?.web?.raw && hexToString(jId?.info?.web?.raw),
        //  'riot':{'none':null},
        email: jId?.info?.email?.raw && hexToString(jId?.info?.email?.raw),
        //  'pgpFingerprint':null,
        //  'image':{'none':null},
        twitter: jId?.info?.twitter?.raw && hexToString(jId?.info?.twitter?.raw)
      }
    };

    return info;
  });

  return ids;
}

async function getCrowdloans (_chainName) {
  console.log('getting crowdloans ...');

  const { url } = getNetworkInfo(null, _chainName);
  // const url='wss://rpc.polkadot.io';

  const wsProvider = new WsProvider(url);

  const api = await ApiPromise.create({ provider: wsProvider });
  const allParaIds = (await api.query.paras.paraLifecycles.entries()).map(([key, _]) => key.args[0]);

  const [auctionInfo, auctionCounter, funds] = await Promise.all([
    await api.query.auctions.auctionInfo(),
    await api.query.auctions.auctionCounter(),
    await api.query.crowdloan.funds.multi(allParaIds)
  ]);

  console.log(` we have ${funds.length} funds`);
  
  // console.log('all funds:%o', funds.toString());

  const fundsWithParaId = funds.map((fund, index) => {
    if (fund.toString()) {
      const jpFund = JSON.parse(fund.toString());

      jpFund.raised = hexToBn(jpFund.raised).toString();
      jpFund.cap = hexToBn(jpFund.cap).toString();
      jpFund.deposit = (jpFund.deposit).toString();
      jpFund.paraId = String(allParaIds[index]);

      return jpFund;
    }

    return null;
  }); //console.log('funds with paradId:%o', fundsWithParaId)

  const nonEmtyFunds = fundsWithParaId.filter((fund) => fund);

   console.log('nonEmtyFunds  :%o', nonEmtyFunds)

  // .map((fund) => {
  //   const jpFund = JSON.parse(fund.toString());

  //   jpFund.raised = hexToBn(jpFund.raised).toString();
  //   jpFund.cap = hexToBn(jpFund.cap).toString();

  //   return jpFund;
  // });// console.log('all crowloans:', nonEmtyFunds);

  const depositors = nonEmtyFunds.map((d) => d.depositor);// console.log('depositors:', depositors)

  const identities = await getIdentities(_chainName, depositors);// console.log('identities:', identities)

  const crowdloansWithIdentity = nonEmtyFunds.map((fund, index) => {
    return {
      fund: fund,
      identity: identities[index]
    };
  });// console.log('%o', crowdloansWithIdentity)

  const winning = await api.query.auctions.winning(funds);

  const auction = {
    auctionCounter: Number(auctionCounter),
    auctionInfo: JSON.parse(auctionInfo.toString()),
    blockchain: _chainName,
    crowdloans: crowdloansWithIdentity,
    minContribution: api.consts.crowdloan.minContribution.toString(),
    wining: winning.toHuman()
  };

  // console.log('%o', auction);

  return auction;
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line no-void
  void getCrowdloans(chain).then((crowdloans) => {
    // console.log('crowdloans in worker',crowdloans);
    postMessage(crowdloans);
  });
};
