import React, { ChangeEventHandler, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import styled from 'styled-components';
import { Layout, ScreenTab } from '@subwallet/extension-koni-ui/components';
// import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
// import { useGetChainSlugsByAccountType } from '@subwallet/extension-koni-ui/hooks';
import { Button, Icon, Input, SwSubHeader } from '@subwallet/react-ui';
import { DownloadSimple, MagnifyingGlass } from 'phosphor-react';
import Tokens from '../Home/Tokens';
import NftCollections from '../Home/Nfts/NftCollections';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import CN from 'classnames';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

type Props = ThemeProps & {
  className?: string;
}

function Component({ className }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext)
  const { pathname } = useLocation();
  const [detailTitle, setDetailTitle] = useState<string | React.ReactNode>()

  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState<string>('')

  useEffect(() => {
    setSearchInput('')
    setDetailTitle('')
  }, [pathname])

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e?.target?.value;
    setSearchInput(value)
  }

  const TAB_LIST = ['Tokens', 'NFTs']

  const handleSelectTab = (index: number) => {
    if (!index) {
      navigate('tokens')
    } else {
      navigate('nfts/collections')
    }
  }

  const activeTabIndex = useMemo(() => {
    const currentTab = pathname.split('/').filter(i => !!i)[1]

    return (TAB_LIST.map(tab => tab.toLowerCase())).indexOf(currentTab)
  }, [pathname])

  const isDetail = useMemo(() => pathname.includes('detail'), [pathname])

  return (
    <Layout.Base
      headerList={['Controller', 'Balance']}
      showWebHeader
    >
      <div className={CN('home', 'home-container', className, {
        '__web-ui': isWebUI
      })}>
        <div className="menu-bar">
          {
            !isDetail ? (
              <>
                <Tabs
                  className={className}
                  selectedIndex={activeTabIndex}
                  onSelect={handleSelectTab}
                >
                  <TabList
                    className={CN("react-tabs__tab-list")}
                  >
                    {TAB_LIST.map((label) => (
                      <Tab key={label}>{label}</Tab>
                    ))}
                  </TabList>

                  {/* fake tabpane to remove error logs */}
                  <div style={{ display: 'none' }}>
                    <TabPanel></TabPanel>
                    <TabPanel></TabPanel>
                  </div>
                </Tabs>
              </>
            ) : (
                <SwSubHeader
                  title={detailTitle}
                  showBackButton
                  onBack={() => {}}
                  background='transparent'
                  className='web-header'
                  center={false}
                />
            )
          }
          <div className="right-section">
            <Input.Search
              className="search-input"
              size="md"
              placeholder="Token name"
              onChange={handleInputChange}
              value={searchInput}
            />
          </div>
        </div>

        <Outlet context={{
          searchInput,
          setDetailTitle
        }} />
      </div>
    </Layout.Base>
  )
}

const Porfolio = styled(Component)<Props>(({ theme: { token }}) => {
  return {
    height: '100%',

    '.right-section': {
      justifySelf: 'end',
      display: 'flex',
      '.search-input': {
        width: 360,
        height: 50
      }
    },

    '&.__web-ui': {
      height: 'auto',

      ".react-tabs__tab-list": {
        display: "flex",
        borderRadius: token.borderRadiusLG,
        margin: 0,
        padding: 0,

        '& > li': {
          paddingBottom: '8px !important',
        }
      },

      ".menu-bar": {
        display: "flex",
        justifyContent: "space-between",
        flex: 1,
        background: "transparent",

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
          },
        },

        ".react-tabs__tab": {
          textAlign: "center",
          display: "inline-block",
          border: "none",
          outline: "none",
          position: "relative",
          listStyle: "none",
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeightStrong,
          cursor: "pointer",
          flex: "unset",
          opacity: 0.45,
          borderRadius: 0,
          color: "#FFFFFF",
          padding: 0,
          margin: "0px 8px",

          "&--selected": {
            background: "transparent",
            borderBottom: "2px solid #D9D9D9",
            opacity: 1,
          },
        },
      },
    },
  }
})

export default Porfolio
