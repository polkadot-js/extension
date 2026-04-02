// Copyright 2019-2026 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Registry } from '@polkadot/types/types';
import type { ExtDef, ExtTypes } from '@polkadot/types/extrinsic/signedExtensions/types';
import type { TypeDef } from '@polkadot/types/types';

import { allExtensions } from '@polkadot/types/extrinsic/signedExtensions';
import { encodeTypeDef, TypeDefInfo } from '@polkadot/types';

/**
 * Convert a TypeDef (from the portable registry) into an ExtTypes field mapping.
 *
 * - Null / empty tuple → {} (no fields, zero-sized extension)
 * - Struct with named sub fields → { fieldName: encodedType }
 * - Other types (Option, Compact, etc.) → { syntheticName: encodedType }
 *   These are newtype wrappers or direct types in the metadata; we generate
 *   a synthetic field name since ExtTypes requires named fields.
 */
function typeDefToExtTypes (registry: Registry, typeDef: TypeDef, identifier: string): ExtTypes {
  if (typeDef.info === TypeDefInfo.Null) {
    return {};
  }

  if (typeDef.info === TypeDefInfo.Tuple) {
    if (!typeDef.sub || (Array.isArray(typeDef.sub) && typeDef.sub.length === 0)) {
      return {};
    }
  }

  if (typeDef.info === TypeDefInfo.Struct) {
    const sub = typeDef.sub;

    if (!sub) {
      return {};
    }

    const fields = Array.isArray(sub) ? sub : [sub];

    if (fields.length > 0 && fields.every((f) => f.name)) {
      const result: ExtTypes = {};

      for (const field of fields) {
        if (field.name) {
          result[field.name] = encodeTypeDef(registry, field);
        }
      }

      return result;
    }
  }

  // For non-struct types (Option, Compact, Tuple with fields, etc.) or
  // structs with unnamed fields: encode the whole type as a single field.
  // Use a synthetic field name derived from the extension identifier.
  //
  // Strip displayName/lookupName from the top-level TypeDef to force
  // structural encoding. getTypeDef unwraps newtype composites (e.g.,
  // ProvideCidConfig(Option<CidConfig>) → info=Option) but preserves
  // the composite's name. If we pass that name to the registry, it
  // resolves back to the composite wrapper instead of the inner type.
  const stripped = { ...typeDef, displayName: undefined, lookupName: undefined };
  const encoded = encodeTypeDef(registry, stripped);
  const fieldName = identifier[0].toLowerCase() + identifier.slice(1);

  return { [fieldName]: encoded };
}

/**
 * Dynamically resolve unknown signed extensions from a registry's metadata.
 * The registry must already have metadata set (via setMetadata).
 *
 * Returns an ExtDef containing only the dynamically resolved extensions
 * (those not already in allExtensions). Callers should merge with any
 * explicit userExtensions from the MetadataDef.
 */
export function resolveDynamicExtensions (registry: Registry, signedExtensions: string[]): ExtDef {
  let metadata;

  try {
    metadata = registry.metadata;
  } catch {
    // Metadata not set on this registry
    return {};
  }

  if (!metadata?.extrinsic?.transactionExtensions) {
    return {};
  }

  const extensions = metadata.extrinsic.transactionExtensions;
  const result: ExtDef = {};

  for (const ext of extensions) {
    const identifier = ext.identifier.toString();

    // Skip built-in extensions and extensions not needed for this tx
    if (allExtensions[identifier] || !signedExtensions.includes(identifier)) {
      continue;
    }

    try {
      const extrinsicTypeDef = registry.lookup.getTypeDef(ext.type);
      const implicitTypeDef = registry.lookup.getTypeDef(ext.implicit);

      const extrinsic = typeDefToExtTypes(registry, extrinsicTypeDef, identifier);
      const payload = typeDefToExtTypes(registry, implicitTypeDef, identifier);

      result[identifier] = { extrinsic, payload };
    } catch (error) {
      console.warn(`Dynamic extension resolution: failed to resolve "${identifier}"`, error);
    }
  }

  return result;
}
