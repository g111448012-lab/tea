import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Product } from "../types";
import { Plus, Coffee, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../lib/utils";
import { toast } from "sonner";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const SEED_DATA = [
  { name: "水之森玄米抹茶", category: "愛茶的牛", prices: { L: 50 }, isAvailable: true },
  { name: "娜杯紅茶", category: "愛茶的牛", prices: { L: 45 }, isAvailable: true },
  { name: "伯爵/大正紅茶", category: "愛茶的牛", prices: { L: 40 }, isAvailable: true },
  { name: "原片初露青茶", category: "愛茶的牛", prices: { L: 40 }, isAvailable: true },
  { name: "茉莉原萃綠茶", category: "愛茶的牛", prices: { L: 40 }, isAvailable: true },
  { name: "琥珀高峰烏龍", category: "愛茶的牛", prices: { L: 40 }, isAvailable: true },
  { name: "娜杯紅茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 60, L: 70 }, isAvailable: true },
  { name: "伯爵紅茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 55, L: 65 }, isAvailable: true },
  { name: "大正紅茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 55, L: 65 }, isAvailable: true },
  { name: "琥珀烏龍拿鐵", category: "醇濃鮮奶茶", prices: { M: 55, L: 65 }, isAvailable: true },
  { name: "茉莉綠茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 55, L: 65 }, isAvailable: true },
  { name: "原片青茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 55, L: 65 }, isAvailable: true },
  { name: "珍珠紅茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 65, L: 75 }, isAvailable: true },
  { name: "珍珠娜杯紅茶拿鐵", category: "醇濃鮮奶茶", prices: { M: 70, L: 80 }, isAvailable: true },
  { name: "伯爵可可拿鐵", category: "醇濃鮮奶茶", prices: { M: 75, L: 85 }, isAvailable: true },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState({ size: 'L' as 'M' | 'L', sugar: '正常', ice: '正常', quantity: 1 });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("category"));
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "products");
        return; // handleFirestoreError throws, but this satisfies TS
      }
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      
      if (data.length === 0) {
        // Seed if empty and signed in
        if (!auth.currentUser) {
          toast.info("請登入後台管理員帳號以初始化商品資料");
          setLoading(false);
          return;
        }
        for (const item of SEED_DATA) {
          try {
            await addDoc(collection(db, "products"), item);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, "products");
          }
        }
        await fetchProducts();
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      location.reload();
    } catch (error) {
      toast.error("登入失敗");
    }
  };

  const displayProducts = products.length > 0 ? products : SEED_DATA.map((p, i) => ({ id: `local-${i}`, ...p } as Product));
  const categories = Array.from(new Set(displayProducts.map(p => p.category)));

  const addToCart = () => {
    if (!selectedProduct) return;
    
    const cartItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: options.size === 'M' ? selectedProduct.prices.M || selectedProduct.prices.L : selectedProduct.prices.L || selectedProduct.prices.M,
      ...options
    };

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    toast.success(`${selectedProduct.name} 已加入購物車`);
    setSelectedProduct(null);
  };

  if (loading) return <div className="flex justify-center py-20 font-serif">匠心調製中...</div>;

  return (
    <div className="space-y-8">
      {/* Admin Quick Action */}
      {products.length === 0 && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-green-800">
            <Coffee size={20} />
            <p className="text-sm font-medium">菜單目前為預覽模式，管理員登入後可同步至資料庫。</p>
          </div>
          <button
            onClick={login}
            className="text-xs font-bold bg-green-800 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            管理員登入 / 初始化
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-green-900 text-white p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">追尋純粹的<br/>茶香之旅</h2>
          <p className="text-green-100 opacity-80 mb-6">嚴選產地好茶，職人手刷比例，每一口都是對土地的敬意。</p>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-green-800 to-transparent flex items-center justify-center opacity-30">
          <Coffee size={200} strokeWidth={1} />
        </div>
      </section>

      {/* Categories */}
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-serif text-2xl font-bold">{category}</h3>
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Select</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayProducts.filter(p => p.category === category).map(product => (
              <motion.div
                key={product.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedProduct(product);
                  setOptions({
                    size: product.prices.M ? 'M' : 'L',
                    sugar: '正常',
                    ice: '正常',
                    quantity: 1
                  });
                }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium text-lg">{product.name}</h4>
                  <p className="text-sm text-gray-500">{product.description || "經典推薦"}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-serif font-bold text-green-900">
                    {product.prices.M && product.prices.L ? (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[10px] text-gray-400 font-sans uppercase">M</span>
                          <span>{product.prices.M}</span>
                        </div>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[10px] text-gray-400 font-sans uppercase">L</span>
                          <span>{product.prices.L}</span>
                        </div>
                      </div>
                    ) : (
                      <span>{product.prices.L || product.prices.M}</span>
                    )}
                  </div>
                  <Plus size={20} className="ml-auto mt-2 text-green-700" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Selection Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-8 z-[70] shadow-2xl md:max-w-xl md:mx-auto md:rounded-3xl md:bottom-auto md:top-1/2 md:-translate-y-1/2"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-serif font-bold">{selectedProduct.name}</h3>
                  <p className="text-gray-500">{selectedProduct.category}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 block">容量</label>
                    <div className="flex gap-2">
                       {selectedProduct.prices.M && (
                        <button
                          onClick={() => setOptions({ ...options, size: 'M' })}
                          className={`flex-1 py-3 rounded-xl border ${options.size === 'M' ? 'bg-green-50 border-green-700 text-green-700' : 'border-gray-200'}`}
                        >
                          M ({formatPrice(selectedProduct.prices.M)})
                        </button>
                      )}
                      {selectedProduct.prices.L && (
                        <button
                          onClick={() => setOptions({ ...options, size: 'L' })}
                          className={`flex-1 py-3 rounded-xl border ${options.size === 'L' ? 'bg-green-50 border-green-700 text-green-700' : 'border-gray-200'}`}
                        >
                          L ({formatPrice(selectedProduct.prices.L)})
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 block">甜度</label>
                    <div className="flex flex-wrap gap-2">
                      {['正常', '少糖', '半糖', '微糖', '無糖'].map(s => (
                        <button
                          key={s}
                          onClick={() => setOptions({ ...options, sugar: s })}
                          className={`px-4 py-2 rounded-lg text-sm border ${options.sugar === s ? 'bg-green-600 text-white border-green-600' : 'border-gray-200'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 block">冰塊</label>
                    <div className="flex flex-wrap gap-2">
                      {['正常', '少冰', '微冰', '去冰', '熱'].map(i => (
                        <button
                          key={i}
                          onClick={() => setOptions({ ...options, ice: i })}
                          className={`px-4 py-2 rounded-lg text-sm border ${options.ice === i ? 'bg-green-600 text-white border-green-600' : 'border-gray-200'}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setOptions({ ...options, quantity: Math.max(1, options.quantity - 1) })} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">-</button>
                      <span className="font-bold">{options.quantity}</span>
                      <button onClick={() => setOptions({ ...options, quantity: options.quantity + 1 })} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">+</button>
                    </div>
                    <button
                      onClick={addToCart}
                      className="bg-green-900 text-white px-8 py-4 rounded-2xl font-bold flex-1 ml-6 hover:bg-green-800 transition-colors"
                    >
                      加入購物車
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
