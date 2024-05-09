import { useEffect, useRef } from "react"
import Socket from "../hooks/Socket"
import { ANSWER, ICECANDIDATES, OFFER, RECEIVER } from "../messages/messages"

const Receiver = () => {

  const socket = Socket()
  const localVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if(!socket) return
    socket.onopen = ()=>{
      socket.send(JSON.stringify({
        type:RECEIVER
      })
    )}
    
    console.log("use effect")

  socket.onmessage = async(e)=>{
    const message = JSON.parse(e.data)
    let pc:RTCPeerConnection | null = null

    switch (message.type) {
      case OFFER:
        pc = new RTCPeerConnection()

        pc.ontrack = (event) =>{
  
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([
              event.track
            ]);
            localVideoRef.current.play();
          }
          console.log(event.track)
        }

        pc.onicecandidate = (event) => {
          console.log(event.candidate)
          socket.send(JSON.stringify({type:ICECANDIDATES, candidate:event.candidate}))
        }
        pc.setRemoteDescription(message.sdp).
          then(() => pc!.createAnswer()
             .then((answer) => {pc!.setLocalDescription(answer)
                 socket.send(JSON.stringify({ type: ANSWER, sdp: answer }))
                }
            ))
        break;
    
      case ICECANDIDATES:
       if(pc !== null){
        // @ts-ignore
        pc.addIceCandidate(message.candidate)
       }
    }
  }

  }, [socket])
  

  return (
        <div className="text-black">
          receiver
            <div className="border-black border " >
            <video src="" className="border-white border "  ref={localVideoRef} ></video>
          </div>
        </div>
  )
}

export default Receiver