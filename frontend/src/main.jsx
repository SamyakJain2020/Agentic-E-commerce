import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import SmoothScroll from './lib/SmoothScroll.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/aura">
      <SmoothScroll>
        <CartProvider>
          <App />
        </CartProvider>
      </SmoothScroll>
    </BrowserRouter>
  </StrictMode>,
)
