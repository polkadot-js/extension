import {getBalances} from "@polkadot/extension-koni-base/api/rpc_api/index";
import { wsProvider } from "../connector";
import { getCurrentBonded } from "./staking-info";
import networks from '../endpoints';

jest.setTimeout(50000)

describe('test rpc api', () => {
  test('test rpc api from endpoints', async () => {
    return getBalances([{ paraId: 2000, chainId: 2 }], 'seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp').then(rs => {
      console.log(rs)
      expect(rs).not.toBeNaN()
    }).catch(err => {
      console.log(err)
    })
  })
})

describe('test api get staking', () => {
  test('test api get bonded token from endpoints', async () => {
    console.log(networks.polkadot.provider)
    const api = await wsProvider(networks.polkadot)
    return getCurrentBonded( { api, accountId: '111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S' } ).then(rs => {
      console.log(rs)
      expect(rs).not.toBeNaN()
    }).catch(err => {
      console.log(err)
    })
  })
})
