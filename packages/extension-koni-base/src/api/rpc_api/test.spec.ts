import {getBalances} from "@polkadot/extension-koni-base/api/rpc_api/index";

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
