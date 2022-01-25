import React, {useCallback} from "react";
import {useSelector} from "react-redux";
import {RootState, store} from "@polkadot/extension-koni-ui/stores";
import {getNft} from "@polkadot/extension-koni-ui/messaging";
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import styled from 'styled-components';
import NftPreview from "@polkadot/extension-koni-ui/components/NftPreview";

interface Props {
  className?: string;
}

function NftContainer ({className}: Props): React.ReactElement<Props> {
  const currentAccount = useSelector((state: RootState) => state.currentAccount);
  console.log(currentAccount)

  const _onCreate = useCallback(
    (): void => {
      if (currentAccount && currentAccount.address) {
        console.log('Fetching nfts')
        getNft(currentAccount.address).then(r => {
          console.log(r)
          store.dispatch({type: 'nft', payload: r})
        }).catch(e => {
          console.error('There is a problem getting NFTs', e)
        })
      } else {
        console.error('There is a problem getting NFTs')
      }
    },
    [currentAccount]
  );

  // _onCreate()
  return (
    <div className={className}>
      <div className={'grid-container'}>
        <NftPreview/>
        <NftPreview/>
        <NftPreview/>
        <NftPreview/>
        <NftPreview/>
        <NftPreview/>
      </div>

      <div className={'footer'}>
        <div>Don't see your tokens?</div>
        <div>
          <span className={'link'}>Refresh list</span> or <span className={'link'}>import tokens</span>
        </div>
      </div>
    </div>
  )
}

export default styled(NftContainer)(({theme}: ThemeProps) => `
  .grid-container {
    width: 100%;
    display: grid;
    column-gap: 20px;
    row-gap: 20px;
    justify-items: center;
    grid-template-columns: repeat(3, 1fr);
  }

  .footer {
    margin-top: 50px;
    width: 100%;
    color: #9196AB;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .link {
    color: #42C59A;
  }

  .link:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`);
