import { TransactResult } from '@wharfkit/session'
import { APIClient, Action, Name, Asset } from '@wharfkit/antelope'
import { Account } from '@wharfkit/account'
import { ContractKit } from '@wharfkit/contract'
import { useSessionStore } from 'src/stores/sessionStore'
import { EventEmitter } from 'events'
import { configuration } from './config'
import {
  abi as eosioTokenABI,
  ActionNameParams as EosioTokenActionNameParams,
  ActionNames as EosioTokenActionNames,
} from './types/eosio.token'
import {
  abi as evmBoidABI,
  ActionNames as EvmBoidActionNames,
  RowType as EvmBoidRowType,
  ActionNameParams as EvmBoidActionNameParams,
  TableNames as EvmBoidTableNames,
} from './types/evm.boid'
import {
  ActionNames as BoidTokenActionNames,
  abi as tokenBoidABI,
  ActionNameParams as BoidTokenActionNameParams,
  Contract as BoidTokenContract,
} from './types/token.boid'
import {
  abi as xsendBoidABI,
  ActionNames as XSendActionNames,
  ActionNameParams as XSendActionNameParams,
  RowType as XSendRowType,
  TableNames as XSendTableNames,
} from './types/xsend.boid'
import { abi as boidABI, RowType as BoidRowType, TableNames as BoidTableNames } from './types/boid'
import { abi as eosioEvmABI } from './types/eosio.evm'
import { getWorkingUrl } from 'src/lib/helperFunctions'

const sessionStore = useSessionStore()
export const notifyEvent = new EventEmitter()

async function getAPIClient(): Promise<APIClient> {
  const url = await getWorkingUrl(configuration.mainnet.native.apis.map((api) => api.url))
  // const url = await getWorkingUrl(configuration.testnet.native.apis.map(api => api.url)),
  if (!url) {
    throw new Error(`Invalid url: ${url}.`)
  }

  return new APIClient({ url })
}

async function createContractKit(): Promise<ContractKit> {
  const client = await getAPIClient()

  const kit = new ContractKit(
    { client },
    {
      abis: [
        { name: 'eosio.token', abi: eosioTokenABI },
        { name: 'evm.boid', abi: evmBoidABI },
        { name: 'token.boid', abi: tokenBoidABI },
        { name: 'xsend.boid', abi: xsendBoidABI },
        { name: 'eosio.evm', abi: eosioEvmABI },
        { name: 'boid', abi: boidABI },
      ],
    },
  )

  return kit
}

export async function loadAccount(accountName: string): Promise<Asset> {
  const client = await getAPIClient()
  const accountData = await client.v1.chain.get_account(Name.from(accountName))
  const accountArgs = {
    data: accountData,
    client,
  }
  const account = new Account(accountArgs)
  const accBalance = await account.balance()
  return accBalance
}

// ACTIONS
export async function createBoidTokenAction<A extends BoidTokenActionNames>(
  actionName: A,
  dataObject: BoidTokenActionNameParams[A],
): Promise<TransactResult | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[1]?.contract.toString() || ''
    const session = sessionStore.session
    const kit = await createContractKit()

    if (!session) throw new Error('Session not loaded')

    const contract = await kit.load(contractName)
    const action = {
      account: contractName,
      name: actionName,
      authorization: [
        {
          actor: String(session.actor),
          permission: String(session.permission),
        },
      ],
      data: dataObject,
    }
    const actionData = Action.from(action, contract.abi)
    console.log('Transacting action...')
    const result = await session.transact({ action: actionData })
    console.log('Transaction result:', result)
    notifyEvent.emit('TrxResult', result)
    return result
  } catch (error) {
    console.error('Error in createAction:', error)
    throw error
  }
}

export async function createEosioTokenAction<A extends EosioTokenActionNames>(
  actionName: A,
  dataObject: EosioTokenActionNameParams[A],
): Promise<TransactResult | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[4]?.contract.toString() || ''
    const session = sessionStore.session
    const kit = await createContractKit()

    if (!session) throw new Error('Session not loaded')

    const contract = await kit.load(contractName)
    const action = {
      account: contractName,
      name: actionName,
      authorization: [
        {
          actor: String(session.actor),
          permission: String(session.permission),
        },
      ],
      data: dataObject,
    }
    const actionData = Action.from(action, contract.abi)
    console.log('Transacting action...')
    const result = await session.transact({ action: actionData })
    console.log('Transaction result:', result)
    notifyEvent.emit('TrxResult', result)
    return result
  } catch (error) {
    console.error('Error in createEosioTokenAction:', error)
    throw error
  }
}

export async function createXsendAction<A extends XSendActionNames>(
  actionName: A,
  dataObject: XSendActionNameParams[A],
): Promise<TransactResult | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[2]?.contract.toString() || ''
    const session = sessionStore.session
    const kit = await createContractKit()

    if (!session) throw new Error('Session not loaded')

    const contract = await kit.load(contractName)
    const action = {
      account: contractName,
      name: actionName,
      authorization: [
        {
          actor: String(session.actor),
          permission: String(session.permission),
        },
      ],
      data: dataObject,
    }
    const actionData = Action.from(action, contract.abi)
    console.log('Transacting action...')
    const result = await session.transact({ action: actionData })
    console.log('Transaction result:', result)
    notifyEvent.emit('TrxResult', result)
    return result
  } catch (error) {
    console.error('Error in createXsendAction:', error)
    throw error
  }
}

export async function createEvmBoidAction<A extends EvmBoidActionNames>(
  actionName: A,
  dataObject: EvmBoidActionNameParams[A],
): Promise<TransactResult | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[0]?.contract.toString() || ''
    const session = sessionStore.session
    const kit = await createContractKit()

    if (!session) throw new Error('Session not loaded')

    const contract = await kit.load(contractName)
    const action = {
      account: contractName,
      name: actionName,
      authorization: [
        {
          actor: String(session.actor),
          permission: String(session.permission),
        },
      ],
      data: dataObject,
    }
    const actionData = Action.from(action, contract.abi)
    console.log('Transacting action...')
    const result = await session.transact({ action: actionData })
    console.log('Transaction result:', result)
    notifyEvent.emit('TrxResult', result)
    return result
  } catch (error) {
    console.error('Error in createEvmBoidAction:', error)
    throw error
  }
}

export async function createEosioAndBoidTokenActions<
  AEos extends EosioTokenActionNames,
  ABoid extends BoidTokenActionNames,
>(
  eosioActionName: AEos,
  eosioDataObject: EosioTokenActionNameParams[AEos],
  boidActionName: ABoid,
  boidDataObject: BoidTokenActionNameParams[ABoid],
): Promise<TransactResult | undefined> {
  try {
    const eosioContractName = configuration.mainnet.native.contracts[4]?.contract.toString() || ''
    const boidContractName = configuration.mainnet.native.contracts[1]?.contract.toString() || ''
    const session = sessionStore.session
    const kit = await createContractKit()

    if (!session) throw new Error('Session not loaded')

    // Load Eosio Token Contract
    const eosioContract = await kit.load(eosioContractName)
    const eosioAction = {
      account: eosioContractName,
      name: eosioActionName,
      authorization: [
        {
          actor: String(session.actor),
          permission: String(session.permission),
        },
      ],
      data: eosioDataObject,
    }
    const eosioActionData = Action.from(eosioAction, eosioContract.abi)

    // Load Boid Token Contract
    const boidContract = await kit.load(boidContractName)
    const boidAction = {
      account: boidContractName,
      name: boidActionName,
      authorization: [
        {
          actor: String(session.actor),
          permission: String(session.permission),
        },
      ],
      data: boidDataObject,
    }
    const boidActionData = Action.from(boidAction, boidContract.abi)

    // Execute transaction with both actions
    console.log('Transacting multiple actions...')
    const result = await session.transact({ actions: [eosioActionData, boidActionData] })
    console.log('Transaction result:', result)
    notifyEvent.emit('TrxResult', result)
    return result
  } catch (error) {
    console.error('Error in createEosioAndBoidTokenActions:', error)
    throw error
  }
}

// TABLE QUERIES
export async function fetchDataFromXsendTable<T extends XSendTableNames>(
  tableName: T,
): Promise<XSendRowType<T>[] | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[2]?.contract.toString() || ''
    const kit = await createContractKit()
    const contract = await kit.load(contractName)
    const tableData: XSendRowType<T>[] = await contract.table(tableName).query().all()
    console.log(`Data fetched from ${tableName}:`, tableData)
    return tableData
  } catch (error: unknown) {
    console.error(`Error fetching data from ${tableName}:`, error)
    throw error
  }
}

export async function fetchDataFromBoidTable<T extends BoidTableNames>(
  tableName: T,
): Promise<BoidRowType<T>[] | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[5]?.contract.toString() || ''
    const kit = await createContractKit()
    const contract = await kit.load(contractName)
    const tableData: BoidRowType<T>[] = await contract.table(tableName).query().all()
    console.log(`Data fetched from ${tableName}:`, tableData)
    return tableData
  } catch (error: unknown) {
    console.error(`Error fetching data from ${tableName}:`, error)
    throw error
  }
}

export async function fetchDataFromEvmBoidTable<T extends EvmBoidTableNames>(
  tableName: T,
): Promise<EvmBoidRowType<T>[] | undefined> {
  try {
    const contractName = configuration.mainnet.native.contracts[0]?.contract.toString() || ''
    const kit = await createContractKit()
    const contract = await kit.load(contractName)
    const tableData: EvmBoidRowType<T>[] = await contract.table(tableName).query().all()
    console.log(`Data fetched from ${tableName}:`, tableData)
    return tableData
  } catch (error: unknown) {
    console.error(`Error fetching data from ${tableName}:`, error)
    throw error
  }
}

export async function fetchDataFromTokenBoidTable(actor:string): Promise<number> {
  const tableName = "accounts"
  try {
    const contractName = configuration.mainnet.native.contracts[1]?.contract.toString() || '' // Assuming index 1 for token.boid based on previous segments
    const kit = await createContractKit()
    const contract:BoidTokenContract = await kit.load(contractName)
    const tableData = await contract.table("accounts").all({scope: Name.from(actor), maxRows: 1})
    const balance = tableData[0]?.balance.toString() || '0'
    const numericalValue = parseFloat(balance);
    return numericalValue
  } catch (error: unknown) {
    console.error(`Error fetching data from ${tableName}:`, error)
    throw error
  }
}
