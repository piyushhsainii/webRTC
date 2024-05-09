import  { useEffect, useState } from 'react'

const useSocket = () => {
    const [Socket, setSocket] = useState<WebSocket | null>(null)

useEffect(() => {    
    const socket = new WebSocket("ws://localhost:8080")
    setSocket(socket)

    socket.onclose = (()=>{
        setSocket(null)
     })
    }, [])
    
  return Socket
}

export default useSocket