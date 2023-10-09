// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useAutoNavigateEarning = () => {
  const navigate = useNavigate();

  const { currentAccount } = useSelector((state) => state.accountState);

  const [currentAddress, setCurrentAddress] = useState(currentAccount?.address);

  useEffect(() => {
    if (currentAccount?.address !== currentAddress) {
      navigate('/home/earning/');
      setCurrentAddress(currentAccount?.address);
    }
  }, [currentAccount?.address, currentAddress, navigate]);
};

export default useAutoNavigateEarning;
