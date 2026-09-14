import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments/provider";

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
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required." }, { status: 400 });
    }

    const result = await paymentProvider.createCheckout(
      user.id,
      planId,
      "/profile?upgrade=success",
      "/membership"
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
