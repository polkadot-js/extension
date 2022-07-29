// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, NetworkJson, ResponseStakeExternal, ResponseStakeLedger, ResponseStakeQr, ResponseUnStakeExternal, ResponseUnStakeLedger, ResponseUnStakeQr, ResponseWithdrawStakeExternal, ResponseWithdrawStakeLedger, ResponseWithdrawStakeQr, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getBondingExtrinsic, getUnbondingExtrinsic, getWithdrawalExtrinsic } from '@subwallet/extension-koni-base/api/bonding';

import { SubmittableExtrinsic } from '@polkadot/api/types';

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
  callback: (data: ResponseStakeExternal) => void;
  isBondedBefore: boolean;
  lockPeriod?: number;
  nominatorAddress: string;
  validatorInfo: ValidatorInfo;
}

interface CreateBondingExtrinsicProps {
  amount: number;
  apiProp: ApiProps;
  bondedValidators: string[];
  isBondedBefore: boolean;
  lockPeriod?: number;
  network: NetworkJson;
  nominatorAddress: string;
  validatorInfo: ValidatorInfo;
}

interface UnStakeExternalProps extends ExternalProps{
  address: string;
  amount: number;
  callback: (data: ResponseUnStakeExternal) => void;
  unstakeAll?: boolean;
  validatorAddress?: string;
}

interface CreateUnBondingExtrinsicProps {
  address: string;
  amount: number;
  apiProp: ApiProps;
  network: NetworkJson;
  unstakeAll?: boolean;
  validatorAddress?: string;
}

interface WithdrawStakeExternalProps extends Omit<ExternalProps, 'network'> {
  action?: string;
  address: string;
  callback: (data: ResponseWithdrawStakeExternal) => void;
  networkKey: string;
  validatorAddress?: string;
}

// Method

const createBondingExtrinsic = async ({ amount,
  apiProp,
  bondedValidators,
  isBondedBefore,
  lockPeriod,
  network,
  nominatorAddress,
  validatorInfo }: CreateBondingExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  return await getBondingExtrinsic(network, network.key, amount, bondedValidators, validatorInfo, isBondedBefore, nominatorAddress, apiProp, lockPeriod);
};

const createUnBondingExtrinsic = async ({ address,
  amount,
  apiProp,
  network,
  unstakeAll,
  validatorAddress }: CreateUnBondingExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  return await getUnbondingExtrinsic(address, amount, network.key, network, apiProp, validatorAddress, unstakeAll);
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
  lockPeriod,
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
    amount,
    lockPeriod
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
  unstakeAll,
  updateState,
  validatorAddress }: UnStakeQrProps): Promise<void> => {
  const txState: ResponseUnStakeQr = {};

  const extrinsic = await createUnBondingExtrinsic({
    amount,
    apiProp,
    network,
    address,
    unstakeAll,
    validatorAddress
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

export const createWithdrawStakeQr = async ({ action,
  address,
  apiProp,
  callback,
  id,
  networkKey,
  setState,
  updateState,
  validatorAddress }: WithdrawStakeQrProps) => {
  const extrinsic = await getWithdrawalExtrinsic(apiProp, networkKey, address, validatorAddress, action);
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
  lockPeriod,
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
    amount,
    lockPeriod
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
  unstakeAll,
  updateState,
  validatorAddress }: UnStakeLedgerProps): Promise<void> => {
  const txState: ResponseUnStakeLedger = {};

  const extrinsic = await createUnBondingExtrinsic({
    amount,
    apiProp,
    network,
    validatorAddress,
    unstakeAll,
    address
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

export const createWithdrawStakeLedger = async ({ action,
  address,
  apiProp,
  callback,
  id,
  networkKey,
  setState,
  updateState,
  validatorAddress }: WithdrawStakeLedgerProps) => {
  const extrinsic = await getWithdrawalExtrinsic(apiProp, networkKey, address, validatorAddress, action);
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
