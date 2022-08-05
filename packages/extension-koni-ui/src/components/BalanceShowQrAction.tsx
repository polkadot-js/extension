// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import buyIcon from '@subwallet/extension-koni-ui/assets/icon/buy-icon.svg';
import penIcon from '@subwallet/extension-koni-ui/assets/icon/pen-icon.svg';
import receiveIcon from '@subwallet/extension-koni-ui/assets/icon/receive-icon.svg';
import receivedIcon from '@subwallet/extension-koni-ui/assets/receive-icon.svg';
import { ActionContext } from '@subwallet/extension-koni-ui/contexts';
import useOutsideClick from '@subwallet/extension-koni-ui/hooks/useOutsideClick';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps{
  className?: string;
  openQr: (e: React.MouseEvent) => void;
  openExportQr: (e: React.MouseEvent) => void;
}

interface Position {
  top: number;
  left: number;
}

const BalanceShowQrAction = (props: Props) => {
  const { className, openExportQr, openQr } = props;

  const { t } = useTranslation();

  const onAction = useContext(ActionContext);

  const containerRef: React.RefObject<HTMLDivElement> | null = useRef(null);

  const { currentAccount } = useSelector((state: RootState) => state);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const isExternal = useMemo(() => {
    return !!currentAccount?.account?.isExternal;
  }, [currentAccount?.account?.isExternal]);

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
      const row = !isExternal ? 3 : 1;
      const height = padding + row * 40;
      let top = rect.height + margin;

      if (rootRect.height < rect.top + rect.height + height + margin + 10) {
        top = -(height + margin);
      }

      setPosition({
        top: rect.top + top,
        left: rect.left + margin
      });
    } else {
      setPosition({ top: 0, left: 0 });
    }
  }, [isExternal]);

  const openDropDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    getDropDownPosition();
    setIsOpen(true);
  }, [getDropDownPosition]);

  const onOpenQr = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setIsOpen(false);
    openQr(e);
  }, [openQr]);

  const onOpenExportQr = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setIsOpen(false);
    openExportQr(e);
  }, [openExportQr]);

  const onOpenSignTransaction = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsOpen(false);
    window.localStorage.setItem('popupNavigation', '/account/scan-qr');
    onAction('/account/scan-qr');
  }, [onAction]);

  useOutsideClick(containerRef, closeDropDown);

  return (
    <div
      className={CN(className)}
      ref={containerRef}
    >
      <img
        alt='trigger'
        className='trigger-icon'
        onClick={openDropDown}
        src={receivedIcon}
      />
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
            onClick={onOpenQr}
          >
            <img
              alt='receive'
              className={CN('action-icon')}
              src={buyIcon}
            />
            <div className={CN('action-title')}>
              {t('Receive assets')}
            </div>
          </div>
          {
            !isExternal && (
              <>
                <div
                  className={CN('action-container')}
                  onClick={onOpenExportQr}
                >
                  <img
                    alt='export'
                    className={CN('action-icon')}
                    src={receiveIcon}
                  />
                  <div className={CN('action-title')}>
                    {t('Export to devices')}
                  </div>
                </div>
                <div
                  className={CN('action-container')}
                  onClick={onOpenSignTransaction}
                >
                  <img
                    alt='sign'
                    className={CN('action-icon')}
                    src={penIcon}
                  />
                  <div className={CN('action-title')}>
                    {t('Sign transactions')}
                  </div>
                </div>
              </>
            )
          }
        </div>
      )}
    </div>
  );
};

export default React.memo(styled(BalanceShowQrAction)(({ theme }: Props) => `
  display: flex;
  position: relative;

  .trigger-icon {
    min-width: 16px;
    height: 16px;
    margin-left: 12px;
    cursor: pointer;
  }

  .dropdown-content {
    width: 190px;
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
