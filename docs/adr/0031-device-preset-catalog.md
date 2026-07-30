# 0031 Device Preset Catalog

## Context

The rebuilt project creator needs a fast system picker that covers major platform/device lines without turning the picker choices into persisted catalog rows. The domain model still allows free-text `Device.name` values and only constrains uniqueness within a project/platform/name tuple.

## Decision

Add `domain/device-catalog.ts` as static presentation data for preset selection. Presets expose a `presetId`, `platformName`, `deviceName`, and `formFactor`, grouped as Mobile, Tablet, and Desktop. Creating devices from presets will still persist ordinary `Device` rows; the preset id is not stored as a domain entity.

## Consequences

- The project creator and later Create Device dialog can share one source of picker choices.
- The existing device uniqueness rule remains the authoritative domain constraint.
- The catalog can be changed for demo relevance without database migrations.
