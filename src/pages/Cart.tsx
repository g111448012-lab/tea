import { useState, useEffect } from "react";
import { CartItem } from "../types";
import { formatPrice } from "../lib/utils";
import { Trash2, CreditCard } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setItems(cart);
    
    // Auto-fill customer info if logged in
    if (auth.currentUser) {
      setCustomerInfo(prev => ({
        ...prev,
        name: auth.currentUser?.displayName || prev.name
      }));
    }
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
  };

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("請輸入訂購人資訊");
      return;
    }

    if (items.length === 0) {
      toast.error("購物車是空的");
      return;
    }

    try {
      // 1. Create order in Firebase
      let orderRef;
      try {
        orderRef = await addDoc(collection(db, "orders"), {
          items,
          totalAmount: total,
          status: 'pending',
          customerInfo,
          customerUid: auth.currentUser?.uid || null,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "orders");
        return;
      }

      // 2. Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("支付系統尚未就緒，請稍後再試");
        return;
      }

      // 3. Create checkout session on server
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, orderId: orderRef.id }),
      });

      const session = await response.json();
      if (session.error) throw new Error(session.error);

      // 4. Redirect to Stripe
      const result = await (stripe as any).redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) toast.error(result.error.message);
    } catch (error: any) {
      console.error(error);
      toast.error(`結帳失敗: ${error.message}`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <Trash2 size={40} />
        </div>
        <h3 className="text-xl font-serif">購物車目前沒有商品</h3>
        <p className="text-gray-500">快去挑選好喝的茶吧！</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-serif font-bold">確認訂單</h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
            <div className="space-y-1">
              <h4 className="font-bold text-lg">{item.name}</h4>
              <div className="flex gap-2 text-xs text-gray-500 uppercase font-mono">
                <span>{item.size}</span>
                <span>•</span>
                <span>{item.sugar}</span>
                <span>•</span>
                <span>{item.ice}</span>
              </div>
              <div className="text-sm text-gray-400">數量: {item.quantity}</div>
            </div>
            <div className="text-right flex items-center gap-4">
              <span className="font-serif font-bold">{formatPrice(item.price * item.quantity)}</span>
              <button 
                onClick={() => removeItem(index)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">訂購人資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="姓名"
            value={customerInfo.name}
            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-600"
          />
          <input
            type="tel"
            placeholder="電話"
            value={customerInfo.phone}
            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      <div className="bg-green-900 text-white p-8 rounded-3xl space-y-6">
        <div className="flex justify-between items-end border-b border-green-800 pb-4">
          <span className="text-green-300 uppercase text-xs font-mono tracking-widest">Total Amount</span>
          <span className="text-4xl font-serif font-bold">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handleCheckout}
          className="w-full bg-white text-green-900 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors shadow-xl"
        >
          <CreditCard size={20} />
          前往線上支付
        </button>
        <p className="text-xs text-center text-green-400">點擊結帳將導向安全支付頁面</p>
      </div>
    </div>
  );
}
