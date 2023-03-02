// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from '@polkadot/extension-chains/types';
import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import React, { useContext, useEffect, useRef, useState } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { bnToBn, formatNumber } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import helpIcon from '../../assets/help.svg';
import { Svg, Table } from '../../components';
import { SettingsContext } from '../../components/contexts';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { ellipsisName } from '../../util/ellipsisName';
import Tooltip from './Tooltip';

interface DecodedMethod {
  args: {
    dest: {
      Id: string;
    };
    value: string;
  };
  method: string;
  section: string;
  target: string | null;
}

interface Props {
  className?: string;
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

const decodeMethodApi = async (data: string, chain: Chain | null, settings: SettingsStruct): Promise<DecodedMethod> => {
  const provider = new WsProvider('wss://rpc.polkadot.io');
  const api = await ApiPromise.create({ provider });
  const methodCall = api.registry.createType('Call', data);
  const prefix = chain?.ss58Format ?? settings.prefix === -1 ? 42 : settings.prefix;
  const target = decodeAddress(methodCall.args[0]?.toString());
  const targetEncoded = encodeAddress(target, prefix);

  const humanRedableResponse = methodCall.toHuman();

  return {
    args: (humanRedableResponse as { args: { dest: { Id: string }; value: string } })?.args,
    method: humanRedableResponse?.method as string,
    section: humanRedableResponse?.section as string,
    target: targetEncoded || null
  };
};

function Extrinsic({
  className,
  payload: { nonce },
  request: { genesisHash, method, specVersion: hexSpec },
  url
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(genesisHash, true);
  const settings = useContext(SettingsContext);
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const [methodDetails, setMethodDetails] = useState<DecodedMethod>();

  useEffect(() => {
    const getDetails = async () => {
      setMethodDetails(await decodeMethodApi(method, chain, settings));
    };

    getDetails().catch((e) => console.error(e));
  }, [chain, method, settings, specVersion]);

  function prettyPrintValue(value: string) {
    const numValue = parseFloat(value.replace(/,/g, ''));
    const trillion = 1000000000000; // 10^12

    return numValue / trillion;
  }

  return (
    <Table className={className}>
      <tr>
        <td className='label'>{t<string>('from')}</td>
        <div className='separator'></div>
        <td className='from'>{url}</td>
      </tr>
      {methodDetails && (
        <>
          <tr>
            <td className='label'>{t<string>('module')}</td>
            <div className='separator'></div>
            <td className='data'>{methodDetails.section}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('Call')}</td>
            <div className='separator'></div>
            <td className='data'>{methodDetails?.method?.toString()}</td>
          </tr>
          <tr>
            <td className='label'>{t<string>('amount')}</td>
            <div className='separator'></div>
            <td className='data'>
              {prettyPrintValue(methodDetails?.args?.value || '')}&nbsp;
              {chain?.definition.symbol}
            </td>
          </tr>
          <tr>
            <td className='label'>{t<string>('target')}</td>
            <div className='separator'></div>
            <td className='data'>{ellipsisName(methodDetails.target || '')}</td>
          </tr>
        </>
      )}
      <tr>
        <td className='label'>
          {t<string>('nonce')}&nbsp;
          <Tooltip content='The overall, lifetime transaction count of your account.'>
            <Svg
              className='help-icon'
              src={helpIcon}
            />
          </Tooltip>
        </td>
        <div className='separator'></div>
        <td className='data'>{formatNumber(nonce)}</td>
      </tr>
    </Table>
  );
}

export default React.memo(Extrinsic);
