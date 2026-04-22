import { io } from 'socket.io-client'
import config from './config'

const socket = io(config.SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

export default socket