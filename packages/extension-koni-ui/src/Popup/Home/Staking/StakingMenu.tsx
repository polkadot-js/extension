// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ClockAfternoon from '@subwallet/extension-koni-ui/assets/ClockAfternoon.svg';
import DotsThree from '@subwallet/extension-koni-ui/assets/DotsThree.svg';
import { ActionContext, Button, ButtonArea } from '@subwallet/extension-koni-ui/components';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useOutsideClick from '@subwallet/extension-koni-ui/hooks/useOutsideClick';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { store } from '@subwallet/extension-koni-ui/stores';
import { BondingParams } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useRef, useState } from 'react';
import styled from 'styled-components';
// import ClockAfternoonGreen from '@subwallet/extension-koni-ui/assets/ClockAfternoonGreen.svg';

interface Props extends ThemeProps {
  className?: string;
  toggleMenu: () => void;
  showMenu: boolean;
  networkKey: string;
}

function StakingMenu ({ className, networkKey, showMenu, toggleMenu }: Props): React.ReactElement<Props> {
  const stakingMenuRef = useRef(null);
  const navigate = useContext(ActionContext);
  const { t } = useTranslation();

  const [showUnstakeModal, setShowUnstakeModal] = useState(false);

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

  const handleShowUnstakeModal = useCallback(() => {
    setShowUnstakeModal(true);
  }, []);

  const handleHideUnstakeModal = useCallback(() => {
    setShowUnstakeModal(false);
  }, []);

  const handleUnstake = useCallback(() => {
    console.log('unstake');
  }, []);

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
          >
            <div
              className={'bonding-menu-item'}
              onClick={handleClickStakeMore}
            >
              <FontAwesomeIcon
                icon={faPlus}
              />
              Stake more
            </div>

            <div
              className={'bonding-menu-item'}
              onClick={handleShowUnstakeModal}
            >
              <FontAwesomeIcon
                icon={faMinus}
              />
              Unstake funds
            </div>

            <div className={'disabled-menu-item'}>
              <img
                data-for={`bonding-menu-tooltip-${networkKey}`}
                data-tip={true}
                src={ClockAfternoon}
              />
              Withdraw
              <Tooltip
                place={'top'}
                text={'3 days remaining'}
                trigger={`bonding-menu-tooltip-${networkKey}`}
              />
            </div>
          </Menu>
        }
      </div>

      {
        showUnstakeModal && <Modal className={'unstake-modal'}>
          <div>
            <div className={'unstake-modal-title'}>
              <div className={'unstake-title'}>Remove selected tokens ?</div>
              <div
                className={'unstake-close-btn'}
                onClick={handleHideUnstakeModal}
              >
                x
              </div>
            </div>

            <ButtonArea
              className={'unstake-button-area'}
            >
              <Button
                className='unstake-edit-button'
                onClick={handleHideUnstakeModal}
              >
                <span>{t<string>('Cancel')}</span>
              </Button>
              <Button
                className='unstake-edit-button'
                onClick={handleUnstake}
              >
                {t<string>('Confirm')}
              </Button>
            </ButtonArea>
          </div>
        </Modal>
      }
    </div>
  );
}

export default React.memo(styled(StakingMenu)(({ theme }: Props) => `
  position: relative;

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
