// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, ExtrinsicType, NominationInfo, NominatorMetadata, RequestStakePoolingUnbonding, RequestUnbondingSubmit, StakingType, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { getValidatorLabel, isActionFromValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AccountSelector, AmountInput, HiddenInput, NominationSelector } from '@subwallet/extension-koni-ui/components';
import { BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { useGetYieldMetadata, useGetYieldPositionInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { yieldSubmitNominationPoolUnstaking, yieldSubmitUnstaking } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps, UnStakeParams, UnYieldParams } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, noop, simpleCheckForm, validateUnStakeValue } from '@subwallet/extension-koni-ui/utils';
import { Button, Checkbox, Form, Icon } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { MinusCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { accountFilterFunc } from '../../helper';
import { BondedBalance, FreeBalance, TransactionContent, TransactionFooter, YieldOutlet } from '../../parts';

type Props = ThemeProps;

const _accountFilterFunc = (
  allNominator: YieldPositionInfo[],
  chainInfoMap: Record<string, _ChainInfo>,
  stakingType: StakingType,
  stakingChain?: string
): (account: AccountJson) => boolean => {
  return (account: AccountJson): boolean => {
    const nominator = allNominator.find((item) => item.address.toLowerCase() === account.address.toLowerCase());

    return new BigN((nominator?.metadata as NominatorMetadata)?.activeStake || BN_ZERO).gt(BN_ZERO) && accountFilterFunc(chainInfoMap, stakingType, stakingChain)(account);
  };
};

const hideFields: Array<keyof UnYieldParams> = ['chain', 'asset', 'method'];
const validateFields: Array<keyof UnYieldParams> = ['value'];

const Component: React.FC = () => {
  const { t } = useTranslation();

  const { defaultData, onDone, persistData } = useTransactionContext<UnYieldParams>();
  const { chain, method } = defaultData;

  const currentAccount = useSelector((state) => state.accountState.currentAccount);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);
  const isAll = isAccountAll(currentAccount?.address || '');

  const [form] = Form.useForm<UnYieldParams>();
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [amountChange, setAmountChange] = useState(false);

  const formDefault = useMemo((): UnYieldParams => ({
    ...defaultData
  }), [defaultData]);

  const from = useWatchTransaction('from', form, defaultData);
  const currentValidator = useWatchTransaction('validator', form, defaultData);

  const yieldPoolInfo = useGetYieldMetadata(method);
  const chainStakingMetadata = yieldPoolInfo?.metadata as ChainStakingMetadata;
  const allNominatorInfo = useGetYieldPositionInfo(method);
  const nominatorInfo = useGetYieldPositionInfo(method, from);
  const nominatorMetadata = nominatorInfo[0].metadata as NominatorMetadata;
  const type = nominatorMetadata.type;

  const { decimals, symbol } = useMemo(() => {
    if (!yieldPoolInfo) {
      return {
        decimals: 0,
        symbol: ''
      };
    }

    if (yieldPoolInfo.type === YieldPoolType.LIQUID_STAKING) {
      const derivativeTokenSlug = yieldPoolInfo?.derivativeAssets?.[0] as string;
      const derivativeTokenInfo = assetRegistry[derivativeTokenSlug];

      return {
        decimals: _getAssetDecimals(derivativeTokenInfo),
        symbol: _getAssetSymbol(derivativeTokenInfo)
      };
    }

    const inputAssetInfo = assetRegistry[yieldPoolInfo.inputAssets[0]];

    return {
      decimals: _getAssetDecimals(inputAssetInfo),
      symbol: _getAssetSymbol(inputAssetInfo)
    };
  }, [assetRegistry, yieldPoolInfo]);

  const selectedValidator = useMemo((): NominationInfo | undefined => {
    if (nominatorMetadata) {
      return nominatorMetadata.nominations.find((item) => item.validatorAddress === currentValidator);
    } else {
      return undefined;
    }
  }, [currentValidator, nominatorMetadata]);

  const mustChooseValidator = useMemo(() => {
    return isActionFromValidator(type, chain || '');
  }, [chain, type]);

  const bondedValue = useMemo((): string => {
    if (!mustChooseValidator) {
      return nominatorMetadata?.activeStake || '0';
    } else {
      return selectedValidator?.activeStake || '0';
    }
  }, [mustChooseValidator, nominatorMetadata?.activeStake, selectedValidator?.activeStake]);

  const [isChangeData, setIsChangeData] = useState(false);

  const persistValidator = useMemo(() => {
    if (from === defaultData.from && !isChangeData) {
      return defaultData.validator;
    } else {
      return '';
    }
  }, [defaultData.from, defaultData.validator, from, isChangeData]);

  const minValue = useMemo((): string => {
    if (type === StakingType.POOLED) {
      return chainStakingMetadata?.minJoinNominationPool || '0';
    } else {
      const minChain = new BigN(chainStakingMetadata?.minStake || '0');
      const minValidator = new BigN(selectedValidator?.validatorMinStake || '0');

      return minChain.gt(minValidator) ? minChain.toString() : minValidator.toString();
    }
  }, [chainStakingMetadata?.minJoinNominationPool, chainStakingMetadata?.minStake, selectedValidator?.validatorMinStake, type]);

  const unBondedTime = useMemo((): string => {
    if (yieldPoolInfo) {
      const defaultWaitingTime = yieldPoolInfo.withdrawalMethods[0].waitingTime;

      if (defaultWaitingTime >= 24) {
        const days = Math.floor(defaultWaitingTime / 24);
        const hours = time - days * 24;

        return `${days} ${t('days')}${hours ? ` ${hours} ${t('hours')}` : ''}`;
      } else {
        return `${defaultWaitingTime} ${t('hours')}`;
      }
    }

    if (chainStakingMetadata) {
      const time = chainStakingMetadata?.unstakingPeriod || 0;

      if (time >= 24) {
        const days = Math.floor(time / 24);
        const hours = time - days * 24;

        return `${days} ${t('days')}${hours ? ` ${hours} ${t('hours')}` : ''}`;
      } else {
        return `${time} ${t('hours')}`;
      }
    } else {
      return t('unknown time');
    }
  }, [chainStakingMetadata, t, yieldPoolInfo]);

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onValuesChange: FormCallbacks<UnYieldParams>['onValuesChange'] = useCallback((changes: Partial<UnYieldParams>, values: UnYieldParams) => {
    const { from, validator, value } = changes;

    if (from) {
      setIsChangeData(true);
    }

    if ((from || validator) && (amountChange || defaultData.value)) {
      form.validateFields(['value']).finally(noop);
    }

    if (value !== undefined) {
      setAmountChange(true);
    }
  }, [amountChange, form, defaultData.value]);

  const onFieldsChange: FormCallbacks<UnStakeParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { error } = simpleCheckForm(allFields);

    const allMap = convertFieldToObject<UnStakeParams>(allFields);

    const checkEmpty: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(allMap)) {
      checkEmpty[key] = !!value;
    }

    checkEmpty.asset = true;

    if (!mustChooseValidator) {
      checkEmpty.validator = true;
    }

    setIsDisable(error || Object.values(checkEmpty).some((value) => !value));
    persistData(form.getFieldsValue());
  }, [form, mustChooseValidator, persistData]);

  const onSubmit: FormCallbacks<UnYieldParams>['onFinish'] = useCallback((values: UnYieldParams) => {
    const { validator: selectedValidator, value } = values;
    // const selectedValidator = nominatorMetadata.nominations[0].validatorAddress;

    let unbondingPromise: Promise<SWTransactionResponse>;

    if (nominatorMetadata.type === StakingType.POOLED) {
      const params: RequestStakePoolingUnbonding = {
        amount: value,
        chain: nominatorMetadata.chain,
        nominatorMetadata: nominatorMetadata
      };

      unbondingPromise = yieldSubmitNominationPoolUnstaking(params);
    } else {
      const params: RequestUnbondingSubmit = {
        amount: value,
        chain: nominatorMetadata.chain,
        nominatorMetadata: nominatorMetadata
      };

      if (mustChooseValidator) {
        params.validatorAddress = selectedValidator || '';
      }

      unbondingPromise = yieldSubmitUnstaking(params);
    }

    setLoading(true);

    setTimeout(() => {
      unbondingPromise
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [mustChooseValidator, nominatorMetadata, onError, onSuccess]);

  const renderBounded = useCallback(() => {
    return (
      <BondedBalance
        bondedBalance={bondedValue}
        className={'bonded-balance'}
        decimals={decimals}
        symbol={symbol}
      />
    );
  }, [bondedValue, decimals, symbol]);

  const onPreCheck = usePreCheckAction(from);

  useEffect(() => {
    if (amountChange) {
      form.validateFields(['value']).finally(noop);
    }
  }, [form, amountChange, minValue, bondedValue, decimals]);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  return (
    <div>
      <TransactionContent>
        <Form
          className={CN('form-container', 'form-space-xxs')}
          form={form}
          initialValues={formDefault}
          name='unstake-form'
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
          onValuesChange={onValuesChange}
        >
          <HiddenInput fields={hideFields} />
          <Form.Item
            hidden={!isAll}
            name={'from'}
          >
            <AccountSelector
              filter={_accountFilterFunc(allNominatorInfo, chainInfoMap, type, chain)}
              label={t('Unstake from account')}
            />
          </Form.Item>
          <FreeBalance
            address={from}
            chain={chain}
            className={'free-balance'}
            label={t('Available balance:')}
            onBalanceReady={setIsBalanceReady}
            tokenSlug={yieldPoolInfo && yieldPoolInfo.type === YieldPoolType.LIQUID_STAKING ? yieldPoolInfo?.derivativeAssets?.[0] : yieldPoolInfo?.inputAssets?.[0]}
          />

          <Form.Item
            hidden={!mustChooseValidator}
            name={'validator'}
          >
            <NominationSelector
              chain={chain}
              defaultValue={persistValidator}
              disabled={!from}
              label={t(`Select ${getValidatorLabel(chain)}`)}
              nominators={ from ? nominatorMetadata?.nominations || [] : []}
            />
          </Form.Item>

          {
            mustChooseValidator && (
              <>
                {renderBounded()}
              </>
            )
          }

          <Form.Item
            name={'value'}
            rules={[
              { required: true, message: t('Amount is required') },
              validateUnStakeValue(minValue, bondedValue, decimals, t)
            ]}
            statusHelpAsTooltip={true}
          >
            <AmountInput
              decimals={decimals}
              maxValue={bondedValue}
              showMaxButton={true}
            />
          </Form.Item>

          {!mustChooseValidator && renderBounded()}

          <Form.Item
            hidden={type !== StakingType.LIQUID_STAKING}
            name={'fastUnstake'}
            valuePropName='checked'
          >
            <Checkbox>
              <span className={'__option-label'}>{t('Fast unstake')}</span>
            </Checkbox>
          </Form.Item>

          <div className={CN('text-light-4', { mt: mustChooseValidator })}>
            {
              t(
                'Once unstaked, your funds will be available for withdrawal after {{time}}.',
                {
                  replace:
                      {
                        time: unBondedTime
                      }
                }
              )
            }
          </div>
        </Form>
      </TransactionContent>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={MinusCircle}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={onPreCheck(form.submit, type === StakingType.POOLED ? ExtrinsicType.STAKING_LEAVE_POOL : ExtrinsicType.STAKING_UNBOND)}
        >
          {t('Unstake')}
        </Button>
      </TransactionFooter>
    </div>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  useSetCurrentPage('/transaction/un-yield');

  return (
    <YieldOutlet
      className={CN(className)}
      path={'/transaction/un-yield'}
      stores={['yieldPool']}
    >
      <Component />
    </YieldOutlet>
  );
};

const YieldUnstake = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    '.web-ui-enable &': {
      display: 'block',
      maxWidth: 416,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.bonded-balance, .free-balance': {
      marginBottom: token.margin
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.mt': {
      marginTop: token.marginSM
    }
  };
});

export default YieldUnstake;
