// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaBaseWallet, Network, PalletName } from '@subwallet/extension-base/services/chain-service/handler/manta/MantaBaseWallet';
import { fetchFiles, privateTransferBuildUnsigned, toPrivateBuildUnsigned, toPublicBuildUnsigned } from 'manta-extension-sdk/utils';
import { Address } from 'manta-extension-sdk/interfaces';
import { PAY_PARAMETER_NAMES, PAY_PROVING_NAMES } from 'manta-extension-sdk/constants';
import LedgerApi from 'manta-extension-sdk/ledger-api';
import * as mantaWasm from './pkg';

import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';

const PROVING_FILE_PATH = 'https://media.githubusercontent.com/media/Manta-Network/manta-rs/main/manta-parameters/data/pay/proving';
const PARAMETERS_FILE_PATH = 'https://raw.githubusercontent.com/Manta-Network/manta-rs/main/manta-parameters/data/pay/parameters';

export class MantaPayWallet extends MantaBaseWallet {
  /// Builds and signs a "To Private" transaction for any fungible token.
  /// Note: This transaction is not published to the ledger.
  async toPrivateBuild (assetId: BN, amount: BN): Promise<any | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await toPrivateBuildUnsigned(
      this.wasm,
      assetId,
      amount
    );
  }

  /// Builds a "Private Transfer" transaction for any fungible token.
  /// Note: This transaction is not published to the ledger.
  async privateTransferBuild (assetId: BN, amount: BN, toZkAddress: Address): Promise<any | null> {
    await this.api.isReady;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await privateTransferBuildUnsigned(
      this.wasm,
      this.api,
      assetId,
      amount,
      toZkAddress,
      this.network
    );
  }

  /// Builds and signs a "To Public" transaction for any fungible token.
  /// Note: This transaction is not published to the ledger.
  async toPublicBuild (assetId: BN, amount: BN, polkadotAddress: Address): Promise<any | null> {
    await this.api.isReady;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await toPublicBuildUnsigned(
      this.wasm,
      this.api,
      assetId,
      amount,
      polkadotAddress,
      this.network
    );
  }

  static async init (api: ApiPromise, network: Network, palletName: PalletName) {
    mantaWasm.init_panic_hook();
    const [provingFileList, parameterFileList] = await Promise.all([
      fetchFiles(PROVING_FILE_PATH, PAY_PROVING_NAMES),
      fetchFiles(PARAMETERS_FILE_PATH, PAY_PARAMETER_NAMES)
    ]);

    const multiProvingContext = new mantaWasm.RawMultiProvingContext(
      ...(provingFileList as [Uint8Array, Uint8Array, Uint8Array])
    );
    const fullParameters = new mantaWasm.RawFullParameters(
      ...(parameterFileList as [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array])
    );

    const mantaWallet = new mantaWasm.Wallet();
    const ledgerApi = new LedgerApi(
      api,
      palletName,
      true
    );

    return new MantaPayWallet(
      mantaWasm,
      fullParameters,
      multiProvingContext,
      api,
      network,
      palletName,
      mantaWallet,
      ledgerApi
    );
  }
}
