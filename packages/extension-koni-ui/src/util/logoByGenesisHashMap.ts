import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import LogosMap from "@polkadot/extension-koni-ui/assets/logo";

function getLogoByGenesisHashMap(): Record<string, string> {
  const result: Record<string, string> = {};

  Object.keys(NETWORKS).forEach(networkKey => {
    const {genesisHash} = NETWORKS[networkKey];

    if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
      return;
    }

    result[genesisHash] = LogosMap[networkKey] || LogosMap['default'];
  });

  return result;
}

const logoByGenesisHashMap = getLogoByGenesisHashMap();

export function getLogoByGenesisHash(hash?: string): string {
  if (!hash) {
    return LogosMap['default'];
  }

  return logoByGenesisHashMap[hash] || LogosMap['default'];
}

export default logoByGenesisHashMap;
