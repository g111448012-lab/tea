import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Order } from "../types";
import { formatPrice } from "../lib/utils";
import { CheckCircle2, Clock, Truck, Ban, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "orders");
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      toast.success("狀態已更新");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-serif font-bold">訂單管理後台</h2>
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
          {Object.entries(stats).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === k ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {k === 'all' ? '全部' : 
               k === 'pending' ? '未付款' : 
               k === 'paid' ? '已付款' : 
               k === 'preparing' ? '製作中' : 
               k === 'completed' ? '已完成' : k}
              <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${filter === k ? 'bg-white/20' : 'bg-gray-100'}`}>{v}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="col-span-full py-20 text-center text-gray-400"
            >
              目前沒有符合條件的訂單
            </motion.div>
          ) : (
            filteredOrders.map(order => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-2xl border ${order.status === 'paid' ? 'border-blue-200' : 'border-gray-100'} shadow-sm p-6 space-y-4`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Order ID</div>
                    <div className="font-mono text-xs text-gray-500 font-bold">#{order.id.slice(-6)}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start text-sm">
                        <div className="flex-1">
                          <span className="font-bold">{item.name}</span>
                          <div className="text-[10px] text-gray-400 mt-0.5">{item.size} | {item.sugar} | {item.ice}</div>
                        </div>
                        <span className="text-gray-500">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center py-3 border-t border-b border-dashed border-gray-100">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-lg font-serif font-bold text-green-900">{formatPrice(order.totalAmount)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-500">{order.customerInfo.name}</div>
                    <div className="text-xs text-gray-400">{order.customerInfo.phone}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {order.status === 'paid' && (
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="col-span-2 bg-blue-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Clock size={14} /> 開始製作
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="col-span-2 bg-green-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} /> 完成訂單
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="col-span-2 bg-gray-100 text-gray-600 p-2 rounded-lg text-xs font-bold hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <Ban size={14} /> 取消訂單
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
