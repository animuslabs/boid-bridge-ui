import { createConfig, http } from '@wagmi/core'
import { WagmiPlugin } from '@wagmi/vue'
import { defineBoot } from '#q-app/wrappers'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { metaMask, safe } from '@wagmi/connectors'
import { configuration } from 'src/lib/config'

const telosEvmMainnet = {
  id: Number(configuration.mainnet.evm.chain_id),
  name: configuration.mainnet.evm.apis[0]?.name || 'Telos EVM Mainnet',
  network: 'telos',
  nativeCurrency: {
    name: configuration.other.evm_token_name,
    symbol: configuration.other.evm_token_symbol,
    decimals: configuration.other.evm_token_decimals
  },
  rpcUrls: {
    default: { http: [configuration.mainnet.evm.apis[0]?.url || ''] }
  }
}

const telosEvmTestnet = {
  id: Number(configuration.testnet.evm.chain_id),
  name: configuration.testnet.evm.apis[0]?.name || 'Telos EVM Testnet',
  network: 'telos-testnet',
  nativeCurrency: {
    name: configuration.other.evm_token_name,
    symbol: configuration.other.evm_token_symbol,
    decimals: configuration.other.evm_token_decimals
  },
  rpcUrls: {
    default: { http: [configuration.testnet.evm.apis[0]?.url || ''] }
  }
}

const config = createConfig({
  chains: [telosEvmMainnet, telosEvmTestnet],
  connectors: [
    metaMask(),
    safe(),
  ],
  transports: {
    [telosEvmMainnet.id]: http(),
    [telosEvmTestnet.id]: http()
  }
})

export default defineBoot(({ app }) => {
  app.use(WagmiPlugin, { config })
  app.use(VueQueryPlugin, {})
})
