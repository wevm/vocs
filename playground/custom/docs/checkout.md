# Accept USDC in a Next.js Checkout

A checkout charges in USDC. USDC has 6 decimals, so convert the price with `parseUnits(price, 6)`.

Build the token transfer in a Server Action, such as `app/checkout/actions.ts`, so the merchant address stays on the server.

```ts
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem'

const merchant = '0x0000000000000000000000000000000000000001'

export const data = encodeFunctionData({
  abi: erc20Abi,
  args: [merchant, parseUnits('25.00', 6)],
  functionName: 'transfer',
})
```
