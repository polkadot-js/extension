// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getSubstrateGenesisHash, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, HiddenInput, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGetNativeTokenBasicInfo, useGetNominatorInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@subwallet/extension-koni-ui/hooks';
import { submitStakeClaimReward } from '@subwallet/extension-koni-ui/messaging';
import { ClaimRewardParams, FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Checkbox, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const hideFields: Array<keyof ClaimRewardParams> = ['chain', 'type', 'asset'];
const validateFields: Array<keyof ClaimRewardParams> = ['from'];

const Component: React.FC<Props> = (props: Props) => {
  useSetCurrentPage('/transaction/claim-reward');
  const { className } = props;

  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { defaultData, onDone, persistData } = useTransactionContext<ClaimRewardParams>();
  const { chain, type } = defaultData;

  const [form] = Form.useForm<ClaimRewardParams>();
  const formDefault = useMemo((): ClaimRewardParams => ({ ...defaultData }), [defaultData]);

  const { isAllAccount } = useSelector((state) => state.accountState);
  const { stakingRewardMap } = useSelector((state) => state.staking);
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const allNominatorInfo = useGetNominatorInfo(chain, type);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const from = useWatchTransaction('from', form, defaultData);

  const reward = useMemo((): StakingRewardItem | undefined => {
    return stakingRewardMap.find((item) => item.chain === chain && item.address === from && item.type === type);
  }, [chain, from, stakingRewardMap, type]);

  const rewardList = useMemo((): StakingRewardItem[] => {
    return stakingRewardMap.filter((item) => item.chain === chain && item.type === type);
  }, [chain, stakingRewardMap, type]);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const goHome = useCallback(() => {
    navigate('/home/staking');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<ClaimRewardParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['asset']);

    const allMap = convertFieldToObject<ClaimRewardParams>(allFields);

    setIsDisable(error || empty);
    persistData(allMap);
  }, [persistData]);

  const { t } = useTranslation();

  const onSubmit: FormCallbacks<ClaimRewardParams>['onFinish'] = useCallback((values: ClaimRewardParams) => {
    setLoading(true);

    const { bondReward } = values;

    setTimeout(() => {
      submitStakeClaimReward({
        address: from,
        chain: chain,
        bondReward: bondReward,
        stakingType: type,
        unclaimedReward: reward?.unclaimedReward
      })
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [chain, from, onError, onSuccess, reward?.unclaimedReward, type]);

  const checkAction = usePreCheckAction(from);

  const filterAccount = useCallback((account: AccountJson): boolean => {
    const chainInfo = chainInfoMap[chain];

    if (!chainInfo) {
      return false;
    }

    if (account.originGenesisHash && _getSubstrateGenesisHash(chainInfo) !== account.originGenesisHash) {
      return false;
    }

    if (isAccountAll(account.address)) {
      return false;
    }

    if (account.isReadOnly) {
      return false;
    }

    const isEvmChain = _isChainEvmCompatible(chainInfo);

    if (isEvmChain !== isEthereumAddress(account.address)) {
      return false;
    }

    const nominatorMetadata = allNominatorInfo.find((value) => isSameAddress(value.address, account.address));

    if (!nominatorMetadata) {
      return false;
    }

    const reward = rewardList.find((value) => isSameAddress(value.address, account.address));

    const isAstarNetwork = _STAKING_CHAIN_GROUP.astar.includes(chain);
    const isAmplitudeNetwork = _STAKING_CHAIN_GROUP.amplitude.includes(chain);
    const bnUnclaimedReward = new BN(reward?.unclaimedReward || '0');

    return ((type === StakingType.POOLED || isAmplitudeNetwork) && bnUnclaimedReward.gt(BN_ZERO)) || (isAstarNetwork && !!nominatorMetadata.nominations.length);
  }, [allNominatorInfo, chainInfoMap, rewardList, chain, type]);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  return (
    <div className={className}>
      <TransactionContent>
        <PageWrapper resolve={dataContext.awaitStores(['staking'])}>
          <Form
            className={CN('form-container form-space-sm')}
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
                className='claim-reward-meta-info'
                hasBackgroundWrapper={true}
              >
                <MetaInfo.Chain
                  chain={chain}
                  label={t('Network')}
                />
                {
                  reward?.unclaimedReward && (
                    <MetaInfo.Number
                      decimals={decimals}
                      label={t('Reward claiming')}
                      suffix={symbol}
                      value={reward.unclaimedReward}
                    />
                  )
                }
              </MetaInfo>
            </Form.Item>
            <Form.Item
              hidden={type !== StakingType.POOLED}
              name={'bondReward'}
              valuePropName='checked'
            >
              <Checkbox>
                <span className={'__option-label'}>{t('Bond reward after claim')}</span>
              </Checkbox>
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
          onClick={checkAction(form.submit, ExtrinsicType.STAKING_CLAIM_REWARD)}
        >
          {t('Continue')}
        </Button>
      </TransactionFooter>
    </div>
  );
};

const ClaimReward = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    '.web-ui-enable &': {
      paddingTop: 24,
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

    '.unstaked-field, .free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    },

    '.cancel-unstake-info-item > .__col': {
      flex: 'initial',
      paddingRight: token.paddingXXS
    },

    '.claim-reward-meta-info': {
      marginTop: token.marginXXS
    },

    '.ant-checkbox-wrapper': {
      display: 'flex',
      alignItems: 'center',

      '.ant-checkbox': {
        top: 0
      }
    }
  };
});

export default ClaimReward;
