// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HorizontalLabelToggle, InputFilter, Link } from '@subwallet/extension-koni-ui/components';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const networks = [
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  },
  {
    name: 'Test',
    isConnect: false
  }
];

function Networks ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const toggleFund = useCallback(() => {}, []);

  const _onChangeFilter = useCallback(() => {
    console.log(123);
  }, []);

  const filteredNetwork = '';

  const renderNetworkItem = (item: { name: string, isConnect: boolean; }) => {
    return (
      <Link
        className='network-item'
        to='/account/network-edit'
      >
        <div className='network-item__top-content'>
          <HorizontalLabelToggle
            checkedLabel={''}
            className='info'
            toggleFunc={toggleFund}
            uncheckedLabel={''}
            value={item.isConnect}
          />
          <div className='network-item__text'>{item.name}</div>
          <div className='network-item__toggle' />
        </div>
        <div className='network-item__separator' />
      </Link>
    );
  };

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Networks')}
      >
        <InputFilter
          className='networks__input-filter'
          onChange={_onChangeFilter}
          placeholder={t<string>('Search network...')}
          value={filteredNetwork}
          withReset
        />
      </Header>

      <div className='networks__button-area'>
        <div className='networks__btn networks__disconnect-btn'>
          {t<string>('Disconnect All')}
        </div>
        <div className='networks__btn networks__connect-btn'>
          {t<string>('Connect All')}
        </div>
      </div>

      <div className='networks-list'>
        {networks.map((item) => renderNetworkItem(item))}
      </div>

    </div>
  );
}

export default styled(Networks)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .networks__input-filter {
    padding: 0 15px 15px;
  }

  .networks__btn {
    position: relative;
    font-size: 14px;
    line-height: 24px;
    color: ${theme.textColor2};
  }

  .networks__btn:hover {
    cursor: pointer;
    color: ${theme.buttonTextColor2};
  }

  .networks__button-area {
    display: flex;
    justify-content: flex-end;
    padding: 10px 15px;
  }

  .networks__connect-btn {
    padding-left: 17px;
  }

  .networks__connect-btn:before {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${theme.textColor2};
    top: 0;
    bottom: 0;
    left: 7px;
    margin: auto 0;
  }

  .network-item__top-content {
    display: flex;
    align-items: center;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .network-item__text {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor2};
  }

  .network-item__toggle {
    position: absolute;
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3.5px;
    transform: rotate(-45deg);
    right: 18px;
    color: ${theme.textColor2};
  }

  .network-item__separator {
    padding-left: 84px;
    padding-right: 15px;
  }

  .network-item {
    position: relative;
  }

  .network-item__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .networks-list {
    flex: 1;
    overflow: auto;
  }
`);
