export type SubscriptionStatus =
  | "FREE"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "PAST_DUE";

export type PaymentMethodType = "paypal" | "card" | "sepa" | "crypto";

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
  paymentMethod?: string;
  planName?: string;
  currentPeriodEnd?: string;
}

export interface CheckoutOptions {
  paymentMethod?: PaymentMethodType;
  billingCycle?: "month" | "year";
  paymentDetails?: {
    email?: string;
    cardLast4?: string;
    ibanLast4?: string;
    cryptoCurrency?: string;
  };
}

export interface PaymentProvider {
  name: string;
  getPlans(): SubscriptionPlan[];
  getPlan(planId: string): SubscriptionPlan | undefined;
  createCheckout(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
    options?: CheckoutOptions
  ): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  handleWebhook?(rawBody: string, signature: string): Promise<{ event: string; userId?: string; status?: SubscriptionStatus }>;
}

