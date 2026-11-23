import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './Pages/Home'
import Auth from './Pages/Auth'
import Checkout from './Pages/Checkout'
import Navbar from './Components/Navbar'
import AuthProvider from './Context/AuthProvider'
import NotFound from './Pages/NotFound'
import ProductDetails from './Pages/ProductDetails'
import CartProvider from './Context/CartProvider'
import OrderProvider from './Context/OrderProvider'
import OrderHistory from './Pages/OrderHistory'
import ForgotPassword from './Pages/ForgotPassword'
import ProductsPage from './Pages/ProductsPage'
import MainLayouts from './Layouts/MainLayouts'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <div className="app">
            <ToastContainer />
            <Navbar />
            <Routes >
              <Route element={<MainLayouts />}>
                <Route path="/" element={<Home />} />
                <Route path="/product" element={<ProductsPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/orders" element={<OrderHistory />} />
              </Route>
            </Routes>
          </div>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
