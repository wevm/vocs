// [!region setup]
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
// [!endregion setup]

export async function getBlockNumber() {
  return client.getBlockNumber()
}
