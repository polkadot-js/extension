// Copyright 2019-2022 Manta Network.
// This file is part of manta-wallet.
//
// manta-wallet is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// manta-wallet is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with manta-wallet. If not, see <http://www.gnu.org/licenses/>.

//! Manta Pay Wallet

#![allow(clippy::result_large_err)]
#![no_std]

extern crate alloc;
extern crate console_error_panic_hook;

use crate::types::*;
use alloc::{
    boxed::Box,
    format,
    rc::Rc,
    string::{String, ToString},
    vec,
    vec::Vec,
};
use core::{cell::RefCell, fmt::Debug};
use js_sys::{JsString, Promise};
use manta_accounting::{
    transfer::canonical,
    wallet::{
        ledger::{self, ReadResponse},
        signer::{InitialSyncData, SyncData},
    },
};
use manta_crypto::signature::schnorr;
use manta_pay::{
    config::{self, utxo},
    key,
    signer::{self, base, client::network, functions},
};
use manta_util::{
    codec::{Decode, Encode},
    future::LocalBoxFutureResult,
    http::reqwest,
    into_array_unchecked, ops,
    serde::{de::DeserializeOwned, Deserialize, Serialize},
    Array,
};
use serde_wasm_bindgen::Error;
use wasm_bindgen::prelude::{wasm_bindgen, JsValue};
use wasm_bindgen_futures::future_to_promise;

mod types;

#[wasm_bindgen]
extern "C" {
    pub type Api;

    #[wasm_bindgen(structural, method)]
    async fn pull(this: &Api, checkpoint: JsValue) -> JsValue;

    #[wasm_bindgen(structural, method)]
    async fn push(this: &Api, posts: Vec<JsValue>) -> JsValue;

    #[wasm_bindgen(structural, method)]
    async fn initial_pull(this: &Api, checkpoint: JsValue) -> JsValue;
}

#[wasm_bindgen]
/// Debugging utility to get panic messages when running the ts code.
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Serialize the borrowed `value` as a Javascript object.
#[inline]
fn borrow_js<T>(value: &T) -> JsValue
where
    T: Serialize,
{
    serde_wasm_bindgen::to_value(value).expect("Serialization is not allowed to fail.")
}

/// Serialize the owned `value` as a Javascript object.
#[inline]
fn into_js<T>(value: T) -> JsValue
where
    T: Serialize,
{
    borrow_js(&value)
}

/// Converts `value` into a value of type `T`.
#[inline]
pub fn from_js<T>(value: JsValue) -> T
where
    T: DeserializeOwned,
{
    serde_wasm_bindgen::from_value(value).expect("Deserialization is not allowed to fail.")
}

/// Converts `value` into a value of type `T`.
#[inline]
pub fn from_js_result<T>(value: JsValue) -> Result<T, Error>
where
    T: DeserializeOwned,
{
    serde_wasm_bindgen::from_value(value)
}

/// convert AssetId to String for js compatability (AssetID is 128 bit)
#[inline]
pub fn id_string_from_field(id: [u8; 32]) -> Option<String> {
    if u128::from_le_bytes(Array::from_iter(id[16..32].iter().copied()).into()) == 0 {
        String::from_utf8(id.to_vec()).ok()
    } else {
        None
    }
}

/// convert String to AssetId (Field)
#[inline]
pub fn field_from_id_string(id: String) -> [u8; 32] {
    into_array_unchecked(id.as_bytes())
}

/// convert u128 to AssetId (Field)
#[inline]
pub fn field_from_id_u128(id: u128) -> [u8; 32] {
    into_array_unchecked([id.to_le_bytes(), [0; 16]].concat())
}

/// Implements a JS-compatible wrapper for the given `$type`.
macro_rules! impl_js_compatible {
    ($name:ident, $type:ty, $doc:expr) => {
        #[doc = $doc]
        #[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
        #[serde(crate = "manta_util::serde", deny_unknown_fields, transparent)]
        #[wasm_bindgen]
        pub struct $name($type);

        #[wasm_bindgen]
        impl $name {
            /// Parses `Self` from a JS value.
            #[inline]
            #[wasm_bindgen(constructor)]
            pub fn new(value: JsValue) -> $name {
                from_js(value)
            }

            /// Parses `Self` from a [`String`].
            #[inline]
            pub fn from_string(value: String) -> $name {
                serde_json::from_str(&value).expect("Deserialization is not allowed to fail.")
            }

            /// Parses `Self` from a Javascript string.
            #[allow(dead_code)] // NOTE: We only care about this implementation if a type uses it.
            #[inline]
            pub(crate) fn from_js_string(value: JsString) -> $type {
                serde_json::from_str(&String::from(value))
                    .expect("Deserialization is not allowed to fail.")
            }
        }

        impl AsRef<$type> for $name {
            #[inline]
            fn as_ref(&self) -> &$type {
                &self.0
            }
        }

        impl AsMut<$type> for $name {
            #[inline]
            fn as_mut(&mut self) -> &mut $type {
                &mut self.0
            }
        }

        impl From<$type> for $name {
            #[inline]
            fn from(this: $type) -> Self {
                Self(this)
            }
        }

        impl From<$name> for $type {
            #[inline]
            fn from(this: $name) -> Self {
                this.0
            }
        }
    };
}

impl_js_compatible!(AccountTable, signer::AccountTable, "Account Table");
impl_js_compatible!(AssetId, utxo::AssetId, "AssetId");
impl_js_compatible!(
    Asset,
    manta_accounting::transfer::Asset<config::Config>,
    "Asset"
);
impl_js_compatible!(AccountId, config::AccountId, "AccountId");
impl_js_compatible!(AssetMetadata, signer::AssetMetadata, "Asset Metadata");
impl_js_compatible!(
    MultiProvingContext,
    config::MultiProvingContext,
    "Multi Proving Context"
);
impl_js_compatible!(
    Transaction,
    canonical::Transaction<config::Config>,
    "Transaction"
);
impl_js_compatible!(
    TransactionKind,
    canonical::TransactionKind<config::Config>,
    "Transaction Kind"
);
impl_js_compatible!(SenderPost, config::SenderPost, "Sender Post");
impl_js_compatible!(ReceiverPost, config::ReceiverPost, "Receiver Post");
impl_js_compatible!(IdentityProof, config::IdentityProof, "Identity Proof");
impl_js_compatible!(TransactionData, config::TransactionData, "Transaction Data");
impl_js_compatible!(IdentityRequest, signer::IdentityRequest, "Identity Request");
impl_js_compatible!(
    TransactionDataRequest,
    signer::TransactionDataRequest,
    "Transaction Data Request"
);
impl_js_compatible!(
    TransactionDataResponse,
    signer::TransactionDataResponse,
    "Transaction Data Response"
);
impl_js_compatible!(
    IdentityResponse,
    signer::IdentityResponse,
    "Identity Response"
);
impl_js_compatible!(UtxoAccumulator, base::UtxoAccumulator, "Utxo Accumulator");
impl_js_compatible!(SignRequest, signer::SignRequest, "Signing Request");
impl_js_compatible!(SignResponse, signer::SignResponse, "Signing Response");
impl_js_compatible!(SignError, signer::SignError, "Signing Error");
impl_js_compatible!(SignResult, signer::SignResult, "Signing Result");
impl_js_compatible!(SyncRequest, signer::SyncRequest, "Synchronization Request");
impl_js_compatible!(
    InitialSyncRequest,
    signer::InitialSyncRequest,
    "Initial Synchronization Request"
);
impl_js_compatible!(
    SyncResponse,
    signer::SyncResponse,
    "Synchronization Response"
);
impl_js_compatible!(SyncError, signer::SyncError, "Synchronization Error");
impl_js_compatible!(SyncResult, signer::SyncResult, "Synchronization Result");
impl_js_compatible!(FullParameters, config::FullParameters, "Full Parameters");
impl_js_compatible!(
    SignWithTransactionDataResult,
    signer::SignWithTransactionDataResult,
    "Sign With Transaction Data Result"
);
impl_js_compatible!(ControlFlow, ops::ControlFlow, "Control Flow");
impl_js_compatible!(Network, network::Network, "Network Type");
impl_js_compatible!(Mnemonic, key::Mnemonic, "Mnemonic");
impl_js_compatible!(
    StorageStateOption,
    signer::StorageStateOption,
    "Storage Option"
);
impl_js_compatible!(ViewingKey, config::EmbeddedScalar, "Viewing Key");

/// Implements a JS-compatible wrapper for the given `$type` without the `From` implementations.
macro_rules! impl_js_compatible_no_into {
    ($name:ident, $type:ty, $doc:expr) => {
        #[doc = $doc]
        #[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
        #[serde(crate = "manta_util::serde", deny_unknown_fields, transparent)]
        #[wasm_bindgen]
        pub struct $name($type);

        #[wasm_bindgen]
        impl $name {
            /// Parses `Self` from a JS value.
            #[inline]
            #[wasm_bindgen(constructor)]
            pub fn new(value: JsValue) -> $name {
                from_js(value)
            }

            /// Parses `Self` from a [`String`].
            #[inline]
            pub fn from_string(value: String) -> $name {
                serde_json::from_str(&value).expect("Deserialization is not allowed to fail.")
            }

            /// Parses `Self` from a Javascript string.
            #[allow(dead_code)] // NOTE: We only care about this implementation if a type uses it.
            #[inline]
            pub(crate) fn from_js_string(value: JsString) -> $type {
                serde_json::from_str(&String::from(value))
                    .expect("Deserialization is not allowed to fail.")
            }
        }

        impl AsRef<$type> for $name {
            #[inline]
            fn as_ref(&self) -> &$type {
                &self.0
            }
        }

        impl AsMut<$type> for $name {
            #[inline]
            fn as_mut(&mut self) -> &mut $type {
                &mut self.0
            }
        }
    };
}

impl_js_compatible_no_into!(Address, config::Address, "Address");
impl_js_compatible_no_into!(Identifier, config::Identifier, "Identifier");
impl_js_compatible_no_into!(
    UtxoAccumulatorModel,
    config::UtxoAccumulatorModel,
    "Utxo Accumulator Model"
);
impl_js_compatible_no_into!(
    AuthorizationContext,
    config::AuthorizationContext,
    "Authorization Context"
);

/// Signer Rng
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields, transparent)]
#[wasm_bindgen]
pub struct SignerRng(signer::SignerRng);

#[wasm_bindgen]
impl SignerRng {
    /// Parses `Self` from a JS value.
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(value: JsValue) -> Self {
        from_js(value)
    }

    /// Parses `Self` from a [`String`].
    #[inline]
    pub fn from_string(value: String) -> Self {
        serde_json::from_str(&value).expect("Deserialization is not allowed to fail.")
    }

    /// Parses `Self` from a Javascript string.
    #[allow(dead_code)] // NOTE: We only care about this implementation if a type uses it.
    #[inline]
    pub(crate) fn from_js_string(value: JsString) -> signer::SignerRng {
        serde_json::from_str(&String::from(value)).expect("Deserialization is not allowed to fail.")
    }
}

impl AsRef<signer::SignerRng> for SignerRng {
    #[inline]
    fn as_ref(&self) -> &signer::SignerRng {
        &self.0
    }
}

impl AsMut<signer::SignerRng> for SignerRng {
    #[inline]
    fn as_mut(&mut self) -> &mut signer::SignerRng {
        &mut self.0
    }
}

/// Signer State
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields, transparent)]
#[wasm_bindgen]
pub struct SignerState(base::SignerState);

#[wasm_bindgen]
impl SignerState {
    /// Parses `Self` from a JS value.
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(value: JsValue) -> Self {
        from_js(value)
    }

    /// Parses `Self` from a [`String`].
    #[inline]
    pub fn from_string(value: String) -> Self {
        serde_json::from_str(&value).expect("Deserialization is not allowed to fail.")
    }

    /// Parses `Self` from a Javascript string.
    #[allow(dead_code)] // NOTE: We only care about this implementation if a type uses it.
    #[inline]
    pub(crate) fn from_js_string(value: JsString) -> base::SignerState {
        serde_json::from_str(&String::from(value)).expect("Deserialization is not allowed to fail.")
    }
}

impl AsRef<base::SignerState> for SignerState {
    #[inline]
    fn as_ref(&self) -> &base::SignerState {
        &self.0
    }
}

impl AsMut<base::SignerState> for SignerState {
    #[inline]
    fn as_mut(&mut self) -> &mut base::SignerState {
        &mut self.0
    }
}

impl From<base::SignerState> for SignerState {
    #[inline]
    fn from(this: base::SignerState) -> Self {
        Self(this)
    }
}

impl From<SignerState> for base::SignerState {
    #[inline]
    fn from(this: SignerState) -> Self {
        this.0
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields)]
pub struct RawAuthorizationSignature {
    /// Authorization Key
    pub authorization_key: [u8; 32],

    /// Signature
    pub signature: ([u8; 32], [u8; 32]),
}

impl TryFrom<RawAuthorizationSignature>
    for manta_accounting::transfer::AuthorizationSignature<config::Config>
{
    type Error = scale_codec::Error;

    #[inline]
    fn try_from(signature: RawAuthorizationSignature) -> Result<Self, Self::Error> {
        Ok(Self {
            authorization_key: group_decode(signature.authorization_key.to_vec())?,
            signature: schnorr::Signature {
                scalar: fp_decode(signature.signature.0.to_vec())?,
                nonce_point: group_decode(signature.signature.1.to_vec())?,
            },
        })
    }
}

impl TryFrom<JsString> for RawAuthorizationSignature {
    type Error = scale_codec::Error;

    #[inline]
    fn try_from(signature: JsString) -> Result<Self, Self::Error> {
        let sig_str = String::from(signature);
        let ref_slice = &sig_str.as_bytes();
        let arr: [u8; 32] = ref_slice[0..32].try_into().unwrap();
        let scala: [u8; 32] = ref_slice[32..64].try_into().unwrap();
        let group: [u8; 32] = ref_slice[64..96].try_into().unwrap();
        Ok(Self {
            authorization_key: decode(arr)?,
            signature: (decode(scala)?, decode(group)?),
        })
    }
}

/// Identified Asset
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields)]
#[wasm_bindgen]
pub struct IdentifiedAsset {
    /// Identifier
    identifier: Identifier,

    /// Asset
    asset: Asset,
}

#[wasm_bindgen]
impl IdentifiedAsset {
    /// Builds a new [`IdentifiedAsset`].
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(identifier: Identifier, asset: Asset) -> Self {
        Self { identifier, asset }
    }
}

impl From<IdentifiedAsset> for config::IdentifiedAsset {
    #[inline]
    fn from(this: IdentifiedAsset) -> Self {
        config::IdentifiedAsset::new(this.identifier.0, this.asset.into())
    }
}

impl From<config::IdentifiedAsset> for IdentifiedAsset {
    #[inline]
    fn from(this: config::IdentifiedAsset) -> Self {
        IdentifiedAsset::new(Identifier(this.identifier), this.asset.into())
    }
}

/// Transfer Post
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields)]
#[wasm_bindgen]
pub struct TransferPost {
    /// Authorization Signature
    authorization_signature:
        Option<manta_accounting::transfer::AuthorizationSignature<config::Config>>,

    /// Asset Id
    asset_id: Option<AssetId>,

    /// Sources
    sources: Vec<RawAssetValue>,

    /// Sender Posts
    sender_posts: Vec<config::SenderPost>,

    /// Receiver Posts
    receiver_posts: Vec<config::ReceiverPost>,

    /// Sinks
    sinks: Vec<RawAssetValue>,

    /// Validity Proof
    proof: config::Proof,

    /// Sink Accounts
    sink_accounts: Vec<config::AccountId>,
}

#[wasm_bindgen]
impl TransferPost {
    /// Builds a new [`TransferPost`].
    #[allow(clippy::too_many_arguments)]
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(
        authorization_signature: Option<JsString>,
        asset_id: JsValue,
        sources: Vec<JsValue>,
        sender_posts: Vec<JsValue>,
        receiver_posts: Vec<JsValue>,
        sinks: Vec<JsValue>,
        proof: JsValue,
        sink_accounts: Vec<JsValue>,
    ) -> Self {
        Self {
            authorization_signature: authorization_signature
            .map(|x| {
                RawAuthorizationSignature::try_from(x)
                    .expect("Error parsing the JsString as a raw authorization signature")
                    .try_into()
                    .expect("Getting an authorization signature from a raw authorization signature is not allowed to fail")
            }),
            asset_id: Some(from_js(asset_id)),
            sources: sources.into_iter().map(from_js).collect(),
            sender_posts: sender_posts
                .into_iter()
                .map(|post| {
                    from_js::<RawSenderPost>(post)
                        .try_into()
                        .expect("Getting a SenderPost from a RawSenderPost is not allowed to fail")
                })
                .collect(),
            receiver_posts: receiver_posts
                .into_iter()
                .map(|post| {
                    from_js::<RawReceiverPost>(post).try_into().expect(
                        "Getting a ReceiverPost from a RawReceiverPost is not allowed to fail",
                    )
                })
                .collect(),
            sinks: sinks.into_iter().map(from_js).collect(),
            proof: from_js(proof),
            sink_accounts: sink_accounts.into_iter().map(from_js).collect(),
        }
    }
}

impl From<config::TransferPost> for TransferPost {
    #[inline]
    fn from(post: config::TransferPost) -> Self {
        Self {
            authorization_signature: post.authorization_signature.map(Into::into),
            asset_id: post.body.asset_id.map(Into::into),
            sources: post
                .body
                .sources
                .into_iter()
                .map(|s| s.to_le_bytes())
                .collect(),
            sender_posts: post.body.sender_posts,
            receiver_posts: post.body.receiver_posts,
            sinks: post
                .body
                .sinks
                .into_iter()
                .map(|s| s.to_le_bytes())
                .collect(),
            proof: post.body.proof,
            sink_accounts: post.sink_accounts,
        }
    }
}

impl From<TransferPost> for config::TransferPost {
    #[inline]
    fn from(post: TransferPost) -> Self {
        Self {
            authorization_signature: post.authorization_signature.map(Into::into),
            body: config::TransferPostBody {
                asset_id: post.asset_id.map(Into::into),
                sources: post.sources.into_iter().map(u128::from_le_bytes).collect(),
                sender_posts: post.sender_posts,
                receiver_posts: post.receiver_posts,
                sinks: post.sinks.into_iter().map(u128::from_le_bytes).collect(),
                proof: post.proof,
            },
            sink_accounts: post.sink_accounts,
        }
    }
}

/// Polkadot-JS API Ledger Connection
#[wasm_bindgen]
pub struct PolkadotJsLedger(Api);

#[wasm_bindgen]
impl PolkadotJsLedger {
    /// Builds a new [`PolkadotJsLedger`] from its JS [`Api`].
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(api: Api) -> Self {
        console_error_panic_hook::set_once();
        Self(api)
    }
}

/// Polkadot-JS API Ledger Connection Error
#[derive(Debug, Deserialize, Serialize)]
#[serde(crate = "manta_util::serde")]
#[wasm_bindgen]
pub struct LedgerError;

impl ledger::Connection for PolkadotJsLedger {
    type Error = LedgerError;
}

impl ledger::Read<SyncData<config::Config>> for PolkadotJsLedger {
    type Checkpoint = utxo::Checkpoint;

    #[inline]
    fn read<'s>(
        &'s mut self,
        checkpoint: &'s Self::Checkpoint,
    ) -> LocalBoxFutureResult<'s, ReadResponse<SyncData<config::Config>>, Self::Error> {
        Box::pin(async {
            from_js_result::<RawPullResponse>(self.0.pull(borrow_js(checkpoint)).await)
                .map(|raw_response| {
                    raw_response
                        .try_into()
                        .expect("Conversion is not allowed to fail.")
                })
                .map_err(|_| LedgerError {})
        })
    }
}

impl ledger::Read<InitialSyncData<config::Config>> for PolkadotJsLedger {
    type Checkpoint = utxo::Checkpoint;

    #[inline]
    fn read<'s>(
        &'s mut self,
        checkpoint: &'s Self::Checkpoint,
    ) -> LocalBoxFutureResult<'s, ReadResponse<InitialSyncData<config::Config>>, Self::Error> {
        Box::pin(async {
            from_js_result::<RawInitialPullResponse>(
                self.0.initial_pull(borrow_js(checkpoint)).await,
            )
            .map(|raw_response| {
                raw_response
                    .try_into()
                    .expect("Conversion is not allowed to fail.")
            })
            .map_err(|_| LedgerError {})
        })
    }
}

impl ledger::Write<Vec<config::TransferPost>> for PolkadotJsLedger {
    type Response = String;

    #[inline]
    fn write(
        &mut self,
        posts: Vec<config::TransferPost>,
    ) -> LocalBoxFutureResult<Self::Response, Self::Error> {
        Box::pin(async {
            from_js(
                self.0
                    .push(
                        posts
                            .into_iter()
                            .map(|p| into_js(TransferPost::from(p)))
                            .collect(),
                    )
                    .await,
            )
        })
    }
}

/// Raw Full Parameters
#[derive(Clone, Debug, Eq, PartialEq)]
#[wasm_bindgen]
pub struct RawFullParameters {
    /// Address Partition Function
    address_partition_function: Vec<u8>,

    /// Group Generator
    group_generator: Vec<u8>,

    /// Incoming Base Encryption Scheme
    incoming_base_encryption_scheme: Vec<u8>,

    /// Light Incoming Base Encryption Scheme
    light_incoming_base_encryption_scheme: Vec<u8>,

    /// Nullifier Commitment Scheme
    nullifier_commitment_scheme: Vec<u8>,

    /// Outgoing Base Encryption Scheme
    outgoing_base_encryption_scheme: Vec<u8>,

    /// Schnorr Hash Function
    schnorr_hash_function: Vec<u8>,

    /// Utxo Accumulator Item Hash
    utxo_accumulator_item_hash: Vec<u8>,

    /// Utxo Accumulator Model
    utxo_accumulator_model: Vec<u8>,

    /// Utxo Commitment Scheme
    utxo_commitment_scheme: Vec<u8>,

    /// Viewing Key Derivation Function
    viewing_key_derivation_function: Vec<u8>,
}

#[wasm_bindgen]
impl RawFullParameters {
    /// Builds a new [`RawFullParameters`] without checking vector sizes.
    #[allow(clippy::too_many_arguments)] // It has 11 fields, what else?
    #[inline]
    fn new_unchecked(
        address_partition_function: &[u8],
        group_generator: &[u8],
        incoming_base_encryption_scheme: &[u8],
        light_incoming_base_encryption_scheme: &[u8],
        nullifier_commitment_scheme: &[u8],
        outgoing_base_encryption_scheme: &[u8],
        schnorr_hash_function: &[u8],
        utxo_accumulator_item_hash: &[u8],
        utxo_accumulator_model: &[u8],
        utxo_commitment_scheme: &[u8],
        viewing_key_derivation_function: &[u8],
    ) -> Self {
        Self {
            address_partition_function: address_partition_function.to_vec(),
            group_generator: group_generator.to_vec(),
            incoming_base_encryption_scheme: incoming_base_encryption_scheme.to_vec(),
            light_incoming_base_encryption_scheme: light_incoming_base_encryption_scheme.to_vec(),
            nullifier_commitment_scheme: nullifier_commitment_scheme.to_vec(),
            outgoing_base_encryption_scheme: outgoing_base_encryption_scheme.to_vec(),
            schnorr_hash_function: schnorr_hash_function.to_vec(),
            utxo_accumulator_item_hash: utxo_accumulator_item_hash.to_vec(),
            utxo_accumulator_model: utxo_accumulator_model.to_vec(),
            utxo_commitment_scheme: utxo_commitment_scheme.to_vec(),
            viewing_key_derivation_function: viewing_key_derivation_function.to_vec(),
        }
    }

    /// Builds a new [`RawFullParameters`] from its components.
    #[allow(clippy::too_many_arguments)] // It has 11 fields, what else?
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(
        address_partition_function: &[u8],
        group_generator: &[u8],
        incoming_base_encryption_scheme: &[u8],
        light_incoming_base_encryption_scheme: &[u8],
        nullifier_commitment_scheme: &[u8],
        outgoing_base_encryption_scheme: &[u8],
        schnorr_hash_function: &[u8],
        utxo_accumulator_item_hash: &[u8],
        utxo_accumulator_model: &[u8],
        utxo_commitment_scheme: &[u8],
        viewing_key_derivation_function: &[u8],
    ) -> Self {
        const ADDRESS_PARTITION_FUNCTION_SIZE: usize = 0;
        const GROUP_GENERATOR_SIZE: usize = 32;
        const INCOMING_BASE_ENCRYPTION_SCHEME_SIZE: usize = 8712;
        const LIGHT_INCOMING_BASE_ENCRYPTION_SCHEME_SIZE: usize = 0;
        const NULLIFIER_COMMITMENT_SCHEME_SIZE: usize = 8608;
        const OUTGOING_BASE_ENCRYPTION_SCHEME_SIZE: usize = 0;
        const SCHNORR_HASH_FUNCTION_SIZE: usize = 0;
        const UTXO_ACCUMULATOR_ITEM_HASH_SIZE: usize = 11072;
        const UTXO_ACCUMULATOR_MODEL_SIZE: usize = 6368;
        const UTXO_COMMITMENT_SCHEME_SIZE: usize = 13472;
        const VIEWING_KEY_DERIVATION_FUNCTION_SIZE: usize = 6368;
        assert_eq!(
            ADDRESS_PARTITION_FUNCTION_SIZE,
            address_partition_function.len(),
            "Address partition function of wrong size",
        );
        assert_eq!(
            GROUP_GENERATOR_SIZE,
            group_generator.len(),
            "Group generator of wrong size",
        );
        assert_eq!(
            INCOMING_BASE_ENCRYPTION_SCHEME_SIZE,
            incoming_base_encryption_scheme.len(),
            "Incoming base encryption scheme of wrong size",
        );
        assert_eq!(
            LIGHT_INCOMING_BASE_ENCRYPTION_SCHEME_SIZE,
            light_incoming_base_encryption_scheme.len(),
            "Light incoming base encryption scheme of wrong size",
        );
        assert_eq!(
            NULLIFIER_COMMITMENT_SCHEME_SIZE,
            nullifier_commitment_scheme.len(),
            "Nullifier commitment scheme of wrong size",
        );
        assert_eq!(
            OUTGOING_BASE_ENCRYPTION_SCHEME_SIZE,
            outgoing_base_encryption_scheme.len(),
            "Outgoing base encryption scheme of wrong size",
        );
        assert_eq!(
            SCHNORR_HASH_FUNCTION_SIZE,
            schnorr_hash_function.len(),
            "Schnorr hash function of wrong size",
        );
        assert_eq!(
            UTXO_ACCUMULATOR_ITEM_HASH_SIZE,
            utxo_accumulator_item_hash.len(),
            "Utxo accumulator item hash of wrong size",
        );
        assert_eq!(
            UTXO_ACCUMULATOR_MODEL_SIZE,
            utxo_accumulator_model.len(),
            "Utxo accumulator model of wrong size",
        );
        assert_eq!(
            UTXO_COMMITMENT_SCHEME_SIZE,
            utxo_commitment_scheme.len(),
            "Utxo commitment scheme of wrong size",
        );
        assert_eq!(
            VIEWING_KEY_DERIVATION_FUNCTION_SIZE,
            viewing_key_derivation_function.len(),
            "Viewing key derivation function of wrong size",
        );
        Self::new_unchecked(
            address_partition_function,
            group_generator,
            incoming_base_encryption_scheme,
            light_incoming_base_encryption_scheme,
            nullifier_commitment_scheme,
            outgoing_base_encryption_scheme,
            schnorr_hash_function,
            utxo_accumulator_item_hash,
            utxo_accumulator_model,
            utxo_commitment_scheme,
            viewing_key_derivation_function,
        )
    }
}

impl From<RawFullParameters> for FullParameters {
    #[inline]
    fn from(value: RawFullParameters) -> FullParameters {
        From::from(&value)
    }
}

impl From<&RawFullParameters> for FullParameters {
    #[inline]
    fn from(value: &RawFullParameters) -> FullParameters {
        config::FullParameters::new(
            config::Parameters {
                base: manta_accounting::transfer::utxo::protocol::BaseParameters {
                    group_generator: Decode::decode(&value.group_generator[..])
                        .expect("Decoding error"),
                    incoming_base_encryption_scheme: Decode::decode(
                        &value.incoming_base_encryption_scheme[..],
                    )
                    .expect("Decoding error"),
                    light_incoming_base_encryption_scheme: Decode::decode(
                        &value.light_incoming_base_encryption_scheme[..],
                    )
                    .expect("Decoding error"),
                    nullifier_commitment_scheme: Decode::decode(
                        &value.nullifier_commitment_scheme[..],
                    )
                    .expect("Decoding error"),
                    outgoing_base_encryption_scheme: Decode::decode(
                        &value.outgoing_base_encryption_scheme[..],
                    )
                    .expect("Decoding error"),
                    utxo_accumulator_item_hash: Decode::decode(
                        &value.utxo_accumulator_item_hash[..],
                    )
                    .expect("Decoding error"),
                    utxo_commitment_scheme: Decode::decode(&value.utxo_commitment_scheme[..])
                        .expect("Decoding error"),
                    viewing_key_derivation_function: Decode::decode(
                        &value.viewing_key_derivation_function[..],
                    )
                    .expect("Decoding error"),
                },
                address_partition_function: Decode::decode(&value.address_partition_function[..])
                    .expect("Decoding error"),
                schnorr_hash_function: Decode::decode(&value.schnorr_hash_function[..])
                    .expect("Decoding error"),
            },
            Decode::decode(&value.utxo_accumulator_model[..]).expect("Decoding error"),
        )
        .into()
    }
}

/// Raw Multi-Proving Context
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields)]
#[wasm_bindgen]
pub struct RawMultiProvingContext {
    /// To Private Proving Context
    to_private: Vec<u8>,

    /// Private Transfer Proving Context
    private_transfer: Vec<u8>,

    /// To Public Proving Context
    to_public: Vec<u8>,
}

#[wasm_bindgen]
impl RawMultiProvingContext {
    /// Builds a new [`RawMultiProvingContext`] without checking the slice sizes.
    #[inline]
    fn new_unchecked(to_private: &[u8], private_transfer: &[u8], to_public: &[u8]) -> Self {
        Self {
            to_private: to_private.to_vec(),
            private_transfer: private_transfer.to_vec(),
            to_public: to_public.to_vec(),
        }
    }

    /// Builds a new [`RawMultiProvingContext`] from `to_private`, `private_transfer` and `to_public`.
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(to_private: &[u8], private_transfer: &[u8], to_public: &[u8]) -> Self {
        const TO_PRIVATE_SIZE: usize = 3690160;
        const PRIVATE_TRANSFER_SIZE: usize = 15450928;
        const TO_PUBLIC_SIZE: usize = 11040176;
        assert_eq!(
            to_private.len(),
            TO_PRIVATE_SIZE,
            "ToPrivate slice of wrong size"
        );
        assert_eq!(
            private_transfer.len(),
            PRIVATE_TRANSFER_SIZE,
            "PrivateTransfer slice of wrong size"
        );
        assert_eq!(
            to_public.len(),
            TO_PUBLIC_SIZE,
            "ToPublic slice of wrong size"
        );
        Self::new_unchecked(to_private, private_transfer, to_public)
    }
}

impl From<&RawMultiProvingContext> for MultiProvingContext {
    #[inline]
    fn from(value: &RawMultiProvingContext) -> Self {
        config::MultiProvingContext {
            to_private: Decode::decode(&value.to_private[..]).expect("Decoding Error"),
            private_transfer: Decode::decode(&value.private_transfer[..]).expect("Decoding Error"),
            to_public: Decode::decode(&value.to_public[..]).expect("Decoding Error"),
        }
        .into()
    }
}

impl From<RawMultiProvingContext> for MultiProvingContext {
    #[inline]
    fn from(value: RawMultiProvingContext) -> Self {
        From::from(&value)
    }
}

impl From<MultiProvingContext> for RawMultiProvingContext {
    #[inline]
    fn from(value: MultiProvingContext) -> Self {
        Self {
            to_private: value.0.to_private.to_vec(),
            private_transfer: value.0.private_transfer.to_vec(),
            to_public: value.0.to_public.to_vec(),
        }
    }
}

/// Signer Error
#[wasm_bindgen]
pub struct SignerError(reqwest::Error);

/// Signer Type
type SignerType = base::Signer;

/// Signer Client
#[derive(Clone, Deserialize, Serialize)]
#[serde(crate = "manta_util::serde", deny_unknown_fields)]
#[wasm_bindgen]
pub struct Signer(SignerType);

impl AsMut<SignerType> for Signer {
    #[inline]
    fn as_mut(&mut self) -> &mut SignerType {
        &mut self.0
    }
}

impl AsRef<SignerType> for Signer {
    #[inline]
    fn as_ref(&self) -> &SignerType {
        &self.0
    }
}

/// Creates a new [`Mnemonic`] from `phrase`. Fails if `phrase` has the wrong format.
/// See <https://docs.rs/bip0039/0.11.0/bip0039/enum.Error.html> for more info.
#[inline]
#[wasm_bindgen]
pub fn mnemonic_from_phrase(phrase: String) -> Option<Mnemonic> {
    key::Mnemonic::new(phrase.as_ref()).ok().map(Mnemonic)
}

/// Creates an [`AccountTable`] from `mnemonic`.
#[inline]
#[wasm_bindgen]
pub fn accounts_from_mnemonic(mnemonic: Mnemonic) -> AccountTable {
    functions::accounts_from_mnemonic(mnemonic.0).into()
}

/// Creates an [`AuthorizationContext`] from `mnemonic`.
#[inline]
#[wasm_bindgen]
pub fn authorization_context_from_mnemonic(
    mnemonic: Mnemonic,
    parameters: &RawFullParameters,
) -> AuthorizationContext {
    AuthorizationContext(functions::authorization_context_from_mnemonic(
        mnemonic.0,
        &FullParameters::from(parameters).0.base,
    ))
}

/// Creates a viewing key from `mnemonic`.
#[inline]
#[wasm_bindgen]
pub fn viewing_key_from_mnemonic(mnemonic: Mnemonic, parameters: &RawFullParameters) -> ViewingKey {
    functions::viewing_key_from_mnemonic(mnemonic.0, &FullParameters::from(parameters).0.base)
        .into()
}

/// Creates an [`Address`] from `mnemonic`.
#[inline]
#[wasm_bindgen]
pub fn address_from_mnemonic(mnemonic: Mnemonic, parameters: &RawFullParameters) -> Address {
    Address(functions::address_from_mnemonic(
        mnemonic.0,
        &FullParameters::from(parameters).0.base,
    ))
}

#[wasm_bindgen]
impl Signer {
    /// Builds a new [`Signer`] from `parameters`, `proving_context` and `storage_state_option`.
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new(
        parameters: &RawFullParameters,
        proving_context: &RawMultiProvingContext,
        storage_state: JsValue,
    ) -> Self {
        Self(functions::new_signer(
            FullParameters::from(parameters).0,
            MultiProvingContext::from(proving_context).into(),
            &StorageStateOption::new(storage_state).0,
        ))
    }

    /// Returns the [`AuthorizationContext`] corresponding to `self`.
    #[inline]
    pub fn authorization_context(&self) -> JsValue {
        into_js(self.as_ref().authorization_context())
    }

    /// Tries to load `authorization_context_option` to `self`.
    #[inline]
    pub fn try_load_authorization_context(
        &mut self,
        authorization_context_option: JsValue,
    ) -> bool {
        self.as_mut()
            .try_load_authorization_context(from_js(authorization_context_option))
    }

    /// Loads `accounts` to `self`.
    #[inline]
    pub fn load_accounts(&mut self, accounts: AccountTable) {
        self.as_mut().load_accounts(accounts.0)
    }

    /// Drops the [`AccountTable`] from `self`.
    #[inline]
    pub fn drop_accounts(&mut self) {
        self.as_mut().drop_accounts()
    }

    /// Loads `authorization_context` to `self`.
    #[inline]
    pub fn load_authorization_context(&mut self, authorization_context: AuthorizationContext) {
        self.as_mut()
            .load_authorization_context(authorization_context.0)
    }

    /// Drops the [`AuthorizationContext`] from `self`.
    #[inline]
    pub fn drop_authorization_context(&mut self) {
        self.as_mut().drop_authorization_context()
    }

    /// Tries to update `self` from `storage_state`.
    #[inline]
    pub fn set_storage(&mut self, storage_state: JsValue) -> bool {
        functions::set_storage(self.as_mut(), &StorageStateOption::new(storage_state).0)
    }

    /// Saves `self` as a [`StorageStateOption`].
    #[inline]
    pub fn get_storage(&self) -> JsValue {
        into_js(StorageStateOption::from(functions::get_storage(
            self.as_ref(),
        )))
    }

    /// Updates the internal ledger state, returning the new asset distribution.
    #[inline]
    pub fn sync(&mut self, request: SyncRequest) -> SyncResult {
        self.as_mut().sync(request.into()).into()
    }

    /// Updates the internal ledger state, returning the new asset distribution.
    ///
    /// # Note
    ///
    /// This method updates the checkpoint and assetmap, but it does not update
    /// the [`UtxoAccumulator`]. Therefore, it should
    /// only be used for non-spendable assets such as SBTs.
    #[inline]
    pub fn sbt_sync(&mut self, request: SyncRequest) -> SyncResult {
        self.as_mut().sbt_sync(request.into()).into()
    }

    /// Performs the initial synchronization of a new signer with the ledger data.
    ///
    /// # Implementation Note
    ///
    /// Using this method to synchronize a signer will make it impossibile to spend any
    /// [`Utxo`](utxo::Utxo)s already on the ledger at the time of synchronization.
    /// Therefore, this method should only be used for the initial synchronization of a
    /// new signer.
    #[inline]
    pub fn initial_sync(&mut self, request: InitialSyncRequest) -> SyncResult {
        self.as_mut().initial_sync(request.into()).into()
    }

    /// Generates an [`IdentityProof`] for `identified_asset` by
    /// signing a virtual [`ToPublic`](canonical::ToPublic) transaction.
    #[inline]
    pub fn identity_proof(
        &mut self,
        identified_asset: IdentifiedAsset,
        public_account: AccountId,
    ) -> Option<IdentityProof> {
        self.as_mut()
            .identity_proof(identified_asset.into(), public_account.into())
            .map(Into::into)
    }

    /// Signs the `transaction`, generating transfer posts.
    #[inline]
    pub fn sign(&mut self, transaction: Transaction) -> SignResult {
        self.as_mut().sign(transaction.into()).into()
    }

    /// Returns a vector with the [`IdentityProof`] corresponding to each [`IdentifiedAsset`] in `identity_request`.
    #[inline]
    pub fn batched_identity_proof(
        &mut self,
        identity_request: IdentityRequest,
    ) -> IdentityResponse {
        self.as_mut()
            .batched_identity_proof(identity_request.0 .0)
            .into()
    }

    /// Returns the [`Address`] corresponding to `self`.
    #[inline]
    pub fn address(&mut self) -> Option<Address> {
        self.as_mut().address().map(Address)
    }

    /// Returns the associated [`TransactionData`] of `post`, namely the [`Asset`] and the
    /// [`Identifier`]. Returns `None` if `post` has an invalid shape, or if `self` doesn't own the
    /// underlying assets in `post`.
    #[inline]
    pub fn transaction_data(&mut self, post: TransferPost) -> Option<TransactionData> {
        self.as_mut().transaction_data(post.into()).map(Into::into)
    }

    /// Returns a vector with the [`TransactionData`] of each well-formed [`TransferPost`] owned by
    /// `self`.
    #[inline]
    pub fn batched_transaction_data(
        &mut self,
        posts: TransactionDataRequest,
    ) -> TransactionDataResponse {
        self.as_mut().batched_transaction_data(posts.0 .0).into()
    }

    /// Signs `transaction` and returns the generated [`TransferPost`]s, as
    /// well as their associated [`TransactionData`].
    #[inline]
    pub fn sign_with_transaction_data(
        &mut self,
        transaction: Transaction,
    ) -> SignWithTransactionDataResult {
        self.as_mut()
            .sign_with_transaction_data(transaction.into())
            .into()
    }

    /// Prunes the [`UtxoAccumulator`], deleting any data which
    /// cannot be used to [`sign`](Self::sign) or [`sync`](Self::sync).
    #[inline]
    pub fn prune(&mut self) {
        self.as_mut().prune()
    }
}

/// Wallet Error
#[wasm_bindgen]
pub struct WalletError(base::WalletError<PolkadotJsLedger>);

/// Wallet Type
type WalletType = base::Wallet<PolkadotJsLedger>;

/// Wallet with Polkadot-JS API Connection
#[derive(Clone, Default)]
#[wasm_bindgen]
pub struct Wallet(Rc<RefCell<Vec<Option<WalletType>>>>);

#[wasm_bindgen]
impl Wallet {
    /// Initializes a default empty wallet.
    ///
    /// # Implementation Note
    ///
    /// To set up a wallet on a [`Network`], use the `set_network` method.
    /// Calling [`Wallet`] methods on empty wallets will always return [`WalletError`].
    #[inline]
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        const NUMBER_OF_NETWORKS: usize = 3;
        let wallets = core::iter::repeat_with(|| Option::<WalletType>::None)
            .take(NUMBER_OF_NETWORKS)
            .collect::<Vec<_>>();
        Self(Rc::new(RefCell::new(wallets)))
    }

    /// Starts a new [`Wallet`] on `network` from existing
    /// `signer` and `ledger` connections.
    ///
    /// # Setting Up the Wallet
    ///
    /// Creating a [`Wallet`] using this method should be followed with a call to [`sync`] or
    /// [`restart`] to retrieve the current checkpoint and balance for this [`Wallet`]. If the
    /// backing `signer` is known to be already initialized, a call to [`sync`] is enough,
    /// otherwise, a call to [`restart`] is necessary to retrieve the full balance state.
    ///
    /// [`sync`]: Self::sync
    /// [`restart`]: Self::restart
    #[inline]
    pub fn set_network(&self, ledger: PolkadotJsLedger, signer: Signer, network: Network) {
        self.0.borrow_mut()[usize::from(network.0)] = Some(WalletType::new(ledger, signer.0));
    }

    /// Returns the [`AuthorizationContext`] corresponding to `self` in `network`.
    #[inline]
    pub fn authorization_context(&self, network: Network) -> JsValue {
        into_js(
            self.0.borrow()[usize::from(network.0)]
                .as_ref()
                .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
                .signer()
                .authorization_context(),
        )
    }

    /// Tries to load `authorization_context_option` to `self` in `network`.
    #[inline]
    pub fn try_load_authorization_context(
        &mut self,
        authorization_context_option: JsValue,
        network: Network,
    ) -> bool {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .signer_mut()
            .try_load_authorization_context(from_js(authorization_context_option))
    }

    /// Loads `accounts` to `self` in `network`
    #[inline]
    pub fn load_accounts(&self, accounts: AccountTable, network: Network) {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .signer_mut()
            .load_accounts(accounts.into())
    }

    /// Drops the [`AccountTable`] from `self` in `network`.
    #[inline]
    pub fn drop_accounts(&self, network: Network) {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .signer_mut()
            .drop_accounts()
    }

    /// Loads `authorization_context` to `self` in `network`.
    #[inline]
    pub fn load_authorization_context(
        &self,
        authorization_context: AuthorizationContext,
        network: Network,
    ) {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .signer_mut()
            .load_authorization_context(authorization_context.0)
    }

    /// Drops the [`AuthorizationContext`] from `self` in `network`.
    #[inline]
    pub fn drop_authorization_context(&self, network: Network) {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .signer_mut()
            .drop_authorization_context()
    }

    /// Saves `self` as a [`StorageStateOption`] in `network`.
    #[inline]
    pub fn get_storage(&self, network: Network) -> JsValue {
        into_js(StorageStateOption::from(functions::get_storage(
            self.0.borrow()[usize::from(network.0)]
                .as_ref()
                .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
                .signer(),
        )))
    }

    /// Tries to update `self` from `storage_state` in `network`.
    #[inline]
    pub fn set_storage(&self, storage_state: JsValue, network: Network) -> bool {
        functions::set_storage(
            self.0.borrow_mut()[usize::from(network.0)]
                .as_mut()
                .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
                .signer_mut(),
            &StorageStateOption::new(storage_state).0,
        )
    }

    /// Returns the current balance associated with this `id`.
    #[inline]
    pub fn balance(&self, id: String, network: Network) -> String {
        let asset_id = id.parse::<u128>().ok();
        let asset_id_type = asset_id
            .map(field_from_id_u128)
            .map(|x| {
                Decode::decode(x)
                    .expect("Decoding a field element from [u8; 32] is not allowed to fail")
            })
            .expect("asset should have value");
        self.0.borrow()[usize::from(network.0)]
            .as_ref()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .balance(&asset_id_type)
            .to_string()
    }

    /// Returns true if `self` contains at least `asset.value` of the asset of kind `asset.id`.
    #[inline]
    pub fn contains(&self, asset: Asset, network: Network) -> bool {
        self.0.borrow()[usize::from(network.0)]
            .as_ref()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .contains(&asset.into())
    }

    /// Returns the balance state associated to `self`.
    #[inline]
    pub fn assets(&self, network: Network) -> JsValue {
        borrow_js(
            self.0.borrow()[usize::from(network.0)]
                .as_ref()
                .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
                .assets(),
        )
    }

    /// Returns the [`Checkpoint`](utxo::Checkpoint) representing the current state
    /// of this wallet.
    #[inline]
    pub fn checkpoint(&self, network: Network) -> JsValue {
        borrow_js(
            self.0.borrow()[usize::from(network.0)]
                .as_ref()
                .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
                .checkpoint(),
        )
    }

    /// Calls `f` on a mutably borrowed value of `self` converting the future into a JS [`Promise`].
    #[allow(clippy::await_holding_refcell_ref)] // NOTE: JS is single-threaded so we can't panic.
    #[inline]
    fn with_async<T, E, F>(&self, f: F, network: Network) -> Promise
    where
        T: Serialize,
        E: Debug,
        F: 'static + for<'w> FnOnce(&'w mut WalletType) -> LocalBoxFutureResult<'w, T, E>,
    {
        let network_index = usize::from(network.0);
        if self.0.borrow()[network_index].is_none() {
            panic!("There is no wallet for the {} network", network.0)
        }
        let this = self.0.clone();
        future_to_promise(async move {
            f(this.borrow_mut()[network_index]
                .as_mut()
                .expect("This cannot panic because of the check above"))
            .await
            .map(into_js)
            .map_err(|err| into_js(format!("Error during asynchronous call: {err:?}")))
        })
    }

    /// Performs full wallet recovery.
    ///
    /// # Failure Conditions
    ///
    /// This method returns an element of type [`Error`] on failure, which can result from any
    /// number of synchronization issues between the wallet, the ledger, and the signer. See the
    /// [`InconsistencyError`] type for more information on the kinds of errors that can occur and
    /// how to resolve them.
    ///
    /// [`Error`]: manta-accounting::wallet::Error
    /// [`InconsistencyError`]: manta-accounting::wallet::InconsistencyError
    #[inline]
    pub fn restart(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.restart()), network)
    }

    /// Pulls data from the ledger, synchronizing the wallet and balance state. This method loops
    /// continuously calling [`sync_partial`](Self::sync_partial) until all the ledger data has
    /// arrived at and has been synchronized with the wallet.
    ///
    /// # Failure Conditions
    ///
    /// This method returns an element of type [`Error`] on failure, which can result from any
    /// number of synchronization issues between the wallet, the ledger, and the signer. See the
    /// [`InconsistencyError`] type for more information on the kinds of errors that can occur and
    /// how to resolve them.
    ///
    /// [`Error`]: manta-accounting::wallet::Error
    /// [`InconsistencyError`]: manta-accounting::wallet::InconsistencyError
    #[inline]
    pub fn sync(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.sync()), network)
    }

    /// Pulls data from the ledger, synchronizing the wallet and balance state. This method loops
    /// continuously calling [`sbt_sync_partial`] until all the ledger data has
    /// arrived at and has been synchronized with the wallet.
    ///
    /// # Failure Conditions
    ///
    /// This method returns an element of type [`Error`] on failure, which can result from any
    /// number of synchronization issues between the wallet, the ledger, and the signer. See the
    /// [`InconsistencyError`] type for more information on the kinds of errors that can occur and
    /// how to resolve them.
    ///
    /// # Note
    ///
    /// In general, this method does not update the [`Utxo`] accumulator, thus making the new assets
    /// effectively non-spendable. Therefore, this method should only be used when the pallet does not
    /// allow [`PrivateTransfer`]s or [`ToPublic`] transactions, for example in the case of
    /// Soul-Bound Tokens (SBTs).
    ///
    /// [`sbt_sync_partial`]: Self::sbt_sync_partial
    /// [`Error`]: manta-accounting::wallet::Error
    /// [`InconsistencyError`]: manta-accounting::wallet::InconsistencyError
    /// [`Utxo`]: utxo::Utxo
    /// [`PrivateTransfer`]: canonical::PrivateTransfer
    /// [`ToPublic`]: canonical::ToPublic
    #[inline]
    pub fn sbt_sync(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.sbt_sync()), network)
    }

    /// Pulls data from the ledger, synchronizing the wallet and balance state. This method returns
    /// a [`ControlFlow`] for matching against to determine if the wallet requires more
    /// synchronization.
    ///
    /// # Failure Conditions
    ///
    /// This method returns an element of type [`Error`] on failure, which can result from any
    /// number of synchronization issues between the wallet, the ledger, and the signer. See the
    /// [`InconsistencyError`] type for more information on the kinds of errors that can occur and
    /// how to resolve them.
    ///
    /// [`Error`]: manta-accounting::wallet::Error
    /// [`InconsistencyError`]: manta-accounting::wallet::InconsistencyError
    #[inline]
    pub fn sync_partial(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.sync_partial()), network)
    }

    /// Pulls data from the ledger, synchronizing the wallet and balance state. This method returns
    /// a [`ControlFlow`] for matching against to determine if the wallet requires more
    /// synchronization.
    ///
    /// # Failure Conditions
    ///
    /// This method returns an element of type [`Error`] on failure, which can result from any
    /// number of synchronization issues between the wallet, the ledger, and the signer. See the
    /// [`InconsistencyError`] type for more information on the kinds of errors that can occur and
    /// how to resolve them.
    ///
    /// # Note
    ///
    /// In general, this method does not update the [`Utxo`] accumulator, thus making the new assets
    /// effectively non-spendable. Therefore, this method should only be used when the pallet does not
    /// allow [`PrivateTransfer`]s or [`ToPublic`] transactions, for example in the case of
    /// Soul-Bound Tokens (SBTs).
    ///
    /// [`Error`]: manta-accounting::wallet::Error
    /// [`InconsistencyError`]: manta-accounting::wallet::InconsistencyError
    /// [`Utxo`]: utxo::Utxo
    /// [`PrivateTransfer`]: canonical::PrivateTransfer
    /// [`ToPublic`]: canonical::ToPublic
    #[inline]
    pub fn sbt_sync_partial(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.sbt_sync_partial()), network)
    }

    /// Signs the `transaction` using the signer connection, sending `metadata` and `network` for context. This
    /// method _does not_ automatically sychronize with the ledger. To do this, call the
    /// [`sync`](Self::sync) method separately.
    #[inline]
    pub fn sign(
        &self,
        transaction: Transaction,
        metadata: Option<AssetMetadata>,
        network: Network,
    ) -> Promise {
        self.with_async(
            |this| {
                Box::pin(async {
                    this.sign(transaction.into(), metadata.map(Into::into))
                        .await
                        .map(|response| {
                            response
                                .posts
                                .into_iter()
                                .map(TransferPost::from)
                                .collect::<Vec<_>>()
                        })
                })
            },
            network,
        )
    }

    /// Posts a transaction to the ledger, returning a success [`Response`] if the `transaction`
    /// was successfully posted to the ledger. This method automatically synchronizes with the
    /// ledger before posting, _but not after_. To amortize the cost of future calls to [`post`],
    /// the [`sync`] method can be used to synchronize with the ledger.
    ///
    /// # Failure Conditions
    ///
    /// This method returns a [`Response`] when there were no errors in producing transfer data and
    /// sending and receiving from the ledger, but instead the ledger just did not accept the
    /// transaction as is. This could be caused by an external update to the ledger while the signer
    /// was building the transaction that caused the wallet and the ledger to get out of sync. In
    /// this case, [`post`] can safely be called again, to retry the transaction.
    ///
    /// This method returns an error in any other case. The internal state of the wallet is kept
    /// consistent between calls and recoverable errors are returned for the caller to handle.
    ///
    /// [`Response`]: ledger::Write::Response
    /// [`post`]: Self::post
    /// [`sync`]: Self::sync
    #[inline]
    pub fn post(
        &self,
        transaction: Transaction,
        metadata: Option<AssetMetadata>,
        network: Network,
    ) -> Promise {
        self.with_async(
            |this| Box::pin(this.post(transaction.into(), metadata.map(Into::into))),
            network,
        )
    }

    /// Returns public receiving keys according to the `request`.
    #[inline]
    pub fn address(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.address()), network)
    }

    /// Retrieves the [`TransactionData`] associated with the [`TransferPost`]s in
    /// `request`, if possible.
    #[inline]
    pub fn transaction_data(&self, request: TransactionDataRequest, network: Network) -> Promise {
        self.with_async(
            |this| {
                Box::pin(async {
                    this.transaction_data(request.0 .0)
                        .await
                        .map(Into::<TransactionDataResponse>::into)
                })
            },
            network,
        )
    }

    /// Generates an [`IdentityProof`] for the [`IdentifiedAsset`]s in `request` by
    /// signing a virtual [`ToPublic`](canonical::ToPublic) transaction.
    #[inline]
    pub fn identity_proof(&self, request: IdentityRequest, network: Network) -> Promise {
        self.with_async(
            |this| {
                Box::pin(async {
                    this.identity_proof(request.0 .0)
                        .await
                        .map(Into::<IdentityResponse>::into)
                })
            },
            network,
        )
    }

    /// Signs `transaction` and returns the generated [`TransferPost`]s, as
    /// well as their associated [`TransactionData`].
    #[inline]
    pub fn sign_with_transaction_data(
        &self,
        transaction: Transaction,
        metadata: Option<AssetMetadata>,
        network: Network,
    ) -> Promise {
        self.with_async(
            |this| {
                Box::pin(async {
                    this.sign_with_transaction_data(transaction.into(), metadata.map(Into::into))
                        .await
                        .map(|response| {
                            response
                                .0
                                .into_iter()
                                .map(|(post, data)| (TransferPost::from(post), data))
                                .collect::<Vec<_>>()
                        })
                })
            },
            network,
        )
    }

    /// Resets a [`Signer`] to its initial state.
    #[inline]
    pub fn reset_state(&self, network: Network) -> Promise {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .reset_state();
        self.with_async(|this| Box::pin(this.load_initial_state()), network)
    }

    /// Pulls data from the ledger, synchronizing the wallet and balance state. This method
    /// builds a [`InitialSyncRequest`] by continuously calling [`read`](ledger::Read::read)
    /// until all the ledger data has arrived. Once the request is built, it executes
    /// synchronizes the signer against it.
    ///
    /// # Implementation Note
    ///
    /// Using this method to synchronize a signer will make it impossibile to spend any
    /// [`Utxo`](utxo::Utxo)s already on the ledger at the time of synchronization.
    /// Therefore, this method should only be used for the initial synchronization of a
    /// new signer.
    ///
    /// # Failure Conditions
    ///
    /// This method returns an element of type [`Error`] on failure, which can result from any
    /// number of synchronization issues between the wallet, the ledger, and the signer. See the
    /// [`InconsistencyError`] type for more information on the kinds of errors that can occur and
    /// how to resolve them.
    ///
    /// [`Error`]: manta-accounting::wallet::Error
    /// [`InconsistencyError`]: manta-accounting::wallet::InconsistencyError
    #[inline]
    pub fn initial_sync(&self, network: Network) -> Promise {
        self.with_async(|this| Box::pin(this.initial_sync()), network)
    }

    /// Prunes the [`UtxoAccumulator`] in `network`, deleting any data which
    /// cannot be used to [`sign`](Self::sign) or [`sync`](Self::sync).
    #[inline]
    pub fn prune(&mut self, network: Network) {
        self.0.borrow_mut()[usize::from(network.0)]
            .as_mut()
            .unwrap_or_else(|| panic!("There is no wallet for the {} network", network.0))
            .signer_mut()
            .prune()
    }
}

/// Creates a [`TransactionDataRequest`] from `post`.
#[inline]
#[wasm_bindgen]
pub fn transaction_data_request(post: TransferPost) -> TransactionDataRequest {
    signer::TransactionDataRequest {
        0: vec![post.into()],
    }
    .into()
}
