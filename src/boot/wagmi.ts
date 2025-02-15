import { createModal, getDefaultConfig } from '@rabby-wallet/rabbykit'
import { createConfig, http } from '@wagmi/core'
import { configuration } from 'src/lib/config'
import { defineBoot } from '#q-app/wrappers'
import { WagmiPlugin } from '@wagmi/vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

const telosEvmMainnet = {
  id: Number(configuration.mainnet.evm.chain_id),
  name: configuration.mainnet.evm.apis[0]?.name || 'Telos EVM Mainnet',
  network: 'telos',
  nativeCurrency: {
    name: configuration.other.evm_token_name,
    symbol: configuration.other.evm_token_symbol,
    decimals: configuration.other.evm_token_decimals,
  },
  rpcUrls: {
    default: { http: [configuration.mainnet.evm.apis[0]?.url || ''] },
  },
}

const telosEvmTestnet = {
  id: Number(configuration.testnet.evm.chain_id),
  name: configuration.testnet.evm.apis[0]?.name || 'Telos EVM Testnet',
  network: 'telos-testnet',
  nativeCurrency: {
    name: configuration.other.evm_token_name,
    symbol: configuration.other.evm_token_symbol,
    decimals: configuration.other.evm_token_decimals,
  },
  rpcUrls: {
    default: { http: [configuration.testnet.evm.apis[0]?.url || ''] },
  },
}

const config = createConfig(
  getDefaultConfig({
    appName: 'BOID Bridge',
    projectId: 'boid-bridge',
    chains: [telosEvmMainnet, telosEvmTestnet],
    transports: {
      [telosEvmMainnet.id]: http(),
      [telosEvmTestnet.id]: http(),
    },
  }),
)

export default defineBoot(({ app }) => {
  const queryClient = new QueryClient()
  app.use(VueQueryPlugin, { queryClient })
  app.use(WagmiPlugin, { config })
})

export const rabbykit = createModal({ wagmi: config })
