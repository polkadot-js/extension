// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarInfo from "@subwallet-webapp/hooks/account/useAccountAvatarInfo";
import useAccountAvatarTheme from "@subwallet-webapp/hooks/account/useAccountAvatarTheme";
import useGetAccountSignModeByAddress from "@subwallet-webapp/hooks/account/useGetAccountSignModeByAddress";
import { ThemeProps } from "@subwallet-webapp/types";
import { AccountSignMode } from "@subwallet-webapp/types/account";
import { Button, Icon, SwIconProps } from "@subwallet/react-ui";
import AccountCard, {
  AccountCardProps,
} from "@subwallet/react-ui/es/web3-block/account-card";
import { Eye, PencilSimpleLine, QrCode, Swatches } from "phosphor-react";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import { KeypairType } from "@polkadot/util-crypto/types";

export interface _AccountCardProps
  extends Omit<AccountCardProps, "avatarIdentPrefix">,
    ThemeProps {
  className?: string;
  genesisHash?: string | null;
  type?: KeypairType;
  showMoreBtn?: boolean;
  onPressMoreBtn?: () => void;
  preventPrefix?: boolean;
}

function Component(
  props: _AccountCardProps
): React.ReactElement<_AccountCardProps> {
  const {
    accountName,
    address,
    className,
    genesisHash,
    onPressMoreBtn,
    preventPrefix,
    showMoreBtn,
    type: givenType,
  } = props;
  const { address: avatarAddress, prefix } = useAccountAvatarInfo(
    address ?? "",
    preventPrefix,
    genesisHash,
    givenType
  );
  const avatarTheme = useAccountAvatarTheme(address || "");

  const signMode = useGetAccountSignModeByAddress(address);

  const iconProps: SwIconProps | undefined = useMemo(():
    | SwIconProps
    | undefined => {
    switch (signMode) {
      case AccountSignMode.LEDGER:
        return {
          type: "phosphor",
          phosphorIcon: Swatches,
        };
      case AccountSignMode.QR:
        return {
          type: "phosphor",
          phosphorIcon: QrCode,
        };
      case AccountSignMode.READ_ONLY:
        return {
          type: "phosphor",
          phosphorIcon: Eye,
        };
    }

    return undefined;
  }, [signMode]);

  const _onClickMore: React.MouseEventHandler<
    HTMLAnchorElement | HTMLButtonElement
  > = useCallback(
    (event) => {
      event.stopPropagation();
      onPressMoreBtn && onPressMoreBtn();
    },
    [onPressMoreBtn]
  );

  const renderRightItem = useCallback(
    (x: React.ReactNode): React.ReactNode => {
      return (
        <>
          {x}
          {iconProps && (
            <Button
              className="account-type-icon"
              icon={<Icon {...iconProps} size="sm" />}
              size="xs"
              type="ghost"
            />
          )}

          {showMoreBtn && (
            <Button
              icon={<Icon phosphorIcon={PencilSimpleLine} size="sm" />}
              onClick={_onClickMore}
              size="xs"
              type="ghost"
            />
          )}
        </>
      );
    },
    [_onClickMore, iconProps, showMoreBtn]
  );

  return (
    <div className={props.className}>
      <AccountCard
        {...props}
        accountName={accountName || ""}
        address={avatarAddress}
        avatarIdentPrefix={prefix}
        avatarTheme={avatarTheme}
        className={className}
        renderRightItem={renderRightItem}
      />
    </div>
  );
}

const AccountCardBase = styled(Component)<_AccountCardProps>(
  ({ theme: { token } }: _AccountCardProps) => {
    return {
      ".account-type-icon": {
        color: `${token["gray-4"]} !important`,
      },
    };
  }
);

export default AccountCardBase;
