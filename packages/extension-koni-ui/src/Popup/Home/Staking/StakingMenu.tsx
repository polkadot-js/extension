// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ClockAfternoon from '@subwallet/extension-koni-ui/assets/ClockAfternoon.svg';
import ClockAfternoonGreen from '@subwallet/extension-koni-ui/assets/ClockAfternoonGreen.svg';
import DotsThree from '@subwallet/extension-koni-ui/assets/DotsThree.svg';
import { ActionContext } from '@subwallet/extension-koni-ui/components';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useOutsideClick from '@subwallet/extension-koni-ui/hooks/useOutsideClick';
import { store } from '@subwallet/extension-koni-ui/stores';
import { BondingParams, UnbondingParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import moment from 'moment';
import React, { useCallback, useContext, useRef } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  toggleMenu: () => void;
  showMenu: boolean;
  networkKey: string;
  bondedAmount: string;
  redeemable: number;
  nextWithdrawal: number;
  nextWithdrawalAmount: number;
  unbondingStake: string | undefined;
  showWithdrawalModal: () => void;
}

const MANUAL_CLAIM_CHAINS = [
  'astar',
  'shibuya',
  'shiden'
];

function StakingMenu ({ bondedAmount, className, networkKey, nextWithdrawal, nextWithdrawalAmount, redeemable, showMenu, showWithdrawalModal, toggleMenu, unbondingStake }: Props): React.ReactElement<Props> {
  const stakingMenuRef = useRef(null);
  const navigate = useContext(ActionContext);
  const networkJson = useGetNetworkJson(networkKey);
  const showClaimButton = MANUAL_CLAIM_CHAINS.includes(networkKey);

  const handleClickBondingMenu = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    toggleMenu();
  }, [toggleMenu]);

  useOutsideClick(stakingMenuRef, (): void => {
    showMenu && toggleMenu();
  });

  const handleClickStakeMore = useCallback(() => {
    store.dispatch({ type: 'bondingParams/update', payload: { selectedNetwork: networkKey, selectedValidator: null, maxNominatorPerValidator: null } as BondingParams });
    navigate('/account/select-bonding-validator');
  }, [navigate, networkKey]);

  const handleUnstake = useCallback(() => {
    if (parseFloat(bondedAmount) > 0) {
      store.dispatch({ type: 'unbondingParams/update', payload: { selectedNetwork: networkKey, bondedAmount: parseFloat(bondedAmount) } as UnbondingParams });
      navigate('/account/unbonding-auth');
    }
  }, [bondedAmount, navigate, networkKey]);

  const getTooltipText = useCallback(() => {
    if (nextWithdrawalAmount === -1) {
      return 'Loading...';
    }

    if (redeemable > 0) {
      return `${redeemable} ${networkJson.nativeToken as string} can be withdrawn now`;
    } else {
      return `${nextWithdrawalAmount} ${networkJson.nativeToken as string} can be withdrawn in ${moment.duration(nextWithdrawal, 'hours').humanize()}`;
    }
  }, [networkJson.nativeToken, nextWithdrawal, nextWithdrawalAmount, redeemable]);

  const handleClickWithdraw = useCallback(() => {
    if (redeemable > 0) {
      showWithdrawalModal();
    }
  }, [redeemable, showWithdrawalModal]);

  return (
    <div className={className}>
      <div
        className={'bonding-menu-btn'}
        // @ts-ignore
        onClick={handleClickBondingMenu}
      >
        <img
          alt={'dots'}
          height={28}
          src={DotsThree}
          width={28}
        />
        {
          showMenu && <Menu
            className={'bonding-menu'}
            reference={stakingMenuRef}
            style={{ marginTop: showClaimButton ? '200px' : '160px' }}
          >
            <div
              className={'bonding-menu-item'}
              onClick={handleClickStakeMore}
            >
              <FontAwesomeIcon
                className={'staking-menu-icon'}
                icon={faPlus}
              />
              Stake more
            </div>

            <div
              className={`${parseFloat(bondedAmount) > 0 ? 'bonding-menu-item' : 'disabled-menu-item'}`}
              onClick={handleUnstake}
            >
              <FontAwesomeIcon
                className={'staking-menu-icon'}
                icon={faMinus}
              />
              Unstake funds
            </div>

            <div
              className={`${redeemable > 0 ? 'bonding-menu-item' : 'disabled-menu-item'}`}
              onClick={handleClickWithdraw}
            >
              <img
                data-for={`bonding-menu-tooltip-${networkKey}`}
                data-tip={true}
                height={18}
                src={nextWithdrawal > 0 && parseFloat(unbondingStake as string) > 0 ? ClockAfternoonGreen : ClockAfternoon}
                width={18}
              />
              Withdraw
              {
                unbondingStake && parseFloat(unbondingStake) !== 0 && <Tooltip
                  place={'top'}
                  text={getTooltipText()}
                  trigger={`bonding-menu-tooltip-${networkKey}`}
                />
              }
            </div>

            {
              showClaimButton && <div
                className={'bonding-menu-item'}
                onClick={handleClickWithdraw}
              >
                <img
                  data-for={`bonding-menu-tooltip-${networkKey}`}
                  data-tip={true}
                  height={18}
                  src={ClockAfternoonGreen}
                  width={18}
                />
                Claim rewards
              </div>
            }
          </Menu>
        }
      </div>
    </div>
  );
}

export default React.memo(styled(StakingMenu)(({ theme }: Props) => `
  position: relative;

  .staking-menu-icon {
    font-size: 18px;
  }

  .unstake-edit-button:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};
    font-size: 15px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .unstake-edit-button:nth-child(2) {
    background-color: ${theme.buttonBackgroundDanger};
    font-size: 15px;

    span {
      color: ${theme.buttonTextColor};
    }
  }

  .unstake-button-area {
    margin-top: 20px;
  }

  .unstake-close-btn {
    font-size: 20px;
    cursor: pointer;
  }

  .unstake-title {
    font-size: 20px;
    font-weight: 500;
  }

  .unstake-modal-title {
    display: flex;
    justify-content: space-between;
  }

  .unstake-modal .subwallet-modal {
    width: 320px;
    padding: 20px;
    top: 30%;
  }

  .bonding-menu-item {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 16px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    color: ${theme.textColor2};

    &:hover {
      background-color: ${theme.accountHoverBackground};
      color: ${theme.textColor};
    }
  }

  .bonding-menu {
    left: 5px;
    right: auto;
    margin-top: 160px;
    width: 180px;
    border-radius: 8px;
  }

  .disabled-menu-item {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 16px;
    font-size: 15px;
    font-weight: 500;
    cursor: default;
    color: ${theme.textColor2};
  }

  .bonding-menu-btn {
    display: flex;
    align-items: center;
  }
`));
