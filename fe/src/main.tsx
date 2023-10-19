import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from "./App";
import './index.css'
import CustomThemeProvider from "./providers/custom-theme-provider";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CustomThemeProvider>
      <App />
    </CustomThemeProvider>
  </React.StrictMode>,
)
