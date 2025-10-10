import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WalletContextProvider } from './components/WalletProvider'
import { WalletBalanceProvider } from './components/WalletBalanceProvider'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <WalletContextProvider>
    <WalletBalanceProvider>
      <App />
    </WalletBalanceProvider>
  </WalletContextProvider>
  // </StrictMode>,
)
