import React, { useCallback, useContext } from 'react';
import { ThemeProps } from "@subwallet/extension-koni-ui/types"
import styled from 'styled-components';
import { GlobalSearchTokenModal, Layout, ScreenTab } from '@subwallet/extension-koni-ui/components';
// import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { Outlet } from 'react-router-dom';
import { GlobalSearchTokenModalId } from '../Home';
// import { useGetChainSlugsByAccountType } from '@subwallet/extension-koni-ui/hooks';
import { Button, Icon, Input, ModalContext } from '@subwallet/react-ui';
import { DownloadSimple, MagnifyingGlass } from 'phosphor-react';
import Tokens from '../Home/Tokens';
import NftCollections from '../Home/Nfts/NftCollections';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import CN from 'classnames';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';

type Props = ThemeProps & {
  className?: string;
}

function Component({ className }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  // const chainsByAccountType = useGetChainSlugsByAccountType();
  // console.log('====chainsByAccountType', chainsByAccountType);
  // const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  // console.log('tokenGroupStructure', tokenGroupStructure);
  // const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  // console.log('accountBalance', accountBalance);
  const { isWebUI } = useContext(ScreenContext)
  const {
    accountBalance,
    tokenGroupStructure
  } = useContext(HomeContext);

  const rightSection: React.ReactElement = (
    <div className="right-section">
      <Button
        type="ghost"
        icon={<Icon phosphorIcon={DownloadSimple} size="sm" />}
      />
      <Input
        className="search-input"
        size="md"
        placeholder="Token name"
        prefix={<Icon phosphorIcon={MagnifyingGlass} />}
      />
    </div>
  )

  const onOpenGlobalSearchToken = useCallback(() => {
    activeModal(GlobalSearchTokenModalId);
  }, [activeModal]);

  const onCloseGlobalSearchToken = useCallback(() => {
    inactiveModal(GlobalSearchTokenModalId);
  }, [inactiveModal]);

  return (
    <>
      {/* <HomeContext.Provider value={{
        tokenGroupStructure,
        accountBalance
      }}
      > */}
      <div className={CN('home', 'home-container', className, {
        '__web-ui': isWebUI
      })}>
        {isWebUI ?
            <ScreenTab rightSection={rightSection}>
              <ScreenTab.SwTabPanel key={'tokens'} label="Tokens">
                <>
                  <Tokens />
                </>
              </ScreenTab.SwTabPanel>
              <ScreenTab.SwTabPanel key={'collections'} label="Collections">
                <>
                  <NftCollections />
                </>
              </ScreenTab.SwTabPanel>
            </ScreenTab>
        :
          <Layout.Home
            onClickSearchIcon={onOpenGlobalSearchToken}
            showFilterIcon
            showSearchIcon
          >
            <Outlet />
        </Layout.Home>}
      </div>
      {/* </HomeContext.Provider> */}

      <GlobalSearchTokenModal
        id={GlobalSearchTokenModalId}
        onCancel={onCloseGlobalSearchToken}
        sortedTokenSlugs={tokenGroupStructure.sortedTokenSlugs}
        tokenBalanceMap={accountBalance.tokenBalanceMap}
      />
    </>
  )
}

const Porfolio = styled(Component)<Props>(() => {
  return {
    height: '100%',
    '.__web-ui': {
      height: 'auto',
    },
    ".right-section": {
      display: "flex",
      alignItems: "center",
    },
  }
})

export default Porfolio
