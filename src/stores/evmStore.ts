import { defineStore } from 'pinia'
import { useConnect, useAccount, useDisconnect } from '@wagmi/vue'

export const useEvmStore = defineStore('evmStore', () => {
  const { connect, connectors } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // ID 0 is Telos EVM Mainnet and ID 1 is Telos EVM Testnet
  function login(connectorIdx = 1) {
    const connector = connectors[connectorIdx]
    if (!connector) return
    connect({ connector })
  }

  function logout() {
    disconnect()
  }

  return {
    address,
    isConnected,
    connectors,
    login,
    logout
  }
})
