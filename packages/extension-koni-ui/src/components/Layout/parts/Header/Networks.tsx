import EmptyList from "@subwallet/extension-koni-ui/components/EmptyList";
import { MetaInfo } from "@subwallet/extension-koni-ui/components/MetaInfo";
import NetworkToggleItem from "@subwallet/extension-koni-ui/components/NetworkToggleItem";
import useChainInfoWithState, { ChainInfoWithState } from "@subwallet/extension-koni-ui/hooks/chain/useChainInfoWithState";
import { ThemeProps } from "@subwallet/extension-koni-ui/types";
import { Button, Divider, Icon, Popover, SwList } from "@subwallet/react-ui";
import { ListChecks, SlidersHorizontal } from "phosphor-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const StyledSection = styled(SwList.Section)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    '&.manage_chains__container': {
      maxHeight: 500,
      width: 390,
      background: token.colorBgBase,

      '.ant-sw-list': {
        padding: '8px 16px 10px',

        '.ant-web3-block': {
          padding: 10,
          margin: '4px 0',

          '.ant-web3-block-right-item': {
            marginRight: 0
          }
        }
      }
    }
  };
});

const Component: React.FC = () => {
  const { t } = useTranslation();
  const chainInfoList = useChainInfoWithState();

  const searchToken = useCallback((chainInfo: ChainInfoWithState, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return chainInfo.name.toLowerCase().includes(searchTextLowerCase);
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

  const popOverContent = useMemo(() => {
    return (
      <>
        <StyledSection
          className={'manage_chains__container'}
          enableSearchInput
          list={chainInfoList}
          mode={'boxed'}
          renderItem={renderChainItem}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search chain')}
        />
        <Divider />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Button
            type="ghost"
            icon={<Icon phosphorIcon={SlidersHorizontal} size={"sm"} />}
          >
            {t<string>("Manage networks")}
          </Button>
        </div>
      </>
    )
  }, [])

  return (
    <Popover
      content={popOverContent}
      trigger="click"
      showArrow={false}
      placement="bottomRight"
      overlayInnerStyle={{
        padding: '16px 0',
      }}
    >
      <MetaInfo.AccountGroup
        className="ava-group"
        accounts={[]}
        content={`${chainInfoList.length} networks`}
      />
    </Popover>
  )
}

const Networks = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
  };
});

export default Networks;
