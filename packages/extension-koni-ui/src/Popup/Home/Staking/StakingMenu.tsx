// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ClockAfternoon from '@subwallet/extension-koni-ui/assets/ClockAfternoon.svg';
import DotsThree from '@subwallet/extension-koni-ui/assets/DotsThree.svg';
import Menu from '@subwallet/extension-koni-ui/components/Menu';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useOutsideClick from '@subwallet/extension-koni-ui/hooks/useOutsideClick';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
// import ClockAfternoonGreen from '@subwallet/extension-koni-ui/assets/ClockAfternoonGreen.svg';

interface Props extends ThemeProps {
  className?: string;
  toggleMenu: () => void;
  showMenu: boolean;
  key: string;
}

function StakingMenu ({ className, key, showMenu, toggleMenu }: Props): React.ReactElement<Props> {
  const stakingMenuRef = useRef(null);

  const handleClickBondingMenu = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    toggleMenu();
  }, [toggleMenu]);

  useOutsideClick(stakingMenuRef, (): void => {
    showMenu && toggleMenu();
  });

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
            <div className={'bonding-menu-item'}>
              <FontAwesomeIcon
                icon={faPlus}
              />
              Stake more
            </div>

            <div className={'bonding-menu-item'}>
              <FontAwesomeIcon
                icon={faMinus}
              />
              Unstake funds
            </div>

            <div className={'bonding-menu-item'}>
              <img
                data-for={`bonding-menu-tooltip-${key}`}
                data-tip={true}
                src={ClockAfternoon}
              />
              Withdraw
              <Tooltip
                place={'top'}
                text={'3 days remaining'}
                trigger={`bonding-menu-tooltip-${key}`}
              />
            </div>
          </Menu>
        }
      </div>
    </div>
  );
}

export default React.memo(styled(StakingMenu)(({ theme }: Props) => `
  position: relative;

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

  .bonding-menu-btn {
    display: flex;
    align-items: center;
  }
`));
