// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, ExternalRequestPromiseStatus, NetworkJson, ResponseStakeExternal, ResponseStakeLedger, ResponseStakeQr, ResponseUnStakeExternal, ResponseUnStakeLedger, ResponseUnStakeQr, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getBondingExtrinsic, getTargetValidators, getUnbondingExtrinsic } from '@subwallet/extension-koni-base/api/bonding';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN } from '@polkadot/util';

// Interface

interface StakeExternalProps {
  amount: number;
  apiProp: ApiProps;
  bondedValidators: string[];
  id: string;
  isBondedBefore: boolean;
  network: NetworkJson;
  nominatorAddress: string;
  validatorInfo: ValidatorInfo;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  callback: (data: ResponseStakeExternal) => void;
}

interface CreateBondingExtrinsicProps {
  apiProp: ApiProps;
  network: NetworkJson;
  nominatorAddress: string;
  amount: number;
  validatorInfo: ValidatorInfo;
  isBondedBefore: boolean;
  bondedValidators: string[];
}

interface UnStakeExternalProps {
  address: string;
  amount: number;
  apiProp: ApiProps;
  callback: (data: ResponseUnStakeExternal) => void;
  id: string;
  network: NetworkJson;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
}

interface CreateUnBondingExtrinsicProps {
  apiProp: ApiProps;
  network: NetworkJson;
  amount: number;
}

// Method

const createBondingExtrinsic = async ({ amount,
  apiProp,
  bondedValidators,
  isBondedBefore,
  network,
  nominatorAddress,
  validatorInfo }: CreateBondingExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  const parsedAmount = amount * (10 ** (network.decimals as number));
  const binaryAmount = new BN(parsedAmount);
  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return await getBondingExtrinsic(apiProp, nominatorAddress, binaryAmount, targetValidators, isBondedBefore);
};

const createUnBondingExtrinsic = async ({ amount,
  apiProp,
  network }: CreateUnBondingExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  const parsedAmount = amount * (10 ** (network.decimals as number));
  const binaryAmount = new BN(parsedAmount);

  return await getUnbondingExtrinsic(apiProp, binaryAmount);
};

// Method Qr

interface StakeQrProps extends StakeExternalProps {
  callback: (data: ResponseStakeQr) => void;
}

export const createStakeQr = async ({ amount,
  apiProp,
  bondedValidators,
  callback,
  id,
  isBondedBefore,
  network,
  nominatorAddress,
  setState,
  updateState,
  validatorInfo }: StakeQrProps): Promise<void> => {
  const txState: ResponseStakeQr = {};

  const extrinsic = await createBondingExtrinsic({
    apiProp,
    isBondedBefore,
    network,
    nominatorAddress,
    validatorInfo,
    bondedValidators,
    amount
  });

  if (extrinsic !== null) {
    const qrCallBack = ({ qrState }: {qrState: QrState}) => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        qrState: qrState,
        externalState: {
          externalId: qrState.qrId
        }
      });
    };

    await extrinsic.signAsync(nominatorAddress, { signer: new QrSigner(apiProp.registry, qrCallBack, id, setState) });

    try {
      const unsubscribe = await extrinsic.send((result) => {
        if (!result || !result.status) {
          return;
        }

        if (result.status.isBroadcast) {
          txState.isBusy = true;
          callback(txState);
        }

        if (result.status.isInBlock || result.status.isFinalized) {
          result.events
            .filter(({ event: { section } }) => section === 'system')
            .forEach(({ event: { method } }): void => {
              txState.transactionHash = extrinsic.hash.toHex();
              callback(txState);

              if (method === 'ExtrinsicFailed') {
                txState.status = false;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.FAILED });
              } else if (method === 'ExtrinsicSuccess') {
                txState.status = true;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
              }
            });
        } else if (result.isError) {
          txState.txError = true;
          txState.status = false;
          callback(txState);
        }

        if (result.isCompleted) {
          unsubscribe();
        }
      });
    } catch (e) {
      console.error('error bonding', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};

interface UnStakeQrProps extends UnStakeExternalProps {
  callback: (data: ResponseUnStakeQr) => void;
}

export const createUnStakeQr = async ({ address,
  amount,
  apiProp,
  callback,
  id,
  network,
  setState,
  updateState }: UnStakeQrProps): Promise<void> => {
  const txState: ResponseUnStakeQr = {};

  const extrinsic = await createUnBondingExtrinsic({
    amount,
    apiProp,
    network
  });

  if (extrinsic !== null) {
    const qrCallBack = ({ qrState }: {qrState: QrState}) => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        qrState: qrState,
        externalState: {
          externalId: qrState.qrId
        }
      });
    };

    await extrinsic.signAsync(address, { signer: new QrSigner(apiProp.registry, qrCallBack, id, setState) });

    try {
      const unsubscribe = await extrinsic.send((result) => {
        if (!result || !result.status) {
          return;
        }

        if (result.status.isBroadcast) {
          txState.isBusy = true;
          callback(txState);
        }

        if (result.status.isInBlock || result.status.isFinalized) {
          result.events
            .filter(({ event: { section } }) => section === 'system')
            .forEach(({ event: { method } }): void => {
              txState.transactionHash = extrinsic.hash.toHex();
              callback(txState);

              if (method === 'ExtrinsicFailed') {
                txState.status = false;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.FAILED });
              } else if (method === 'ExtrinsicSuccess') {
                txState.status = true;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
              }
            });
        } else if (result.isError) {
          txState.txError = true;
          txState.status = false;
          callback(txState);
        }

        if (result.isCompleted) {
          unsubscribe();
        }
      });
    } catch (e) {
      console.error('error unbonding', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};

// Method Ledger

interface StakeLedgerProps extends StakeExternalProps {
  callback: (data: ResponseStakeLedger) => void;
}

export const createStakeLedger = async ({ amount,
  apiProp,
  bondedValidators,
  callback,
  id,
  isBondedBefore,
  network,
  nominatorAddress,
  setState,
  updateState,
  validatorInfo }: StakeLedgerProps): Promise<void> => {
  const txState: ResponseStakeQr = {};

  const extrinsic = await createBondingExtrinsic({
    apiProp,
    isBondedBefore,
    network,
    nominatorAddress,
    validatorInfo,
    bondedValidators,
    amount
  });

  if (extrinsic !== null) {
    const ledgerCallback = ({ ledgerState }: {ledgerState: LedgerState}) => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        ledgerState: ledgerState,
        externalState: {
          externalId: ledgerState.ledgerId
        }
      });
    };

    await extrinsic.signAsync(nominatorAddress, { signer: new LedgerSigner(apiProp.registry, ledgerCallback, id, setState) });

    try {
      const unsubscribe = await extrinsic.send((result) => {
        if (!result || !result.status) {
          return;
        }

        if (result.status.isInBlock || result.status.isFinalized) {
          result.events
            .filter(({ event: { section } }) => section === 'system')
            .forEach(({ event: { method } }): void => {
              txState.transactionHash = extrinsic.hash.toHex();
              callback(txState);

              if (method === 'ExtrinsicFailed') {
                txState.status = false;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.FAILED });
              } else if (method === 'ExtrinsicSuccess') {
                txState.status = true;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
              }
            });
        } else if (result.isError) {
          txState.txError = true;
          txState.status = false;
          callback(txState);
        }

        if (result.isCompleted) {
          unsubscribe();
        }
      });
    } catch (e) {
      console.error('error bonding', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};

interface UnStakeLedgerProps extends UnStakeExternalProps {
  callback: (data: ResponseUnStakeLedger) => void;
}

export const createUnStakeLedger = async ({ address,
  amount,
  apiProp,
  callback,
  id,
  network,
  setState,
  updateState }: UnStakeLedgerProps): Promise<void> => {
  const txState: ResponseUnStakeLedger = {};

  const extrinsic = await createUnBondingExtrinsic({
    amount,
    apiProp,
    network
  });

  if (extrinsic !== null) {
    const ledgerCallback = ({ ledgerState }: {ledgerState: LedgerState}) => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        ledgerState: ledgerState,
        externalState: {
          externalId: ledgerState.ledgerId
        }
      });
    };

    await extrinsic.signAsync(address, { signer: new LedgerSigner(apiProp.registry, ledgerCallback, id, setState) });

    try {
      const unsubscribe = await extrinsic.send((result) => {
        if (!result || !result.status) {
          return;
        }

        if (result.status.isInBlock || result.status.isFinalized) {
          result.events
            .filter(({ event: { section } }) => section === 'system')
            .forEach(({ event: { method } }): void => {
              txState.transactionHash = extrinsic.hash.toHex();
              callback(txState);

              if (method === 'ExtrinsicFailed') {
                txState.status = false;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.FAILED });
              } else if (method === 'ExtrinsicSuccess') {
                txState.status = true;
                callback(txState);
                updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
              }
            });
        } else if (result.isError) {
          txState.txError = true;
          txState.status = false;
          callback(txState);
        }

        if (result.isCompleted) {
          unsubscribe();
        }
      });
    } catch (e) {
      console.error('error unbonding', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};
