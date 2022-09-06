// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import buyIcon from '@subwallet/extension-koni-ui/assets/buy-icon.svg';
import cryptoIcon from '@subwallet/extension-koni-ui/assets/icon/crypto.svg';
import receiveIcon from '@subwallet/extension-koni-ui/assets/icon/receive-icon.svg';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import useOutsideClick from '@subwallet/extension-koni-ui/hooks/useOutsideClick';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  openAddress: () => void;
  openBuy: () => void;
}

interface Position {
  top: number;
  left: number;
}

const ReceiveButton = (props: Props) => {
  const { className, openAddress, openBuy } = props;
  const trigger = 'home-receive-button';

  const { t } = useTranslation();

  const containerRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const closeDropDown = useCallback(() => {
    setIsOpen(false);
    setPosition({ top: 0, left: 0 });
  }, []);

  const getDropDownPosition = useCallback(() => {
    const ele = containerRef.current;
    const root = document.getElementById('root');

    if (ele && root) {
      const rect = ele.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const margin = 8;
      const padding = 10 * 2;
      const width = 210;
      const row = 2;
      const height = padding + row * 40;
      let top = rect.height + margin;

      if (rootRect.height < rect.top + rect.height + height + margin + 10) {
        top = -(height + margin);
      }

      setPosition({
        top: rect.top + top,
        left: rect.left - width + rect.width
      });
    } else {
      setPosition({ top: 0, left: 0 });
    }
  }, []);

  const openDropDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    getDropDownPosition();
    setIsOpen(true);
  }, [getDropDownPosition]);

  const onOpenAddress = useCallback(() => {
    setIsOpen(false);
    openAddress();
  }, [openAddress]);

  const onOpenBuy = useCallback(() => {
    setIsOpen(false);
    openBuy();
  }, [openBuy]);

  useOutsideClick(containerRef, closeDropDown);

  return (
    <>
      <div
        className={CN(className)}
        ref={containerRef}
      >
        <div
          className='receive-button'
          data-for={trigger}
          data-tip={true}
          onClick={openDropDown}
        >
          <img
            alt='trigger'
            className='trigger-icon'
            src={buyIcon}
          />
        </div>
        {isOpen && (
          <div
            className={CN('dropdown-content')}
            style={{
              top: position.top,
              left: position.left
            }}
          >
            <div
              className={CN('action-container')}
              onClick={onOpenBuy}
            >
              <img
                alt='buy'
                className={CN('action-icon')}
                src={cryptoIcon}
              />
              <div className={CN('action-title')}>
                {t('Buy crypto from fiat')}
              </div>
            </div>
            <div
              className={CN('action-container')}
              onClick={onOpenAddress}
            >
              <img
                alt='address'
                className={CN('action-icon')}
                src={receiveIcon}
              />
              <div className={CN('action-title')}>
                {t('Get wallet address')}
              </div>
            </div>
          </div>
        )}
      </div>
      <Tooltip
        offset={{ top: 8 }}
        text={t<string>('Receiver')}
        trigger={trigger}
      />
    </>
  );
};

export default React.memo(styled(ReceiveButton)(({ theme }: Props) => `
  .receive-button {
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 40%;
    background-color: ${theme.buttonBackground};
    cursor: pointer;

    .trigger-icon {
      min-width: 24px;
      height: 24px;
      cursor: pointer;
    }
  }

  .dropdown-content {
    width: 210px;
    position: fixed;
    padding: 10px;
    background: ${theme.popupBackground};
    box-shadow: 0px 0px 7px rgba(102, 225, 182, 0.4);
    z-index: 10;
    border-radius: 8px;

    .action-container {
      display: flex;
      align-items: center;
      cursor: pointer;

      .action-icon {
        width: 20px;
        height: 20px;
        margin-right: 8px;
        filter: ${theme.filterDefault};
      }

      .action-title {
        font-style: normal;
        font-weight: 500;
        font-size: 15px;
        line-height: 40px;
        color: ${theme.textColor};
      }
    }
  }
`));
