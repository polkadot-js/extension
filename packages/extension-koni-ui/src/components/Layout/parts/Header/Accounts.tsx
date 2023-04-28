import { AccountJson } from "@subwallet/extension-base/background/types";
import EmptyList from "@subwallet/extension-koni-ui/components/EmptyList";
import { MetaInfo } from "@subwallet/extension-koni-ui/components/MetaInfo";
import { RootState } from "@subwallet/extension-koni-ui/stores";
import { ThemeProps } from "@subwallet/extension-koni-ui/types";
import { funcSortByName, isAccountAll, searchAccountFunction } from "@subwallet/extension-koni-ui/utils";
import { Divider, Logo, Popover, SwList } from "@subwallet/react-ui";
import { ListChecks } from "phosphor-react";
import { LegacyRef, forwardRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SelectAccountFooter from "../SelectAccount/Footer";
import { isEthereumAddress } from "@polkadot/util-crypto";
import { AccountItemWithName, AccountCardSelection } from "@subwallet/extension-koni-ui/components/Account";

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

const StyledActions = styled.div<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    '& > div': {
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      gap: "8px",
    }
  };
});
const Component: React.FC = () => {
  const { t } = useTranslation();
  const { accounts: _accounts } = useSelector((state: RootState) => state.accountState);

  const accounts = useMemo((): AccountJson[] => {
    return [..._accounts].sort(funcSortByName);
  }, [_accounts]);


  const renderItem = useCallback((item: AccountJson, _selected: boolean) => {
    const currentAccountIsAll = isAccountAll(item.address);

    if (currentAccountIsAll) {
      return (
        <AccountItemWithName
          address={item.address}
          className='all-account-selection'
          isSelected={_selected}
        />
      );
    }

    return (
      <AccountCardSelection
        accountName={item.name || ''}
        address={item.address}
        genesisHash={item.genesisHash}
        isSelected={_selected}
        isShowSubIcon
        // onPressMoreBtn={onClickDetailAccount(item.address)}
        subIcon={(
          <Logo
            network={isEthereumAddress(item.address) ? 'ethereum' : 'polkadot'}
            shape={'circle'}
            size={16}
          />
        )}
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

  // Remove ref error
  const TriggerComponent = forwardRef((props, ref) => (
    <div {...props} ref={ref as unknown as LegacyRef<HTMLDivElement> | undefined}>
      <MetaInfo.AccountGroup
        className="ava-group"
        accounts={accounts}
        content={`${accounts.length} accounts`}
      />
    </div>
  ))

  const popOverContent = useMemo(() => {
    return (
      <>
        <StyledSection
          className={'manage_chains__container'}
          enableSearchInput
          list={accounts}
          mode={'boxed'}
          renderItem={renderItem}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchAccountFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search chain')}
        />
        <Divider />
        <StyledActions>
          <SelectAccountFooter />
        </StyledActions>
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
      <TriggerComponent />
    </Popover>
  )
}

const Accounts = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return {
  };
});

export default Accounts;
