// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EmptyList, PageWrapper } from "@subwallet-webapp/components";
import { AccountSelectorModal } from "@subwallet-webapp/components/Modal/AccountSelectorModal";
import ReceiveQrModal from "@subwallet-webapp/components/Modal/ReceiveModal/ReceiveQrModal";
import { TokensSelectorModal } from "@subwallet-webapp/components/Modal/ReceiveModal/TokensSelectorModal";
import { TokenGroupBalanceItem } from "@subwallet-webapp/components/TokenItem/TokenGroupBalanceItem";
import { DataContext } from "@subwallet-webapp/contexts/DataContext";
import { HomeContext } from "@subwallet-webapp/contexts/screen/HomeContext";
import useNotification from "@subwallet-webapp/hooks/common/useNotification";
import useTranslation from "@subwallet-webapp/hooks/common/useTranslation";
import useReceiveQR from "@subwallet-webapp/hooks/screen/home/useReceiveQR";
import { UpperBlock } from "@subwallet-webapp/Popup/Home/Tokens/UpperBlock";
import { RootState } from "@subwallet-webapp/stores";
import { ThemeProps } from "@subwallet-webapp/types";
import { TokenBalanceItemType } from "@subwallet-webapp/types/balance";
import { Button, Icon } from "@subwallet/react-ui";
import classNames from "classnames";
import { Coins, FadersHorizontal } from "phosphor-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

type Props = ThemeProps;

const Component = (): React.ReactElement => {
  const { t } = useTranslation();
  const [isShrink, setIsShrink] = useState<boolean>(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const topBlockRef = useRef<HTMLDivElement>(null);
  const {
    accountBalance: { tokenGroupBalanceMap, totalBalanceInfo },
    tokenGroupStructure: { sortedTokenGroups },
  } = useContext(HomeContext);
  const currentAccount = useSelector(
    (state: RootState) => state.accountState.currentAccount
  );
  const notify = useNotification();
  const {
    accountSelectorItems,
    onOpenReceive,
    openSelectAccount,
    openSelectToken,
    selectedAccount,
    selectedNetwork,
    tokenSelectorItems,
  } = useReceiveQR();

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const topPosition = event.currentTarget.scrollTop;

    if (topPosition > 80) {
      setIsShrink((value) => {
        if (!value && topBlockRef.current && containerRef.current) {
          const containerProps = containerRef.current.getBoundingClientRect();

          topBlockRef.current.style.position = "fixed";
          topBlockRef.current.style.top = `${containerProps.top}px`;
          topBlockRef.current.style.left = `${containerProps.left}px`;
          topBlockRef.current.style.right = `${containerProps.right}px`;
          topBlockRef.current.style.width = `${containerProps.width}px`;
          topBlockRef.current.style.opacity = "0";
          topBlockRef.current.style.paddingTop = "0";

          setTimeout(() => {
            if (topBlockRef.current) {
              topBlockRef.current.style.opacity = "1";
              topBlockRef.current.style.paddingTop = "32px";
            }
          }, 100);
        }

        return true;
      });
    } else {
      setIsShrink((value) => {
        if (value && topBlockRef.current) {
          topBlockRef.current.style.position = "absolute";
          topBlockRef.current.style.top = "0";
          topBlockRef.current.style.left = "0";
          topBlockRef.current.style.right = "0";
          topBlockRef.current.style.width = "100%";
          topBlockRef.current.style.opacity = "0";
          topBlockRef.current.style.paddingTop = "0";

          setTimeout(() => {
            if (topBlockRef.current) {
              topBlockRef.current.style.opacity = "1";
              topBlockRef.current.style.paddingTop = "32px";
            }
          }, 100);
        }

        return false;
      });
    }
  }, []);

  const handleResize = useCallback(() => {
    const topPosition = containerRef.current?.scrollTop || 0;

    if (topPosition > 80) {
      if (topBlockRef.current && containerRef.current) {
        const containerProps = containerRef.current.getBoundingClientRect();

        topBlockRef.current.style.top = `${containerProps.top}px`;
        topBlockRef.current.style.left = `${containerProps.left}px`;
        topBlockRef.current.style.right = `${containerProps.right}px`;
        topBlockRef.current.style.width = `${containerProps.width}px`;
      }
    } else {
      if (topBlockRef.current) {
        topBlockRef.current.style.top = "0";
        topBlockRef.current.style.left = "0";
        topBlockRef.current.style.right = "0";
        topBlockRef.current.style.width = "100%";
      }
    }
  }, []);

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === "decrease";

  const onClickItem = useCallback(
    (item: TokenBalanceItemType) => {
      return () => {
        navigate(`/home/tokens/detail/${item.slug}`);
      };
    },
    [navigate]
  );

  const onClickManageToken = useCallback(() => {
    navigate("/settings/tokens/manage");
  }, [navigate]);

  const onOpenSendFund = useCallback(() => {
    if (currentAccount && currentAccount.isReadOnly) {
      notify({
        message: t(
          "The account you are using is read-only, you cannot send assets with it"
        ),
        type: "info",
        duration: 3,
      });

      return;
    }

    navigate("/transaction/send-fund");
  }, [currentAccount, navigate, notify, t]);

  const onOpenBuyTokens = useCallback(() => {
    navigate("/buy-tokens");
  }, [navigate]);

  const tokenGroupBalanceItems = useMemo<TokenBalanceItemType[]>(() => {
    const result: TokenBalanceItemType[] = [];

    sortedTokenGroups.forEach((tokenGroupSlug) => {
      if (tokenGroupBalanceMap[tokenGroupSlug]) {
        result.push(tokenGroupBalanceMap[tokenGroupSlug]);
      }
    });

    return result;
  }, [sortedTokenGroups, tokenGroupBalanceMap]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <div
      className={"tokens-screen-container"}
      onScroll={handleScroll}
      ref={containerRef}
    >
      <div
        className={classNames("__upper-block-wrapper", {
          "-is-shrink": isShrink,
          "-decrease": isTotalBalanceDecrease,
        })}
        ref={topBlockRef}
      >
        <UpperBlock
          isPriceDecrease={isTotalBalanceDecrease}
          isShrink={isShrink}
          onOpenBuyTokens={onOpenBuyTokens}
          onOpenReceive={onOpenReceive}
          onOpenSendFund={onOpenSendFund}
          totalChangePercent={totalBalanceInfo.change.percent}
          totalChangeValue={totalBalanceInfo.change.value}
          totalValue={totalBalanceInfo.convertedValue}
        />
      </div>
      <div className={"__scroll-container"}>
        {tokenGroupBalanceItems.map((item) => {
          return (
            <TokenGroupBalanceItem
              key={item.slug}
              {...item}
              onPressItem={onClickItem(item)}
            />
          );
        })}
        {!tokenGroupBalanceItems.length && (
          <EmptyList
            className={"__empty-list"}
            emptyMessage={t("Add tokens to get started.")}
            emptyTitle={t("No tokens found")}
            phosphorIcon={Coins}
          />
        )}
        <div className={"__scroll-footer"}>
          <Button
            icon={<Icon phosphorIcon={FadersHorizontal} />}
            onClick={onClickManageToken}
            size={"xs"}
            type={"ghost"}
          >
            {t("Manage token list")}
          </Button>
        </div>
      </div>

      <AccountSelectorModal
        items={accountSelectorItems}
        onSelectItem={openSelectAccount}
      />

      <TokensSelectorModal
        address={selectedAccount}
        items={tokenSelectorItems}
        onSelectItem={openSelectToken}
      />

      <ReceiveQrModal
        address={selectedAccount}
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
};

const WrapperComponent = ({
  className = "",
}: ThemeProps): React.ReactElement<Props> => {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={`tokens ${className}`}
      resolve={dataContext.awaitStores([
        "price",
        "chainStore",
        "assetRegistry",
        "balance",
      ])}
    >
      <Component />
    </PageWrapper>
  );
};

const Tokens = styled(WrapperComponent)<ThemeProps>(
  ({ theme: { extendToken, token } }: ThemeProps) => {
    return {
      overflow: "hidden",

      ".__empty-list": {
        marginTop: token.marginSM,
        marginBottom: token.marginSM,
      },

      ".tokens-screen-container": {
        height: "100%",
        color: token.colorTextLight1,
        fontSize: token.fontSizeLG,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        paddingTop: 210,
      },

      ".__scroll-container": {
        paddingLeft: token.size,
        paddingRight: token.size,
      },

      ".__upper-block-wrapper": {
        backgroundColor: token.colorBgDefault,
        position: "absolute",
        paddingTop: "32px",
        height: 210,
        zIndex: 10,
        top: 0,
        left: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        backgroundImage: extendToken.tokensScreenSuccessBackgroundColor,
        transition: "opacity, padding-top 0.27s ease",

        "&.-is-shrink": {
          height: 104,
        },

        "&.-decrease": {
          backgroundImage: extendToken.tokensScreenDangerBackgroundColor,
        },
      },

      ".tokens-upper-block": {
        flex: 1,
      },

      ".__scroll-footer": {
        display: "flex",
        justifyContent: "center",
        marginBottom: token.size,
      },

      ".token-group-balance-item": {
        marginBottom: token.sizeXS,
      },

      ".__upper-block-wrapper.-is-shrink": {
        ".__static-block": {
          display: "none",
        },

        ".__scrolling-block": {
          display: "flex",
        },
      },
    };
  }
);

export default Tokens;
