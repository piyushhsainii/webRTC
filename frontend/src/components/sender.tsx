import React, { useEffect } from 'react';
import { ANSWER, ICECANDIDATES, OFFER, SENDER } from '../messages/messages';
import useSocket from '../hooks/Socket';

const Sender: React.FC = () => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: SENDER,
        })
      );
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
    <div style={{ cursor: 'pointer' }} onClick={sendVideo}>
      Sender
    </div>
  );
};

export default Sender;
