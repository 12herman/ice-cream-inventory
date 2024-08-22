import './assets/main.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ConfigProvider, App as AntdApp } from 'antd'
const theme = {
  token: {
    colorPrimary: '#f26723'
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <ConfigProvider theme={theme} getPopupContainer={() => document.getElementById('root')}>
    <AntdApp>
      <App />
    </AntdApp>
  </ConfigProvider>
)