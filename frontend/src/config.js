const isDev = process.env.NODE_ENV === 'development' || !window.__ELECTRON_ENV__

const config = {
  API_URL: isDev
    ? 'http://localhost:3001'
    : 'https://你的项目名.onrender.com',

  SOCKET_URL: isDev
    ? 'http://localhost:3001'
    : 'https://你的项目名.onrender.com',
}

export default config