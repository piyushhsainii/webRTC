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

  async function sendVideo() {
    if (!socket) return;
    console.log('sendvideo');

    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: ICECANDIDATES, candidate: event.candidate })
        );
      }
    };

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        socket.send(JSON.stringify({ type: OFFER, sdp: pc.localDescription }));
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      stream.getTracks().forEach((track) => pc.addTrack(track));

      socket.onmessage = async (e) => {
        const message = JSON.parse(e.data);
        switch (message.type) {
          case ANSWER:
            if (message.sdp) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(message.sdp)
              );
            }
            break;
          case ICECANDIDATES:
            if (message.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
            break;
        }
      };
    } catch (error) {
      console.error('Failed to get media stream or set up connection:', error);
    }
  }

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
      </div>
      <div className='cursor-pointer' onClick={sendVideo}>share Video</div>
    </div>
  );
};

export default Receiver;
