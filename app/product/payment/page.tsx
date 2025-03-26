import { Suspense } from "react";
import { getOrderDetail, getPaymentMethods, getUserInfo } from "@/lib/actions";
import PaymentForm from "./PaymentForm";

export default async function PaymentPage({ 
  searchParams 
}: { 
  searchParams: Promise<any>
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <PaymentPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentPageContent({ 
  searchParams 
}: { 
  searchParams: Promise<any>
}) {
  const resolvedParams = await searchParams;
  const tradeNo = resolvedParams?.trade_no ? String(resolvedParams.trade_no) : undefined;

  if (!tradeNo) {
    return <div>Invalid order number</div>;
  }

  const [orderResponse, methodsResponse, userResponse] = await Promise.all([
    getOrderDetail(tradeNo),
    getPaymentMethods(),
    getUserInfo().catch(() => null),
  ]);

  return (
    <PaymentForm
      initialOrder={orderResponse.data}
      paymentMethods={methodsResponse.data}
      user={userResponse?.data || null} // Convert undefined to null
    />
  );
}
