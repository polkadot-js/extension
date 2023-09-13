// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, RequestStakeWithdrawal, StakingType, UnstakingInfo, UnstakingStatus } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { getAstarWithdrawable } from '@subwallet/extension-base/koni/api/staking/bonding/astar';
import { isActionFromValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGetNativeTokenBasicInfo, useGetNominatorInfo, useHandleSubmitTransaction, usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { submitStakeWithdrawal } from '@subwallet/extension-koni-ui/messaging';
import { accountFilterFunc } from '@subwallet/extension-koni-ui/Popup/Transaction/helper';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';
import { TransactionContext, TransactionFormBaseProps } from '../Transaction';

type Props = ThemeProps;

type WithdrawFormProps = TransactionFormBaseProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className = '' } = props;

  const { chain: stakingChain, type: _stakingType } = useParams();
  const stakingType = _stakingType as StakingType;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { asset, chain, from, onDone, setChain, setFrom } = useContext(TransactionContext);

  const { currentAccount, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const allNominatorInfo = useGetNominatorInfo(stakingChain, stakingType);
  const nominatorInfo = useGetNominatorInfo(stakingChain, stakingType, from);
  const nominatorMetadata = nominatorInfo[0];

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

  const [form] = Form.useForm<WithdrawFormProps>();
  const formDefault = useMemo((): WithdrawFormProps => ({
    from: from,
    chain: chain,
    asset: asset
  }), [asset, chain, from]);

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const goHome = useCallback(() => {
    navigate('/home/staking');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<WithdrawFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields);

    const changesMap = convertFieldToObject<WithdrawFormProps>(changedFields);

    const { from } = changesMap;

    if (from !== undefined) {
      setFrom(from);
    }

    setIsDisable(empty || error);
  }, [setFrom]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const onSubmit: FormCallbacks<WithdrawFormProps>['onFinish'] = useCallback((values: WithdrawFormProps) => {
    setLoading(true);

    if (!unstakingInfo) {
      setLoading(false);

      return;
    }

    const params: RequestStakeWithdrawal = {
      unstakingInfo: unstakingInfo,
      chain: nominatorMetadata.chain,
      nominatorMetadata
    };

    if (isActionFromValidator(stakingType, chain)) {
      params.validatorAddress = unstakingInfo.validatorAddress;
    }

    setTimeout(() => {
      submitStakeWithdrawal(params)
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [chain, nominatorMetadata, onError, onSuccess, stakingType, unstakingInfo]);

  const onPreCheck = usePreCheckAction(from);

  const filterAccount = useCallback((account: AccountJson): boolean => {
    const nomination = allNominatorInfo.find((data) => isSameAddress(data.address, account.address));

    return (nomination ? nomination.unstakings.filter((data) => data.status === UnstakingStatus.CLAIMABLE).length > 0 : false) && accountFilterFunc(chainInfoMap, stakingType, stakingChain)(account);
  }, [chainInfoMap, allNominatorInfo, stakingChain, stakingType]);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (address) {
      if (!isAccountAll(address)) {
        setFrom(address);
      }
    }
  }, [currentAccount?.address, setFrom]);

  useEffect(() => {
    setChain(stakingChain || '');
  }, [setChain, stakingChain]);

  return (
    <div className={className}>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(['staking'])}>
          <Form
            className={'form-container form-space-sm'}
            form={form}
            initialValues={formDefault}
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            {isAllAccount &&
              <Form.Item name={'from'}>
                <AccountSelector filter={filterAccount} />
              </Form.Item>
            }
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
          onClick={onPreCheck(form.submit, stakingType === StakingType.POOLED ? ExtrinsicType.STAKING_POOL_WITHDRAW : ExtrinsicType.STAKING_WITHDRAW)}
        >
          {t('Continue')}
        </Button>
      </TransactionFooter>
    </div>
  );
};

const Withdraw = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

export default Withdraw;
