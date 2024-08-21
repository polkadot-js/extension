// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Headers from '@subwallet/extension-web-ui/components/Layout/parts/Header';
import { useNotification, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron } from '@subwallet/extension-web-ui/messaging';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ActivityIndicator, Button, Icon, Input, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowClockwise } from 'phosphor-react';
import React, { ChangeEventHandler, ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import styled from 'styled-components';

type Props = ThemeProps & {
  className?: string;
}

type SearchInputProps = {
  onChange: (value: string) => void;
  placeholder?: string;
  className: string;
};

type SearchInputRef = {
  setValue: (value: string) => void
}

const _SearchInput = ({ className,
  onChange,
  placeholder }: SearchInputProps, ref: ForwardedRef<SearchInputRef>) => {
  const [value, setValue] = useState<string>('');

  useImperativeHandle(ref, () => ({
    setValue
  }));

  const _onChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    const value = e?.target?.value;

    setValue(value);
  }, []);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      onChange(value);
    }, 300);

    return () => {
      return clearTimeout(timeOut);
    };
  }, [onChange, value]);

  return (
    <Input.Search
      className={className}
      onChange={_onChange}
      placeholder={placeholder}
      size='md'
      value={value}
    />
  );
};

const SearchInput = forwardRef(_SearchInput);

function Component ({ className }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const [detailTitle, setDetailTitle] = useState<string | React.ReactNode>();
  const [searchPlaceholder, setSearchPlaceholder] = useState<string>();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(true);
  const searchInputRef = useRef<SearchInputRef>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const notify = useNotification();

  const TAB_LIST = useMemo(() => {
    return [t('Tokens'), t('NFTs'), t('Inscriptions'), t('Statistics')];
  }, [t]);

  const handleSelectTab = useCallback((index: number) => {
    if (!index) {
      navigate('tokens');
    } else if (index === 1) {
      navigate('nfts/collections');
    } else if (index === 2) {
      navigate('inscriptions');
    } else if (index === 3) {
      navigate('statistics');
    }
  }, [navigate]);

  const onReloadNft = useCallback(() => {
    setLoading(true);
    notify({
      icon: <ActivityIndicator size={32} />,
      style: { top: 210 },
      direction: 'vertical',
      duration: 1.8,
      closable: false,
      message: t('Reloading')
    });

    reloadCron({ data: 'nft' })
      .then(() => {
        setLoading(false);
      })
      .catch(console.error);
  }, [notify, t]);

  const activeTabIndex = useMemo(() => {
    const currentTab = pathname.split('/').filter((i) => !!i)[1];

    return (TAB_LIST.map((tab) => tab.toLowerCase())).indexOf(currentTab);
  }, [TAB_LIST, pathname]);

  const isDetail = useMemo(() => pathname.includes('detail'), [pathname]);

  useEffect(() => {
    searchInputRef.current?.setValue('');
  }, [pathname]);

  const isShowReloadNft = useMemo(() => pathname.startsWith('/home/nfts/collections'), [pathname]);

  const outletValue = useMemo(() => ({
    searchInput,
    setDetailTitle,
    setSearchPlaceholder,
    setShowSearchInput
  }), [searchInput]);

  return (
    <div className={CN(className, 'portfolio-container')}>
      <div className='portfolio-header'>
        <Headers.Balance className={'portfolio-balance'} />
        <div className='menu-bar'>
          {
            !isDetail
              ? (
                <>
                  <Tabs
                    onSelect={handleSelectTab}
                    selectedIndex={activeTabIndex}
                  >
                    <TabList
                      className={CN('react-tabs__tab-list')}
                    >
                      {TAB_LIST.map((label) => (
                        <Tab key={label}>{label}</Tab>
                      ))}
                    </TabList>

                    {/* fake tabpane to remove error logs */}
                    <div style={{ display: 'none' }}>
                      <TabPanel></TabPanel>
                      <TabPanel></TabPanel>
                      <TabPanel></TabPanel>
                      <TabPanel></TabPanel>
                    </div>
                  </Tabs>
                </>
              )
              : (
                <SwSubHeader
                  background='transparent'
                  center={false}
                  className='web-header'
                  onBack={goBack}
                  showBackButton
                  title={detailTitle}
                />
              )
          }
          <div className='right-section'>
            {
              isShowReloadNft && (
                <Button
                  className={'mr-xs'}
                  disabled={loading}
                  icon={
                    (
                      <Icon
                        phosphorIcon={ArrowClockwise}
                        size='md'
                        type='phosphor'
                      />
                    )
                  }
                  onClick={onReloadNft}
                  size={'sm'}
                  type={'ghost'}
                />
              )
            }

            <SearchInput
              className={CN('search-input', {
                hidden: !showSearchInput
              })}
              onChange={setSearchInput}
              placeholder={searchPlaceholder}
              ref={searchInputRef}
            />
          </div>
        </div>
      </div>

      <div className='portfolio-content'>
        <Outlet
          context={outletValue}
        />
      </div>
    </div>
  );
}

const PortfolioPage = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',

    '.portfolio-header': {
      flex: '0 0 auto'
    },

    '.portfolio-content': {
      flex: '1 1 500px',
      paddingTop: token.paddingLG,
      paddingBottom: token.paddingLG
    },

    '.react-tabs__tab-list': {
      display: 'flex',
      borderRadius: token.borderRadiusLG,
      margin: 0,
      padding: 0
    },

    '.menu-bar': {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'transparent',
      minHeight: 50,

      '.web-header': {
        flex: 1,
        '.header-content': {
          color: token.colorTextBase,
          fontWeight: token.fontWeightStrong,
          fontSize: token.fontSizeHeading4,
          lineHeight: token.lineHeightHeading4,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden'
        }
      },

      '.react-tabs__tab': {
        textAlign: 'center',
        display: 'inline-block',
        border: 'none',
        outline: 'none',
        position: 'relative',
        listStyle: 'none',
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG,
        fontWeight: token.headingFontWeight,
        cursor: 'pointer',
        flex: 'unset',
        borderRadius: 0,
        color: token.colorTextLight4,
        padding: 0,
        marginRight: 16,
        paddingTop: 10,
        paddingBottom: token.paddingXS,
        borderBottom: '2px solid transparent',

        '&--selected': {
          background: 'transparent',
          color: token.colorTextLight2,
          borderBottomColor: token.colorTextLight2
        }
      },

      '.right-section': {
        justifySelf: 'end',
        display: 'flex',
        '.search-input': {
          width: 360,
          height: 50
        }
      }
    }
  };
});

export default PortfolioPage;
