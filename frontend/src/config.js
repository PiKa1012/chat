// const isDev = process.env.NODE_ENV === 'development' || !window.__ELECTRON_ENV__

// const config = {
//   API_URL: isDev
//     ? 'http://localhost:3001'
//     : 'https://chat-backend-production-c11a.up.railway.app',

//   SOCKET_URL: isDev
//     ? 'http://localhost:3001'
//     : 'https://chat-backend-production-c11a.up.railway.app',
// }

// export default config

const config = {
  API_URL: 'https://chat-backend-production-c11a.up.railway.app',
  SOCKET_URL: 'https://chat-backend-production-c11a.up.railway.app',
}

export default config