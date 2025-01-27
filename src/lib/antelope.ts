import { TransactResult} from "@wharfkit/session";
import { APIClient, Action } from '@wharfkit/antelope';
import { ContractKit } from "@wharfkit/contract"
import { useSessionStore } from "src/stores/sessionStore";
import { EventEmitter } from "events";
import { configuration } from './config';
import {
  abi as eosioTokenABI,
  ActionNameParams as EosioTokenActionNameParams,
  ActionNames as EosioTokenActionNames,
 } from "./types/eosio.token";
import { abi as evmBoidABI } from "./types/evm.boid";
import {
  TableNames as BoidTokenTableNames,
  RowType as BoidTokenRowType,
  ActionNames as BoidTokenActionNames,
  Contract as BoidTokenContract,
  abi as tokenBoidABI,
  ActionNameParams as BoidTokenActionNameParams,
} from "./types/token.boid";
import {
  abi as xsendBoidABI,
  ActionNames as XSendActionNames,
  ActionNameParams as XSendActionNameParams,
 } from "./types/xsend.boid";
import { abi as eosioEvmABI } from "./types/eosio.evm";
import { getWorkingUrl } from "src/lib/helperFunctions";

const sessionStore = useSessionStore()
export const notifyEvent = new EventEmitter()

async function getAPIClient(): Promise<APIClient> {
    // Configuration for mainnet and testnet
    const API_URLS = {
        mainnet: await getWorkingUrl(configuration.mainnet.native.apis.map(api => api.url)),
        testnet: await getWorkingUrl(configuration.testnet.native.apis.map(api => api.url)),
    };

    const url = API_URLS[sessionStore.chainUrl ? 'mainnet' : 'testnet'];
    if (!url) {
        throw new Error(`Invalid chain: ${url}.`);
    }

    return new APIClient({ url });
}

async function createContractKit(): Promise<ContractKit> {
    const client = await getAPIClient();

    const kit = new ContractKit(
        { client },
        {
            abis: [
                { name: 'eosio.token', abi: eosioTokenABI },
                { name: 'evm.boid', abi: evmBoidABI },
                { name: 'token.boid', abi: tokenBoidABI },
                { name: 'xsend.boid', abi: xsendBoidABI },
                { name: 'eosio.evm', abi: eosioEvmABI },
            ],
        }
    );

    return kit;
}


export async function createBoidTokenAction<A extends BoidTokenActionNames>(
    actionName: A,
    dataObject: BoidTokenActionNameParams[A]
): Promise<TransactResult | undefined> {
    try {
      const contractName = configuration.mainnet.native.contracts[1]?.contract.toString() || ''
        const session = sessionStore.session
        const kit = await createContractKit();

        if (!session) throw new Error("Session not loaded")

        const contract = await kit.load(contractName)
        const action = {
            account: contractName,
            name: actionName,
            authorization: [{
                actor: String(session.actor),
                permission: String(session.permission),
            }],
            data: dataObject
        };
        const actionData = Action.from(action, contract.abi);
        console.log("Transacting action...")
        const result = await session.transact({ action: actionData })
        console.log("Transaction result:", result)
        notifyEvent.emit("TrxResult", result)
        return result
    } catch (error) {
        console.error("Error in createAction:", error)
        throw error
    }
}

export async function createEosioTokenAction<A extends EosioTokenActionNames>(
    actionName: A,
    dataObject: EosioTokenActionNameParams[A]
): Promise<TransactResult | undefined> {
    try {
        const contractName = configuration.mainnet.native.contracts[4]?.contract.toString() || ''
        const session = sessionStore.session
        const kit = await createContractKit();

        if (!session) throw new Error("Session not loaded")

        const contract = await kit.load(contractName)
        const action = {
            account: contractName,
            name: actionName,
            authorization: [{
                actor: String(session.actor),
                permission: String(session.permission),
            }],
            data: dataObject
        };
        const actionData = Action.from(action, contract.abi);
        console.log("Transacting action...")
        const result = await session.transact({ action: actionData })
        console.log("Transaction result:", result)
        notifyEvent.emit("TrxResult", result)
        return result
    } catch (error) {
        console.error("Error in createEosioTokenAction:", error)
        throw error
    }
}

export async function createXsendAction<A extends XSendActionNames>(
    actionName: A,
    dataObject: XSendActionNameParams[A]
): Promise<TransactResult | undefined> {
    try {
        const contractName = configuration.mainnet.native.contracts[2]?.contract.toString() || ''
        const session = sessionStore.session
        const kit = await createContractKit();

        if (!session) throw new Error("Session not loaded")

        const contract = await kit.load(contractName)
        const action = {
            account: contractName,
            name: actionName,
            authorization: [{
                actor: String(session.actor),
                permission: String(session.permission),
            }],
            data: dataObject
        };
        const actionData = Action.from(action, contract.abi);
        console.log("Transacting action...")
        const result = await session.transact({ action: actionData })
        console.log("Transaction result:", result)
        notifyEvent.emit("TrxResult", result)
        return result
    } catch (error) {
        console.error("Error in createXsendAction:", error)
        throw error
    }
}


export async function fetchDataFromBoidTokenTable<T extends BoidTokenTableNames>(contract:BoidTokenContract, tableName:T):Promise<BoidTokenRowType<T>[] | undefined> {
  try {
    const tableData:BoidTokenRowType<T>[] = await contract.table(tableName).query().all()
    console.log(`Data fetched from ${tableName}:`, tableData)
    return tableData
  } catch (error:unknown) {
    console.error(`Error fetching data from ${tableName}:`, error)
    throw error
  }
}
