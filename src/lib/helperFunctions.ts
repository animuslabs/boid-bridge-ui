import { ethers, BigNumberish } from 'ethers'
import { Notify } from 'quasar'
import { EventEmitter } from 'events'
import { configuration } from './config'

export const notifyEvent = new EventEmitter()

// Function to check if an API URL is working by hitting /v1/chain/get_info
async function isUrlWorking(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/v1/chain/get_info`, { method: 'GET' })
    if (response.ok) {
      const data = await response.json()
      if (data && data.chain_id) {
        console.log(`API at ${url} is working with chain ID: ${data.chain_id}`)
        return true
      }
    }
    console.error(`API at ${url} responded but is invalid.`)
    return false
  } catch (error) {
    console.error(`URL check failed for ${url}:`, error)
    return false
  }
}

// Function to get a working API URL from a list
export async function getWorkingUrl(urls: string[]): Promise<string> {
  for (const url of urls) {
    const isWorking = await isUrlWorking(url)
    if (isWorking) {
      console.log(`Using working URL: ${url}`)
      return url
    }
  }
  throw new Error('No working URLs found.')
}

// Helper function to clean up the address by removing "0x" if present
export const cleanAddress = (address: string): string => {
  return address.startsWith('0x') ? address.slice(2) : address
}

// change BigNumber to string
export const bigNumberishToString = (bigNumberish: BigNumberish): string => {
  return bigNumberish.toString()
}

// change BigNumberish to BigInt
export const bigNumberishToBigInt = (bigNumberish: BigNumberish): bigint => {
  return BigInt(bigNumberish)
}

/**
 * Safely parse a bytes32 value (0x....32bytes) into a UTF-8 string.
 * If it's not zero-terminated or has unexpected data, parseBytes32String may throw,
 * so we catch and fallback to returning the raw hex or an empty string.
 */
export function parseBytes32ToString(bytes32Val: string): string {
  if (!bytes32Val || bytes32Val === ethers.ZeroHash) {
    return ''
  }
  try {
    // Convert bytes32 to a buffer and then to a string
    const buffer = Buffer.from(bytes32Val.replace(/^0x/, ''), 'hex')
    return buffer.toString('utf8').replace(/\0/g, '') // Remove null characters
  } catch {
    // Fallback: just return the raw hex if parsing fails
    return bytes32Val
  }
}

// Add a helper to decode left‐aligned bytes32 (as in Solidity)
export function customBytes32ToString(bytes32: string): string {
  const hex = bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16)
    if (code === 0) break // stop at the first null byte
    str += String.fromCharCode(code)
  }
  return str
}

export function showNotification(transactionId: string, isError = false, isEvm = false): void {
  const baseUrl = isEvm ? configuration.mainnet.evm.explorer : configuration.mainnet.native.explorer
  const transactionUrl = isEvm
    ? `${baseUrl}/tx/${transactionId}`
    : `${baseUrl}/transaction/${transactionId}`

  Notify.create({
    message: isError ? 'Transaction failed' : 'Transaction successful',
    color: isError ? 'negative' : 'positive',
    icon: isError ? 'mdi-alert-circle' : 'mdi-check-circle',
    position: 'bottom',
    timeout: 30000,
    actions: isError
      ? []
      : [
          {
            icon: 'link',
            label: 'View Transaction',
            handler: () => window.open(transactionUrl, '_blank'),
          },
        ],
  })
}

// Add type guards for raw data objects
export function hasDataProperty(x: unknown): x is { data: unknown } {
  return typeof x === 'object' && x !== null && 'data' in x
}

export function hasResultsProperty(x: unknown): x is { results: unknown } {
  return typeof x === 'object' && x !== null && 'results' in x
}

export function normalizeTelosTimestamp(ts: string): string {
  if (ts.startsWith('+') && ts.length >= 7) {
    // Remove the plus sign and take everything after the first 6 characters (which represent the Telos year)
    const rest = ts.slice(7) // slice starting from index 7, because index 0 is the '+'
    const currentYear = new Date().getFullYear().toString() // e.g. "2025"
    // Return current year + '-' + rest (make sure to insert a hyphen if necessary)
    return `${currentYear}-${rest}`
  }
  return ts
}
