import { APIClient, FetchProvider } from '@wharfkit/antelope'
import { HyperionAPIClient } from '@wharfkit/hyperion' // Adjust the import path if needed
import { configuration } from './config'
import { ActionNameParams as TokenBoidNameParams } from 'src/lib/types/token.boid'
import { ActionNameParams as EvmBoidNameParams } from 'src/lib/types/evm.boid'
import { ActionNameParams as XsendBoidNameParams } from 'src/lib/types/xsend.boid'

const client = new APIClient({
  provider: new FetchProvider(configuration.testnet.native.hyperion), // Use a real provider here
})

export interface ContractEvmBoidActionResponse<
  A extends keyof EvmBoidNameParams = keyof EvmBoidNameParams,
> {
  timestamp: string
  trx_id: string
  act: {
    account: string
    name: A
  }
  data: EvmBoidNameParams[A]
}

export interface ContractXsendBoidActionResponse<
  A extends keyof XsendBoidNameParams = keyof XsendBoidNameParams,
> {
  timestamp: string
  trx_id: string
  act: {
    account: string
    name: A
  }
  data: XsendBoidNameParams[A]
}

export interface ContractTokenBoidActionResponse<
  A extends keyof TokenBoidNameParams = keyof TokenBoidNameParams,
> {
  timestamp: string
  trx_id: string
  act: {
    account: string
    name: A
  }
  data: TokenBoidNameParams[A]
}

// Instantiate the Hyperion API client
const hyperion = new HyperionAPIClient(client)

export type ActionResponse = {
  timestamp: string
  trx_id: string
  act: {
    account: string
    name: string
  }
  data: Record<string, unknown>
}

async function queryEvmBoidActions(contractAccount: string): Promise<ActionResponse[] | undefined> {
  try {
    const response = await hyperion.v2.history.get_actions(contractAccount, {
      filter: `${contractAccount}:*`,
      skip: 0,
      limit: 333,
      after: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const dataResponse =
      (response.actions.map(
        (action: {
          timestamp: { toString: () => string }
          trx_id: { toString: () => string }
          act: {
            account: { toString: () => string }
            name: { toString: () => string }
            data: { [key: string]: unknown }
          }
        }) => ({
          timestamp: action.timestamp.toString(),
          trx_id: action.trx_id.toString(),
          act: {
            account: action.act.account.toString(),
            name: action.act.name.toString(),
          },
          data: action.act.data,
        }),
      ) as ActionResponse[]) || []

    console.log(`Actions for ${contractAccount}:`, dataResponse)
    return dataResponse
  } catch (error) {
    console.error(`Error querying actions for ${contractAccount}:`, error)
    return undefined
  }
}

async function queryXsendBoidActions(
  contractAccount: string,
): Promise<ContractXsendBoidActionResponse[] | undefined> {
  try {
    const response = await hyperion.v2.history.get_actions(contractAccount, {
      filter: `${contractAccount}:*`, // Adjust filter: you can specify action name if needed (e.g., `${contractAccount}:transfer`)
      skip: 0,
      limit: 333,
      after: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    })
    const dataResponse: ContractXsendBoidActionResponse[] =
      response.actions.map(
        (action: {
          timestamp: { toString: () => string }
          trx_id: { toString: () => string }
          act: {
            account: { toString: () => string }
            name: { toString: () => string }
            data: { [key: string]: unknown }
          }
        }) => ({
          timestamp: action.timestamp.toString(),
          trx_id: action.trx_id.toString(),
          act: {
            account: action.act.account.toString(),
            name: action.act.name.toString() as keyof XsendBoidNameParams,
          },
          data: action.act.data,
        }),
      ) || []
    console.log(`Actions for ${contractAccount}:`, dataResponse)
    return dataResponse
  } catch (error) {
    console.error(`Error querying actions for ${contractAccount}:`, error)
    return undefined
  }
}

async function queryNativeTokenActions(): Promise<ContractTokenBoidActionResponse[] | undefined> {
  const contractAccount = 'token.boid'
  try {
    const response = await hyperion.v2.history.get_actions(contractAccount, {
      filter: `${contractAccount}:*`, // Adjust filter: you can specify action name if needed (e.g., `${contractAccount}:transfer`)
      skip: 0,
      limit: 333,
      after: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    })
    const dataResponse: ContractTokenBoidActionResponse[] = response.actions

      .map(
        (action: {
          timestamp: { toString: () => string }
          trx_id: { toString: () => string }
          act: {
            account: { toString: () => string }
            name: { toString: () => string }
            data: { [key: string]: unknown }
          }
        }) => ({
          timestamp: action.timestamp.toString(),
          trx_id: action.trx_id.toString(),
          act: {
            account: action.act.account.toString(),
            name: action.act.name.toString() as keyof TokenBoidNameParams,
          },
          data: action.act.data,
        }),
      )
      .filter((action: { data: { from: string } }) => {
        const allowedSenders = new Set(['xsend.boid', 'evm.boid'])
        return allowedSenders.has(action.data?.from)
      })
    console.log(`Actions for ${contractAccount}:`, dataResponse)
    return dataResponse
  } catch (error) {
    console.error(`Error querying actions for ${contractAccount}:`, error)
    return undefined
  }
}

// function to query all actions from all contracts
export async function queryAllActions(): Promise<ActionResponse[] | undefined> {
  const contractActionsEVMboid = await queryEvmBoidActions('evm.boid')
  const contractActionsXsendboid = await queryXsendBoidActions('xsend.boid')
  const tokenActions = await queryNativeTokenActions()
  if (!contractActionsEVMboid && !contractActionsXsendboid && !tokenActions) return undefined
  return [
    ...(contractActionsEVMboid || []),
    ...(contractActionsXsendboid || []),
    ...(tokenActions || []),
  ] as ActionResponse[]
}
