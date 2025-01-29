type Api = {
  name: string;
  url: string;
};

type Contract = {
  name: string;
  contract: string;
};

type ChainConfig = {
  apis: Api[];
  chain_id: string;
  contracts: Contract[];
};

type NetworkConfig = {
  native: ChainConfig;
  evm: ChainConfig;
};

type OtherConfig = {
  token_name: string;
  token_symbol: string;
  bridge_fee: number;
}

export type Configuration = {
  mainnet: NetworkConfig;
  testnet: NetworkConfig;
  other: OtherConfig;
};

const contracts = [
  { name: "TokenBridge", contract: "evm.boid" },
  { name: "TokenContract", contract: "token.boid" },
  { name: "FeesContract", contract: "xsend.boid" },
  { name: "SystemEVMcontract", contract: "eosio.evm" },
  { name: "TLOStokenContract", contract: "eosio.token" },
  { name: "BoidContract", contract: "boid" }
]

export const configuration: Configuration = {
  mainnet: {
    native: {
      apis: [
        { name: "Boid_API", url: "https://telos.api.boid.animus.is" },
        { name: "EOS_Nation", url: "https://telos.api.eosnation.io" },
        { name: "EOS_Amsterdam", url: "https://telos.eu.eosamsterdam.net" },
      ],
      chain_id: "4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11",
      contracts: contracts
    },
    evm: {
      apis: [
        { name: "Telos_Offical_EVM", url: "https://mainnet.telos.net/evm" }
      ],
      chain_id: "40",
      contracts: [
        { name: "TokenBridge", contract: "0xxxxx" },
        { name: "TokenContract", contract: "0xxx" }
      ],
    },
  },
  testnet: {
    native: {
      apis: [
        { name: "Boid_API_Testnet", url: "https://telos.testnet.boid.animus.is" },
        { name: "EOS_Sphere", url: "https://telos-testnet.eosphere.io" },
        { name: "EOS_USA", url: "https://test.telos.eosusa.io" },
      ],
      chain_id: "1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f",
      contracts: contracts
    },
    evm: {
      apis: [
        { name: "Telos_Offical_EVM_Testnet", url: "https://testnet.telos.net/evm" }
      ],
      chain_id: "41",
      contracts: [
        { name: "TokenBridge", contract: "0xxxxx" },
        { name: "TokenContract", contract: "0xxx" }
      ],
    },
  },
  other: {
    token_name: "BOID",
    token_symbol: "4,BOID",
    bridge_fee: 0.5,
  }
};
