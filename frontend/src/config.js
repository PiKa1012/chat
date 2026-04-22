const isDev = process.env.NODE_ENV === 'development' || !window.__ELECTRON_ENV__

const config = {
  API_URL: isDev
    ? 'http://localhost:3001'
    : 'https://my-chat-app.up.railway.app',

  SOCKET_URL: isDev
    ? 'http://localhost:3001'
    : 'https://my-chat-app.up.railway.app',
}

export default config