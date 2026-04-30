import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ShoppingCart, User, Coffee, Menu } from "lucide-react";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Success from "./pages/Success";
import { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

function Navigation() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center md:top-0 md:bottom-auto md:border-t-0 md:border-b z-50">
      <Link to="/" className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600">
        <Menu size={20} />
        <span className="text-xs">菜單</span>
      </Link>
      <Link to="/cart" className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600">
        <ShoppingCart size={20} />
        <span className="text-xs">購物車</span>
      </Link>
      <Link to="/admin" className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600">
        <User size={20} />
        <span className="text-xs">後台</span>
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] pb-24 md:pb-0 md:pt-16">
        <header className="bg-white px-6 py-4 flex items-center gap-3 md:hidden">
          <Coffee className="text-green-700" size={24} />
          <h1 className="font-serif text-xl font-bold tracking-tight">醇厚茶飲</h1>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/success" element={<Success />} />
          </Routes>
        </main>

        <Navigation />
        <Toaster position="top-center" />
      </div>
    </Router>
  );
}
