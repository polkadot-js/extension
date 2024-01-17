// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MessageTypesWithSubscriptions } from '@subwallet/extension-base/background/types';
import { subscribeMessage } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Form, Input, Select } from '@subwallet/react-ui';
import { FormInstance } from '@subwallet/react-ui/es/form/hooks/useForm';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

interface ComponentProps extends ThemeProps{
  className?: string
}

const API_LIST = [
  'pri(mantaPay.enable)',
  'pri(mantaPay.initialSyncMantaPay)',
  'pri(mantaPay.getZkBalance)'

  // 'pri(accounts.edit)',
  // 'pri(accounts.show)',
  // 'pri(currentAccount.saveAddress)',
  // 'pri(settings.changeBalancesVisibility)',
  // 'pri(settings.saveAccountAllLogo)',
  // 'pri(settings.saveTheme)',
  // 'pri(settings.subscribe)',
  // 'pri(accounts.tie)',
  // 'pri(accounts.export)',
  // 'pri(accounts.exportPrivateKey)',
  // 'pri(accounts.batchExport)',
  // 'pri(accounts.checkPublicAndSecretKey)',
  // 'pri(accounts.validate)',
  // 'pri(accounts.forget)',
  // 'pri(authorize.approve)',
  // 'pri(authorize.approveV2)',
  // 'pri(metadata.approve)',
  // 'pri(signing.cancel)',
  // 'pri(signing.isLocked)',
  // 'pri(signing.approve.password)',
  // 'pri(signing.approve.passwordV2)',
  // 'pri(signing.approve.signature)',
  // 'pri(accounts.create.external)',
  // 'pri(accounts.create.externalV2)',
  // 'pri(accounts.create.hardware)',
  // 'pri(accounts.create.hardwareV2)',
  // 'pri(accounts.create.suri)',
  // 'pri(accounts.create.suriV2)',
  // 'pri(seed.create)',
  // 'pri(seed.createV2)',
  // 'pri(accounts.create.withSecret)',
  // 'pri(metadata.list)',
  // 'pri(metadata.get)',
  // 'pri(metadata.get)',
  // 'pri(authorize.reject)',
  // 'pri(authorize.rejectV2)',
  // 'pri(authorize.cancelV2)',
  // 'pri(metadata.reject)',
  // 'pri(accounts.subscribe)',
  // 'pri(accounts.subscribeWithCurrentAddress)',
  // 'pri(accounts.subscribeAccountsInputAddress)',
  // 'pri(accounts.saveRecent)',
  // 'pri(accounts.triggerSubscription)',
  // 'pri(authorize.requests)',
  // 'pri(authorize.requestsV2)',
  // 'pri(authorize.list)',
  // 'pri(authorize.listV2)',
  // 'pri(authorize.toggle)',
  // 'pri(authorize.changeSiteAll)',
  // 'pri(authorize.changeSite)',
  // 'pri(authorize.changeSitePerAccount)',
  // 'pri(authorize.changeSitePerSite)',
  // 'pri(authorize.changeSiteBlock)',
  // 'pri(authorize.forgetSite)',
  // 'pri(authorize.forgetAllSite)',
  // 'pri(metadata.requests)',
  // 'pri(signing.requests)',
  // 'pri(seed.validate)',
  // 'pri(seed.validateV2)',
  // 'pri(privateKey.validateV2)',
  // 'pri(derivation.validate)',
  // 'pri(derivation.create)',
  // 'pri(derivation.createV2)',
  // 'pri(window.open)',
  // 'pri(json.account.info)',
  // 'pri(json.restore)',
  // 'pri(json.batchRestore)',
  // 'pri(json.restoreV2)',
  // 'pri(json.batchRestoreV2)',
  // 'pri(settings.notification)',
  // 'pri(price.getPrice)',
  // 'pri(price.getSubscription)',
  // 'pri(balance.getBalance)',
  // 'pri(balance.getSubscription)',
  // 'pri(crowdloan.getCrowdloan)',
  // 'pri(crowdloan.getSubscription)',
  // 'pri(chainService.subscribeAssetRegistry)',
  // 'pri(transaction.history.getSubscription)',
  // 'pri(nft.getNft)',
  // 'pri(nft.getSubscription)',
  // 'pri(nftCollection.getSubscription)',
  // 'pri(staking.getStaking)',
  // 'pri(staking.getSubscription)',
  // 'pri(stakingReward.getStakingReward)',
  // 'pri(stakingReward.getSubscription)',
  // 'pri(nft.forceUpdate)',
  // 'pri(nftTransfer.getNftTransfer)',
  // 'pri(nftTransfer.getSubscription)',
  // 'pri(nftTransfer.setNftTransfer)',
  // 'pri(accounts.checkTransfer)',
  // 'pri(accounts.checkCrossChainTransfer)',
  // 'pri(accounts.transfer)',
  // 'pri(accounts.crossChainTransfer)',
  // 'pri(evmNft.getTransaction)',
  // 'pri(evmNft.submitTransaction)',
  // 'pri(chainService.subscribeChainInfoMap)',
  // 'pri(chainService.subscribeChainStateMap)',
  // 'pri(chainService.removeChain)',
  // 'pri(chainService.disableChain)',
  // 'pri(chainService.enableChain)',
  // 'pri(chainService.enableChains)',
  // 'pri(chainService.disableChains)',
  // 'pri(chainService.upsertCustomChain)',
  // 'pri(chainService.getSupportedContractTypes)',
  // 'pri(chainService.upsertCustomToken)',
  // 'pri(chainService.deleteCustomTokens)',
  // 'pri(chainService.validateCustomToken)',
  // 'pri(chainService.resetDefaultChains)',
  // 'pri(networkMap.disableAll)',
  // 'pri(transfer.checkReferenceCount)',
  // 'pri(transfer.checkSupporting)',
  // 'pri(transfer.getExistentialDeposit)',
  // 'pri(subscription.cancel)',
  // 'pri(freeBalance.subscribe)',
  // 'pri(substrateNft.getTransaction)',
  // 'pri(substrateNft.submitTransaction)',
  // 'pri(networkMap.recoverDotSama)',
  // 'pri(account.isLocked)',
  // 'pri(qr.sign.substrate)',
  // 'pri(qr.sign.evm)',
  // 'pri(qr.transaction.parse.substrate)',
  // 'pri(qr.transaction.parse.evm)',
  // 'pri(accounts.transfer.qr.create)',
  // 'pri(accounts.cross.transfer.qr.create)',
  // 'pri(nft.transfer.qr.create.substrate)',
  // 'pri(nft.transfer.qr.create.evm)',
  // 'pri(stake.qr.create)',
  // 'pri(unStake.qr.create)',
  // 'pri(withdrawStake.qr.create)',
  // 'pri(claimReward.qr.create)',
  // 'pri(createCompound.qr.create)',
  // 'pri(cancelCompound.qr.create)',
  // 'pri(accounts.transfer.ledger.create)',
  // 'pri(accounts.cross.transfer.ledger.create)',
  // 'pri(nft.transfer.ledger.create.substrate)',
  // 'pri(stake.ledger.create)',
  // 'pri(unStake.ledger.create)',
  // 'pri(withdrawStake.ledger.create)',
  // 'pri(claimReward.ledger.create)',
  // 'pri(createCompound.ledger.create)',
  // 'pri(cancelCompound.ledger.create)',
  // 'pri(account.external.reject)',
  // 'pri(account.external.resolve)',
  // 'pri(accounts.get.meta)',
  // 'pri(confirmations.subscribe)',
  // 'pri(confirmations.complete)',
  // 'pri(bonding.getBondingOptions)',
  // 'pri(bonding.getChainBondingBasics)',
  // 'pri(bonding.submitTransaction)',
  // 'pri(bonding.txInfo)',
  // 'pri(unbonding.txInfo)',
  // 'pri(unbonding.submitTransaction)',
  // 'pri(unbonding.withdrawalTxInfo)',
  // 'pri(unbonding.submitWithdrawal)',
  // 'pri(staking.claimRewardTxInfo)',
  // 'pri(staking.submitClaimReward)',
  // 'pri(evm.transaction.parse.input)',
  // 'pri(authorize.subscribe)',
  // 'pri(staking.turingCompound)',
  // 'pri(staking.submitTuringCompound)',
  // 'pri(staking.checkTuringCompoundTask)',
  // 'pri(staking.turingCancelCompound)',
  // 'pri(staking.submitTuringCancelCompound)',
  // 'pri(keyring.subscribe)',
  // 'pri(keyring.change)',
  // 'pri(keyring.migrate)',
  // 'pri(keyring.unlock)',
  // 'pri(keyring.lock)',
  // 'pri(keyring.export.mnemonic)',
  // 'pri(derivation.validateV2)',
  // 'pri(derivation.getList)',
  // 'pri(derivation.create.multiple)'
];

let unsub: () => void;

function payloadValidator (rule: RuleObject, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      JSON.parse(value);
      resolve();
    } catch (e) {
      reject(new Error('Invalid JSON'));
    }
  });
}

interface ApiFormType {
  api: string;
  payload: string;
}

const Component = ({ className }: ComponentProps) => {
  const formRef = useRef<FormInstance<ApiFormType>>(null);
  const [response, setResponse] = useState<string>('');

  // Submit form
  const submit = useCallback(() => {
    setResponse('');
    const formValues = formRef.current?.getFieldsValue();

    formRef.current?.validateFields().then(() => {
      unsub && unsub();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request = JSON.parse(formValues?.payload || 'null');

      const callback = (response: any) => {
        console.debug(formValues?.api, response);
        setResponse(JSON.stringify(response, null, 2));
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const subscription = subscribeMessage(formValues?.api as MessageTypesWithSubscriptions, request, callback, callback);

      unsub = subscription.unsub;
    }).catch((e) => {
      console.error(e);
    });
  }, []);

  return <div className={className}>
    <Form
      initialValues={{ api: 'pri(price.getPrice)', payload: 'null' }}
      ref={formRef}
    >
      <Form.Item name='api'>
        <Select
          className='input'
          showSearch
        >
          {API_LIST.map((item) => <Select.Option
            key={item}
            value={item}
          >{item}</Select.Option>)}
        </Select>
      </Form.Item>
      <Form.Item
        name='payload'
        rules={[{ validator: payloadValidator }]}
        statusHelpAsTooltip={true}
        validateTrigger={['onBlur']}
      >
        <Input.TextArea
          label={'Payload'}
          rows={6}
        />
      </Form.Item>
      <Form.Item>
        <Button
          onClick={submit}
          size={'xs'}
        >Submit</Button>
      </Form.Item>
      <Form.Item>
        <Input.TextArea
          label={'Response'}
          rows={6}
          value={response}
        />
      </Form.Item>
    </Form>
  </div>;
};

export const DebuggerAPI = styled(Component)<ComponentProps>(({ theme }: ComponentProps) => {
  return {
    padding: (theme.token.paddingMD || 0) / 2,
    paddingTop: 0,

    '.input, .ant-input-container': {
      width: '100%'
    }
  };
});
