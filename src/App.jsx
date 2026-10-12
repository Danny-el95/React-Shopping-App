import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './Pages/Home'
import Auth from './Pages/Auth'
import Checkout from './Pages/Checkout'
import Navbar from './Components/Navbar'
import AuthProvider from './Context/AuthContext'
import NotFound from './Pages/NotFound'
import ProductDetails from './Pages/ProductDetails'
import CartProvider from './Context/CartContext'
import OrderProvider from './Context/OrderContext'
import OrderHistory from './Pages/OrderHistory'
import ForgotPassword from './Pages/ForgotPassword'

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Routes>
        </div>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
