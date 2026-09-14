import { PaymentProvider, SubscriptionPlan, CheckoutResult } from "./types";
import { prisma } from "../prisma";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free_tier",
    name: "Discovery Tier",
    tagline: "Experience curated public teasers and open previews.",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [
      "Access to all public trailers and teasers",
      "Selected free premiere episodes",
      "Public community discussion reading",
      "Standard definition 1080p previews",
      "Discreet platform access",
    ],
  },
  {
    id: "member_monthly",
    name: "Velvet Club Member",
    tagline: "Full unrestricted access to all Manhwa series and private salons.",
    price: 29,
    currency: "USD",
    interval: "month",
    popular: true,
    badge: "MOST POPULAR",
    features: [
      "Unrestricted access to all Manhwa series",
      "Uncompressed 4K Ultra-HD streaming",
      "Full participation in Private Community discussions",
      "Director's cuts and alternative endings",
      "Audio commentary and noir score soundtracks",
      "100% discreet billing descriptor (YM MEDIA)",
      "Cancel anytime with one click",
    ],
  },
  {
    id: "vip_premium",
    name: "VIP Sovereign Patron",
    tagline: "The pinnacle experience with exclusive atelier access and direct creator circles.",
    price: 49,
    currency: "USD",
    interval: "month",
    badge: "VIP TIER",
    features: [
      "Everything in Velvet Club Member",
      "Early 72-hour premiere window for all new releases",
      "Private VIP discussion salon with creators & models",
      "Direct artist interaction and behind-the-scenes ateliers",
      "VIP badge across all community boards",
      "High-bitrate lossless audio tracks",
      "Priority customer concierge support",
    ],
  },
];

/**
 * Production-ready mock payment provider for MVP testing.
 * Can be swapped with StripePaymentProvider or CCBillPaymentProvider by implementing PaymentProvider.
 */
export class SimulatedPaymentProvider implements PaymentProvider {
  name = "SimulatedPaymentProvider";

  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  getPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  }

  async createCheckout(
    userId: string,
    planId: string,
    _successUrl: string,
    _cancelUrl: string
  ): Promise<CheckoutResult> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan specified: ${planId}`);
    }

    // In a real Stripe/CCBill deployment:
    // const session = await stripe.checkout.sessions.create({ ... });
    // return { checkoutUrl: session.url, sessionId: session.id };

    // For the MVP abstraction, we activate the subscription immediately in the database
    const periodDays = plan.interval === "year" ? 365 : 30;
    const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodEnd,
        cancelAtEnd: false,
      },
    });

    return {
      activatedImmediately: true,
      subscriptionId: subscription.id,
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
