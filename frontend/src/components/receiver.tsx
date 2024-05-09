import { useEffect, useRef } from "react"
import Socket from "../hooks/Socket"
import { ANSWER, ICECANDIDATES, OFFER, RECEIVER } from "../messages/messages"

const Receiver = () => {

  const socket = Socket()
  const video = useRef<HTMLVideoElement | null>(null)

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

    console.log(message,"in receiver")
    switch (message.type) {
      case OFFER:
        pc = new RTCPeerConnection()

        pc.ontrack = (event) =>{
          const video = document.createElement('video');
          document.body.appendChild(video)
          console.log(event.track)
          video.srcObject = new MediaStream([event.track])
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            video.play()
                .then(() => {
                    console.log('Video playback started successfully');
                })
                .catch((error) => {
                    console.error('Error starting video playback:', error);
                });
        };
        }

        pc.onicecandidate = (event) => {
          socket.send(JSON.stringify({type:ICECANDIDATES, candidate:event.candidate}))
        }

        await pc.setRemoteDescription(message.sdp)          //receiving sender's description
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)                //forwarding local description ahead
        socket.send(JSON.stringify({type:ANSWER,sdp:pc.localDescription}))
        break;
    
     case ANSWER:
        break;

      case ICECANDIDATES:
       if(pc !== null){
        // @ts-ignore
        pc!.addIceCandidate(message.canidate)
       }
    }
  }

  }, [socket])
  

  return (
    <div>receiver
    <video src="" ref={video} ></video>
    </div>
  )
}

export default Receiver