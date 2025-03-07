import { configuration } from 'src/lib/config'
import { Session } from '@wharfkit/session'
import { SessionKit } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'
import { ref, Ref } from 'vue'
import { getWorkingUrl } from 'src/lib/helperFunctions'

const session = ref<Session | undefined>(undefined) as Ref<Session | undefined>

const webRenderer = new WebRenderer()

// Resilient chains configuration
async function getResilientChains() {
  return {
    mainnet: {
      id: configuration.mainnet.native.chain_id,
      url: await getWorkingUrl(configuration.mainnet.native.apis.map(api => api.url)), // Validate URLs
      logo: "./Telos-circle.png",
    }
    // testnet: {
    //   id: configuration.testnet.native.chain_id,
    //   url: await getWorkingUrl(configuration.testnet.native.apis.map((api) => api.url)), // Validate URLs
    //   logo: './Telos-circle.png',
    // },
  }
}

let sessionKit: SessionKit | undefined

// Initialize SessionKit with resilient URLs
async function initializeSessionKit() {
  const chains = await getResilientChains()
  sessionKit = new SessionKit({
    appName: 'BoidBridge',
    chains: [
      chains.mainnet,
      // chains.testnet,
    ],
    ui: webRenderer,
    walletPlugins: [new WalletPluginAnchor()],
  })
}

// Login
export async function sessionLogin(): Promise<Session | undefined> {
  if (!sessionKit) {
    await initializeSessionKit()
  }
  const response = await sessionKit!.login()
  session.value = response.session
  return response.session
}

// Logout
export async function sessionLogout(): Promise<Session | undefined> {
  if (sessionKit) {
    await sessionKit.logout()
    session.value = undefined
  }
  return session.value
}

// Restore
export async function sessionRestore(): Promise<Session | undefined> {
  if (!sessionKit) {
    await initializeSessionKit()
  }
  const loginResult = await sessionKit!.restore()
  session.value = loginResult
  return loginResult
}
