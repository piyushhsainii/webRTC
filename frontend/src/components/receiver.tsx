import { useEffect, useRef } from "react"
import Socket from "../hooks/Socket"
import { ANSWER, ICECANDIDATES, OFFER, RECEIVER } from "../messages/messages"

const Receiver = () => {

  const socket = Socket()
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null);

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
        pcRef.current = new RTCPeerConnection()

        pcRef.current.ontrack = (event) =>{
          console.log(event.track)
  
          if (localVideoRef.current) {
            if(localVideoRef.current.srcObject){
              localVideoRef.current.srcObject = new MediaStream();
            }
            (localVideoRef.current.srcObject as MediaStream).addTrack(event.track)
          }
          console.log(event.track)
        }

        pcRef.current.onicecandidate = (event) => {
        console.log(event.candidate)

         if(event.candidate){
          socket.send(JSON.stringify({type:ICECANDIDATES, candidate:event.candidate}))
         }
        }

        pcRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate) {
            socket.send(
              JSON.stringify({ type: ICECANDIDATES, candidate: event.candidate })
            );
          }
        };

        pcRef.current.oniceconnectionstatechange = () => {
          console.log(`ICE connection state: ${pcRef.current?.iceConnectionState}`);
        };

        pcRef.current.setRemoteDescription(message.sdp).
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

const handlePlayVideo = () => {
  if (localVideoRef.current) {
    localVideoRef.current
      .play()
      .catch((e) => console.error('Error playing video', e));
  }
};

  

  return (
        <div className="text-black">
          receiver
            <div className="border-black border " >
            <video src="" className="border-white border " autoPlay controls muted playsInline  ref={localVideoRef} ></video>
          </div>
        </div>
  )
}

export default Receiver