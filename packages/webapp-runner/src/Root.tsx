// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from "@subwallet/extension-base/constants"
import { PageWrapper } from "@subwallet-webapp/components"
import Logo2D from "@subwallet-webapp/components/Logo/Logo2D"
import { DEFAULT_ROUTER_PATH } from "@subwallet-webapp/constants/router"
import { DataContext } from "@subwallet-webapp/contexts/DataContext"
import {
  usePredefinedModal,
  WalletModalContext,
} from "@subwallet-webapp/contexts/WalletModalContext"
import useNotification from "@subwallet-webapp/hooks/common/useNotification"
import useDefaultNavigate from "@subwallet-webapp/hooks/router/useDefaultNavigate"
import { subscribeNotifications } from "@subwallet-webapp/messaging"
import { RootState } from "@subwallet-webapp/stores"
import { ThemeProps } from "@subwallet-webapp/types"
import { isNoAccount } from "@subwallet-webapp/util/account/account"
import { changeHeaderLogo } from "@subwallet/react-ui"
import { NotificationProps } from "@subwallet/react-ui/es/notification/NotificationProvider"
import React, { useContext, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import styled from "styled-components"

changeHeaderLogo(<Logo2D />)

export const RouteState = {
  prevDifferentPathNum: -1,
  lastPathName: "/",
}

const welcomeUrl = "/welcome"
const tokenUrl = "/home/tokens"
const loginUrl = "/keyring/login"
const createPasswordUrl = "/keyring/create-password"
const migratePasswordUrl = "/keyring/migrate-password"

function DefaultRoute({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const { goBack, goHome } = useDefaultNavigate()
  const { isOpenPModal, openPModal } = usePredefinedModal()
  const { hasConfirmations, hasInternalConfirmations } = useSelector(
    (state: RootState) => state.requestState
  )
  const { accounts, hasMasterPassword, isLocked } = useSelector(
    (state: RootState) => state.accountState
  )
  const notify = useNotification()

  const needMigrate = useMemo(
    () =>
      !!accounts
        .filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal)
        .filter((acc) => !acc.isMasterPassword).length,
    [accounts]
  )

  useEffect(() => {
    let cancel = false
    let lastNotifyTime = new Date().getTime()

    subscribeNotifications((rs) => {
      rs.sort((a, b) => a.id - b.id).forEach(
        ({ action, id, message, title, type }) => {
          if (!cancel && id > lastNotifyTime) {
            const notificationItem: NotificationProps = {
              message: title || message,
              type,
            }

            if (action?.url) {
              notificationItem.onClick = () => {
                window.open(action.url)
              }
            }

            notify(notificationItem)
            lastNotifyTime = id
          }
        }
      )
    }).catch(console.error)

    return () => {
      cancel = true
    }
  }, [notify])

  // Update goBack number
  useEffect(() => {
    if (location.pathname === RouteState.lastPathName) {
      RouteState.prevDifferentPathNum -= 1
    } else {
      RouteState.prevDifferentPathNum = -1
    }

    RouteState.lastPathName = location.pathname
  }, [location])

  useEffect(() => {
    const pathName = location.pathname

    if (needMigrate && hasMasterPassword) {
      navigate(migratePasswordUrl)
    } else if (pathName === DEFAULT_ROUTER_PATH) {
      if (hasConfirmations) {
        if (hasMasterPassword && isLocked) {
          navigate(loginUrl)
        } else {
          openPModal("confirmations")
        }
      } else if (isNoAccount(accounts)) {
        if (hasMasterPassword && isLocked) {
          navigate(loginUrl)
        } else {
          navigate(welcomeUrl)
        }
      } else if (!hasMasterPassword) {
        navigate(createPasswordUrl)
      } else if (isLocked) {
        navigate(loginUrl)
      } else if (needMigrate) {
        navigate(migratePasswordUrl)
      } else {
        navigate(tokenUrl)
      }
    } else if (pathName === loginUrl && !isLocked) {
      goHome()
    } else if (pathName === welcomeUrl && !isNoAccount(accounts)) {
      goHome()
    } else if (hasInternalConfirmations) {
      openPModal("confirmations")
    } else if (!hasInternalConfirmations && isOpenPModal("confirmations")) {
      openPModal(null)
    }
  }, [
    accounts,
    goBack,
    goHome,
    hasConfirmations,
    hasInternalConfirmations,
    hasMasterPassword,
    isLocked,
    isOpenPModal,
    location.pathname,
    navigate,
    needMigrate,
    openPModal,
  ])

  return <>{children}</>
}

const Main = styled.main`
  display: flex;
  height: 100%;
  flex-direction: column;
`

function _Root({ className }: ThemeProps): React.ReactElement {
  const dataContext = useContext(DataContext)

  // Implement WalletModalContext in Root component to make it available for all children and can use react-router-dom and ModalContextProvider
  return (
    <WalletModalContext>
      <PageWrapper
        animateOnce={true}
        className={"main-page-container"}
        resolve={dataContext.awaitStores([
          // "accountState",
          // "chainStore",
          // "assetRegistry",
          // "requestState",
          // "settings",
        ])}
      >
        <DefaultRoute>
          <Main className={className}>
            <Outlet />
          </Main>
        </DefaultRoute>
      </PageWrapper>
    </WalletModalContext>
  )
}

export const Root = styled(_Root)(() => ({}))
