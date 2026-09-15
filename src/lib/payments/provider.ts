import { PaymentProvider, SubscriptionPlan, CheckoutResult, CheckoutOptions } from "./types";
import { prisma } from "../prisma";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free_tier",
    name: "Pengguna Biasa",
    tagline: "Akses gratis untuk menonton trailer dan preview publik.",
    price: 0,
    currency: "EUR",
    interval: "month",
    features: [
      "Nonton semua trailer dan preview publik",
      "Membaca forum diskusi komunitas",
      "Pendaftaran akun gratis tanpa biaya",
      "Akses platform standar",
    ],
  },
  {
    id: "member_monthly",
    name: "Pengguna Subscription",
    tagline: "Akses penuh tanpa batas ke seluruh video dan chapter serial manhwa.",
    price: 9.99,
    currency: "EUR",
    interval: "month",
    popular: true,
    badge: "SUBSCRIPTION",
    features: [
      "Akses tak terbatas ke seluruh episode & chapter penuh manhwa",
      "Bebas streaming semua video serial tanpa batasan",
      "Partisipasi penuh dalam forum & diskusi komunitas",
      "Dukungan pembayaran PayPal & Kartu Kredit Eropa",
      "Dapat dibatalkan kapan saja dengan 1 klik",
    ],
  },
];

/**
 * Multi-method payment provider supporting European payments:
 * PayPal, European Credit/Debit cards, SEPA Direct Debit (IBAN), and Crypto.
 */
export class SimulatedPaymentProvider implements PaymentProvider {
  name = "SimulatedPaymentProvider";

  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  getPlan(planId: string): SubscriptionPlan | undefined {
    if (planId === "vip_premium") {
      return SUBSCRIPTION_PLANS.find((p) => p.id === "member_monthly");
    }
    return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  }

  async createCheckout(
    userId: string,
    planId: string,
    _successUrl: string,
    _cancelUrl: string,
    options?: CheckoutOptions
  ): Promise<CheckoutResult> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan specified: ${planId}`);
    }

    const cycle = options?.billingCycle || plan.interval || "month";
    const periodDays = cycle === "year" ? 365 : 30;
    const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

    // Format human-readable payment method description
    const rawMethod = options?.paymentMethod || "paypal";
    let formattedMethod = "PayPal";

    if (rawMethod === "paypal") {
      const email = options?.paymentDetails?.email;
      formattedMethod = email ? `PayPal (${email})` : "PayPal";
    } else if (rawMethod === "card") {
      const last4 = options?.paymentDetails?.cardLast4 || "4242";
      formattedMethod = `Credit Card (•••• ${last4})`;
    } else if (rawMethod === "sepa") {
      const ibanLast4 = options?.paymentDetails?.ibanLast4 || "8899";
      formattedMethod = `SEPA Direct Debit (•••• ${ibanLast4})`;
    } else if (rawMethod === "crypto") {
      const coin = options?.paymentDetails?.cryptoCurrency || "USDT";
      formattedMethod = `Cryptocurrency (${coin})`;
    }

    // Check if user already has a subscription
    const existing = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    let subscription;
    if (existing) {
      subscription = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodEnd,
          cancelAtEnd: false,
          paymentMethod: formattedMethod,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodEnd,
          cancelAtEnd: false,
          paymentMethod: formattedMethod,
        },
      });
    }

    return {
      activatedImmediately: true,
      subscriptionId: subscription.id,
      paymentMethod: formattedMethod,
      planName: plan.name,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELLED",
        cancelAtEnd: true,
      },
    });
    return true;
  }
}

// Active provider instance (configured via environment variables in production)
export const paymentProvider: PaymentProvider = new SimulatedPaymentProvider();

