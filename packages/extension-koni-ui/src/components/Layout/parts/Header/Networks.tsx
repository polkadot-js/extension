// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BackgroundMask } from '@subwallet/extension-koni-ui/components/BackgroundMask';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import NetworkGroupItem from '@subwallet/extension-koni-ui/components/MetaInfo/parts/NetworkGroupItem';
import NetworkToggleItem from '@subwallet/extension-koni-ui/components/NetworkToggleItem';
import useChainInfoWithState, { ChainInfoWithState } from '@subwallet/extension-koni-ui/hooks/chain/useChainInfoWithState';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Popover, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown, ListChecks, SlidersHorizontal } from 'phosphor-react';
import React, { forwardRef, LegacyRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const MANAGE_NETWORK_KEY = 'manage-network-key';

const Component: React.FC<ThemeProps> = ({ className }: ThemeProps) => {
  const { t } = useTranslation();
  const chainInfoList = useChainInfoWithState();
  const [manageNetworkKey, setManageNetworkKey] = useState<string>(MANAGE_NETWORK_KEY);
  const [open, setOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const searchToken = useCallback((chainInfo: ChainInfoWithState, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return chainInfo.name.toLowerCase().includes(searchTextLowerCase);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      setManageNetworkKey(`${MANAGE_NETWORK_KEY} + ${Date.now()}`);
    }

    setOpen(newOpen);
  }, []);

  const renderChainItem = useCallback((chainInfo: ChainInfoWithState) => {
    return (
      <NetworkToggleItem
        chainInfo={chainInfo}
        isShowSubLogo={true}
        key={chainInfo.slug}
      />
    );
  }, []);

  const emptyTokenList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t<string>('Your chain will appear here.')}
        emptyTitle={t<string>('No chain found')}
        phosphorIcon={ListChecks}
      />
    );
  }, [t]);

  const handleManageNetworks = useCallback(() => {
    navigate('/settings/chains/manage');
  }, [navigate]);

  const popOverContent = useMemo(() => {
    return (
      <div
        className={CN(className, 'manage-network-container')}
        key={manageNetworkKey}
      >
        <SwList.Section
          className={'__list-container'}
          enableSearchInput
          list={chainInfoList}
          mode={'boxed'}
          renderItem={renderChainItem}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search chain')}
        />
        <div className={'__action-container'}>
          <Button
            icon={(
              <Icon
                phosphorIcon={SlidersHorizontal}
              />
            )}
            onClick={handleManageNetworks}
            size={'xs'}
            type='ghost'
          >
            {t<string>('Manage networks')}
          </Button>
        </div>
      </div>
    );
  }, [chainInfoList, className, emptyTokenList, handleManageNetworks, manageNetworkKey, renderChainItem, searchToken, t]);

  // Remove ref error
  // eslint-disable-next-line react/display-name
  const TriggerComponent = forwardRef((props, ref) => (
    <div
      {...props}
      className={'trigger-container'}
      ref={ref as unknown as LegacyRef<HTMLDivElement> | undefined}
      style={{
        zIndex: 999
      }}
    >
      <NetworkGroupItem
        chains={chainInfoList}
        className='ava-group'
        content={`${chainInfoList.length} networks`}
      />
      <Button
        icon={<CaretDown size={12} />}
        type='ghost'
      />
    </div>
  ));

  return (
    <>
      <Popover
        content={popOverContent}
        onOpenChange={handleOpenChange}
        open={open}
        overlayInnerStyle={{
          padding: '0',
          boxShadow: 'none',
          backgroundColor: 'transparent'
        }}
        placement='bottomRight'
        showArrow={false}
        trigger='click'
      >
        <TriggerComponent />
      </Popover>

      <BackgroundMask visible={open} />
    </>
  );
};

const Networks = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    '&.manage-network-container': {
      paddingTop: token.padding,
      background: token.colorBgDefault,
      border: `1px solid ${token.colorBgBorder}`,
      boxShadow: '4px 4px 4px 0px rgba(0, 0, 0, 0.25)',
      borderRadius: token.borderRadiusLG,

      '.__list-container': {
        width: 390,
        maxHeight: 500,
        marginBottom: token.margin
      },

      '.ant-sw-list': {
        paddingLeft: token.padding,
        paddingRight: token.padding,
        paddingTop: 0,
        paddingBottom: 0,

        '> div:not(:first-of-type)': {
          marginTop: token.marginXXS
        }
      },

      '.ant-web3-block': {
        height: 52,
        padding: 0,
        paddingLeft: token.paddingSM,
        paddingRight: token.paddingSM
      },

      '.ant-web3-block-middle-item': {
        paddingRight: token.paddingXS
      },

      '.ant-network-item-name': {
        'white-space': 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },

      '.ant-web3-block-right-item': {
        marginRight: 0
      },

      '.__action-container': {
        borderTop: `2px solid ${token.colorBgBorder}`,
        gap: token.sizeSM,
        padding: token.padding,
        display: 'flex',
        justifyContent: 'center'
      }
    }
  };
});

export default Networks;
