// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NominatorMetadata, RequestStakeWithdrawal, StakingType, UnstakingInfo, UnstakingStatus } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { getAstarWithdrawable } from '@subwallet/extension-base/koni/api/staking/bonding/astar';
import { isActionFromValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, HiddenInput, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGetNativeTokenBasicInfo, useGetYieldPositionInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { yieldSubmitStakingWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps, YieldStakingWithdrawParams } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { accountFilterFunc } from '../../helper';
import { FreeBalance, TransactionContent, TransactionFooter } from '../../parts';

type Props = ThemeProps;

const hideFields: Array<keyof YieldStakingWithdrawParams> = ['chain', 'asset', 'method'];
const validateFields: Array<keyof YieldStakingWithdrawParams> = ['from'];

const Component: React.FC = () => {
  useSetCurrentPage('/transaction/withdraw-yield');

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { defaultData, onDone, persistData } = useTransactionContext<YieldStakingWithdrawParams>();
  const { chain, method } = defaultData;

  const [form] = Form.useForm<YieldStakingWithdrawParams>();
  const formDefault = useMemo((): YieldStakingWithdrawParams => ({ ...defaultData }), [defaultData]);

  const { isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const from = useWatchTransaction('from', form, defaultData);

  const allNominatorInfo = useGetYieldPositionInfo(method);
  const nominatorInfo = useGetYieldPositionInfo(method, from);
  const nominatorMetadata = nominatorInfo[0].metadata as NominatorMetadata;
  const type = nominatorMetadata.type;

  const unstakingInfo = useMemo((): UnstakingInfo | undefined => {
    if (from && !isAccountAll(from)) {
      if (_STAKING_CHAIN_GROUP.astar.includes(nominatorMetadata.chain)) {
        return getAstarWithdrawable(nominatorMetadata);
      }

      return nominatorMetadata.unstakings.filter((data) => data.status === UnstakingStatus.CLAIMABLE)[0];
    }

    return undefined;
  }, [from, nominatorMetadata]);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const goHome = useCallback(() => {
    navigate('/home/earning');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<YieldStakingWithdrawParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['asset']);

    const values = convertFieldToObject<YieldStakingWithdrawParams>(allFields);

    setIsDisable(empty || error);
    persistData(values);
  }, [persistData]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onSubmit: FormCallbacks<YieldStakingWithdrawParams>['onFinish'] = useCallback((values: YieldStakingWithdrawParams) => {
    setLoading(true);

    if (!unstakingInfo) {
      setLoading(false);

      return;
    }

    const params: RequestStakeWithdrawal = {
      unstakingInfo: unstakingInfo,
      chain: nominatorMetadata.chain,
      nominatorMetadata: nominatorMetadata
    };

    if (isActionFromValidator(type, chain)) {
      params.validatorAddress = unstakingInfo.validatorAddress;
    }

    setTimeout(() => {
      yieldSubmitStakingWithdrawal(params)
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [chain, nominatorMetadata, onError, onSuccess, type, unstakingInfo]);

  const onPreCheck = usePreCheckAction(from);

  const filterAccount = useCallback((account: AccountJson): boolean => {
    const nomination = allNominatorInfo.find((data) => isSameAddress(data.address, account.address));

    return (nomination ? (nomination.metadata as NominatorMetadata)?.unstakings.filter((data) => data.status === UnstakingStatus.CLAIMABLE).length > 0 : false) && accountFilterFunc(chainInfoMap, type, chain)(account);
  }, [chainInfoMap, allNominatorInfo, chain, type]);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  return (
    <>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(['yieldPool'])}>
          <Form
            className={'form-container form-space-sm'}
            form={form}
            initialValues={formDefault}
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            <HiddenInput fields={hideFields} />
            <Form.Item
              hidden={!isAllAccount}
              name={'from'}
            >
              <AccountSelector filter={filterAccount} />
            </Form.Item>
            <FreeBalance
              address={from}
              chain={chain}
              className={'free-balance'}
              label={t('Available balance:')}
              onBalanceReady={setIsBalanceReady}
            />
            <Form.Item>
              <MetaInfo
                className='withdraw-meta-info'
                hasBackgroundWrapper={true}
              >
                <MetaInfo.Chain
                  chain={chain}
                  label={t('Network')}
                />
                {
                  unstakingInfo && (
                    <MetaInfo.Number
                      decimals={decimals}
                      label={t('Amount')}
                      suffix={symbol}
                      value={unstakingInfo.claimable}
                    />
                  )
                }
              </MetaInfo>
            </Form.Item>
          </Form>
        </PageWrapper>
      </TransactionContent>
      <TransactionFooter
        errors={[]}
        warnings={[]}
      >
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

        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onPreCheck(form.submit, type === StakingType.POOLED ? ExtrinsicType.STAKING_POOL_WITHDRAW : ExtrinsicType.STAKING_WITHDRAW)}
        >
          {t('Continue')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  useSetCurrentPage('/transaction/withdraw-yield');

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['yieldPool'])}
    >
      <Component />
    </PageWrapper>
  );
};

const YieldWithdraw = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    '.web-ui-enable &': {
      display: 'block',
      maxWidth: 416,
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',

      '.transaction-footer': {
        paddingTop: 4,
        gap: token.size
      }
    },

    '.free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default YieldWithdraw;
