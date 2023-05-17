// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetLogoMap, ChainLogoMap } from '@subwallet/chain-list';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Logo, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

interface LogoItem {
  key: string;
  type: string;
  value: string;
  isNew: boolean;
}

const logoList = Object.entries(ChainLogoMap).map(([key, value]) => {
  return {
    key,
    value,
    type: 'network',
    isNew: value?.startsWith('./images/projects')
  } as LogoItem;
}).concat(Object.entries(AssetLogoMap).map(([key, value]) => {
  return {
    key,
    value,
    type: 'token',
    isNew: value?.startsWith('./images/projects')
  } as LogoItem;
}));

interface CategoriesFilter {
  showOld: boolean
  showNew: boolean
}

function Component (props: ThemeProps) {
  const [categories, setCategories] = useState<CategoriesFilter>({ showOld: true, showNew: true });
  const renderItem = useCallback(
    (item: LogoItem) => {
      return (<div
        className={CN('logo-item', item.isNew ? 'is-new' : 'is-old')}
        key={item.key}
      >
        <Logo
          network={item.type === 'network' ? item.key : undefined}
          size={56}
          token={item.type === 'token' ? item.key : undefined}
        />
        <span>{item.key}</span>
      </div>);
    },
    []
  );
  const finalLogoList = useMemo<LogoItem[]>(() => {
    if (categories.showNew && categories.showOld) {
      return logoList;
    } else if (categories.showNew) {
      return logoList.filter((i) => i.isNew);
    } else if (categories.showOld) {
      return logoList.filter((i) => !i.isNew);
    } else {
      return [];
    }
  }, [categories]);

  const toggleNew = useCallback(() => {
    setCategories((current) => ({ ...current, showNew: !current.showNew }));
  }, []);

  const toggleOld = useCallback(() => {
    setCategories((current) => ({ ...current, showOld: !current.showOld }));
  }, []);

  const searchFunction = useCallback((item: LogoItem, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.key.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return <div className={props.className}>
    <div className='filter-buttons'>
      <Button
        onClick={toggleNew}
        schema={categories.showNew ? 'primary' : 'secondary'}
        size={'xs'}
      >New</Button>
      <Button
        onClick={toggleOld}
        schema={categories.showOld ? 'primary' : 'secondary'}
        size={'xs'}
      >Old</Button>
    </div>
    <SwList.Section
      className={'logo-list'}
      displayGrid={true}
      enableSearchInput={true}
      gridGap={'14px'}
      ignoreScroll={true}
      list={finalLogoList}
      loadOnScroll={true}
      minColumnWidth={'140px'}
      renderItem={renderItem}
      searchFunction={searchFunction}
    />
  </div>;
}

const DebuggerLogoPreview = styled(Component)<ThemeProps>(({ theme }: ThemeProps) => ({
  '.filter-buttons': {
    display: 'flex',
    marginBottom: 14,
    gap: 8
  },

  '.logo-list': {
    marginRight: -16,
    marginLeft: -16
  },

  '.ant-sw-list': {
    height: 220
  },

  '.logo-item': {
    textAlign: 'center',
    background: theme.token.colorBgSecondary,
    padding: theme.token.sizeMD,
    borderRadius: theme.token.borderRadius,
    height: 120,

    '&.is-new': {
      background: theme.token['green-3']
    },

    '.ant-logo': {
      margin: '0 auto 8px'
    }
  }
}));

export default DebuggerLogoPreview;
