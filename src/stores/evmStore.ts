import { defineStore } from 'pinia'
import { useConnect, useAccount, useDisconnect, useWriteContract } from '@wagmi/vue'
import { configuration } from 'src/lib/config'
import { abi as bridgeContractAbi } from 'src/lib/TelosEVMContracts/TokenBridge.json'
import { abi as tokenAbi } from 'src/lib/TelosEVMContracts/TokenContract.json'
import { BigNumberish, parseEther } from 'ethers'
import { ethers } from 'ethers'
import { bigNumberishToBigInt, bigNumberishToString } from 'src/lib/helperFunctions'
import { ref } from 'vue'
import {
  BridgeTransactionEvent,
  ValidationStatusEvent,
  RequestStatusCallbackEvent,
  RequestRetryStatusEvent,
  RefundStatusEvent,
  RefundRetryStatusEvent,
  BridgeRequestEvent,
} from 'src/lib/types/evmEvents'

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
  let blockNumberFor30DaysAgo: number | null = null

  // Function to calculate and store the block number for 30 days ago
  async function initializeBlockNumberFor30DaysAgo() {
    const currentBlockNumber = await ethersProvider.getBlockNumber()
    const averageBlockTimeInSeconds = 13 // Adjust this based on the network's average block time
    const secondsInADay = 86400
    const blocksPerDay = secondsInADay / averageBlockTimeInSeconds
    const blocksAgo = Math.floor(30 * blocksPerDay)
    blockNumberFor30DaysAgo = currentBlockNumber - blocksAgo
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
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<BridgeTransactionEvent[]>([])
    }
    const events = ref<BridgeTransactionEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('BridgeTransaction', blockNumberFor30DaysAgo, 'latest')
      console.log('BridgeTransaction events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          receiver: args.receiver,
          token: args.token,
          amount: ethers.formatEther(args.amount),
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
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
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<ValidationStatusEvent[]>([])
    }
    const events = ref<ValidationStatusEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('ValidationStatus', blockNumberFor30DaysAgo, 'latest')
      console.log('ValidationStatus events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          message: args.message,
          token: args.token,
          receiver: args.receiver,
          amount: ethers.formatEther(args.amount),
          sender: args.sender,
          fromTokenContract: args.from_token_contract,
          fromTokenSymbol: args.from_token_symbol,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
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
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<RequestStatusCallbackEvent[]>([])
    }
    const events = ref<RequestStatusCallbackEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('RequestStatusCallback', blockNumberFor30DaysAgo, 'latest')
      console.log('RequestStatusCallback events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: args.id,
          sender: args.sender,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: ethers.formatEther(args.amount),
          receiver: args.receiver,
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching RequestStatusCallback events:', error)
    }
    return events
  }

  // Function to fetch RequestRetryStatus events
  async function fetchRequestRetryStatusEvents() {
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<RequestRetryStatusEvent[]>([])
    }
    const events = ref<RequestRetryStatusEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('RequestRetryStatus', blockNumberFor30DaysAgo, 'latest')
      console.log('RequestRetryStatus events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: args.id,
          sender: args.sender,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: ethers.formatEther(args.amount),
          receiver: args.receiver,
          attemptCount: args.attemptCount,
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching RequestRetryStatus events:', error)
    }
    return events
  }

  // Function to fetch RefundStatus events
  async function fetchRefundStatusEvents() {
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<RefundStatusEvent[]>([])
    }
    const events = ref<RefundStatusEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('RefundStatus', blockNumberFor30DaysAgo, 'latest')
      console.log('RefundStatus events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: args.id,
          sender: args.sender,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: ethers.formatEther(args.amount),
          receiver: args.receiver,
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching RefundStatus events:', error)
    }
    return events
  }

  // Function to fetch RefundRetryStatus events
  async function fetchRefundRetryStatusEvents() {
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<RefundRetryStatusEvent[]>([])
    }
    const events = ref<RefundRetryStatusEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('RefundRetryStatus', blockNumberFor30DaysAgo, 'latest')
      console.log('RefundRetryStatus events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: args.id,
          sender: args.sender,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: ethers.formatEther(args.amount),
          receiver: args.receiver,
          attemptCount: args.attemptCount,
          status: args.status,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
          reason: args.reason,
          transactionHash: event.transactionHash,
        }
      })
    } catch (error) {
      console.error('Error fetching RefundRetryStatus events:', error)
    }
    return events
  }

  // Function to fetch BridgeRequest events
  async function fetchBridgeRequestEvents() {
    if (blockNumberFor30DaysAgo === null) {
      console.error('Block number for 30 days ago is not initialized')
      return ref<BridgeRequestEvent[]>([])
    }
    const events = ref<BridgeRequestEvent[]>([])
    try {
      const bridgeContract = new ethers.Contract(
        bridgeContractAddress,
        bridgeContractAbi,
        ethersProvider,
      )
      const eventLogs = await bridgeContract.queryFilter('BridgeRequest', blockNumberFor30DaysAgo, 'latest')
      console.log('BridgeRequest events', eventLogs)
      events.value = eventLogs.map((event) => {
        const args = (event as ethers.EventLog).args
        return {
          id: args.id,
          sender: args.sender,
          token: args.token,
          antelopeTokenContract: args.antelope_token_contract,
          antelopeSymbol: args.antelope_symbol,
          amount: ethers.formatEther(args.amount),
          receiver: args.receiver,
          timestamp: new Date(Number(args.timestamp) * 1000).toLocaleString(),
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
    fetchRequestRetryStatusEvents,
    fetchRefundStatusEvents,
    fetchRefundRetryStatusEvents,
    fetchBridgeRequestEvents,
    initializeBlockNumberFor30DaysAgo
  }
})
