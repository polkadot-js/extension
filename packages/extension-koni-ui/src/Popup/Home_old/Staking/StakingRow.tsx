// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingRewardItem, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import UserIcon from '@subwallet/extension-koni-ui/assets/user.svg';
import UsersIcon from '@subwallet/extension-koni-ui/assets/users.svg';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { formatLocaleNumber } from '@subwallet/extension-koni-ui/util/formatNumber';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

const StakingMenu = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/StakingMenu'));

interface Props extends ThemeProps {
  className?: string;
  logo: string;
  chainName: string;
  symbol: string;
  totalStake: string | undefined;
  unit: string | undefined;
  index: number;
  reward: StakingRewardItem;
  price: number;
  networkKey: string;
  stakingType: StakingType;
  activeStake: string | undefined;
  unbondingStake: string | undefined;
  isCanSign: boolean;

  redeemable: number;
  nextWithdrawal: number;
  nextWithdrawalAmount: number;
  nextWithdrawalAction: string | undefined;
  targetValidator: string | undefined;
  unlockingDataTimestamp: number;

  setShowCompoundStakeModal: (val: boolean) => void;
  setShowWithdrawalModal: (val: boolean) => void;
  setShowClaimRewardModal: (val: boolean) => void;
  setActionNetworkKey: (val: string) => void;
  setTargetValidator: (val: string) => void;
  setTargetNextWithdrawalAction: (val: string | undefined) => void;
  setTargetRedeemable: (val: number) => void;
  setTargetStakingType: (val: StakingType) => void;
  setTargetClaimable: (val: string | undefined) => void;
}

function StakingRow ({ activeStake, chainName, className, index, isCanSign, logo, networkKey, nextWithdrawal, nextWithdrawalAction, nextWithdrawalAmount, price, redeemable, reward, setActionNetworkKey, setShowClaimRewardModal, setShowCompoundStakeModal, setShowWithdrawalModal, setTargetClaimable, setTargetNextWithdrawalAction, setTargetRedeemable, setTargetStakingType, setTargetValidator, stakingType, targetValidator, totalStake, unbondingStake, unit }: Props): React.ReactElement<Props> {
  const [showReward, setShowReward] = useState(false);
  const [showStakingMenu, setShowStakingMenu] = useState(false);

  const handleToggleReward = useCallback(() => {
    setShowReward(!showReward);
  }, [showReward]);

  const handleShowWithdrawalModal = useCallback(() => {
    setActionNetworkKey(networkKey);
    setTargetNextWithdrawalAction(nextWithdrawalAction);
    setTargetRedeemable(redeemable);
    setTargetValidator(targetValidator || '');
    setShowWithdrawalModal(true);
  }, [nextWithdrawalAction, redeemable, targetValidator, networkKey, setActionNetworkKey, setShowWithdrawalModal, setTargetNextWithdrawalAction, setTargetRedeemable, setTargetValidator]);

  const handleShowClaimRewardModal = useCallback(() => {
    setActionNetworkKey(networkKey);
    setShowClaimRewardModal(true);
    setTargetStakingType(stakingType);
  }, [networkKey, setActionNetworkKey, setShowClaimRewardModal, setTargetStakingType, stakingType]);

  const handleShowCompoundStakeModal = useCallback(() => {
    setActionNetworkKey(networkKey);
    setShowCompoundStakeModal(true);
  }, [networkKey, setActionNetworkKey, setShowCompoundStakeModal]);

  const handleToggleBondingMenu = useCallback(() => {
    setShowStakingMenu(!showStakingMenu);
  }, [showStakingMenu]);

  const editBalance = (balance: string, roundTo = 2, omitSmallBalance = true) => {
    if (parseFloat(balance) === 0) {
      return <span className={'major-balance'}>{balance}</span>;
    }

    if (omitSmallBalance && parseFloat(balance) <= 0.00001) { // in case the balance is too small
      return <span className={'major-balance'}>0</span>;
    }

    const balanceSplit = balance.split('.');

    if (balanceSplit[0] === '') {
      return <span>--</span>;
    }

    const number = balanceSplit[0];
    const decimal = balanceSplit[1];

    return (
      <span>
        <span className={'major-balance'}>{formatLocaleNumber(parseInt(number))}</span>
        {balance.includes('.') && '.'}
        <span className={'decimal-balance'}>{decimal ? decimal.slice(0, roundTo) : ''}</span>
      </span>
    );
  };

  const parsePrice = (price: number, amount: string) => {
    if (!price) {
      return ' --';
    }

    const balance = parseFloat(amount) * price;

    return editBalance(balance.toString());
  };

  const getStakingTypeClassName = () => {
    if (stakingType === StakingType.POOLED) {
      return '-pooled';
    }

    return '-nominated';
  };

  const getStakingTypeIcon = () => {
    if (stakingType === StakingType.POOLED) {
      return UsersIcon;
    }

    return UserIcon;
  };

  return (
    <div className={`${className || ''} ${showReward ? '-show-detail' : ''}`}>
      <div
        className={'staking-row'}
        key={index}
      >
        <img
          alt='logo'
          className={'network-logo'}
          onClick={handleToggleReward}
          src={logo}
        />

        <div className={'staking-info-container'}>
          <div
            className={'info-wrapper'}
            onClick={handleToggleReward}
          >
            <div className={'meta-container'}>
              <div className={'chain-name'}>
                {chainName}
              </div>
              <div className={'balance-description'}>
                <div className={`staking-type__container ${getStakingTypeClassName()}`}>
                  <img
                    height={16}
                    src={getStakingTypeIcon()}
                    width={16}
                  />
                  {stakingType.charAt(0).toUpperCase() + stakingType.slice(1)} balance
                </div>
                {
                  isCanSign && <StakingMenu
                    bondedAmount={activeStake as string}
                    claimable={reward?.unclaimedReward}
                    networkKey={networkKey}
                    nextWithdrawal={nextWithdrawal}
                    nextWithdrawalAmount={nextWithdrawalAmount}
                    redeemable={redeemable}
                    setTargetClaimable={setTargetClaimable}
                    showClaimRewardModal={handleShowClaimRewardModal}
                    showMenu={showStakingMenu}
                    showStakeCompoundModal={handleShowCompoundStakeModal}
                    showWithdrawalModal={handleShowWithdrawalModal}
                    stakingType={stakingType}
                    toggleMenu={handleToggleBondingMenu}
                    unbondingStake={unbondingStake}
                  />
                }
              </div>
            </div>

            <div className={'balance-container'}>
              <div className={'meta-container'}>
                <div className={'staking-amount'}>
                  <span className={'staking-balance'}>{editBalance(totalStake || '')}</span>
                  {unit}
                </div>
                <div className={'price-container'}>${parsePrice(price, totalStake as string)}</div>
              </div>

              <div>
                <div className={'toggle-container'}>
                  <div className={'chain-balance-item__toggle'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        showReward &&
        <div className={'extra-info'}>
          <div className={'filler-div'}></div>
          <div className={'extra-container'}>
            <div className={'reward-container'}>
              <div className={'reward-title'}>Active stake</div>
              <div className={'reward-amount'}>
                <div>{editBalance(activeStake || '')}</div>
                <div className={'chain-unit'}>{unit}</div>
              </div>
            </div>

            <div className={'reward-container'}>
              <div className={'reward-title'}>Unlocking stake</div>
              <div className={'reward-amount'}>
                <div>{editBalance(unbondingStake || '')}</div>
                <div className={'chain-unit'}>{unit}</div>
              </div>
            </div>

            {
              stakingType === StakingType.NOMINATED
                ? <div>

                  {
                    reward?.totalReward && !isNaN(parseFloat(reward?.totalReward)) && <div className={'reward-container'}>
                      <div className={'reward-title'}>Total reward</div>
                      <div className={'reward-amount'}>
                        <div>{editBalance(reward?.totalReward || '', 9)}</div>
                        <div className={'chain-unit'}>{unit}</div>
                      </div>
                    </div>
                  }

                  {
                    reward?.latestReward && !isNaN(parseFloat(reward?.latestReward)) && <div className={'reward-container'}>
                      <div className={'reward-title'}>Latest reward</div>
                      <div className={'reward-amount'}>
                        <div>{editBalance(reward?.latestReward || '', 9)}</div>
                        <div className={'chain-unit'}>{unit}</div>
                      </div>
                    </div>
                  }

                  {
                    reward?.totalSlash && !isNaN(parseFloat(reward?.totalSlash)) && <div className={'reward-container'}>
                      <div className={'reward-title'}>Total slash</div>
                      <div className={'reward-amount'}>
                        <div>{editBalance(reward?.totalSlash || '', 9)}</div>
                        <div className={'chain-unit'}>{unit}</div>
                      </div>
                    </div>
                  }

                  {
                    reward?.unclaimedReward && !isNaN(parseFloat(reward?.unclaimedReward)) && <div className={'reward-container'}>
                      <div className={'reward-title'}>Unclaimed reward</div>
                      <div className={'reward-amount'}>
                        <div>{editBalance(reward?.unclaimedReward || '', 9, false)}</div>
                        <div className={'chain-unit'}>{unit}</div>
                      </div>
                    </div>
                  }
                </div>
                : <div>
                  {
                    reward?.unclaimedReward && !isNaN(parseFloat(reward?.unclaimedReward)) && <div className={'reward-container'}>
                      <div className={'reward-title'}>Unclaimed reward</div>
                      <div className={'reward-amount'}>
                        <div>{editBalance(reward?.unclaimedReward || '', 9, false)}</div>
                        <div className={'chain-unit'}>{unit}</div>
                      </div>
                    </div>
                  }
                </div>
            }
          </div>
        </div>
      }
    </div>
  );
}

export default React.memo(styled(StakingRow)(({ theme }: Props) => `
  .-pooled {
    color: ${theme.primaryColor};
    background-color: #42C59A33;
  }

  .-nominated {
    color: ${theme.iconNeutralColor};
    background-color: #7B809833;
  }

  .staking-type__container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
    padding: 0 4px 0 4px;
    font-weight: 400;
    font-size: 14px;
    line-height: 24px;
    border-radius: 4px;
  }

  .staking-item__type {
    color: ${theme.crowdloanWinnerStatus};

    padding: 2px 6px;
    border-radius: 3px;
    background-color: ${theme.backgroundAccountAddress};
    margin-left: 8px;
    font-size: 13px;
    line-height: 20px;
  }

  .extra-info {
    display: flex;
    gap: 12px;
  }

  .filler-div {
    min-width: 32px;
  }

  .kn-copy-btn {
    width: 15px;
    height: 15px;
    margin-top: auto;
    margin-bottom: auto;
    cursor: pointer;
    background-color: ${theme.buttonBackground1};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 40%;
  }

  .smart-contract-field {
    display: flex;
    gap: 10px;
  }

  .smart-contract-value {
    font-size: 14px;
  }

  .extra-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .balance-description {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .staking-balance {
    margin-right: 3px;
  }

  .reward-container {
    padding-top: 4px;
    display: flex;
    justify-content: space-between;
  }

  .reward-title {
    font-size: 14px;
    color: #7B8098;
  }

  .reward-amount {
    font-size: 14px;
    display: flex;
    gap: 5px;
  }

  .staking-info-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .staking-row {
    width: 100%;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toggle-container {
    position: relative;
    width: 20px;
  }

  .chain-balance-item__toggle {
    position: absolute;
    top: 5px;
    right: 4px;
    border-style: solid;
    border-width: 0 2px 2px 0;
    border-color: #7B8098;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(45deg);
  }

  .network-logo {
    display: block;
    min-width: 36px;
    height: 36px;
    border-radius: 100%;
    overflow: hidden;
    background-color: #fff;
    cursor: pointer;
  }

  .info-wrapper {
    cursor: pointer;
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid ${theme.borderColor2};
    padding-bottom: 12px;
    padding-top: 12px;
  }

  .balance-container {
    display: flex;
    gap: 5px;
  }

  .meta-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .chain-name {
    font-size: 16px;
    font-weight: 500;
    text-transform: capitalize;

    display: flex;
    flex-direction: row;
    gap: 3px;
  }

  .chain-symbol {
    text-transform: uppercase;
    font-size: 14px;
    color: #7B8098;
  }

  .staking-amount {
    font-size: 15px;
    font-weight: 500;
    display: flex;
    justify-content: flex-end;
    text-align: right;
  }

  .price-container {
    text-align: right;
  }

  .chain-unit {
    font-size: 14px;
    font-weight: normal;
    display: flex;
    justify-content: flex-end;
    color: #7B8098;
  }

  .major-balance {}

  .decimal-balance {
    color: ${theme.textColor2};
    opacity: ${theme.textOpacity};
  }

  &.-show-detail .chain-balance-item__toggle {
    top: 12px;
    transform: rotate(-135deg);
  }
`));
