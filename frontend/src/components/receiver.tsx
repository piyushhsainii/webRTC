import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../hooks/Socket'; // assuming this is your custom hook
import { ANSWER, ICECANDIDATES, OFFER, RECEIVER } from '../messages/messages';

interface IMessage {
  type: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const Receiver: React.FC = () => {
  const socket = useSocket();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: RECEIVER }));
    };

    pcRef.current = new RTCPeerConnection();

    pcRef.current.ontrack = (event: RTCTrackEvent) => {
      console.log('Track received:', event.track);
      if (localVideoRef.current) {
        if (!localVideoRef.current.srcObject) {
          localVideoRef.current.srcObject = new MediaStream();
        }
        (localVideoRef.current.srcObject as MediaStream).addTrack(event.track);
        setVideoReady(true);
      }
    };

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

    socket.onmessage = async (e: MessageEvent<string>) => {
      const message: IMessage = JSON.parse(e.data);
      let answer;
      switch (message.type) {
        case OFFER:
          if (!pcRef.current || !message.sdp) return;
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(message.sdp)
          );
          answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.send(JSON.stringify({ type: ANSWER, sdp: answer }));
          break;
        case ICECANDIDATES:
          if (!pcRef.current || !message.candidate) return;
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
          break;
      }
    };

    return () => {
      pcRef.current?.close();
    };
  }, [socket]);

  const handlePlayVideo = () => {
    if (localVideoRef.current) {
      localVideoRef.current
        .play()
        .catch((e) => console.error('Error playing video', e));
    }
  };

  return (
    <div className="text-black">
      Receiver
      <div className="border-black border">
        <video
          ref={localVideoRef}
          className="border-white border"
          autoPlay
          playsInline
          muted
        ></video>
        {/* {videoReady && <button onClick={handlePlayVideo}>Play Video</button>} */}
      </div>
    </div>
  );
};

export default Receiver;
