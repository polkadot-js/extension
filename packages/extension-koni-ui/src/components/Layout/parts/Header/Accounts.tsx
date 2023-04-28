import { AccountJson, CurrentAccountInfo } from "@subwallet/extension-base/background/types";
import EmptyList from "@subwallet/extension-koni-ui/components/EmptyList";
import { MetaInfo } from "@subwallet/extension-koni-ui/components/MetaInfo";
import { RootState } from "@subwallet/extension-koni-ui/stores";
import { ThemeProps } from "@subwallet/extension-koni-ui/types";
import { findAccountByAddress, funcSortByName, isAccountAll, searchAccountFunction } from "@subwallet/extension-koni-ui/utils";
import { Divider, Logo, Popover, SwList } from "@subwallet/react-ui";
import { ListChecks } from "phosphor-react";
import { LegacyRef, forwardRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SelectAccountFooter from "../SelectAccount/Footer";
import { isEthereumAddress } from "@polkadot/util-crypto";
import { AccountItemWithName, AccountCardSelection } from "@subwallet/extension-koni-ui/components/Account";
import { saveCurrentAccountAddress } from "@subwallet/extension-koni-ui/messaging";
import { useNavigate } from "react-router-dom";
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';

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
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const accounts = useMemo((): AccountJson[] => {
    return [..._accounts].sort(funcSortByName);
  }, [_accounts]);

  const onClickDetailAccount = useCallback((address: string) => {
    return () => {
      setTimeout(() => {
        navigate(`/accounts/detail/${address}`);
      }, 100);
    };
  }, [navigate]);


  const noAllAccounts = useMemo(() => {
    return accounts.filter(({ address }) => !isAccountAll(address));
  }, [accounts]);

  const _onSelect = useCallback((address: string) => {
    if (address) {
      console.log('%c Rainbowww!', 'font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 rgb(217,31,38) , 6px 6px 0 rgb(226,91,14) , 9px 9px 0 rgb(245,221,8) , 12px 12px 0 rgb(5,148,68) , 15px 15px 0 rgb(2,135,206) , 18px 18px 0 rgb(4,77,145) , 21px 21px 0 rgb(42,21,113); margin-bottom: 12px; padding: 5%;');
      console.log('address', address)
      const accountByAddress = findAccountByAddress(accounts, address);

      if (accountByAddress) {
        const accountInfo = {
          address: address
        } as CurrentAccountInfo;

        saveCurrentAccountAddress(accountInfo).then(() => {
          const pathName = location.pathname;
          const locationPaths = location.pathname.split('/');

          if (locationPaths) {
            if (locationPaths[1] === 'home') {
              if (locationPaths.length >= 3) {
                if (pathName.startsWith('/home/nfts')) {
                  navigate('/home/nfts/collections');
                } else if (pathName.startsWith('/home/tokens/detail')) {
                  navigate('/home/tokens');
                } else {
                  navigate(`/home/${locationPaths[2]}`);
                }
              }
            } else {
              goHome();
            }
          }
        }).catch((e) => {
          console.error('There is a problem when set Current Account', e);
        });
      } else {
        console.error('There is a problem when change account');
      }
    }
  }, [accounts, location.pathname, navigate, goHome]);

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
      <div onClick={() => _onSelect(item.address)}>
        <AccountCardSelection
        accountName={item.name || ''}
        address={item.address}
        genesisHash={item.genesisHash}
        isSelected={_selected}
        isShowSubIcon
        onPressMoreBtn={onClickDetailAccount(item.address)}
        subIcon={(
          <Logo
            network={isEthereumAddress(item.address) ? 'ethereum' : 'polkadot'}
            shape={'circle'}
            size={16}
          />
        )}
      />
      </div>
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
          list={noAllAccounts}
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
