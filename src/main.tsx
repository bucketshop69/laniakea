import './polyfills/commonjs-shim'
import './polyfills'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WalletContextProvider } from './components/WalletProvider'
import { WalletBalanceProvider } from './components/WalletBalanceProvider'

const computeShouldAutoConnect = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const { hostname, pathname, search } = window.location;
  const normalizedHost = hostname.toLowerCase();
  const params = new URLSearchParams(search);

  if (params.get('surface') === 'app') {
    return true;
  }

  if (params.get('surface') === 'landing') {
    return false;
  }

  const hostSegments = normalizedHost.split('.');
  const hostIndicatesApp = hostSegments[0] === 'app';

  return hostIndicatesApp || pathname.startsWith('/app');
};

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <WalletContextProvider autoConnect={computeShouldAutoConnect()}>
    <WalletBalanceProvider>
      <App />
    </WalletBalanceProvider>
  </WalletContextProvider>
  // </StrictMode>,
)
