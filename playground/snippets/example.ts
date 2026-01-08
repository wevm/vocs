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
const _blockNumber = await client.getBlockNumber()
// [!endregion usage-1]

// [!region usage-2]
const _block = await client.getBlock()
// [!endregion usage-2]
