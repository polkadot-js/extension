// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { reformatAddress } from "@subwallet/extension-base/utils";
import {
  useForwardInputRef,
  useOpenQrScanner,
  useSelector,
  useTranslation,
} from "@subwallet-webapp/hooks";
import { ThemeProps } from "@subwallet-webapp/types";
import { ScannerResult } from "@subwallet-webapp/types/scanner";
import { toShort } from "@subwallet-webapp/util";
import {
  Button,
  Icon,
  Input,
  InputRef,
  ModalContext,
  SwQrScanner,
} from "@subwallet/react-ui";
import CN from "classnames";
import { Book, Scan } from "phosphor-react";
import React, {
  ChangeEventHandler,
  ForwardedRef,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";

import { isAddress, isEthereumAddress } from "@polkadot/util-crypto";

import { Avatar } from "../Avatar";
import { QrScannerErrorNotice } from "../Qr";
import { BasicInputWrapper } from "./Base";

interface Props extends BasicInputWrapper, ThemeProps {
  showAddressBook?: boolean;
  showScanner?: boolean;
  autoReformatValue?: boolean;
}

const modalId = "input-account-address-modal";

function Component(
  props: Props,
  ref: ForwardedRef<InputRef>
): React.ReactElement<Props> {
  const {
    autoReformatValue,
    className = "",
    disabled,
    id = modalId,
    label,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    readOnly,
    showAddressBook,
    showScanner,
    statusHelp,
    value,
  } = props;
  const { t } = useTranslation();

  const { inactiveModal } = useContext(ModalContext);

  const accounts = useSelector((root) => root.accountState.accounts);

  const inputRef = useForwardInputRef(ref);
  const [scanError, setScanError] = useState("");

  const accountName = useMemo(() => {
    const account = accounts.find(
      (acc) => acc.address.toLowerCase() === value?.toLowerCase()
    );

    return account?.name;
  }, [accounts, value]);

  const parseAndChangeValue = useCallback(
    (value: string) => {
      const val = value.trim();

      if (autoReformatValue) {
        if (isAddress(val)) {
          onChange && onChange({ target: { value: reformatAddress(val, 42) } });

          return;
        }
      }

      onChange && onChange({ target: { value: val } });
    },
    [onChange, autoReformatValue]
  );

  const _onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      parseAndChangeValue(event.target.value);
    },
    [parseAndChangeValue]
  );

  const onOpenScanner = useOpenQrScanner(id);

  const onScanError = useCallback((error: string) => {
    setScanError(error);
  }, []);

  const onSuccess = useCallback(
    (result: ScannerResult) => {
      inputRef?.current?.focus();
      setScanError("");
      inactiveModal(id);
      parseAndChangeValue(result.text);
      inputRef?.current?.blur();
    },
    [inactiveModal, id, parseAndChangeValue, inputRef]
  );

  const onCloseScan = useCallback(() => {
    inputRef?.current?.focus();
    setScanError("");
    inputRef?.current?.blur();
  }, [inputRef]);

  // todo: Will work with "Manage address book" feature later
  return (
    <>
      <Input
        className={CN("address-input", className, {
          "-is-valid-address": isAddress(value),
        })}
        disabled={disabled}
        id={id}
        label={label || t("Account address")}
        onBlur={onBlur}
        onChange={_onChange}
        onFocus={onFocus}
        placeholder={placeholder || t("Please type or paste an address")}
        prefix={
          <>
            {value && isAddress(value) && (
              <div className={"__overlay"}>
                <div
                  className={CN("__name common-text", {
                    "limit-width": !!accountName,
                  })}
                >
                  {accountName || toShort(value, 9, 9)}
                </div>
                {accountName && (
                  <div className={"__address common-text"}>
                    ({toShort(value, 4, 4)})
                  </div>
                )}
              </div>
            )}
            <Avatar
              size={20}
              theme={
                value
                  ? isEthereumAddress(value)
                    ? "ethereum"
                    : "polkadot"
                  : undefined
              }
              value={value}
            />
          </>
        }
        readOnly={readOnly}
        ref={inputRef}
        statusHelp={statusHelp}
        suffix={
          <>
            {showAddressBook && (
              <Button
                icon={<Icon phosphorIcon={Book} size="sm" />}
                size="xs"
                type="ghost"
              />
            )}
            {showScanner && (
              <Button
                icon={<Icon phosphorIcon={Scan} size="sm" />}
                onClick={onOpenScanner}
                size="xs"
                type="ghost"
              />
            )}
          </>
        }
        value={value}
      />

      {showScanner && (
        <SwQrScanner
          className={className}
          id={id}
          isError={!!scanError}
          onClose={onCloseScan}
          onError={onScanError}
          onSuccess={onSuccess}
          overlay={scanError && <QrScannerErrorNotice message={scanError} />}
        />
      )}
    </>
  );
}

export const AddressInput = styled(forwardRef(Component))<Props>(
  ({ theme: { token } }: Props) => {
    return {
      ".__overlay": {
        position: "absolute",
        backgroundColor: token.colorBgSecondary,
        top: 0,
        left: 2,
        bottom: 2,
        right: 2,
        borderRadius: token.borderRadiusLG,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        paddingLeft: 40,
        paddingRight: 84,
        whiteSpace: "nowrap",
      },

      ".__name": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: token.colorTextLight1,

        "&.limit-width": {
          maxWidth: 136,
        },
      },

      ".__address": {
        paddingLeft: token.sizeXXS,
      },

      ".ant-input-prefix": {
        pointerEvents: "none",
      },

      "&:focus-within, &.-status-error": {
        ".__overlay": {
          pointerEvents: "none",
          opacity: 0,
        },
      },
    };
  }
);
