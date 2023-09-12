// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getSubstrateGenesisHash, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { AccountSelector, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useGetNativeTokenBasicInfo, useGetNominatorInfo, useHandleSubmitTransaction, usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { submitStakeClaimReward } from '@subwallet/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, noop, simpleCheckForm } from '@subwallet/extension-koni-ui/utils';
import { Button, Checkbox, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';
import { TransactionContext, TransactionFormBaseProps } from '../Transaction';

type Props = ThemeProps;

enum FormFieldName {
  BOND_REWARD = 'bond-reward'
}

interface ClaimRewardFormProps extends TransactionFormBaseProps {
  [FormFieldName.BOND_REWARD]: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { chain: stakingChain, type: _stakingType } = useParams();
  const stakingType = _stakingType as StakingType;

  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { asset, chain, from, onDone, setChain, setFrom } = useContext(TransactionContext);

  const { currentAccount, isAllAccount } = useSelector((state) => state.accountState);
  const { stakingRewardMap } = useSelector((state) => state.staking);
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const allNominatorInfo = useGetNominatorInfo(stakingChain, stakingType);
  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  const reward = useMemo((): StakingRewardItem | undefined => {
    return stakingRewardMap.find((item) => item.chain === chain && item.address === from && item.type === stakingType);
  }, [chain, from, stakingRewardMap, stakingType]);

  const rewardList = useMemo((): StakingRewardItem[] => {
    return stakingRewardMap.filter((item) => item.chain === chain && item.type === stakingType);
  }, [chain, stakingRewardMap, stakingType]);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const [form] = Form.useForm<ClaimRewardFormProps>();
  const formDefault = useMemo((): ClaimRewardFormProps => ({
    from: from,
    chain: chain,
    asset: asset,
    [FormFieldName.BOND_REWARD]: true
  }), [asset, chain, from]);

  const { onError, onSuccess } = useHandleSubmitTransaction(onDone);

  const goHome = useCallback(() => {
    navigate('/home/staking');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<ClaimRewardFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { error } = simpleCheckForm(allFields);

    const changesMap = convertFieldToObject<ClaimRewardFormProps>(changedFields);
    const allMap = convertFieldToObject<ClaimRewardFormProps>(allFields);

    const { from } = changesMap;

    if (from !== undefined) {
      setFrom(from);
    }

    setIsDisable(error || !(allMap.from ?? true));
  }, [setFrom]);

  const { t } = useTranslation();

  const onSubmit: FormCallbacks<ClaimRewardFormProps>['onFinish'] = useCallback((values: ClaimRewardFormProps) => {
    setLoading(true);

    const { [FormFieldName.BOND_REWARD]: bondReward } = values;

    setTimeout(() => {
      submitStakeClaimReward({
        address: from,
        chain: chain,
        bondReward: bondReward,
        stakingType: stakingType,
        unclaimedReward: reward?.unclaimedReward
      })
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [chain, from, onError, onSuccess, reward?.unclaimedReward, stakingType]);

  const checkAction = usePreCheckAction(from);

  const filterAccount = useCallback((account: AccountJson): boolean => {
    const _stakingChain = stakingChain || '';
    const chain = chainInfoMap[_stakingChain];

    if (!chain) {
      return false;
    }

    if (account.originGenesisHash && _getSubstrateGenesisHash(chain) !== account.originGenesisHash) {
      return false;
    }

    if (isAccountAll(account.address)) {
      return false;
    }

    if (account.isReadOnly) {
      return false;
    }

    const isEvmChain = _isChainEvmCompatible(chain);

    if (isEvmChain !== isEthereumAddress(account.address)) {
      return false;
    }

    const nominatorMetadata = allNominatorInfo.find((value) => isSameAddress(value.address, account.address));

    if (!nominatorMetadata) {
      return false;
    }

    const reward = rewardList.find((value) => isSameAddress(value.address, account.address));

    const isAstarNetwork = _STAKING_CHAIN_GROUP.astar.includes(_stakingChain);
    const isAmplitudeNetwork = _STAKING_CHAIN_GROUP.amplitude.includes(_stakingChain);
    const bnUnclaimedReward = new BN(reward?.unclaimedReward || '0');

    return ((stakingType === StakingType.POOLED || isAmplitudeNetwork) && bnUnclaimedReward.gt(BN_ZERO)) || (isAstarNetwork && !!nominatorMetadata.nominations.length);
  }, [allNominatorInfo, chainInfoMap, rewardList, stakingChain, stakingType]);

  useEffect(() => {
    const address = currentAccount?.address || '';

    if (address) {
      if (!isAccountAll(address)) {
        setFrom(address);
      }
    }
  }, [currentAccount?.address, form, setFrom]);

  useEffect(() => {
    setChain(stakingChain || '');
  }, [setChain, stakingChain]);

  useEffect(() => {
    // Trick to trigger validate when case single account
    setTimeout(() => {
      form.validateFields().finally(noop);
    }, 500);
  }, [form]);

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
            {
              stakingType === StakingType.POOLED && (
                <Form.Item
                  name={FormFieldName.BOND_REWARD}
                  valuePropName='checked'
                >
                  <Checkbox>
                    <span className={'__option-label'}>{t('Bond reward after claim')}</span>
                  </Checkbox>
                </Form.Item>
              )
            }
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
