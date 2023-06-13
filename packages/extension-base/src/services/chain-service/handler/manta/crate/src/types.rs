use alloc::{boxed::Box, vec::Vec};
use core::fmt::Debug;
use manta_accounting::wallet::{
    ledger::ReadResponse,
    signer::{InitialSyncData, SyncData},
};
use manta_crypto::{
    arkworks::{algebra::Group, constraint::fp::Fp, ec::ProjectiveCurve},
    encryption::{hybrid, EmptyHeader},
    permutation::duplex,
};
use manta_pay::{
    config::{
        self,
        utxo::{self, Config},
    },
    crypto::poseidon::encryption::{self, BlockArray, CiphertextBlock},
};
use manta_util::{
    codec::Encode,
    serde::{Deserialize, Serialize},
    serde_with, BoxArray,
};
use scale_codec::Error;

/// Decodes the `bytes` array of the given length `N` into the SCALE decodable type `T` returning a
/// blanket error if decoding fails.
#[inline]
pub fn decode<T, const N: usize>(bytes: [u8; N]) -> Result<T, scale_codec::Error>
where
    T: scale_codec::Decode,
{
    T::decode(&mut bytes.as_slice())
}

/// Raw Asset Identifier Type
pub type RawAssetId = [u8; 32];

/// Raw Asset Value Type
pub type RawAssetValue = [u8; 16];

/// Raw Utxo Commitment Type
pub type RawUtxoCommitment = [u8; 32];

/// Decodes a field element from `bytes`.
#[inline]
pub fn fp_decode<T>(bytes: Vec<u8>) -> Result<Fp<T>, scale_codec::Error>
where
    T: manta_crypto::arkworks::ff::Field,
{
    Fp::try_from(bytes).map_err(|_e| scale_codec::Error::from("Fp Serialize"))
}

/// Decodes a group element from `bytes`.
#[inline]
pub fn group_decode<T>(bytes: Vec<u8>) -> Result<Group<T>, scale_codec::Error>
where
    T: ProjectiveCurve,
{
    Group::try_from(bytes).map_err(|_e| scale_codec::Error::from("Group Serialize"))
}

/// Raw Asset
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawAsset {
    /// Asset Id
    pub id: RawAssetId,

    /// Asset Value
    pub value: RawAssetValue,
}

impl TryFrom<RawAsset> for config::Asset {
    type Error = Error;

    #[inline]
    fn try_from(asset: RawAsset) -> Result<Self, Self::Error> {
        Ok(Self {
            id: fp_decode(asset.id.to_vec())?,
            value: u128::from_le_bytes(asset.value),
        })
    }
}

/// Raw Nullifier Commitment
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawNullifierCommitment {
    /// Commitment
    pub commitment: [u8; 32],
}

/// Raw UTXO Type
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawUtxo {
    /// Transparency Flag:
    pub is_transparent: bool,

    /// Public Asset: 40 bytes
    pub public_asset: RawAsset,

    /// UTXO Commitment: 32 bytes
    pub commitment: RawUtxoCommitment,
}

impl RawUtxo {
    /// Tries to convert `self` into a [`Utxo`](utxo::Utxo)
    #[inline]
    pub fn try_into(self) -> Result<utxo::Utxo, Error> {
        Ok(utxo::Utxo {
            is_transparent: self.is_transparent,
            public_asset: self.public_asset.try_into()?,
            commitment: fp_decode(self.commitment.to_vec())?,
        })
    }
}

/// Raw Encrypted Note
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawLightIncomingNote {
    /// Ephemeral Public Key
    pub ephemeral_public_key: [u8; 32],

    /// Ciphertext
    #[serde(with = "serde_with::As::<[[serde_with::Same; 32]; 3]>")]
    pub ciphertext: [[u8; 32]; 3],
}

/// Raw Incoming Note
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawIncomingNote {
    /// Ephemeral Public Key
    pub ephemeral_public_key: [u8; 32],

    // Tag
    pub tag: [u8; 32],

    /// Ciphertext
    #[serde(with = "serde_with::As::<[[serde_with::Same; 32]; 3]>")]
    pub ciphertext: [[u8; 32]; 3],
}

/// Raw Outgoing Note
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawOutgoingNote {
    /// Ephemeral Public Key
    pub ephemeral_public_key: [u8; 32],

    /// Ciphertext
    #[serde(with = "serde_with::As::<[[serde_with::Same; 32]; 2]>")]
    pub ciphertext: [[u8; 32]; 2],
}

/// Raw Nullifier
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawNulllifier {
    /// Nullifier
    pub nullifier: RawNullifierCommitment,

    /// Outgoing Note
    pub outgoing_note: RawOutgoingNote,
}

impl TryFrom<RawNullifierCommitment>
    for manta_accounting::transfer::utxo::protocol::Nullifier<Config>
{
    type Error = scale_codec::Error;

    #[inline]
    fn try_from(commitment: RawNullifierCommitment) -> Result<Self, Self::Error> {
        Ok(Self {
            commitment: fp_decode(commitment.commitment.to_vec())?,
        })
    }
}

/// Raw Full Incoming Note
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawFullIncomingNote {
    /// Address Partition
    address_partition: u8,

    /// Incoming Note
    incoming_note: RawIncomingNote,

    /// Light Incoming Note
    light_incoming_note: RawLightIncomingNote,
}

impl TryFrom<RawFullIncomingNote> for utxo::FullIncomingNote {
    type Error = scale_codec::Error;

    #[inline]
    fn try_from(note: RawFullIncomingNote) -> Result<Self, Self::Error> {
        let mut encoded_incoming_ciphertext = [0u8; 96];
        let mut ind = 0;
        for component in note.light_incoming_note.ciphertext {
            for byte in component {
                encoded_incoming_ciphertext[ind as usize] = byte;
                ind += 1;
            }
        }
        Ok(Self {
            address_partition: note.address_partition,
            incoming_note: utxo::IncomingNote {
                header: EmptyHeader::default(),
                ciphertext: hybrid::Ciphertext {
                    ephemeral_public_key: group_decode(
                        note.incoming_note.ephemeral_public_key.to_vec(),
                    )?,
                    ciphertext: duplex::Ciphertext {
                        tag: encryption::Tag(fp_decode(note.incoming_note.tag.to_vec())?),
                        message: BlockArray(BoxArray(Box::new([CiphertextBlock(
                            note.incoming_note
                                .ciphertext
                                .into_iter()
                                .map(|x| fp_decode(x.to_vec()))
                                .collect::<Result<Vec<_>, _>>()?
                                .into(),
                        )]))),
                    },
                },
            },
            light_incoming_note: utxo::LightIncomingNote {
                header: EmptyHeader::default(),
                ciphertext: hybrid::Ciphertext {
                    ephemeral_public_key: group_decode(
                        note.light_incoming_note.ephemeral_public_key.to_vec(),
                    )?,
                    ciphertext: encoded_incoming_ciphertext.into(),
                },
            },
        })
    }
}

impl TryFrom<RawOutgoingNote> for utxo::OutgoingNote {
    type Error = Error;

    #[inline]
    fn try_from(note: RawOutgoingNote) -> Result<Self, Self::Error> {
        let mut array_ = [0u8; 64];
        let mut ind = 0;
        for i in note.ciphertext {
            for j in i {
                array_[ind as usize] = j;
                ind += 1;
            }
        }
        let decoded: [u8; 64] = decode(array_).unwrap();
        Ok(Self {
            header: EmptyHeader::default(),
            ciphertext: hybrid::Ciphertext {
                ephemeral_public_key: group_decode(note.ephemeral_public_key.to_vec())?,
                ciphertext: decoded.into(),
            },
        })
    }
}

impl RawNulllifier {
    /// Tries to convert `self` into a [`Nullifier`](utxo::Nullifier).
    #[inline]
    pub fn try_into(self) -> Result<utxo::Nullifier, Error> {
        Ok(utxo::Nullifier {
            nullifier: self.nullifier.try_into()?,
            outgoing_note: self.outgoing_note.try_into()?,
        })
    }
}

/// Raw Pull Response
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawPullResponse {
    /// Should Continue Flag
    pub should_continue: bool,

    /// Receiver Data
    pub receivers: Vec<(RawUtxo, RawFullIncomingNote)>,

    /// Sender Data
    pub senders: Vec<(RawUtxoCommitment, RawOutgoingNote)>,
}

impl TryFrom<RawPullResponse> for ReadResponse<SyncData<config::Config>> {
    type Error = ();

    #[inline]
    fn try_from(response: RawPullResponse) -> Result<Self, Self::Error> {
        Ok(Self {
            should_continue: response.should_continue,
            data: SyncData {
                utxo_note_data: response
                    .receivers
                    .into_iter()
                    .map(|(utxo, encrypted_note)| {
                        utxo.try_into()
                            .and_then(|u| encrypted_note.try_into().map(|n| (u, n)))
                    })
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|_| ())?,
                nullifier_data: response
                    .senders
                    .into_iter()
                    .map(|(comm, note)| {
                        let nullifier = RawNulllifier {
                            nullifier: RawNullifierCommitment { commitment: comm },
                            outgoing_note: note,
                        };
                        nullifier.try_into()
                    }) // check type
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|_| ())?,
            },
        })
    }
}

/// Raw Leaf Digest
pub type RawLeafDigest = [u8; 32];

/// Raw Inner Digest
pub type RawInnerDigest = [u8; 32];

/// Raw Current Path
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawCurrentPath {
    /// Sibling Digest
    pub sibling_digest: RawLeafDigest,

    /// Leaf Index
    pub leaf_index: u32,

    /// Inner Path
    pub inner_path: Vec<RawInnerDigest>,
}

impl TryFrom<RawCurrentPath> for config::CurrentPath {
    type Error = ();

    #[inline]
    fn try_from(path: RawCurrentPath) -> Result<Self, Self::Error> {
        Ok(Self::new(
            fp_decode(path.sibling_digest.to_vec()).map_err(|_| ())?,
            (path.leaf_index as usize).into(),
            path.inner_path
                .into_iter()
                .map(|x| fp_decode(x.to_vec()))
                .collect::<Result<_, _>>()
                .map_err(|_| ())?,
        ))
    }
}

/// Raw Initial Pull Response
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawInitialPullResponse {
    /// Should Continue Flag
    pub should_continue: bool,

    /// Utxo Data
    pub utxo_data: Vec<RawUtxo>,

    /// Memebership Proof Data
    pub membership_proof_data: Vec<RawCurrentPath>,

    /// Sender Data
    pub nullifier_count: u128,
}

impl TryFrom<RawInitialPullResponse> for ReadResponse<InitialSyncData<config::Config>> {
    type Error = ();

    #[inline]
    fn try_from(response: RawInitialPullResponse) -> Result<Self, Self::Error> {
        Ok(Self {
            should_continue: response.should_continue,
            data: InitialSyncData {
                utxo_data: response
                    .utxo_data
                    .into_iter()
                    .map(|utxo| utxo.try_into())
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|_| ())?,
                membership_proof_data: response
                    .membership_proof_data
                    .into_iter()
                    .map(|path| config::CurrentPath::try_from(path).map(Into::into))
                    .collect::<Result<_, _>>()
                    .map_err(|_| ())?,
                nullifier_count: response.nullifier_count,
            },
        })
    }
}

/// Raw Receiver Post
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawReceiverPost {
    /// Raw Utxo
    pub utxo: RawUtxo,

    /// Raw Note
    pub full_incoming_note: RawFullIncomingNote,
}

impl TryFrom<RawReceiverPost> for config::ReceiverPost {
    type Error = ();

    #[inline]
    fn try_from(value: RawReceiverPost) -> Result<Self, Self::Error> {
        Ok(Self {
            utxo: value.utxo.try_into().map_err(|_| ())?,
            note: value.full_incoming_note.try_into().map_err(|_| ())?,
        })
    }
}

/// Raw Sender Post
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(crate = "manta_util::serde")]
pub struct RawSenderPost {
    /// Raw Utxo Accumulator Output
    pub utxo_accumulator_output: RawInnerDigest,

    /// Raw Nullifier
    pub nullifier: RawNulllifier,
}

impl TryFrom<RawSenderPost> for config::SenderPost {
    type Error = ();

    #[inline]
    fn try_from(value: RawSenderPost) -> Result<Self, Self::Error> {
        Ok(Self {
            utxo_accumulator_output: fp_decode(value.utxo_accumulator_output.to_vec())
                .map_err(|_| ())?,
            nullifier: value.nullifier.try_into().map_err(|_| ())?,
        })
    }
}
