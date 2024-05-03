// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, CancelUnstakeSelector, HiddenInput } from '@subwallet/extension-web-ui/components';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useTransactionContext, useWatchTransaction, useYieldPositionDetail } from '@subwallet/extension-web-ui/hooks';
import { yieldSubmitStakingCancelWithdrawal } from '@subwallet/extension-web-ui/messaging';
import { CancelUnStakeParams, FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertFieldToObject, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { accountFilterFunc } from '../helper';
import { EarnOutlet, FreeBalance, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const hideFields: Array<keyof CancelUnStakeParams> = ['slug', 'chain', 'asset'];
const validateFields: Array<keyof CancelUnStakeParams> = ['from'];

const filterAccount = (
  chainInfoMap: Record<string, _ChainInfo>,
  allNominatorInfo: YieldPositionInfo[],
  stakingType: YieldPoolType,
  stakingChain?: string
): ((account: AccountJson) => boolean) => {
  return (account: AccountJson): boolean => {
    const nomination = allNominatorInfo.find((data) => isSameAddress(data.address, account.address));

    return (
      (nomination ? nomination.unstakings.length > 0 : false) &&
      accountFilterFunc(chainInfoMap, stakingType, stakingChain)(account)
    );
  };
};

const Component = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isWebUI } = useContext(ScreenContext);

  const { defaultData, persistData } = useTransactionContext<CancelUnStakeParams>();
  const { slug } = defaultData;

  const [form] = Form.useForm<CancelUnStakeParams>();
  const formDefault = useMemo((): CancelUnStakeParams => ({ ...defaultData }), [defaultData]);

  const { accounts, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { poolInfoMap } = useSelector((state) => state.earning);

  const poolInfo = poolInfoMap[slug];
  const poolType = poolInfo.type;
  const poolChain = poolInfo.chain;

  const fromValue = useWatchTransaction('from', form, defaultData);
  const chainValue = useWatchTransaction('chain', form, defaultData);

  const { list: allPositionInfos } = useYieldPositionDetail(slug);
  const { compound: positionInfo } = useYieldPositionDetail(slug, fromValue);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [isChangeData, setIsChangeData] = useState(false);

  const goHome = useCallback(() => {
    navigate('/home/earning');
  }, [navigate]);

  const persistUnstake = useMemo(() => {
    if (fromValue === defaultData.from && !isChangeData) {
      return defaultData.unstake;
    } else {
      return '';
    }
  }, [defaultData.from, defaultData.unstake, fromValue, isChangeData]);

  const onFieldsChange: FormCallbacks<CancelUnStakeParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['--asset']);

    const values = convertFieldToObject<CancelUnStakeParams>(allFields);
    const changes = convertFieldToObject<CancelUnStakeParams>(changedFields);

    if (changes.from) {
      setIsChangeData(true);
    }

    setIsDisable(empty || error);
    persistData(values);
  }, [persistData]);

  const { onError, onSuccess } = useHandleSubmitTransaction();

  const onSubmit: FormCallbacks<CancelUnStakeParams>['onFinish'] = useCallback((values: CancelUnStakeParams) => {
    if (!positionInfo) {
      return;
    }

    setLoading(true);

    const { from, slug, unstake: unstakeIndex } = values;

    const selectedUnstaking = positionInfo.unstakings[parseInt(unstakeIndex)];

    setTimeout(() => {
      yieldSubmitStakingCancelWithdrawal({
        address: from,
        slug,
        selectedUnstaking
      })
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [onError, onSuccess, positionInfo]);

  const onPreCheck = usePreCheckAction(fromValue);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  useEffect(() => {
    form.setFieldValue('chain', poolChain || '');
  }, [poolChain, form]);

  const accountList = useMemo(() => {
    return accounts.filter(filterAccount(chainInfoMap, allPositionInfos, poolType, poolChain));
  }, [accounts, allPositionInfos, chainInfoMap, poolChain, poolType]);

  useEffect(() => {
    if (!fromValue && accountList.length === 1) {
      form.setFieldValue('from', accountList[0].address);
    }
  }, [accountList, form, fromValue]);

  return (
    <>
      <TransactionContent>
        <Form
          className={'form-container form-space-sm'}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
          onFinish={onSubmit}
        >
          <HiddenInput fields={hideFields} />
          <Form.Item
            name={'from'}
          >
            <AccountSelector
              disabled={!isAllAccount}
              doFilter={false}
              externalAccounts={accountList}
            />
          </Form.Item>
          <FreeBalance
            address={fromValue}
            chain={chainValue}
            className={'free-balance'}
            label={t('Available balance:')}
            onBalanceReady={setIsBalanceReady}
          />
          <Form.Item name={'unstake'}>
            <CancelUnstakeSelector
              chain={chainValue}
              defaultValue={persistUnstake}
              disabled={!fromValue}
              label={t('Select an unstake request')}
              nominators={fromValue ? positionInfo?.unstakings || [] : []}
            />
          </Form.Item>
        </Form>
      </TransactionContent>
      <TransactionFooter>
        {
          !isWebUI && (
            <Button
              disabled={loading}
              icon={(
                <Icon
                  phosphorIcon={XCircle}
                  weight='fill'
                />
              )}
              onClick={goHome}
              schema={'secondary'}
            >
              {t('Cancel')}
            </Button>
          )
        }

        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onPreCheck(form.submit, ExtrinsicType.STAKING_CANCEL_UNSTAKE)}
        >
          {t('Approve')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <EarnOutlet
      className={CN(className)}
      path={'/transaction/cancel-unstake'}
      stores={['earning']}
    >
      <Component />
    </EarnOutlet>
  );
};

const CancelUnstake = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.unstaked-field, .free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.cancel-unstake-info-item > .__col': {
      flex: 'initial',
      paddingRight: token.paddingXXS
    }
  };
});

export default CancelUnstake;
