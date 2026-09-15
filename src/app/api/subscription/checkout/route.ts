import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments/provider";
import { PaymentMethodType } from "@/lib/payments/types";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to upgrade or manage a subscription." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, paymentMethod, billingCycle, paymentDetails } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required." }, { status: 400 });
    }

    const validMethods: PaymentMethodType[] = ["paypal", "card", "sepa", "crypto"];
    const chosenMethod = validMethods.includes(paymentMethod) ? paymentMethod : "paypal";

    const result = await paymentProvider.createCheckout(
      user.id,
      planId,
      "/profile?upgrade=success",
      "/membership",
      {
        paymentMethod: chosenMethod,
        billingCycle: billingCycle === "year" ? "year" : "month",
        paymentDetails: paymentDetails || {},
      }
    );

    return NextResponse.json({
      success: true,
      result,
      message: "Subscription successfully activated.",
    });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { error: "Unable to process subscription checkout." },
      { status: 500 }
    );
  }
}

