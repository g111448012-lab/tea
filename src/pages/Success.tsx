import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Home } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      // In a real app, this should be done via a webhook from Stripe
      // But for this demo, we'll update it here if the user reaches this page
      updateDoc(doc(db, "orders", orderId), {
        status: 'paid'
      }).catch(err => {
        console.error(err);
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      });

      // Clear local storage cart
      localStorage.removeItem('cart');
    }
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto text-center space-y-8 py-20">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 size={48} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-serif font-bold">支付成功！</h2>
        <p className="text-gray-500">感謝您的訂購，我們正火速為您準備中。</p>
      </div>

      {orderId && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 font-mono text-sm">
          <span className="text-gray-400">訂單編號:</span>
          <span className="ml-2 font-bold">#{orderId.slice(-8)}</span>
        </div>
      )}

      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 bg-green-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-800 transition-colors shadow-lg"
      >
        <Home size={20} />
        回到首頁
      </button>
    </div>
  );
}
