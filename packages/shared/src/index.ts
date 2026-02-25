export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "sending"
  | "sent"
  | "completed"
  | "failed"
  | "cancel_requested"
  | "canceled";

export type CampaignEventType =
  | "sent"
  | "delivered"
  | "failed"
  | "shown"
  | "click";

export type PresenceClass = "active" | "warm" | "cold";

export interface JwtUser {
  userId: string;
  accountId: string;
  email: string;
}
