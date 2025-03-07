type Api = {
  name: string
  url: string
}

type Contract = {
  name: string
  contract: string
}

type ChainConfigEVM = {
  apis: Api[]
  chain_id: string
  chainIdHEX: string
  contracts: Contract[]
  explorer: string
  historyAPI: string
}

type ChainConfigNative = {
  apis: Api[]
  chain_id: string
  contracts: Contract[]
  hyperion: string
  explorer: string
}

type NetworkConfig = {
  native: ChainConfigNative
  evm: ChainConfigEVM
}

type OtherConfig = {
  token_name: string
  token_symbol: string
  bridge_fee: number
  evm_token_name: string
  evm_token_symbol: string
  evm_token_decimals: number
}

export type Configuration = {
  mainnet: NetworkConfig
  testnet: NetworkConfig
  other: OtherConfig
}

const contracts = [
  { name: 'TokenBridge', contract: 'evm.boid' },
  { name: 'TokenContract', contract: 'token.boid' },
  { name: 'FeesContract', contract: 'xsend.boid' },
  { name: 'SystemEVMcontract', contract: 'eosio.evm' },
  { name: 'TLOStokenContract', contract: 'eosio.token' },
  { name: 'BoidContract', contract: 'boid' },
]

export const configuration: Configuration = {
  mainnet: {
    native: {
      apis: [
        { name: 'Boid_API', url: 'https://telos.api.boid.animus.is' },
        { name: 'EOS_Nation', url: 'https://telos.api.eosnation.io' },
        { name: 'EOS_Amsterdam', url: 'https://telos.eu.eosamsterdam.net' },
      ],
      chain_id: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
      contracts: contracts,
      hyperion: 'https://hyperion.telos.animus.is',
      explorer: 'https://explorer.telos.net',
    },
    evm: {
      apis: [{ name: 'Telos EVM', url: 'https://mainnet.telos.net/evm' }],
      chain_id: '40',
      chainIdHEX: '0x28', // 40 in hex
      contracts: [
        { name: 'TokenBridge', contract: '0x6032E5218e1fb6ec2803BA2D7af385fB15D14466' },
        { name: 'TokenContract', contract: '0xF07f8D13F57dF3572b284FB701cEF021C62a68Ab' },
      ],
      explorer: 'https://teloscan.io',
      historyAPI: 'https://api.teloscan.io',
    },
  },
  testnet: {
    native: {
      apis: [
        { name: 'Boid_API_Testnet', url: 'https://telos.testnet.boid.animus.is' },
        { name: 'EOS_Sphere', url: 'https://telos-testnet.eosphere.io' },
        { name: 'EOS_USA', url: 'https://test.telos.eosusa.io' },
      ],
      chain_id: '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
      contracts: contracts,
      hyperion: 'https://test.telos.eosusa.io',
      explorer: 'https://explorer-test.telos.net',
    },
    evm: {
      apis: [{ name: 'Telos EVM Testnet', url: 'https://testnet.telos.net/evm' }],
      chain_id: '41',
      chainIdHEX: '0x29', // 41 in hex
      contracts: [
        { name: 'TokenBridge', contract: '0xF50d9a830e24bDb0A2b3A4b58C6f746375f369b2' },
        { name: 'TokenContract', contract: '0xacE76e8611319C443f4DF90FaEEdc48286563D17' },
      ],
      explorer: 'https://testnet.teloscan.io',
      historyAPI: 'https://api.testnet.teloscan.io',
    },
  },
  other: {
    token_name: 'BOID',
    token_symbol: '4,BOID',
    bridge_fee: 0.5,
    evm_token_name: 'Telos',
    evm_token_symbol: 'TLOS',
    evm_token_decimals: 18,
  },
}
