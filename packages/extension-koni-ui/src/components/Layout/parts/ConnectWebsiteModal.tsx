// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { isAccountAll } from '@subwallet/extension-base/utils';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import { changeAuthorizationBlock, changeAuthorizationPerSite } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress } from '@subwallet/extension-koni-ui/util';
import { accountCanSign, getSignMode } from '@subwallet/extension-koni-ui/util/account';
import { Button, Icon } from '@subwallet/react-ui';
import SwModal from '@subwallet/react-ui/es/sw-modal';
import CN from 'classnames';
import { CheckCircle, GlobeHemisphereWest, Info, ShieldCheck, ShieldSlash, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & {
  id: string;
  onCancel: () => void;
  isNotConnected: boolean;
  isBlocked: boolean;
  authInfo?: AuthUrlInfo;
  url: string;
}

type ConnectIcon = {
  linkIcon?: React.ReactNode;
  linkIconBg?: string;
};

function Component ({ authInfo, className = '', id, isBlocked = true, isNotConnected = false, onCancel, url }: Props): React.ReactElement<Props> {
  const [allowedMap, setAllowedMap] = useState<Record<string, boolean>>(authInfo?.isAllowedMap || {});
  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const [oldConnected, setOldConnected] = useState(0);
  const [isSubmit, setIsSubmit] = useState(false);
  const { token } = useTheme() as Theme;
  const _isNotConnected = isNotConnected || !authInfo;

  const handlerUpdateMap = useCallback((address: string, oldValue: boolean) => {
    return () => {
      setAllowedMap((values) => ({
        ...values,
        [address]: !oldValue
      }));
    };
  }, []);

  const handlerSubmit = useCallback(() => {
    if (!isSubmit && authInfo?.id) {
      setIsSubmit(true);
      changeAuthorizationPerSite({ values: allowedMap, id: authInfo.id })
        .catch((e) => {
          console.log('changeAuthorizationPerSite error', e);
        }).finally(() => {
          onCancel();
          setIsSubmit(false);
        });
    }
  }, [allowedMap, authInfo?.id, isSubmit, onCancel]);

  const handlerUnblock = useCallback(() => {
    if (!isSubmit && authInfo?.id) {
      setIsSubmit(true);
      changeAuthorizationBlock({ connectedValue: true, id: authInfo.id })
        .then(() => {
          setIsSubmit(false);
        })
        .catch(console.error);
    }
  }, [authInfo?.id, isSubmit]);

  useEffect(() => {
    if (!!authInfo?.isAllowedMap && !!authInfo?.accountAuthType) {
      const connected = Object.values(authInfo.isAllowedMap).filter((s) => s).length;

      const type = authInfo.accountAuthType;
      const allowedMap = authInfo.isAllowedMap;

      const filterType = (address: string) => {
        if (type === 'both') {
          return true;
        }

        const _type = type || 'substrate';

        return _type === 'substrate' ? !isEthereumAddress(address) : isEthereumAddress(address);
      };

      const result: Record<string, boolean> = {};

      Object.entries(allowedMap)
        .filter(([address]) => filterType(address))
        .forEach(([address, value]) => {
          result[address] = value;
        });

      setAllowedMap(result);
      setOldConnected(connected);
    } else {
      setOldConnected(0);
      setAllowedMap({});
    }
  }, [authInfo?.accountAuthType, authInfo?.isAllowedMap]);

  const actionButtons = useMemo(() => {
    if (_isNotConnected) {
      return (
        <>
          <Button
            block
            icon={
              <Icon
                phosphorIcon={XCircle}
              />
            }
            loading={isSubmit}
            onClick={onCancel}
          >
            {/* todo: i18n this */}
            Close
          </Button>
        </>
      );
    }

    if (isBlocked) {
      return (
        <>
          <Button
            block
            icon={
              <Icon
                phosphorIcon={XCircle}
                weight={'fill'}
              />
            }
            loading={isSubmit}
            onClick={onCancel}
            schema={'secondary'}
          >
            {/* todo: i18n this */}
            Cancel
          </Button>
          <Button
            block
            icon={
              <Icon
                phosphorIcon={ShieldCheck}
                weight={'fill'}
              />
            }
            loading={isSubmit}
            onClick={handlerUnblock}
          >
            {/* todo: i18n this */}
            Unblock
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          block
          icon={
            <Icon
              phosphorIcon={XCircle}
              weight={'fill'}
            />
          }
          loading={isSubmit}
          onClick={onCancel}
          schema={'secondary'}
        >
          {/* todo: i18n this */}
          Cancel
        </Button>
        <Button
          block
          icon={
            <Icon
              phosphorIcon={CheckCircle}
              weight={'fill'}
            />
          }
          loading={isSubmit}
          onClick={handlerSubmit}
        >
          {/* todo: i18n this */}
          Confirm
        </Button>
      </>
    );
  }, [_isNotConnected, handlerSubmit, handlerUnblock, isBlocked, isSubmit, onCancel]);

  const connectIconProps = useMemo<ConnectIcon>(() => {
    if (_isNotConnected) {
      return {
        linkIcon: <Icon
          customSize='24px'
          phosphorIcon={GlobeHemisphereWest}
        />,
        linkIconBg: token.colorWarning
      };
    }

    if (isBlocked) {
      return {
        linkIcon: <Icon
          customSize='24px'
          phosphorIcon={ShieldSlash}
        />,
        linkIconBg: token.colorError
      };
    }

    return {};
  }, [_isNotConnected, isBlocked, token]);

  const renderContent = () => {
    if (_isNotConnected) {
      // todo: i18n this
      return (
        <>
          <div className={'__content-heading'}>This is not a Web3 application</div>
          <div className={'text-tertiary __content-text'}>
            SubWallet is not connected to this site. To connect to a web3 site, find and click the connect button.
          </div>
        </>
      );
    }

    if (isBlocked) {
      // todo: i18n this
      return (
        <>
          <div className={'__content-heading'}>This site has been blocked</div>
          <div className={'text-tertiary __content-text'}>
            This website has previously been blocked. Do you wish to unblock and grant access to it?
          </div>
        </>
      );
    }

    const origin = Object.entries(allowedMap).map(([address, value]) => ({ address, value }));
    const list = origin.filter(({ address }) => accountCanSign(getSignMode(findAccountByAddress(accounts, address))));

    const current = list.find(({ address }) => address === currentAccount?.address);

    if (current) {
      const idx = list.indexOf(current);

      list.splice(idx, 1);
      list.unshift(current);
    }

    return (
      <>
        <div className={CN('__number-of-select-text')}>
          {/* todo: i18n */}
          You have {oldConnected} accounts connected to this site
        </div>

        <div className={'__account-item-container'}>
          {
            list.map(({ address, value }) => {
              const account = accounts.find((acc) => acc.address === address);

              if (!account || isAccountAll(account.address)) {
                return null;
              }

              const isCurrent = account.address === currentAccount?.address;

              return (
                <AccountItemWithName
                  accountName={account.name}
                  address={account.address}
                  avatarSize={24}
                  className={CN({
                    '-is-current': isCurrent
                  })}
                  isSelected={value}
                  key={account.address}
                  onClick={handlerUpdateMap(address, value)}
                  showUnselectIcon
                />
              );
            })
          }
        </div>
      </>
    );
  };

  return (
    <SwModal
      className={className}
      footer={actionButtons}
      id={id}
      onCancel={onCancel}
      rightIconProps={{
        icon: (
          <Icon
            phosphorIcon={Info}
          />
        )
      }}
      title={'Connect website'} // todo: i18n this
    >
      <ConfirmationGeneralInfo
        request={{
          id: url,
          url: url
        }}
        {...connectIconProps}
      />

      {renderContent()}
    </SwModal>
  );
}

export const ConnectWebsiteModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 0
    },

    '.dual-logo-container': {
      paddingTop: 0
    },

    '.__domain': {
      marginBottom: token.margin
    },

    '.__content-heading': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4
    },

    '.confirmation-general-info-container + .__content-heading': {
      paddingTop: token.paddingXS,
      textAlign: 'center',
      marginBottom: token.marginMD
    },

    '.__content-text': {
      textAlign: 'center',
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.__account-item-container:not(:empty)': {
      marginTop: token.margin
    },

    '.account-item-with-name': {
      position: 'relative',
      cursor: 'pointer',

      '&:before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        display: 'block',
        border: '2px solid transparent',
        borderRadius: token.borderRadiusLG
      },

      '&:-is-current:before': {
        borderColor: token.colorPrimary
      }
    },

    '.account-item-with-name + .account-item-with-name': {
      marginTop: token.marginSM
    },

    '.ant-sw-modal-footer': {
      display: 'flex',
      marginTop: token.margin,
      marginBottom: token.margin,

      '.ant-btn + .ant-btn.ant-btn': {
        marginInlineStart: token.margin
      }
    }
  });
});
