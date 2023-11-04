// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, NominationInfo, NominatorMetadata, RequestStakePoolingUnbonding, RequestUnbondingSubmit, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { getValidatorLabel, isActionFromValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { AccountSelector, AmountInput, HiddenInput, NominationSelector, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useGetChainStakingMetadata, useGetNativeTokenBasicInfo, useGetNominatorInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { submitPoolUnbonding, submitUnbonding } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps, UnStakeParams } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, noop, simpleCheckForm, validateUnStakeValue } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { MinusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { accountFilterFunc } from '../../helper';
import { BondedBalance, FreeBalance, TransactionContent, TransactionFooter } from '../../parts';

type Props = ThemeProps;

const _accountFilterFunc = (
  allNominator: NominatorMetadata[],
  chainInfoMap: Record<string, _ChainInfo>,
  stakingType: StakingType,
  stakingChain?: string
): (account: AccountJson) => boolean => {
  return (account: AccountJson): boolean => {
    const nominator = allNominator.find((item) => item.address.toLowerCase() === account.address.toLowerCase());

    return new BigN(nominator?.activeStake || BN_ZERO).gt(BN_ZERO) && accountFilterFunc(chainInfoMap, stakingType, stakingChain)(account);
  };
};

const hideFields: Array<keyof UnStakeParams> = ['chain', 'asset', 'type'];
const validateFields: Array<keyof UnStakeParams> = ['value'];

const Component: React.FC = () => {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);

  const { defaultData, onDone, persistData } = useTransactionContext<UnStakeParams>();
  const { chain, type } = defaultData;

  const currentAccount = useSelector((state) => state.accountState.currentAccount);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const isAll = isAccountAll(currentAccount?.address || '');

  const [form] = Form.useForm<UnStakeParams>();
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [amountChange, setAmountChange] = useState(false);

  const formDefault = useMemo((): UnStakeParams => ({
    ...defaultData
  }), [defaultData]);

  const from = useWatchTransaction('from', form, defaultData);
  const currentValidator = useWatchTransaction('validator', form, defaultData);

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain || '');
  const chainStakingMetadata = useGetChainStakingMetadata(chain);
  const allNominatorInfo = useGetNominatorInfo(chain, type);
  const nominatorInfo = useGetNominatorInfo(chain, type, from);
  const nominatorMetadata = nominatorInfo[0];

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
    if (chainStakingMetadata) {
      const time = chainStakingMetadata.unstakingPeriod;

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
  }, [chainStakingMetadata, t]);

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onValuesChange: FormCallbacks<UnStakeParams>['onValuesChange'] = useCallback((changes: Partial<UnStakeParams>, values: UnStakeParams) => {
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

  const onSubmit: FormCallbacks<UnStakeParams>['onFinish'] = useCallback((values: UnStakeParams) => {
    const { validator: selectedValidator, value } = values;
    // const selectedValidator = nominatorMetadata.nominations[0].validatorAddress;

    let unbondingPromise: Promise<SWTransactionResponse>;

    if (nominatorMetadata.type === StakingType.POOLED) {
      const params: RequestStakePoolingUnbonding = {
        amount: value,
        chain: nominatorMetadata.chain,
        nominatorMetadata
      };

      unbondingPromise = submitPoolUnbonding(params);
    } else {
      const params: RequestUnbondingSubmit = {
        amount: value,
        chain: nominatorMetadata.chain,
        nominatorMetadata
      };

      if (mustChooseValidator) {
        params.validatorAddress = selectedValidator || '';
      }

      unbondingPromise = submitUnbonding(params);
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
            statusHelpAsTooltip={isWebUI}
          >
            <AmountInput
              decimals={decimals}
              maxValue={bondedValue}
              showMaxButton={true}
            />
          </Form.Item>

          {!mustChooseValidator && renderBounded()}

          <div className={CN('text-light-4', { mt: mustChooseValidator })}>
            {
              t(
                'Once unbonded, your funds would be available for withdrawal after {{time}}.',
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
          {t('Unbond')}
        </Button>
      </TransactionFooter>
    </div>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  useSetCurrentPage('/transaction/unstake');

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['staking'])}
    >
      <Component />
    </PageWrapper>
  );
};

const Unbond = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
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

export default Unbond;
