// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, NetworkJson, ResponseStakeExternal, ResponseStakeLedger, ResponseStakeQr, ResponseUnStakeExternal, ResponseUnStakeLedger, ResponseUnStakeQr, ResponseWithdrawStakeExternal, ResponseWithdrawStakeLedger, ResponseWithdrawStakeQr, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getBondingExtrinsic, getTargetValidators, getUnbondingExtrinsic, getWithdrawalExtrinsic } from '@subwallet/extension-koni-base/api/bonding';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN } from '@polkadot/util';

import { sendExtrinsic } from './shared';

// Interface

interface ExternalProps {
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  apiProp: ApiProps;
  network: NetworkJson;
}

interface StakeExternalProps extends ExternalProps{
  amount: number;
  bondedValidators: string[];
  isBondedBefore: boolean;
  nominatorAddress: string;
  validatorInfo: ValidatorInfo;
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

interface UnStakeExternalProps extends ExternalProps{
  address: string;
  amount: number;
  callback: (data: ResponseUnStakeExternal) => void;
}

interface CreateUnBondingExtrinsicProps {
  apiProp: ApiProps;
  network: NetworkJson;
  amount: number;
}

interface WithdrawStakeExternalProps extends Omit<ExternalProps, 'network'> {
  address: string;
  callback: (data: ResponseWithdrawStakeExternal) => void;
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

    const qrResolver = () => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        isBusy: true
      });
    };

    await extrinsic.signAsync(
      nominatorAddress,
      {
        signer: new QrSigner({
          registry: apiProp.registry,
          callback: qrCallBack,
          id,
          setState,
          resolver: qrResolver
        })
      }
    );

    try {
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
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

    const qrResolver = () => {
    // eslint-disable-next-line node/no-callback-literal
      callback({
        isBusy: true
      });
    };

    await extrinsic.signAsync(
      address,
      {
        signer: new QrSigner({
          registry: apiProp.registry,
          callback: qrCallBack,
          id,
          setState,
          resolver: qrResolver
        })
      }
    );

    try {
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
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

interface WithdrawStakeQrProps extends WithdrawStakeExternalProps{
  callback: (data: ResponseWithdrawStakeQr) => void;
}

export const createWithdrawStakeQr = async ({ address,
  apiProp,
  callback,
  id,
  setState,
  updateState }: WithdrawStakeQrProps) => {
  const extrinsic = await getWithdrawalExtrinsic(apiProp, address);
  const txState: ResponseWithdrawStakeQr = {};

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

    const qrResolver = () => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        isBusy: true
      });
    };

    await extrinsic.signAsync(
      address,
      {
        signer: new QrSigner({
          registry: apiProp.registry,
          callback: qrCallBack,
          id,
          setState,
          resolver: qrResolver
        })
      }
    );

    try {
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
      });
    } catch (e) {
      console.error('error withdrawing', e);
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
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
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
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
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

interface WithdrawStakeLedgerProps extends WithdrawStakeExternalProps{
  callback: (data: ResponseWithdrawStakeLedger) => void;
}

export const createWithdrawStakeLedger = async ({ address,
  apiProp,
  callback,
  id,
  setState,
  updateState }: WithdrawStakeLedgerProps) => {
  const extrinsic = await getWithdrawalExtrinsic(apiProp, address);
  const txState: ResponseWithdrawStakeLedger = {};

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
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
      });
    } catch (e) {
      console.error('error withdrawing', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};
