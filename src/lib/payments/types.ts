export type SubscriptionStatus =
  | "FREE"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "PAST_DUE";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  badge?: string;
  popular?: boolean;
  features: string[];
}

export interface CheckoutResult {
  checkoutUrl?: string;
  sessionId?: string;
  activatedImmediately?: boolean;
  subscriptionId?: string;
}

export interface PaymentProvider {
  name: string;
  getPlans(): SubscriptionPlan[];
  getPlan(planId: string): SubscriptionPlan | undefined;
  createCheckout(userId: string, planId: string, successUrl: string, cancelUrl: string): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  handleWebhook?(rawBody: string, signature: string): Promise<{ event: string; userId?: string; status?: SubscriptionStatus }>;
}
