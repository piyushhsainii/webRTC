import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../hooks/Socket'; // assuming this is your custom hook
import { ANSWER, ICECANDIDATES, OFFER, USER2 } from '../messages/messages';
import { Video, VideoOff } from 'lucide-react';

interface IMessage {
  type: string;
  payload: {
      sdp: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
      type?: "sender" | "receiver";
  };
}

const Receiver: React.FC = () => {
  const socket = useSocket();
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [ReceiverPc, setReceiverPc] = useState<RTCPeerConnection | null>(null)
  const [SenderPc, setSenderPc] = useState<RTCPeerConnection | null>(null)
  const [videoReady, setVideoReady] = useState(false);
  const [ShowCam, setShowCam] = useState(true)

  async function showCam(){
    if(localVideoRef.current){
      localVideoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({video:true})
    }
  }

  useEffect(() => {
    if (!socket) return;

    // ShowCam && showCam() 


    socket.onopen = () => {
      socket.send(JSON.stringify({ type: USER2 }));
    };  

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
            payload:{candidate: event.candidate } })
        );
      }
    };
    socket.onmessage = async (e) => {
      const message = JSON.parse(e.data);

      let receiverPc
      switch (message.type) {
        case OFFER:
          receiverPc = new RTCPeerConnection();

          receiverPc.ontrack = (event: RTCTrackEvent) => {
              if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = new MediaStream([
                      event.track,
                  ]);
                  remoteVideoRef.current.play();
              }
          }
          receiverPc.onicecandidate = async (e) => {
            if (e.candidate) {
                socket.send(
                    JSON.stringify({
                        type: ICECANDIDATES,
                        payload: {
                            candidate: e.candidate,
                            type: "receiver",
                        },
                    })
                );
            }
        };

        await receiverPc.setRemoteDescription(
          new RTCSessionDescription(message.payload.sdp)
        );

        const sdp = await receiverPc.createAnswer();
        await receiverPc.setLocalDescription(sdp);

        setReceiverPc(receiverPc);

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
          console.log("answer")
          // if (message.payload.sdp ){
          // if(SenderPc){
          //   await SenderPc.setRemoteDescription(
          //     new RTCSessionDescription(message.payload.sdp)
          //   );
          // }
           
          // }
          setSenderPc((pc) => {
            pc?.setRemoteDescription(message.payload.remoteSdp);
            return pc;
        });
          break;

        case ICECANDIDATES:
          if (message.payload.candidate) {
              await ReceiverPc?.addIceCandidate(
                new RTCIceCandidate(message.payload.candidate));
          }
          break;
      }
    };

    return () => {
      ReceiverPc?.close();
    };
  }, [socket,ShowCam]);

  
  async function sendVideo() {
    if (!socket) return;

    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ 
            type: ICECANDIDATES, 
            payload:{
              candidate: event.candidate
            }})
        );
      }
    };
    pc.onnegotiationneeded = async () => {
      console.log('sendvideo');
      const offer = await SenderPc?.createOffer();
      await SenderPc?.setLocalDescription(offer);
        console.log("offer sent")
        setSenderPc(pc)
        socket.send(JSON.stringify({ 
          type: OFFER,
           payload:{sdp: offer} }));
    }
      
      try {
        const stream = await window.navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const videoTrack = stream.getTracks()[0];
  
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream([videoTrack]);
          localVideoRef.current.play();
        }
  
        SenderPc?.addTrack(videoTrack);

      } catch (error) {
        console.error('Failed to get media stream or set up connection:', error);
      }
  }

  return (
    <div className="text-black">
      Receiver
      <div className='flex'>
          <div className="border-black border w-[300px] h-[300px]  flex flex-col justify-evenly  ">
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

export default Receiver;
