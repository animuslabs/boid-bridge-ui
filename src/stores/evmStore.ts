import { defineStore } from 'pinia'
import { useConnect, useAccount, useDisconnect, useWriteContract } from '@wagmi/vue'
import { configuration } from 'src/lib/config'
import { abi as bridgeContractAbi } from 'src/lib/TelosEVMContracts/TokenBridge.json'
import { abi as tokenAbi } from 'src/lib/TelosEVMContracts/TokenContract.json'
import { BigNumberish, parseEther } from 'ethers'
import { ethers } from 'ethers'
import {
  bigNumberishToBigInt,
  bigNumberishToString,
  customBytes32ToString,
} from 'src/lib/helperFunctions'
import { ref } from 'vue'
import {
  BridgeTransactionEvent,
  ValidationStatusEvent,
  RequestStatusCallbackEvent,
  BridgeRequestEvent,
  RequestRemovalSuccessEvent,
  FailedRequestClearedEvent,
} from 'src/lib/types/evmEvents'

export interface BridgeRequest {
  id: number
  sender: string
  amount: string
  requested_at: Date
  antelope_token_contract: string
  antelope_symbol: string
  receiver: string
  evm_decimals: number
  status: string
  memo: string
}

export const useEvmStore = defineStore('evmStore', () => {
  const { connect, connectors } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()
  const tokenContractAddress = configuration.testnet.evm.contracts[1]?.contract as `0x${string}`
  const bridgeContractAddress = configuration.testnet.evm.contracts[0]?.contract as `0x${string}`
  const ethersUrl = configuration.testnet.evm.apis[0]?.url || ''
  const ethersProvider = new ethers.JsonRpcProvider(ethersUrl) // Replace with your RPC URL

  // Variable to store the block number for 30 days ago
  let blockNumberFor7DaysAgo: number | null = null

  // Function to calculate and store the block number for 30 days ago
  async function initBlockNumber7DaysAgo() {
    const currentBlockNumber = await ethersProvider.getBlockNumber()
    const averageBlockTimeInSeconds = 0.5
    const secondsInADay = 86400
    const blocksPerDay = secondsInADay / averageBlockTimeInSeconds
    const blocksAgo = Math.floor(7 * blocksPerDay)
    blockNumberFor7DaysAgo = currentBlockNumber - blocksAgo
  }

  async function getTokenAllowance(owner: `0x${string}`): Promise<bigint> {
    if (!tokenContractAddress?.startsWith('0x')) {
      console.error('Invalid contract address')
      return BigInt(0)
    }
    try {
      const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, ethersProvider)

      // Check if the allowance function exists
      if (typeof tokenContract.allowance !== 'function') {
        console.error('Allowance function is not available on the contract')
        return parseEther('0')
      }

      const allowance = (await tokenContract.allowance(
        owner,
        bridgeContractAddress,
      )) as BigNumberish
      return bigNumberishToBigInt(allowance)
    } catch (error) {
      console.error('Error fetching allowance:', error)
      return parseEther('0')
    }
  }

  // user approved token function
  function userApprovedToken(amount: BigNumberish) {
    if (!tokenContractAddress?.startsWith('0x')) return
    const tokenContract = writeContractAsync({
      abi: tokenAbi,
      address: tokenContractAddress,
      functionName: 'approve',
      args: [bridgeContractAddress, amount],
    })
    return tokenContract
  }

  // Bridge Token to Native function
  function bridgeToken(amount: BigNumberish, antelopeAddress: string, memo: string) {
    if (!bridgeContractAddress?.startsWith('0x')) return

    const bridgeContract = writeContractAsync({
      abi: bridgeContractAbi,
      address: bridgeContractAddress,
      functionName: 'bridge',
      args: [tokenContractAddress, amount, antelopeAddress, memo],
      value: parseEther('0.5'),
    })
    return bridgeContract
  }

  // Modified removeRequest function to return an object with trx result
  async function removeRequest(
    id: number,
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    if (!bridgeContractAddress?.startsWith('0x'))
      return { success: false, error: 'Invalid contract address' }
    try {
      const txHash = await writeContractAsync({
        abi: bridgeContractAbi,
        address: bridgeContractAddress,
        functionName: 'refundRequest',
        args: [id],
      })
      const txReceipt = await ethersProvider.waitForTransaction(txHash)
      if (!txReceipt) throw new Error('Transaction receipt not found')
      return { success: true, hash: txReceipt.hash }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return { success: false, error: errorMessage }
    }
  }

  function login(connectorIdx = 0) {
    const connector = connectors[connectorIdx]
    if (!connector) {
      console.error('No connector found')
      return
    }
    try {
      connect({ connector })
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  function logout() {
    disconnect()
  }

  async function queryActiveRequests(): Promise<BridgeRequest[]> {
    if (!bridgeContractAddress?.startsWith('0x')) return Promise.resolve([])

    // Get array length from slot 10
    const lengthHex = await ethersProvider.getStorage(bridgeContractAddress, 10)
    const length = Number(BigInt(lengthHex))

    // Get all elements from the array
    const activeIds: bigint[] = []
    const arrayBaseSlot = ethers.keccak256(new ethers.AbiCoder().encode(['uint256'], [10]))

    for (let i = 0; i < length; i++) {
      const slot = BigInt(arrayBaseSlot) + BigInt(i)
      const idHex = await ethersProvider.getStorage(bridgeContractAddress, '0x' + slot.toString(16))
      activeIds.push(BigInt(idHex))
    }

    // Fetch all requests in parallel
    const requests = await Promise.all(
      activeIds.map(async (requestId) => {
        try {
          const baseSlot = ethers.keccak256(
            new ethers.AbiCoder().encode(['uint256', 'uint256'], [requestId, 9]),
          )

          // Read all required slots
          const [sender, amount, requestedAt, tokenContract, symbol, receiver, packedData, memo] =
            await Promise.all([
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 1n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 2n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 3n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 4n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 5n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 6n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 7n).toString(16),
              ),
              ethersProvider.getStorage(
                bridgeContractAddress,
                '0x' + (BigInt(baseSlot) + 8n).toString(16),
              ),
            ])

          const packedValue = BigInt(packedData)
          const evmDecimals = Number(packedValue & 0xffn)
          const status = String((packedValue >> 8n) & 0xffn)

          return {
            id: Number(requestId),
            sender: '0x' + sender.slice(-40), // Extract address from bytes32
            amount: Number(ethers.formatUnits(BigInt(amount), evmDecimals)).toFixed(0),
            requested_at: new Date(Number(BigInt(requestedAt)) * 1000),
            antelope_token_contract: customBytes32ToString(tokenContract),
            antelope_symbol: customBytes32ToString(symbol),
            receiver: customBytes32ToString(receiver),
            evm_decimals: evmDecimals,
            status: status,
            memo: customBytes32ToString(memo),
          }
        } catch (error) {
          console.error(`Error processing request ${requestId}:`, error)
          return null
        }
      }),
    )

    return requests.filter((req) => req !== null) as BridgeRequest[]
  }

  async function getBOIDTokenBalance(account: `0x${string}`): Promise<bigint> {
    if (!tokenContractAddress?.startsWith('0x')) {
      console.error('Invalid token address')
      return Promise.resolve(BigInt(0))
    }
    try {
      const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, ethersProvider)
      // Check if the balanceOf function exists
      if (typeof tokenContract.balanceOf !== 'function') {
        console.error('BalanceOf function is not available on the contract')
        return parseEther('0')
      }
      return tokenContract
        .balanceOf(account)
        .then((balance: BigNumberish) => bigNumberishToBigInt(balance))
    } catch (error) {
      console.error('Error fetching token balance:', error)
      return Promise.resolve(BigInt(0))
    }
  }

  async function getTLOSNativeBalance(account: `0x${string}`): Promise<string> {
    try {
      const balance = await ethersProvider.getBalance(account)
      const balanceInEther = ethers.formatEther(balance)
      const formattedBalance = Number(balanceInEther).toFixed(8)
      console.log('balance in Ether', formattedBalance)
      return bigNumberishToString(formattedBalance)
    } catch (error) {
      console.error('Error fetching native TLOS balance:', error)
      return Promise.resolve('0')
    }
  }

  // Function to fetch BridgeTransaction events from the last 30 days
  async function fetchBridgeTransactionEvents() {
    const events = ref<BridgeTransactionEvent[]>([])
    if (blockNumberFor7DaysAgo === null) {
      console.error('Block number for 7 days ago is not initialized')
      return events
    }
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter(
        'BridgeTransaction',
        blockNumberFor7DaysAgo,
        'latest',
      )
      console.log('BridgeTransaction events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: Number(args.id),
          receiver: args.receiver,
          token: args.token,
          amount: Number(ethers.formatEther(args.amount)).toString(),
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
          sender: args.sender,
          fromTokenContract: args.from_token_contract,
          fromTokenSymbol: args.from_token_symbol,
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching BridgeTransaction events:', error)
    }
    return events
  }

  // Function to fetch ValidationStatus events
  async function fetchValidationStatusEvents() {
    const events = ref<ValidationStatusEvent[]>([])
    if (blockNumberFor7DaysAgo === null) {
      console.error('Block number for 7 days ago is not initialized')
      return events
    }
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter(
        'ValidationStatus',
        blockNumberFor7DaysAgo,
        'latest',
      )
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          message: args.message,
          token: args.token,
          receiver: args.receiver,
          amount: Number(ethers.formatEther(args.amount)).toString(),
          sender: args.sender,
          fromTokenContract: args.from_token_contract,
          fromTokenSymbol: args.from_token_symbol,
          timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching ValidationStatus events:', error)
    }
    return events
  }

  // Function to fetch RequestStatus events
  async function fetchRequestStatusEvents() {
    const events = ref<RequestStatusCallbackEvent[]>([])
    if (blockNumberFor7DaysAgo === null) {
      console.error('Block number for 7 days ago is not initialized')
      return events
    }
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter(
        'RequestStatusCallback',
        blockNumberFor7DaysAgo,
        'latest',
      )
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: Number(args.id),
          sender: args.sender,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: Number(ethers.formatEther(args.amount)).toString(),
          receiver: args.receiver,
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching RequestStatus events:', error)
    }
    return events
  }

  // Function to fetch BridgeRequest events
  async function fetchBridgeRequestEvents() {
    if (blockNumberFor7DaysAgo === null) {
      console.error('Block number for 7 days ago is not initialized')
      return ref<BridgeRequestEvent[]>([])
    }
    const events = ref<BridgeRequestEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter(
        'BridgeRequest',
        blockNumberFor7DaysAgo,
        'latest',
      )
      console.log('BridgeRequest events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: args.id,
          sender: args.sender,
          token: args.token,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: Number(ethers.formatEther(args.amount)).toString(),
          receiver: args.receiver,
          timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
          memo: args.memo,
          status: args.status,
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching BridgeRequest events:', error)
    }
    return events
  }

  async function fetchRequestRemovalSuccessEvents() {
    const events = ref<RequestRemovalSuccessEvent[]>([])
    if (blockNumberFor7DaysAgo === null) {
      console.error('Block number for 7 days ago is not initialized')
      return events
    }
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter(
        'RequestRemovalSuccess',
        blockNumberFor7DaysAgo,
        'latest',
      )
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: Number(args.id),
          sender: args.sender,
          timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
          message: args.message,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching RequestRemovalSuccess events:', error)
    }
    return events
  }

  async function fetchFailedRequestClearedEvents() {
    const events = ref<FailedRequestClearedEvent[]>([])
    if (blockNumberFor7DaysAgo === null) {
      console.error('Block number for 7 days ago is not initialized')
      return events
    }
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter(
        'FailedRequestCleared',
        blockNumberFor7DaysAgo,
        'latest',
      )
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: Number(args.id),
          sender: args.sender,
          timestamp: new Date(Number(args.timestamp) * 1000).toISOString(),
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching FailedRequestCleared events:', error)
    }
    return events
  }

  return {
    address,
    isConnected,
    connectors,
    login,
    logout,
    bridgeToken,
    userApprovedToken,
    getTokenAllowance,
    getBOIDTokenBalance,
    getTLOSNativeBalance,
    fetchBridgeTransactionEvents,
    fetchValidationStatusEvents,
    fetchRequestStatusEvents,
    fetchBridgeRequestEvents,
    fetchRequestRemovalSuccessEvents,
    fetchFailedRequestClearedEvents,
    initBlockNumber7DaysAgo,
    removeRequest,
    queryActiveRequests,
  }
})
