export interface BridgeTransactionEvent {
  receiver: string;
  token: string;
  amount: string;
  status: string;
  timestamp: string;
  sender: string;
  fromTokenContract: string;
  fromTokenSymbol: string;
  reason: string;
  transactionHash: string;
}

export interface ValidationStatusEvent {
  message: string;
  token: string;
  receiver: string;
  amount: string;
  sender: string;
  fromTokenContract: string;
  fromTokenSymbol: string;
  timestamp: string;
  transactionHash: string;
}

export interface RequestStatusCallbackEvent {
  id: number;
  sender: string;
  antelopeTokenContract: string;
  antelopeSymbol: string;
  amount: string;
  receiver: string;
  status: RequestStatus;
  timestamp: string;
  reason: string;
  transactionHash: string;
}

export interface BridgeRequestEvent {
  id: number;
  sender: string;
  token: string;
  antelopeTokenContract: string;
  antelopeSymbol: string;
  amount: string;
  receiver: string;
  timestamp: string;
  memo: string;
  status: string;
  reason: string;
  transactionHash: string;
}

export enum RequestStatus {
  Pending = "Pending",
  Completed = "Completed",
  Failed = "Failed",
  Refunded = "Refunded"
}

export interface RequestRemovalSuccessEvent {
  id: number;
  sender: string;
  timestamp: string;
  message: string;
  transactionHash: string;
}

export interface FailedRequestClearedEvent {
  id: number;
  sender: string;
  timestamp: string;
  transactionHash: string;
}

export type Event =
  | (BridgeTransactionEvent & { eventType: 'BridgeTransaction' })
  | (ValidationStatusEvent & { eventType: 'ValidationStatus' })
  | (RequestStatusCallbackEvent & { eventType: 'RequestStatusCallback' })
  | (BridgeRequestEvent & { eventType: 'BridgeRequest' })
  | (RequestRemovalSuccessEvent & { eventType: 'RequestRemovalSuccess' })
  | (FailedRequestClearedEvent & { eventType: 'FailedRequestCleared' });
