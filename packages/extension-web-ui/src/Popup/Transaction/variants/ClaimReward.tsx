// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { AmountData, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _getSubstrateGenesisHash, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { EarningRewardItem, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, HiddenInput, MetaInfo } from '@subwallet/extension-web-ui/components';
import { BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useGetNativeTokenBasicInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useTransactionContext, useWatchTransaction, useYieldPositionDetail } from '@subwallet/extension-web-ui/hooks';
import { yieldSubmitStakingClaimReward } from '@subwallet/extension-web-ui/messaging';
import { ClaimRewardParams, FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-web-ui/types';
import { convertFieldToObject, isAccountAll, simpleCheckForm } from '@subwallet/extension-web-ui/utils';
import { Button, Checkbox, Form, Icon } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { EarnOutlet, FreeBalance, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const hideFields: Array<keyof ClaimRewardParams> = ['chain', 'slug', 'asset'];
const validateFields: Array<keyof ClaimRewardParams> = ['from'];

const filterAccount = (
  chainInfoMap: Record<string, _ChainInfo>,
  yieldPositions: YieldPositionInfo[],
  rewardList: EarningRewardItem[],
  poolType: YieldPoolType,
  poolChain?: string
): ((account: AccountJson) => boolean) => {
  const _poolChain = poolChain || '';
  const chain = chainInfoMap[_poolChain];

  return (account: AccountJson): boolean => {
    if (!chain) {
      return false;
    }

    if (account.originGenesisHash && _getSubstrateGenesisHash(chain) !== account.originGenesisHash) {
      return false;
    }

    if (isAccountAll(account.address)) {
      return false;
    }

    const isEvmChain = _isChainEvmCompatible(chain);

    if (isEvmChain !== isEthereumAddress(account.address)) {
      return false;
    }

    const nominatorMetadata = yieldPositions.find((value) => isSameAddress(value.address, account.address));

    if (!nominatorMetadata) {
      return false;
    }

    const reward = rewardList.find((value) => isSameAddress(value.address, account.address));

    const isAstarNetwork = _STAKING_CHAIN_GROUP.astar.includes(_poolChain);
    const isAmplitudeNetwork = _STAKING_CHAIN_GROUP.amplitude.includes(_poolChain);
    const bnUnclaimedReward = new BigN(reward?.unclaimedReward || '0');

    return (
      ((poolType === YieldPoolType.NOMINATION_POOL || isAmplitudeNetwork) && bnUnclaimedReward.gt(BN_ZERO)) ||
      isAstarNetwork
    );
  };
};

const Component = () => {
  const navigate = useNavigate();
  const { isWebUI } = useContext(ScreenContext);

  const { defaultData, persistData } = useTransactionContext<ClaimRewardParams>();
  const { slug } = defaultData;

  const [form] = Form.useForm<ClaimRewardParams>();
  const formDefault = useMemo((): ClaimRewardParams => ({ ...defaultData }), [defaultData]);

  const { accounts, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { earningRewards, poolInfoMap } = useSelector((state) => state.earning);

  const fromValue = useWatchTransaction('from', form, defaultData);
  const chainValue = useWatchTransaction('chain', form, defaultData);

  const poolInfo = useMemo(() => poolInfoMap[slug], [poolInfoMap, slug]);
  const poolType = poolInfo.type;
  const poolChain = poolInfo.chain;

  const { list: allPositions } = useYieldPositionDetail(slug);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(chainValue);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const handleDataForInsufficientAlert = useCallback(
    (estimateFee: AmountData) => {
      return {
        chainName: chainInfoMap[chainValue]?.name || '',
        symbol: estimateFee.symbol
      };
    },
    [chainInfoMap, chainValue]
  );

  const { onError, onSuccess } = useHandleSubmitTransaction(undefined, handleDataForInsufficientAlert);

  const reward = useMemo((): EarningRewardItem | undefined => {
    return earningRewards.find((item) => item.slug === slug && item.address === fromValue);
  }, [earningRewards, fromValue, slug]);

  const rewardList = useMemo((): EarningRewardItem[] => {
    return earningRewards.filter((item) => item.slug === slug);
  }, [earningRewards, slug]);

  const goHome = useCallback(() => {
    navigate('/home/earning');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<ClaimRewardParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['--asset']);

    const allMap = convertFieldToObject<ClaimRewardParams>(allFields);

    setIsDisable(error || empty);
    persistData(allMap);
  }, [persistData]);

  const { t } = useTranslation();

  const onSubmit: FormCallbacks<ClaimRewardParams>['onFinish'] = useCallback((values: ClaimRewardParams) => {
    setLoading(true);

    const { bondReward, from, slug } = values;

    setTimeout(() => {
      yieldSubmitStakingClaimReward({
        address: from,
        bondReward: bondReward,
        slug,
        unclaimedReward: reward?.unclaimedReward
      })
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [onError, onSuccess, reward?.unclaimedReward]);

  const checkAction = usePreCheckAction(fromValue);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  useEffect(() => {
    form.setFieldValue('chain', poolChain);
  }, [form, poolChain]);

  const accountList = useMemo(() => {
    return accounts.filter(filterAccount(chainInfoMap, allPositions, rewardList, poolType, poolChain));
  }, [accounts, allPositions, chainInfoMap, poolChain, poolType, rewardList]);

  useEffect(() => {
    if (!fromValue && accountList.length === 1) {
      form.setFieldValue('from', accountList[0].address);
    }
  }, [accountList, form, fromValue]);

  return (
    <>
      <TransactionContent>
        <Form
          className={CN('form-container form-space-sm')}
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
          <Form.Item>
            <MetaInfo
              className='claim-reward-meta-info'
              hasBackgroundWrapper={true}
            >
              <MetaInfo.Chain
                chain={chainValue}
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
            name={'bondReward'}
            valuePropName='checked'
          >
            <Checkbox>
              <span className={'__option-label'}>{t('Stake reward after claim')}</span>
            </Checkbox>
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
          onClick={checkAction(form.submit, ExtrinsicType.STAKING_CLAIM_REWARD)}
        >
          {t('Continue')}
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
      path={'/transaction/claim-reward'}
      stores={['earning']}
    >
      <Component />
    </EarnOutlet>
  );
};

const ClaimReward = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
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
