// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_ROUTER_PATH } from "@subwallet-webapp/constants/router";
import { RouteState } from "@subwallet-webapp/Popup/Root";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useDefaultNavigate() {
  const navigate = useNavigate();
  const goHome = useCallback(() => {
    navigate(DEFAULT_ROUTER_PATH);
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(RouteState.prevDifferentPathNum);
  }, [navigate]);

  return {
    goHome,
    goBack,
  };
}
