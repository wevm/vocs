import 'viem/window'

// ---cut---
// [!region imports]
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
// [!endregion imports]

export const walletClient = createWalletClient({
  chain: mainnet,
  // biome-ignore lint/style/noNonNullAssertion: _
  transport: custom(window.ethereum!),
})
