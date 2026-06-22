import { read } from '../payload.js'

/**
 * Backs `virtual:vocs/config` in the prebuilt app: the serialized Vocs config
 * embedded in the payload (functions still encoded; `useConfig` deserializes).
 */
export const config = read().config
