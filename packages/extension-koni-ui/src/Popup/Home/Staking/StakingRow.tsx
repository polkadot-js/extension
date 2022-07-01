// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DelegationItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import cloneIconLight from '@subwallet/extension-koni-ui/assets/clone--color-2.svg';
import cloneIconDark from '@subwallet/extension-koni-ui/assets/clone--color-3.svg';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getUnlockingStakeInfo } from '@subwallet/extension-koni-ui/messaging';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { formatLocaleNumber } from '@subwallet/extension-koni-ui/util/formatNumber';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled, { ThemeContext } from 'styled-components';

const StakingMenu = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/StakingMenu'));
const StakeAuthClaimReward = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/StakeAuthClaimReward'));
const StakeAuthWithdrawal = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Staking/StakeAuthWithdrawal'));

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
  activeStake: string | undefined;
  unbondingStake: string | undefined;
  isAccountAll: boolean;
  isExternalAccount: boolean;
  isHardwareAccount: boolean;
  address: string;
  delegations: DelegationItem[] | undefined;
}

function StakingRow ({ activeStake, address, chainName, className, delegations, index, isAccountAll, isExternalAccount, isHardwareAccount, logo, networkKey, price, reward, totalStake, unbondingStake, unit }: Props): React.ReactElement<Props> {
  const [showReward, setShowReward] = useState(false);
  const [showStakingMenu, setShowStakingMenu] = useState(false);
  const [redeemable, setRedeemable] = useState(0);
  const [nextWithdrawal, setNextWithdrawal] = useState(-1);
  const [nextWithdrawalAmount, setNextWithdrawalAmount] = useState(-1);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false);

  const handleToggleReward = useCallback(() => {
    setShowReward(!showReward);
  }, [showReward]);

  const handleShowWithdrawalModal = useCallback(() => {
    setShowWithdrawalModal(true);
  }, []);

  const handleShowClaimRewardModal = useCallback(() => {
    setShowClaimRewardModal(true);
  }, []);

  const handleHideWithdrawalModal = useCallback(() => {
    setShowWithdrawalModal(false);
  }, []);

  const handleHideClaimRewardModal = useCallback(() => {
    setShowClaimRewardModal(false);
  }, []);

  const handleToggleBondingMenu = useCallback(() => {
    setShowStakingMenu(!showStakingMenu);
  }, [showStakingMenu]);

  useEffect(() => {
    if (parseFloat(unbondingStake as string) > 0) {
      getUnlockingStakeInfo({
        networkKey,
        address
      })
        .then((resp) => {
          setRedeemable(resp.redeemable);
          setNextWithdrawal(resp.nextWithdrawal);
          setNextWithdrawalAmount(resp.nextWithdrawalAmount);
        })
        .catch(console.error);
    }
  }, [address, networkKey, unbondingStake]);

  const editBalance = (balance: string) => {
    if (parseFloat(balance) === 0) {
      return <span className={'major-balance'}>{balance}</span>;
    }

    if (parseFloat(balance) <= 0.0001) { // in case the balance is too small
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
        <span className={'decimal-balance'}>{decimal ? decimal.slice(0, 2) : ''}</span>
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

  const { show } = useToast();
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const theme = themeContext.id;

  const _onCopy = useCallback(
    () => {
      show(t('Copied'));
    },
    [show, t]
  );

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
              <div className={'chain-name'}>{chainName}</div>
              <div className={'balance-description'}>
                <div>Staking balance</div>
                {
                  !isAccountAll && !isHardwareAccount && !isExternalAccount && <StakingMenu
                    bondedAmount={activeStake as string}
                    delegations={delegations}
                    networkKey={networkKey}
                    nextWithdrawal={nextWithdrawal}
                    nextWithdrawalAmount={nextWithdrawalAmount}
                    redeemable={redeemable}
                    showClaimRewardModal={handleShowClaimRewardModal}
                    showMenu={showStakingMenu}
                    showWithdrawalModal={handleShowWithdrawalModal}
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

            <div className={'reward-container'}>
              <div className={'reward-title'}>Total reward</div>
              <div className={'reward-amount'}>
                <div>{editBalance(reward?.totalReward || '')}</div>
                <div className={'chain-unit'}>{unit}</div>
              </div>
            </div>

            <div className={'reward-container'}>
              <div className={'reward-title'}>Latest reward</div>
              <div className={'reward-amount'}>
                <div>{editBalance(reward?.latestReward || '')}</div>
                <div className={'chain-unit'}>{unit}</div>
              </div>
            </div>

            <div className={'reward-container'}>
              <div className={'reward-title'}>Total slash</div>
              <div className={'reward-amount'}>
                <div>{editBalance(reward?.totalSlash || '')}</div>
                <div className={'chain-unit'}>{unit}</div>
              </div>
            </div>

            {
              chainName === 'astar' &&
              <div className={'reward-container'}>
                <div className={'reward-title'}>Smart contract</div>
                <div className={'smart-contract-field'}>
                  <div className={'smart-contract-value'}>
                    {reward?.smartContract?.slice(0, 6)}...{reward?.smartContract?.slice(-6)}
                  </div>
                  <CopyToClipboard text={(reward.smartContract && reward.smartContract) || ''}>
                    <div
                      className={'kn-copy-btn'}
                      onClick={_onCopy}
                    >
                      {theme === 'dark'
                        ? (
                          <img
                            alt='copy'
                            src={cloneIconDark}
                          />
                        )
                        : (
                          <img
                            alt='copy'
                            src={cloneIconLight}
                          />
                        )
                      }
                    </div>
                  </CopyToClipboard>
                </div>
              </div>
            }
            {/* <div className={'reward-container'}> */}
            {/*  <div className={'reward-title'}>APR</div> */}
            {/*  <div className={'reward-amount'}> */}
            {/*    14% */}
            {/*  </div> */}
            {/* </div> */}
          </div>
        </div>
      }

      {
        showWithdrawalModal && <StakeAuthWithdrawal
          address={address}
          amount={redeemable}
          hideModal={handleHideWithdrawalModal}
          networkKey={networkKey}
        />
      }

      {
        showClaimRewardModal && <StakeAuthClaimReward
          address={address}
          hideModal={handleHideClaimRewardModal}
          networkKey={networkKey}
        />
      }
    </div>
  );
}

export default React.memo(styled(StakingRow)(({ theme }: Props) => `
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
    font-size: 14px;
    color: #7B8098;
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
    min-width: 32px;
    height: 32px;
    border-radius: 100%;
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #fff;
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
    color: #7B8098;
  }

  &.-show-detail .chain-balance-item__toggle {
    top: 12px;
    transform: rotate(-135deg);
  }
`));
