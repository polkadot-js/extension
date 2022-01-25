// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  activatedTab: number;
  onSelect: (tab: number) => void;
}

function Tabs ({ activatedTab, className, onSelect }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <div className={className}>
        <div className='koni-tabs'>
          <button
            className={`koni-tab ${activatedTab === 1 ? 'active' : ''}`}
            onClick={() => { onSelect(1); }}
          >
            {t<string>('Crypto')}
          </button>
          <button
            className={`koni-tab ${activatedTab === 2 ? 'active' : ''}`}
            onClick={() => { onSelect(2); }}
          >
            {t<string>('NFTs')}
          </button>
          <button
            className={`koni-tab ${activatedTab === 3 ? 'active' : ''}`}
            onClick={() => { onSelect(3); }}
          >
            {t<string>('Crowdloans')}
          </button>
          <button
            className={`koni-tab ${activatedTab === 4 ? 'active' : ''}`}
            onClick={() => { onSelect(4); }}
          >
            {t<string>('Transfers')}
          </button>

        </div>
      </div>
    </>
  );
}

export default styled(Tabs)(({ theme }: Props) => `
  .koni-tabs {
    display: flex;
  }

  .koni-tab {
    font-size: 16px;
    line-height: 26px;
    padding: 5px 12px;
    cursor: pointer;
    opacity: 1;
    display: flex;
    justify-content: center;
    flex: 1;
    font-family: ${theme.fontFamily};
    font-weight: 500;
    box-shadow: 0px 4px 7px rgba(0, 0, 0, 0.05);
    background: ${theme.background};
    border: 0;
    outline: 0;
    border-bottom: 2px solid ${theme.tabContentBorderBottomColor};
    color: ${theme.textColor2}
  }

  .active {
    border-bottom-color: ${theme.buttonBackground};
    color: ${theme.textColor};
    opacity: 1;
  }
`);
