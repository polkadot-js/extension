// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { Modal } from '@polkadot/extension-koni-ui/components';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import ChainBalanceItemRow from '@polkadot/extension-koni-ui/Popup/Home/ChainBalances/ChainBalanceItemRow';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BalanceInfo } from '@polkadot/extension-koni-ui/util/types';

interface Props extends ThemeProps {
  className?: string;
  balanceInfo: BalanceInfo;
  onCancel: () => void;
}

function ChainBalanceDetail ({ balanceInfo, className, onCancel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <Modal>
        <div className='chain-balance-detail-header'>
          <div className='chain-balance-detail-header__part-1' />
          <div className='chain-balance-detail-header__part-2'>
            {t<string>('Balance Detail')}
          </div>
          <div className='chain-balance-detail-header__part-3'>
            <span
              className={'chain-balance-detail-header__close-btn'}
              onClick={onCancel}
            >{t('Cancel')}</span>
          </div>
        </div>
        <div className='chain-balance-detail-body'>
          {balanceInfo.detailBalances &&
          <>
            {balanceInfo.detailBalances.map((d) => (
              <ChainBalanceItemRow
                className='chain-balance-detail-item'
                item={d}
                key={d.key}
              />
            ))}
          </>
          }
          {!!balanceInfo.childrenBalances.length &&
          <>
            <div className='chain-balance-detail__separator' />
            {balanceInfo.childrenBalances.map((d) => (
              <ChainBalanceItemRow
                className='chain-balance-detail-item'
                item={d}
                key={d.key}
              />
            ))}
          </>
          }
        </div>
      </Modal>
    </div>
  );
}

export default React.memo(styled(ChainBalanceDetail)(({ theme }: Props) => `
  .subwallet-modal {
    max-width: 460px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chain-balance-detail-header {
    display: flex;
    align-items: center;
    height: 72px;
    box-shadow: ${theme.headerBoxShadow};
  }

  .chain-balance-detail-header__part-1 {
    flex: 1;
  }

  .chain-balance-detail-header__part-2 {
    color: ${theme.textColor};
    font-size: 20px;
    font-weight: 500;
  }

  .chain-balance-detail-header__part-3 {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .chain-balance-detail-header__close-btn {
    padding-left: 16px;
    padding-right: 16px;
    height: 40px;
    display: flex;
    align-items: center;
    color: #04C1B7;
    font-weight: 500;
    cursor: pointer;
  }

  .chain-balance-detail-header__close-btn.-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .chain-balance-detail-body {
    flex: 1;
    padding-top: 50px;
    padding-bottom: 15px;
    overflow-y: auto;
  }

  .chain-balance-detail-item {
    .chain-balance-item-row__col-1 {
      padding-left: 16px;
    }

    .chain-balance-item-row__col-3 {
      padding-right: 16px;
    }
  }

  .chain-balance-detail__separator {
    padding: 16px;

    &:before {
      content: '';
      height: 1px;
      display: block;
      background: ${theme.boxBorderColor};
    }
  }
`));
