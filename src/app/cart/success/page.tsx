"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuccessPage } from "@/components/ui/SuccessPage";

export default function CartSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
    }
  }, [session, router]);

  const getContinueShoppingUrl = () => {
    if (session?.user?.venues && session.user.venues.length > 0) {
      return `/venues/${session.user.venues[0].trxVenueId}`;
    }
    return "/products";
  };

  if (!session?.user) {
    return null; // Will redirect in useEffect
  }

  return (
    <SuccessPage
      title="Order Submitted Successfully!"
      continueText="Continue Shopping"
      continueLink={getContinueShoppingUrl()}
      showContactLink={true}
    >
      Thank you for your order. Our sales team will review your request and
      contact you shortly with pricing and availability information.
    </SuccessPage>
  );
}
