// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NominationInfo, StakingStatus, StakingType, UnstakingInfo, UnstakingStatus, YieldPoolInfo, YieldPoolType, YieldPositionMetadata } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { getValidatorLabel, isShowNominationByValidator } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _getChainNativeTokenBasicInfo, _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { BaseModal, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { TagTypes } from '@subwallet/extension-koni-ui/components/EarningItem';
import { DEFAULT_UN_YIELD_PARAMS, DEFAULT_YIELD_PARAMS, EARNING_MANAGEMENT_DETAIL_MODAL, StakingStatusUi, UN_YIELD_TRANSACTION, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { useFetchChainInfo, useGetAccountsByStaking, usePreCheckAction, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { MORE_ACTION_MODAL } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import { getUnstakingPeriod, getWaitingTime } from '@subwallet/extension-koni-ui/Popup/Transaction/helper/staking/stakingHandler';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll, toShort } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, ModalContext, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowCircleUpRight, DotsThree } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

interface Props extends ThemeProps {
  yieldPositionMetadata: YieldPositionMetadata;
  yieldPoolInfo: YieldPoolInfo;
  // rewardItem?: StakingRewardItem;
}

export const getUnstakingInfo = (unstakings: UnstakingInfo[], address: string) => {
  return unstakings.find((item) => item.validatorAddress === address);
};

const modalId = EARNING_MANAGEMENT_DETAIL_MODAL;

const Component: React.FC<Props> = ({ className, yieldPoolInfo, yieldPositionMetadata }: Props) => {
  const { currentAccount, isAllAccount } = useSelector((state: RootState) => state.accountState);
  const chainStakingMetadata = useMemo(() => yieldPoolInfo.metadata, [yieldPoolInfo]);
  const { expectedReturn, minJoinNominationPool, minStake, unstakingPeriod } = chainStakingMetadata || {};
  const { activeStake, address, chain, nominations, type, unstakings } = yieldPositionMetadata;
  const showingOption = isShowNominationByValidator(chain);
  const isRelayChain = _STAKING_CHAIN_GROUP.relay.includes(chain);
  const modalTitle = type === StakingType.NOMINATED.valueOf() ? detectTranslate('Nomination details') : detectTranslate('Pooled details');

  const { token } = useTheme() as Theme;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [seeMore, setSeeMore] = useState<boolean>(false);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const onClickFooterButton = usePreCheckAction(currentAccount?.address, false);

  const chainInfo = useFetchChainInfo(yieldPoolInfo.chain);
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);
  const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);
  const account = isAllAccount ? null : currentAccount;

  const [, setYieldStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const [, setUnStakeStorage] = useLocalStorage(UN_YIELD_TRANSACTION, DEFAULT_UN_YIELD_PARAMS);

  const stakingAccounts = useGetAccountsByStaking(chain, type);

  const onClickStakeMoreBtn = useCallback(() => {
    inactiveModal(modalId);
    setTimeout(() => {
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setYieldStorage({
        ...DEFAULT_YIELD_PARAMS,
        method: yieldPoolInfo.slug,
        from: address,
        chain: yieldPoolInfo.chain,
        asset: yieldPoolInfo.inputAssets[0]
      });
      navigate('/transaction/earn');
    }, 300);
  }, [currentAccount, inactiveModal, navigate, setYieldStorage, yieldPoolInfo]);

  const onClickUnstakeBtn = useCallback(() => {
    inactiveModal(modalId);
    setTimeout(() => {
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setUnStakeStorage({
        ...DEFAULT_UN_YIELD_PARAMS,
        from: address,
        chain: yieldPoolInfo.chain,
        method: yieldPoolInfo.slug,
        asset: yieldPoolInfo.inputAssets[0]
      });
      navigate('/transaction/un-yield');
    }, 300);
  }, [currentAccount, inactiveModal, navigate, setUnStakeStorage, yieldPoolInfo]);

  const onClickMoreAction = useCallback(() => {
    activeModal(MORE_ACTION_MODAL);
    inactiveModal(modalId);
  }, [activeModal, inactiveModal]);

  const footer = () => {
    return (
      <div className='staking-detail-modal-footer'>
        <Button
          icon={<Icon phosphorIcon={DotsThree} />}
          onClick={onClickMoreAction}
          schema='secondary'
        />
        <Button
          className='__action-btn'
          disabled={new BigN(activeStake || '0').lte(0) }
          onClick={onClickFooterButton(
            onClickUnstakeBtn,
            yieldPoolInfo.type === YieldPoolType.NOMINATION_POOL ? ExtrinsicType.STAKING_LEAVE_POOL : ExtrinsicType.STAKING_UNBOND
          )}
          schema='secondary'
        >{t('Unstake')}</Button>
        <Button
          className='__action-btn'
          onClick={onClickFooterButton(
            onClickStakeMoreBtn,
            yieldPoolInfo.type === YieldPoolType.NOMINATION_POOL ? ExtrinsicType.STAKING_BOND : ExtrinsicType.STAKING_JOIN_POOL
          )}
        >{t('Stake more')}</Button>
      </div>
    );
  };

  const onClickSeeMoreBtn = useCallback(() => {
    setSeeMore(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setSeeMore(false);
    inactiveModal(modalId);
  }, [inactiveModal]);

  const getStakingStatus = useCallback((status: StakingStatus) => {
    if (status === StakingStatus.EARNING_REWARD) {
      return StakingStatusUi.active;
    }

    if (status === StakingStatus.PARTIALLY_EARNING) {
      return StakingStatusUi.partialEarning;
    }

    if (status === StakingStatus.WAITING) {
      return StakingStatusUi.waiting;
    }

    return StakingStatusUi.inactive;
  }, []);

  const renderUnstakingInfo = useCallback((item: NominationInfo) => {
    const unstakingData = getUnstakingInfo(unstakings, item.validatorAddress);

    return (
      <MetaInfo
        hasBackgroundWrapper
        key={item.validatorAddress}
        spaceSize={'sm'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={item.validatorAddress}
          label={t(getValidatorLabel(item.chain))}
          name={item.validatorIdentity || toShort(item.validatorAddress)}
          networkPrefix={networkPrefix}
        />

        <MetaInfo.Number
          decimals={decimals}
          key={item.validatorAddress}
          label={t('Active staked')}
          suffix={symbol}
          value={item.activeStake || ''}
          valueColorSchema={'gray'}
        />

        <MetaInfo.Number
          decimals={decimals}
          key={item.validatorAddress}
          label={t('Minimum staked')}
          suffix={symbol}
          value={item.validatorMinStake || '0'}
          valueColorSchema={'gray'}
        />

        {!!unstakingData && showingOption === 'showByValidator' && <MetaInfo.Default
          className={'__para'}
          label={t('Unstaked')}
          labelAlign={unstakingData.status === UnstakingStatus.UNLOCKING.valueOf() ? 'top' : 'center'}
        >
          <div>
            <Number
              className={'common-text text-light-4 text-right'}
              decimal={decimals}
              suffix={symbol}
              value={unstakingData.claimable}
            />

            {unstakingData.status === UnstakingStatus.UNLOCKING.valueOf() &&
              <div className={'sm-text text-light-4'}>
                {getWaitingTime(unstakingData.waitingTime, unstakingData.status, t)}
              </div>
            }
          </div>
        </MetaInfo.Default>}

        <MetaInfo.Status
          label={t('Staking status')}
          statusIcon={getStakingStatus(item.status).icon}
          statusName={t(getStakingStatus(item.status).name)}
          valueColorSchema={getStakingStatus(item.status).schema}
        />
      </MetaInfo>
    );
  }, [decimals, getStakingStatus, networkPrefix, showingOption, symbol, t, unstakings]);

  return (
    <BaseModal
      className={className}
      closable={true}
      footer={footer()}
      id={modalId}
      maskClosable={true}
      onCancel={onCloseModal}
      title={t(modalTitle)}
    >
      <MetaInfo>
        <MetaInfo.Account
          accounts={isAccountAll(address) ? stakingAccounts : undefined}
          address={address}
          label={t('Account')}
          name={account?.name}
        />

        {/* change this when all account data is full */}
        {/* <MetaInfo.AccountGroup label={'Account'} accounts={accounts} content={`${accounts.length} accounts staking`} /> */}

        <MetaInfo.DisplayType
          label={t('Staking type')}
          typeName={TagTypes(t)[yieldPoolInfo.type].label}
        />
        <MetaInfo.Status
          label={t('Staking status')}
          statusIcon={getStakingStatus(yieldPositionMetadata.status).icon}
          statusName={t(getStakingStatus(yieldPositionMetadata.status).name)}
          valueColorSchema={getStakingStatus(yieldPositionMetadata.status).schema}
        />

        {/* {!!rewardItem?.totalReward && parseFloat(rewardItem?.totalReward) > 0 && ( */}
        {/*  <MetaInfo.Number */}
        {/*    decimals={decimals} */}
        {/*    label={t('Total reward')} */}
        {/*    suffix={staking.nativeToken} */}
        {/*    value={rewardItem?.totalReward || '0'} */}
        {/*  /> */}
        {/* )} */}

        {/* {!!rewardItem?.unclaimedReward && ( */}
        {/*  <MetaInfo.Number */}
        {/*    decimals={decimals} */}
        {/*    label={t('Unclaimed rewards')} */}
        {/*    suffix={staking.nativeToken} */}
        {/*    value={rewardItem?.unclaimedReward || '0'} */}
        {/*  /> */}
        {/* )} */}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Total staked')}
          suffix={symbol}
          // value={String(parseFloat(activeStake) + parseFloat(staking.unlockingBalance || '0'))}
          value={String(parseFloat(activeStake) + parseFloat('0'))}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Active staked')}
          suffix={symbol}
          value={activeStake}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Unstaked')}
          suffix={symbol}
          // value={staking.unlockingBalance || '0'}
          value={'0'}
        />

        <MetaInfo.Chain
          chain={yieldPoolInfo.chain}
          label={t('Network')}
        />
      </MetaInfo>

      {!seeMore && <Button
        block
        className={'see-more-btn'}
        icon={<Icon
          iconColor={token.colorTextLight4}
          phosphorIcon={ArrowCircleUpRight}
          size={'sm'}
        />}
        onClick={onClickSeeMoreBtn}
        size={'xs'}
        type={'ghost'}
      >
        {t('See more')}
      </Button>}

      {seeMore && <>
        <MetaInfo
          hasBackgroundWrapper
          spaceSize={'xs'}
          valueColorScheme={'light'}
        >
          {!!expectedReturn &&
            <MetaInfo.Number
              className={'expected-return'}
              label={t('Estimated annual earnings')}
              suffix={'%'}
              value={expectedReturn}
              valueColorSchema={'even-odd'}
            />
          }

          <MetaInfo.Number
            decimals={decimals}
            label={t('Minimum active')}
            suffix={symbol}
            value={yieldPoolInfo.type === YieldPoolType.NATIVE_STAKING ? (minStake || '0') : (minJoinNominationPool || '0')}
            valueColorSchema={'gray'}
          />

          {!!unstakingPeriod && <MetaInfo.Default
            label={t('Unstaking period')}
            valueColorSchema={'gray'}
          >
            {getUnstakingPeriod(t, unstakingPeriod)}
          </MetaInfo.Default>}
        </MetaInfo>

        {showingOption === 'showByValue' && (nominations && nominations.length > 0) && currentAccount?.address !== ALL_ACCOUNT_KEY && (
          <>
            <MetaInfo valueColorScheme={'light'}>
              <MetaInfo.Number
                decimals={decimals}
                label={t('Active staked')}
                suffix={symbol}
                value={activeStake}
              />
            </MetaInfo>
            <MetaInfo
              hasBackgroundWrapper
              spaceSize={'xs'}
              valueColorScheme={'light'}
            >
              <>
                {nominations.map((item) => {
                  if (isRelayChain && type === StakingType.NOMINATED) {
                    return (
                      <MetaInfo.Default
                        className={CN('__nomination-field', 'stand-alone')}
                        key={`${item.validatorAddress}-${item.activeStake}-${item.validatorIdentity || item.validatorMinStake || item.chain}`}
                        label={(
                          <MetaInfo.Account
                            address={item.validatorAddress}
                            className={'__nomination-label'}
                            name={item.validatorIdentity}
                          />
                        )}
                      >
                      </MetaInfo.Default>
                    );
                  }

                  return (
                    <MetaInfo.Number
                      className={'__nomination-field'}
                      decimals={decimals}
                      key={`${item.validatorAddress}-${item.activeStake}-${item.validatorIdentity || item.validatorMinStake || item.chain}`}
                      label={(
                        <MetaInfo.Account
                          address={item.validatorAddress}
                          className={'__nomination-label'}
                          name={item.validatorIdentity}
                        />
                      )}
                      suffix={symbol}
                      value={item.activeStake || ''}
                      valueColorSchema={'gray'}
                    />
                  );
                })}
              </>
            </MetaInfo>
          </>
        )}

        {(showingOption === 'showByValue' || showingOption === 'mixed') && (unstakings && unstakings.length > 0) && currentAccount?.address !== ALL_ACCOUNT_KEY && (
          <>
            <MetaInfo valueColorScheme={'light'}>
              <MetaInfo.Number
                decimals={decimals}
                label={t('Unstaked')}
                suffix={symbol}
                // value={staking.unlockingBalance || '0'}
                value={'0'}
              />
            </MetaInfo>
            <MetaInfo
              hasBackgroundWrapper
              spaceSize={'xs'}
              valueColorScheme={'light'}
            >
              <>
                {unstakings.map((item) => (
                  <MetaInfo.Number
                    decimals={decimals}
                    key={`${item.validatorAddress || item.chain}-${item.status}-${item.claimable}`}
                    label={getWaitingTime(item.waitingTime, item.status, t) ? t(getWaitingTime(item.waitingTime, item.status, t)) : t('Withdraw')}
                    suffix={symbol}
                    value={item.claimable || ''}
                    valueColorSchema={'gray'}
                  />
                ))}
              </>
            </MetaInfo>
          </>
        )}

        {(showingOption === 'showByValidator' || showingOption === 'mixed') && (nominations && nominations.length > 0) && currentAccount?.address !== ALL_ACCOUNT_KEY &&
          <>
            {nominations && nominations.length && nominations.map((item) => (
              renderUnstakingInfo(item)
            ))}
          </>
        }
      </>}
    </BaseModal>
  );
};

const EarningManagementDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.expected-return div:first-child': {
      flex: 2
    },

    '.staking-detail-modal-footer': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__action-btn': {
      flex: 1
    },

    '.__slash': {
      marginLeft: token.marginXXS,
      marginRight: token.marginXXS
    },

    '.__inflation-text': {
      marginLeft: token.marginXXS,
      color: token.colorTextLight4
    },

    '.__expected-return, .__inflation': {
      display: 'inline-flex'
    },

    '.__inflation': {
      color: token.colorTextLight4
    },

    '.__nomination-field': {
      '> .__col': {
        overflow: 'hidden'
      },

      '&.stand-alone': {
        '.__col.-to-right': {
          flexGrow: 0
        }
      }
    },

    '.__nomination-label > .__col.-to-right': {
      flex: 'initial',
      overflow: 'hidden',
      alignItems: 'flex-start',

      '.__account-item': {
        width: '100%'
      },

      '.__account-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }
    },

    '.see-more-btn': {
      marginTop: token.margin
    },

    '.ant-sw-modal-body': {
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 'none'
    }
  };
});

export default EarningManagementDetailModal;
