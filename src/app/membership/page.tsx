"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/payments/provider";

interface UserInfo {
  id: string;
  username: string;
  role: string;
  subscription?: {
    status: string;
    planId: string;
  } | null;
}

export default function MembershipPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setError(null);
    setMessage(null);

    if (planId === "free_tier") {
      if (!user) {
        router.push("/register");
      } else {
        router.push("/browse");
      }
      return;
    }

    if (!user) {
      router.push(`/login?redirect=/membership`);
      return;
    }

    setLoadingPlan(planId);

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initiate subscription.");
        setLoadingPlan(null);
        return;
      }

      setMessage("Membership successfully activated! Redirecting to your private profile...");
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1500);
    } catch {
      setError("An unexpected network error occurred.");
      setLoadingPlan(null);
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (!user?.subscription) return planId === "free_tier";
    return user.subscription.planId === planId && user.subscription.status === "ACTIVE";
  };

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      {/* Membership Hero Header */}
      <section
        style={{
          padding: "80px 0 50px",
          background: "radial-gradient(ellipse at 50% 20%, rgba(212, 175, 55, 0.15) 0%, var(--bg-base) 70%)",
          textAlign: "center",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ maxWidth: "800px" }}>
          <span className="section-subtitle">THE INNER SANCTUARY</span>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              fontFamily: "var(--font-serif)",
              color: "var(--text-primary)",
              marginBottom: "20px",
              lineHeight: 1.15,
            }}
          >
            Discreet. Uncensored. Cinematic.
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: "0 auto 36px",
            }}
          >
            Choose your patron tier to experience full-length 4K productions, director cuts, private community salons, and lossless audio.
          </p>

          {/* Billing Cycle Toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px",
              borderRadius: "9999px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setBillingCycle("month")}
              style={{
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: billingCycle === "month" ? "#ffffff" : "transparent",
                color: billingCycle === "month" ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: billingCycle === "month" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("year")}
              style={{
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: billingCycle === "year" ? "var(--accent-gold)" : "transparent",
                color: billingCycle === "year" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: billingCycle === "year" ? "0 2px 8px rgba(166,124,30,0.25)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: billingCycle === "year" ? "rgba(0, 0, 0, 0.25)" : "rgba(148, 108, 21, 0.12)",
                  color: billingCycle === "year" ? "#ffffff" : "var(--accent-gold)",
                  border: billingCycle === "year" ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid var(--accent-gold)",
                  fontWeight: 700,
                }}
              >
                SAVE 25%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {message && (
        <div className="container" style={{ marginTop: "24px" }}>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              boxShadow: "var(--shadow-sm)",
              color: "#065f46",
              textAlign: "center",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            {message}
          </div>
        </div>
      )}

      {error && (
        <div className="container" style={{ marginTop: "24px" }}>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              boxShadow: "var(--shadow-sm)",
              color: "#b91c1c",
              textAlign: "center",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <section className="section" style={{ paddingTop: "60px" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "32px",
              alignItems: "stretch",
            }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => {
              const current = isCurrentPlan(plan.id);
              const isPopular = plan.popular;
              const displayPrice =
                billingCycle === "year" && plan.price > 0
                  ? Math.round(plan.price * 0.75 * 12)
                  : plan.price;

              return (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "20px",
                    border: isPopular
                      ? "2px solid var(--accent-gold)"
                      : "1px solid var(--border-subtle)",
                    boxShadow: isPopular
                      ? "var(--shadow-lg), 0 0 28px rgba(166, 124, 30, 0.12)"
                      : "var(--shadow-md)",
                    padding: "40px 32px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    transform: isPopular ? "translateY(-8px)" : "none",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: isPopular ? "var(--accent-gold)" : "#7c3aed",
                        color: "#ffffff",
                        padding: "4px 14px",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "1.6rem",
                        color: "var(--text-primary)",
                        marginBottom: "6px",
                      }}
                    >
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", minHeight: "42px" }}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: "32px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "3.2rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          lineHeight: 1,
                        }}
                      >
                        ${displayPrice}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        /{billingCycle === "year" && plan.price > 0 ? "year" : "month"}
                      </span>
                    </div>
                    {billingCycle === "year" && plan.price > 0 && (
                      <span style={{ fontSize: "0.78rem", color: "var(--accent-gold)", marginTop: "4px", display: "block" }}>
                        Billed annually (effectively ${Math.round(plan.price * 0.75)}/mo)
                      </span>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={current || loadingPlan === plan.id}
                    className={`btn ${isPopular ? "btn-primary" : "btn-secondary"} btn-lg`}
                    style={{
                      width: "100%",
                      marginBottom: "36px",
                      cursor: current ? "default" : "pointer",
                      opacity: current ? 0.6 : 1,
                    }}
                    id={`plan-btn-${plan.id}`}
                  >
                    {current
                      ? "Current Plan"
                      : loadingPlan === plan.id
                      ? "Activating..."
                      : plan.price === 0
                      ? "Browse Discovery"
                      : "Unlock Access"}
                  </button>

                  {/* Features List */}
                  <div style={{ marginTop: "auto" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginBottom: "16px",
                      }}
                    >
                      WHAT IS INCLUDED:
                    </span>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px" }}>
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: "0.88rem",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Discreet Billing Notice */}
      <section style={{ padding: "40px 0" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div
            style={{
              padding: "24px 32px",
              borderRadius: "16px",
              backgroundColor: "var(--bg-surface)",
              border: "1px dashed var(--border-medium)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            
            <div style={{ flexGrow: 1 }}>
              <h4 style={{ color: "var(--text-primary)", fontSize: "1.05rem", marginBottom: "4px" }}>
                Secure & Encrypted Billing
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                All subscriptions are billed securely via 256-bit bank-grade encryption. Statement line displays <strong>&ldquo;YORUMUSE STUDIOS&rdquo;</strong>. Cancel anytime with a single click from your profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership FAQ Section */}
      <section className="section" id="faq">
        <div className="container" style={{ maxWidth: "860px" }}>
          <div className="section-header" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <span className="section-subtitle">Common Questions</span>
              <h2 className="section-title">Membership Frequently Asked</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                padding: "24px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h4 style={{ color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "8px" }}>
                Can I cancel my subscription at any time?
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Yes, absolutely. You can cancel with a single click from your profile dashboard at any time. Your member access remains active until the end of your prepaid period with no subsequent renewals or fees.
              </p>
            </div>

            <div
              style={{
                padding: "24px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h4 style={{ color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "8px" }}>
                What streaming resolutions and formats are available?
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                All YoruMuse Originals are mastered in 4K HDR at high bitrates with adaptive streaming. We also support lossless audio soundtracks and stereo audio feeds across all modern web browsers, tablets, and phones.
              </p>
            </div>

            <div
              style={{
                padding: "24px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h4 style={{ color: "var(--text-primary)", fontSize: "1.1rem", marginBottom: "8px" }}>
                How do Private Salons work?
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Private salons are invite-only and member-exclusive discussion circles where members discuss creative themes, participate in Q&As with featured directors and performers, and vote on future production directions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
