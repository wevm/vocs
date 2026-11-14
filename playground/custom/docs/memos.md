# Memos

Attach a memo to a transfer with `transferWithMemo`. The memo is 32 bytes and is stored with the transfer event.

```ts
await client.token.transferWithMemo({ amount: 100n, memo: 'invoice-42', to: recipient })
```
