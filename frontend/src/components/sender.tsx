
import { useEffect } from "react"
import { ANSWER, ICECANDIDATES, OFFER, SENDER } from "../messages/messages"
import useSocket from "../hooks/Socket"


const Sender = () => {
  const socket = useSocket()

  useEffect(() => {

    if(!socket) return
      socket.onopen = ()=>{  
        socket.send(JSON.stringify({
          type:SENDER
        }))
      }

  }, [socket])
 
 async function sendVideo(){

    if(!socket) return
    console.log("sendvideo")

    const pc1 = new RTCPeerConnection()
    
    pc1.onicecandidate = (event) =>{
        // sends ice candidates whenever it trickles in
        console.log(event.candidate)
        if(event.candidate){
          socket.send(JSON.stringify({type:ICECANDIDATES, candidate:event.candidate}))
        }
    }

 pc1.onnegotiationneeded = async()=>{
    const offer = await  pc1.createOffer()
    await pc1.setLocalDescription(offer)
    if(pc1.localDescription){
      socket?.send(JSON.stringify({ type:OFFER, sdp: pc1.localDescription }))
    }
 }
     
    const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})

    // console.log(stream.getTracks()[0])
    // pc1.addTrack(stream.getTracks()[0])
    stream.getTracks().forEach((track) => pc1.addTrack(track));

    socket.onmessage = async(e)=>{
      const message = JSON.parse(e.data)
      switch (message.type) {

        case ANSWER:
       if(message.sdp){
        await  pc1.setRemoteDescription(new RTCSessionDescription(message.sdp))
       }

          break;

        case ICECANDIDATES:
          pc1.addIceCandidate(new RTCIceCandidate(message.candidate))
      }

    }

 }
  

  return (
    <div style={{cursor:"pointer"}} onClick={sendVideo} >sender</div>
  )
}

export default Sender