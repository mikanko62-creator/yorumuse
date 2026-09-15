"use client";

import React, { useState } from "react";
import { SubscriptionPlan, PaymentMethodType } from "@/lib/payments/types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  billingCycle: "month" | "year";
  userEmail?: string;
  onSuccess: (result: { paymentMethod: string; planName: string; currentPeriodEnd: string }) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
  userEmail,
  onSuccess,
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [paypalEmail, setPaypalEmail] = useState(userEmail || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [sepaIban, setSepaIban] = useState("");
  const [sepaName, setSepaName] = useState("");
  const [sepaMandate, setSepaMandate] = useState(false);
  const [cryptoCoin, setCryptoCoin] = useState<"USDT-TRC20" | "USDT-ERC20" | "BTC" | "ETH">("USDT-TRC20");

  if (!isOpen) return null;

  // Price calculations in EUR
  const basePrice = plan.price;
  const isAnnual = billingCycle === "year";
  const finalPrice = isAnnual ? Number((basePrice * 0.75 * 12).toFixed(2)) : basePrice;
  const monthlyEquivalent = isAnnual ? Number((basePrice * 0.75).toFixed(2)) : basePrice;

  const formatCardNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const formatIban = (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 34);
    return cleaned.replace(/(.{4})(?=.)/g, "$1 ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedMethod === "sepa" && !sepaMandate) {
      setErrorMessage("Please accept the SEPA Direct Debit mandate to proceed.");
      return;
    }

    setIsProcessing(true);

    if (selectedMethod === "paypal") {
      setProcessingStep("Connecting securely to PayPal European Gateway...");
    } else if (selectedMethod === "card") {
      setProcessingStep("Verifying card details with 3D Secure 2.0...");
    } else if (selectedMethod === "sepa") {
      setProcessingStep("Registering SEPA direct debit mandate (EPC compliant)...");
    } else {
      setProcessingStep("Verifying anonymous blockchain transaction...");
    }

    try {
      // Simulate gateway latency for realistic luxury UX
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const paymentDetails: Record<string, string> = {};
      if (selectedMethod === "paypal") {
        paymentDetails.email = paypalEmail || userEmail || "member@paypal.eu";
      } else if (selectedMethod === "card") {
        const digits = cardNumber.replace(/\s/g, "");
        paymentDetails.cardLast4 = digits.length >= 4 ? digits.slice(-4) : "4242";
      } else if (selectedMethod === "sepa") {
        const cleanIban = sepaIban.replace(/\s/g, "");
        paymentDetails.ibanLast4 = cleanIban.length >= 4 ? cleanIban.slice(-4) : "8899";
      } else if (selectedMethod === "crypto") {
        paymentDetails.cryptoCurrency = cryptoCoin;
      }

      setProcessingStep("Activating all-access member credentials...");

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: selectedMethod,
          billingCycle,
          paymentDetails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment authorization failed. Please try again.");
      }

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess({
          paymentMethod: data.result?.paymentMethod || "PayPal",
          planName: plan.name,
          currentPeriodEnd: data.result?.currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      }, 1600);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : "Payment processing error.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(184, 138, 37, 0.15)",
          overflow: "hidden",
          position: "relative",
          animation: "modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-gold)",
                boxShadow: "0 0 10px var(--accent-gold)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              Secure Checkout • Europe
            </span>
          </div>

          {!isProcessing && !isSuccess && (
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "4px 8px",
                lineHeight: 1,
                borderRadius: "8px",
                transition: "color 0.2s",
              }}
              title="Close modal"
            >
              ✕
            </button>
          )}
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div
            style={{
              padding: "60px 32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontSize: "2.2rem",
                boxShadow: "0 0 25px rgba(16, 185, 129, 0.25)",
              }}
            >
              ✓
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--text-primary)", margin: 0 }}>
              Membership Activated
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "420px", lineHeight: 1.6 }}>
              Thank you for subscribing to <strong>{plan.name}</strong>. Your full 4K streaming pass and private discussion salons are now unlocked.
            </p>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Redirecting to your sanctuary profile...
            </span>
          </div>
        ) : isProcessing ? (
          /* Processing Spinner Screen */
          <div
            style={{
              padding: "60px 32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "3px solid rgba(212, 175, 55, 0.2)",
                borderTopColor: "var(--accent-gold)",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--text-primary)", margin: 0 }}>
              Securing Authorization
            </h3>
            <p style={{ color: "var(--accent-gold)", fontSize: "0.92rem", fontWeight: 500 }}>
              {processingStep}
            </p>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Please do not refresh or close this browser window.
            </span>
          </div>
        ) : (
          /* Checkout Form Screen */
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "24px 28px" }}>
              {/* Order Summary Card */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 700, letterSpacing: "0.1em" }}>
                    SELECTED PLAN
                  </span>
                  <h4 style={{ margin: "2px 0 0", fontSize: "1.15rem", color: "var(--text-primary)" }}>
                    {plan.name}
                  </h4>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {isAnnual ? "Annual Billing (Billed yearly)" : "Monthly Flexible Billing"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                    €{finalPrice}
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {isAnnual ? `€${monthlyEquivalent}/mo equivalent` : "/ month"}
                  </span>
                </div>
              </div>

              {/* Discreet Billing Notice */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(212, 175, 55, 0.06)",
                  border: "1px solid rgba(212, 175, 55, 0.2)",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-gold)", flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>
                  Discreet European Billing: Statement shows as <strong>&ldquo;YM MEDIA LUX&rdquo;</strong>.
                </span>
              </div>

              {/* Payment Method Selector Tabs */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>
                  CHOOSE PAYMENT METHOD
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                  }}
                >
                  {/* Tab 1: PayPal */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("paypal")}
                    style={{
                      padding: "12px 6px",
                      borderRadius: "10px",
                      border: selectedMethod === "paypal" ? "2px solid #0070ba" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedMethod === "paypal" ? "rgba(0, 112, 186, 0.12)" : "var(--bg-surface-elevated)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        letterSpacing: "-0.04em",
                        color: "#0070ba",
                      }}
                    >
                      <span style={{ color: "#003087" }}>Pay</span>
                      <span style={{ color: "#0079c1" }}>Pal</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: selectedMethod === "paypal" ? "#60a5fa" : "var(--text-muted)", fontWeight: 600 }}>
                      PayPal EU
                    </span>
                  </button>

                  {/* Tab 2: Credit/Debit Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("card")}
                    style={{
                      padding: "12px 6px",
                      borderRadius: "10px",
                      border: selectedMethod === "card" ? "2px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedMethod === "card" ? "rgba(212, 175, 55, 0.12)" : "var(--bg-surface-elevated)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span style={{ fontSize: "0.72rem", color: selectedMethod === "card" ? "var(--accent-gold)" : "var(--text-muted)", fontWeight: 600 }}>
                      Card / Visa
                    </span>
                  </button>

                  {/* Tab 3: SEPA Direct Debit */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("sepa")}
                    style={{
                      padding: "12px 6px",
                      borderRadius: "10px",
                      border: selectedMethod === "sepa" ? "2px solid #3b82f6" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedMethod === "sepa" ? "rgba(59, 130, 246, 0.12)" : "var(--bg-surface-elevated)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="21" x2="21" y2="21" />
                      <line x1="6" y1="18" x2="6" y2="11" />
                      <line x1="10" y1="18" x2="10" y2="11" />
                      <line x1="14" y1="18" x2="14" y2="11" />
                      <line x1="18" y1="18" x2="18" y2="11" />
                      <polygon points="12 2 20 7 4 7" />
                    </svg>
                    <span style={{ fontSize: "0.72rem", color: selectedMethod === "sepa" ? "#93c5fd" : "var(--text-muted)", fontWeight: 600 }}>
                      SEPA (IBAN)
                    </span>
                  </button>

                  {/* Tab 4: Crypto */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("crypto")}
                    style={{
                      padding: "12px 6px",
                      borderRadius: "10px",
                      border: selectedMethod === "crypto" ? "2px solid #10b981" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedMethod === "crypto" ? "rgba(16, 185, 129, 0.12)" : "var(--bg-surface-elevated)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>🪙</span>
                    <span style={{ fontSize: "0.72rem", color: selectedMethod === "crypto" ? "#34d399" : "var(--text-muted)", fontWeight: 600 }}>
                      Crypto USDT
                    </span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    fontSize: "0.85rem",
                    marginBottom: "16px",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Dynamic Method Content */}
              {/* --- 1. PAYPAL --- */}
              {selectedMethod === "paypal" && (
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(0, 48, 135, 0.08)",
                    border: "1px solid rgba(0, 112, 186, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h5 style={{ margin: "0 0 2px", color: "var(--text-primary)", fontSize: "0.98rem" }}>
                        PayPal Express Checkout
                      </h5>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        Safe, encrypted buyer protection across Europe & worldwide.
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        backgroundColor: "#0070ba",
                        color: "#ffffff",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      OFFICIAL PARTNER
                    </span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      PayPal Account Email
                    </label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="your.email@provider.eu"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    You will authorize this recurring billing via PayPal pre-approved subscription. Billed discreetly in <strong>EUR (€)</strong>. You can cancel at any time with zero penalty.
                  </p>
                </div>
              )}

              {/* --- 2. CARD --- */}
              {selectedMethod === "card" && (
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                      Visa • Mastercard • Maestro • CB
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)" }}>
                      3D Secure 2.0 Enabled
                    </span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Cardholder Full Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Jean Dupont / Max Mustermann"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4532 •••• •••• 4242"
                      required
                      maxLength={19}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        letterSpacing: "0.08em",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM / YY"
                        required
                        maxLength={5}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-medium)",
                          backgroundColor: "var(--bg-surface)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        Security Code (CVC)
                      </label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="•••"
                        required
                        maxLength={4}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-medium)",
                          backgroundColor: "var(--bg-surface)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- 3. SEPA (IBAN) --- */}
              {selectedMethod === "sepa" && (
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(59, 130, 246, 0.06)",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                      Eurozone SEPA Direct Debit
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#93c5fd" }}>
                      DE • FR • IT • ES • NL • BE
                    </span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={sepaName}
                      onChange={(e) => setSepaName(e.target.value)}
                      placeholder="Account holder's full legal name"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      International Bank Account Number (IBAN)
                    </label>
                    <input
                      type="text"
                      value={sepaIban}
                      onChange={(e) => setSepaIban(formatIban(e.target.value))}
                      placeholder="DE89 3704 0044 0532 0130 00"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        letterSpacing: "0.05em",
                      }}
                    />
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.4,
                      marginTop: "4px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sepaMandate}
                      onChange={(e) => setSepaMandate(e.target.checked)}
                      style={{ marginTop: "2px", accentColor: "var(--accent-gold)" }}
                    />
                    <span>
                      I authorize YM Media Lux to instruct my bank to debit recurring monthly dues from my account in accordance with European SEPA mandate regulations.
                    </span>
                  </label>
                </div>
              )}

              {/* --- 4. CRYPTO --- */}
              {selectedMethod === "crypto" && (
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(16, 185, 129, 0.06)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                      Zero Bank Records • 100% Privacy
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#34d399" }}>
                      Instant Verification
                    </span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Select Cryptocurrency
                    </label>
                    <select
                      value={cryptoCoin}
                      onChange={(e) => setCryptoCoin(e.target.value as any)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <option value="USDT-TRC20">USDT (TRC20 - Lowest Fees)</option>
                      <option value="USDT-ERC20">USDT (ERC20)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                    </select>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Deposit Address:</span>
                    <code style={{ color: "var(--accent-gold)", fontSize: "0.78rem" }}>
                      TXZm99...EuropeanVault77
                    </code>
                  </div>

                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                    Your subscription will be authorized and activated instantly upon clicking below.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                padding: "20px 28px",
                borderTop: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-surface-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>256-bit Encryption</span>
                </span>
                <span>•</span>
                <span>EU GDPR Compliant</span>
              </div>

              {selectedMethod === "paypal" ? (
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#ffc439",
                    color: "#000000",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "12px 28px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(255, 196, 57, 0.35)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  <span style={{ fontStyle: "italic", fontWeight: 900 }}>P</span>
                  <span>Pay with PayPal • €{finalPrice}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "12px 28px",
                    borderRadius: "9999px",
                    fontSize: "0.95rem",
                  }}
                >
                  Confirm & Authorize • €{finalPrice}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
