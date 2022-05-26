// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetWorkInfo } from '@subwallet/extension-base/background/KoniTypes';
import { Button, Spinner } from '@subwallet/extension-koni-ui/components';
import { SCANNER_QR_STEP } from '@subwallet/extension-koni-ui/constants/scanner';
import { ScannerContext, ScannerContextType } from '@subwallet/extension-koni-ui/contexts/ScannerContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import AccountInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/AccountInfo';
import NetworkInfo from '@subwallet/extension-koni-ui/Popup/ExternalRequest/Shared/NetworkInfo';
import MessageSigned from '@subwallet/extension-koni-ui/Popup/ExternalRequest/ViewQRDetail/MessageSigned';
import TransactionSigned from '@subwallet/extension-koni-ui/Popup/ExternalRequest/ViewQRDetail/TransactionSigned';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import getNetworkInfoByGenesisHash from '@subwallet/extension-koni-ui/util/getNetworkInfoByGenesisHash';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
}

const ViewQRDetail = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  const scannerStore = useContext<ScannerContextType>(ScannerContext);
  const { setStep, state } = scannerStore;
  const { genesisHash, senderAddress, type } = state;

  const [loading, setLoading] = useState<boolean>(true);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [network, setNetwork] = useState<NetWorkInfo | null>(null);

  const handlerFetch = useCallback(() => {
    const network = getNetworkInfoByGenesisHash(genesisHash);

    setLoading(!network);
    setNetwork(network);
  }, [genesisHash]);

  useEffect(() => {
    handlerFetch();
  }, [handlerFetch]);

  const handlerRenderContent = useCallback(() => {
    if (loading || !network) {
      return (<></>);
    }

    if (network) {
      if (type === 'message') {
        return (
          <MessageSigned />
        );
      } else if (type === 'transaction') {
        return (
          <TransactionSigned
            network={network}
            setButtonLoading={setButtonLoading}
          />
        );
      }

      return <></>;
    } else {
      return <></>;
    }
  }, [loading, network, type]);

  const handlerClickBack = useCallback(() => {
    setButtonLoading(true);
    setStep(SCANNER_QR_STEP.SCAN_STEP);
    setButtonLoading(false);
  }, [setStep]);

  const handlerClickNext = useCallback(() => {
    setButtonLoading(true);
    setStep(SCANNER_QR_STEP.CONFIRM_STEP);
    setButtonLoading(false);
  }, [setStep]);

  if (loading && !network) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={CN(className)}>
      {
        (loading || !network) && (
          <div className={CN('loading')}>
            <Spinner />
          </div>
        )
      }

      {
        (!loading && network) && (
          <>
            <NetworkInfo network={network} />
            <AccountInfo
              address={senderAddress}
              network={network}
            />
          </>
        )
      }
      {handlerRenderContent()}
      <div className={CN('grid-container')}>
        <Button
          className={CN('button')}
          onClick={handlerClickBack}
        >
          {t('Previous Step')}
        </Button>
        <Button
          className={CN('button')}
          isBusy={buttonLoading || !network || loading}
          onClick={handlerClickNext}
        >
          {t('Next Step')}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(styled(ViewQRDetail)(({ theme }: Props) => `
  margin: 20px 20px 0 20px;
  padding: 5px;

  .loading{
    position: relative;
    height: 300px;
  }

  .grid-container{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 4px;

    .button{
      margin-top: 8px;
    }
  }
`));
