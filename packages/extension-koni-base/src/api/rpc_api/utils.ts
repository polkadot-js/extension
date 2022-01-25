// Node >= 14 doesnt have require by default. Fix this maybe ?
import {decodeAddress, encodeAddress} from "@polkadot/keyring";
import {BN, hexToU8a, isHex} from "@polkadot/util";
import {readFileSync} from "fs";
import { resolve } from 'path'

export const loadJSON = (path: string) => {
    try {
      return JSON.parse(readFileSync(resolve(__dirname, path), 'utf-8') )
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
