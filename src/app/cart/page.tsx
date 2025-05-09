/* eslint-disable @next/next/no-img-element */
"use client";

import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { CartTable } from "@/components/ui/CartTable";
import { OrderForm } from "@/components/ui/OrderForm";
import { MessageBox } from "@/components/ui/MessageBox";
import { SuccessPage } from "@/components/ui/SuccessPage";
import { QuoteVenueAssignmentModal } from "@/components/ui/QuoteVenueAssignmentModal";

export default function CartPage() {
  const { data: session } = useSession();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    clearCartFromDatabase,
  } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [comment, setComment] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [showQuoteVenueModal, setShowQuoteVenueModal] = useState(false);
  const router = useRouter();

  // Group items by venue
  const itemsByVenue = items.reduce((acc, item) => {
    const venueKey = `${item.venueId}-${item.venueName}`;
    if (!acc[venueKey]) {
      acc[venueKey] = {
        venueId: item.venueId || "",
        venueName: item.venueName || "",
        items: [],
        total: 0,
      };
    }
    acc[venueKey].items.push(item);
    if (item.price) {
      acc[venueKey].total += item.price * item.quantity;
    }
    return acc;
  }, {} as Record<string, { venueId: string; venueName: string; items: typeof items; total: number }>);

  const getContinueShoppingUrl = () => {
    if (session?.user?.venues && session.user.venues.length > 0) {
      return `/venues/${session.user.venues[0].trxVenueId}`;
    }
    return "/products";
  };

  const handleQuoteVenueAssignment = (assignments: Record<string, string>) => {
    // Directly proceed with order submission using the assignments
    proceedWithOrderSubmission(assignments);
  };

  const proceedWithOrderSubmission = async (
    venueAssignments: Record<string, string> = {}
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/cart/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          comment,
          purchaseOrder,
          venue: session?.user?.venues?.[0] || null,
          trxCustomerId: session?.user?.trxCustomerId,
          quoteVenueAssignments: venueAssignments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit order");
      }

      setSuccess(true);

      // First clear cart from database to ensure it's persisted
      await clearCartFromDatabase();

      // Then clear local cart state (this is a backup as clearCartFromDatabase also clears local state)
      clearCart();

      router.push("/cart/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    // Get catalog items (items with venueId = 0 or "0")
    // Convert to string for comparison to handle both string and number types
    const quoteItems = items.filter(
      (item) => !item.venueId || String(item.venueId) === "0"
    );

    // If there are quote items and multiple venues, show the venue assignment modal
    if (
      quoteItems.length > 0 &&
      session?.user?.venues &&
      session.user.venues.length > 1
    ) {
      setShowQuoteVenueModal(true);
      // Don't proceed with order submission here - wait for modal callback
    } else {
      // No need to show modal, proceed with order
      await proceedWithOrderSubmission({});
    }
  };

  // Handle closing the modal without assigning venues
  const handleCloseModal = () => {
    setShowQuoteVenueModal(false);

    // If modal was closed without assignments, use default assignment (first venue)
    if (items.some((item) => item.venueId === "0")) {
      const defaultAssignments: Record<string, string> = {};
      const defaultVenueId =
        session?.user?.venues?.[0]?.trxVenueId.toString() || "0";

      items.forEach((item) => {
        if (item.venueId === "0") {
          defaultAssignments[item.id] = defaultVenueId;
        }
      });

      proceedWithOrderSubmission(defaultAssignments);
    }
  };

  if (!session?.user) {
    return (
      <PageContainer>
        <MessageBox type="warning">Please log in to view your cart</MessageBox>
      </PageContainer>
    );
  }

  if (success) {
    return (
      <SuccessPage title="Order Submitted">
        Your order has been submitted successfully! Our sales team will contact
        you shortly.
      </SuccessPage>
    );
  }

  return (
    <PageContainer title="Your Cart">
      {items.length === 0 ? (
        <div className="text-gray-500">
          Your cart is empty.{" "}
          <Link href="/products" className="text-blue-600 hover:text-blue-800">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(itemsByVenue).map((venueGroup) => (
            <CartTable
              key={venueGroup.venueId}
              items={venueGroup.items}
              venueId={venueGroup.venueId}
              venueName={venueGroup.venueName}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              showPrices={!!session?.user?.seePrices}
              total={venueGroup.total}
            />
          ))}

          {session?.user?.seePrices && items.some((item) => item.price) && (
            <div className="text-right text-xl font-semibold text-gray-900 border-t pt-4">
              Order Total: $
              {Object.values(itemsByVenue)
                .reduce((total, venue) => total + venue.total, 0)
                .toFixed(2)}
            </div>
          )}

          {error && <MessageBox type="error">{error}</MessageBox>}

          <OrderForm
            comment={comment}
            purchaseOrder={purchaseOrder}
            onCommentChange={setComment}
            onPurchaseOrderChange={setPurchaseOrder}
            onClearCart={clearCart}
            onSubmitOrder={handleSubmitOrder}
            submitting={submitting}
            continueShoppingUrl={getContinueShoppingUrl()}
          />

          {/* Quote Venue Assignment Modal */}
          {session?.user?.venues && (
            <QuoteVenueAssignmentModal
              isOpen={showQuoteVenueModal}
              onClose={handleCloseModal}
              quoteItems={items.filter(
                (item) => !item.venueId || String(item.venueId) === "0"
              )}
              venues={session.user.venues}
              onSubmit={handleQuoteVenueAssignment}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}
