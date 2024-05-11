import React, { useEffect, useRef, useState } from 'react';
import { ANSWER, ICECANDIDATES, OFFER, USER1 } from '../messages/messages';
import useSocket from '../hooks/Socket';
import { Video, VideoOff } from 'lucide-react';

interface IMessage {
  type: string;
  payload: {
      sdp: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
      type?: "sender" | "receiver";
  };
}

const Sender: React.FC = () => {
  const socket = useSocket();
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [ShowCam, setShowCam] = useState<Boolean>(true)
  const [ReceiverPc, setReceiverPc] = useState<RTCPeerConnection | null>(null)
  const [SenderPc, setSenderPc] = useState<RTCPeerConnection | null>(null)
  const [videoReady, setVideoReady] = useState(false);
  
  async function showCam(){
    if(localVideoRef.current){
      localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({video:true})
    }
  }

  useEffect(() => {
    if (!socket) return;
    // ShowCam && showCam() 
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: USER1,
        })
      );
    };   
    socket.onmessage = async (e) => {
      const message = JSON.parse(e.data);
      switch (message.type) {
        
        case OFFER:
          const pc = new RTCPeerConnection();

          pc.ontrack = (event: RTCTrackEvent) => {
              if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = new MediaStream([
                      event.track,
                  ]);
                  remoteVideoRef.current.play();
                  console.log("\ntracks:", event.track);
              }
          };

          pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
              socket.send(
                JSON.stringify({ 
                  type: ICECANDIDATES, 
                  payload:{
                    candidate: event.candidate,
                    type: "receiver"
                  } })
              );
            }
          };

        await pc.setRemoteDescription(
          new RTCSessionDescription(message.payload.sdp)
        );

        const sdp = await pc.createAnswer();
        await pc.setLocalDescription(sdp);

        setReceiverPc(pc);

        socket.send(
            JSON.stringify({
                type: ANSWER,
                payload: {
                  sdp: sdp,
                },
            })
        );

          break;

        case ANSWER:
          setSenderPc((pc) => {
            pc?.setRemoteDescription(message.payload.remoteSdp);
            return pc;
        });
          break;

        case ICECANDIDATES:
          if (message.payload.candidate) {
            await ReceiverPc?.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
          }
          break;
      }
    };

    return () => {
      ReceiverPc?.close();
    };

  }, [socket]);

  async function sendVideo() {
    console.log("check1")
    if (!socket) return;
    console.log("check2")

    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ 
            type: ICECANDIDATES,
            payload:{
              candidate: event.candidate} })
        );
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log("send video")
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setSenderPc(pc)
      socket.send(JSON.stringify({
         type: OFFER, 
         payload:{
          sdp: offer
        } 
        }));
  }
    
    try {
      const streams = await window.navigator.mediaDevices.getUserMedia({
        video: true,
    });

    const videoTrack = streams.getVideoTracks()[0];

    if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([videoTrack]);
        localVideoRef.current.play();
    }

    SenderPc?.addTrack(videoTrack);
    } 
    catch (error) {
      console.error('Failed to get media stream or set up connection:', error);
    }

};
  
  return (
    <div className="text-black">
      Sender
      <div className='flex'>
          <div className="border-black border w-[300px] h-[300px]  flex flex-col justify-evenly ">
            {
              ShowCam && 
              <video
              ref={localVideoRef}
              className={`border-white border `}
              autoPlay
              playsInline
              muted
            ></video>
            }
              {
               ShowCam === true ? <div className='cursor-pointer' onClick={()=>setShowCam(false)}> <VideoOff color="#2e2e2e" /> </div> :
               <div className='cursor-pointer' onClick={()=>setShowCam(true)}> <Video color="#2e2e2e" /> </div>
              }
          </div>
          <div className="border-black border w-[300px] h-[300px] ">
              <video
                ref={remoteVideoRef}
                className="border-white border"
                autoPlay
                playsInline
                muted
              ></video>
          </div>
      </div>
      <div className='cursor-pointer' onClick={sendVideo}>share Video</div>
    </div>
  );
};

export default Sender;
