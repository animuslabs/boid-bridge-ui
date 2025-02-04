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
}

export interface RefundStatusEvent {
  id: number;
  sender: string;
  antelopeTokenContract: string;
  antelopeSymbol: string;
  amount: string;
  receiver: string;
  status: RequestStatus;
  timestamp: string;
  reason: string;
}

export interface RequestRetryStatusEvent {
  id: number;
  sender: string;
  antelopeTokenContract: string;
  antelopeSymbol: string;
  amount: string;
  receiver: string;
  attemptCount: number;
  status: RequestStatus;
  timestamp: string;
  reason: string;
}

export interface RefundRetryStatusEvent {
  id: number;
  sender: string;
  antelopeTokenContract: string;
  antelopeSymbol: string;
  amount: string;
  receiver: string;
  attemptCount: number;
  status: RequestStatus;
  timestamp: string;
  reason: string;
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
}

export enum RequestStatus {
  Pending = "Pending",
  Completed = "Completed",
  Failed = "Failed"
}

export type Event =
  | (BridgeTransactionEvent & { eventType: 'BridgeTransaction' })
  | (ValidationStatusEvent & { eventType: 'ValidationStatus' })
  | (RequestStatusCallbackEvent & { eventType: 'RequestStatusCallback' })
  | (RefundStatusEvent & { eventType: 'RefundStatus' })
  | (RequestRetryStatusEvent & { eventType: 'RequestRetryStatus' })
  | (RefundRetryStatusEvent & { eventType: 'RefundRetryStatus' })
  | (BridgeRequestEvent & { eventType: 'BridgeRequest' });
