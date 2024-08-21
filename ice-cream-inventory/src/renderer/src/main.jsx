import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// ant design config
import { ConfigProvider, App as AntdApp } from 'antd';
const theme = {
  token: {
      colorPrimary: '#3b82f6', // Set your desired primary color here
  },
};




ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
   <ConfigProvider theme={theme} getPopupContainer={() => document.getElementById('root')}>
  <AntdApp> 
  <App />
  </AntdApp>
    </ConfigProvider>
 
)
