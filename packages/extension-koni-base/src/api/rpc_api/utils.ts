// Node >= 14 doesnt have require by default. Fix this maybe ?
import {createRequire} from 'module'
import {decodeAddress, encodeAddress} from "@polkadot/keyring";
import {BN, hexToU8a, isHex} from "@polkadot/util";
const require = createRequire(import.meta.url)

export const loadJSON = (path: string) => {
    try {
        return require(path)
    } catch (e) {
        console.log(e)
        console.log('Error parsing JSON file')
    }
}

export const isValidAddress = (address: string) => {
    try {
        encodeAddress(
            isHex(address)
                ? hexToU8a(address)
                : decodeAddress(address)
        )

        return true
    } catch (error) {
        return false
    }
}

export const toUnit = (balance: number, decimals: number) => {
    const base = new BN(10).pow(new BN(decimals));
    const dm = new BN(balance).divmod(base);
    return parseFloat(dm.div.toString() + "." + dm.mod.toString())
}
