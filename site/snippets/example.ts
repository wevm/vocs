// [!region import]
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// [!endregion import]

// [!region setup]
const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
// [!endregion setup]

// [!region usage-1]
const _blockNumber_$1 = await client.getBlockNumber()
// [!endregion usage-1]

// [!region usage-2-docs]
const _blockNumber_$2 = await client.getBlockNumber() // [\!code hl] // [!code focus]
// [!endregion usage-2-docs]

// [!region usage-2]
const _blockNumber_$3 = await client.getBlockNumber() // [!code hl]
// [!endregion usage-2]

// [!region usage-3-docs]
// [\!code word:getBlockNumber] // [!code focus]
const _blockNumber_$4 = await client.getBlockNumber()
// [!endregion usage-3-docs]

// [!region usage-3]
// [!code word:getBlockNumber]
const _blockNumber_$5 = await client.getBlockNumber()
// [!endregion usage-3]

// [!region usage-4]
const _blockNumber_$6 = await client.getBlockNumber()
//    ^?
// [!endregion usage-4]
