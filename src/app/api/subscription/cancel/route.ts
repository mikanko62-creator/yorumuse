import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments/provider";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required." }, { status: 400 });
    }

    await paymentProvider.cancelSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      message: "Subscription has been cancelled.",
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: "Unable to process subscription cancellation." },
      { status: 500 }
    );
  }
}
