import React, { useEffect, useRef, useState } from "react";
import { ANSWER, ICECANDIDATES, OFFER, USER2 } from "../messages/messages";
import useSocket from "../hooks/Socket";

interface IMessage {
    type: string;
    payload: {
        remoteSdp: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
        type?: "sender" | "receiver";
    };
}

const Receiver: React.FC = () => {
    const socket = useSocket();
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const [_sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [_receiverPc, setReceiverPc] = useState<RTCPeerConnection | null>(
        null
    );

    useEffect(() => {
        if (!socket) return;

        socket.onopen = () => {
            socket.send(
                JSON.stringify({
                    type: USER2,
                })
            );
        };

        socket.onmessage = async (e: MessageEvent) => {
            const message: IMessage = JSON.parse(e.data);
            console.log("\n\nmessage", message);
            switch (message.type) {
                case OFFER:
                    console.log("answer");
                    const receiverPc = new RTCPeerConnection();

                    receiverPc.ontrack = (event: RTCTrackEvent) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = new MediaStream([
                                event.track,
                            ]);
                            remoteVideoRef.current.play();
                            console.log("\ntracks:", event.track);
                        }
                    };

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
                        new RTCSessionDescription(message.payload.remoteSdp)

                    );

                    const sdp = await receiverPc.createAnswer();
                    await receiverPc.setLocalDescription(sdp);
                    setReceiverPc(receiverPc);

                    socket.send(
                        JSON.stringify({
                            type: ANSWER,
                            payload: {
                                remoteSdp: sdp,
                            },
                        })
                    );
                    break;

                case ANSWER:
                    setSendingPc((pc) => {
                        pc?.setRemoteDescription(message.payload.remoteSdp);
                        return pc;
                    });
                    break;

                case ICECANDIDATES:
                    if (message.payload.type === "sender") {
                        setReceiverPc((pc) => {
                            pc?.addIceCandidate(message.payload.candidate);
                            return pc;
                        });
                    } else {
                        setSendingPc((pc) => {
                            pc?.addIceCandidate(message.payload.candidate);
                            return pc;
                        });
                    }
                    break;
            }
        };

        return () => {
            if (localVideoRef.current && remoteVideoRef.current) {
                localVideoRef.current.srcObject = null;
                remoteVideoRef.current.srcObject = null;
            }
        };
    }, [socket]);

    async function sendVideo() {
        if (!socket) return;

        console.log("send offer");

        const senderPc = new RTCPeerConnection();

        senderPc.onicecandidate = async (event) => {
            if (event.candidate) {
                socket.send(
                    JSON.stringify({
                        type: ICECANDIDATES,
                        payload: {
                            type: "sender",
                            candidate: event.candidate,
                        },
                    })
                );
            }
        };

        senderPc.onnegotiationneeded = async () => {
            const sdp = await senderPc.createOffer();
            await senderPc.setLocalDescription(sdp);
            console.log(sdp,"local desc")
            setSendingPc(senderPc);
            socket.send(
                JSON.stringify({
                    type: OFFER,
                    payload: {
                        remoteSdp: sdp,
                    },
                })
            );
        };

        const streams = await window.navigator.mediaDevices.getUserMedia({
            video: true,
        });

        const videoTrack = streams.getVideoTracks()[0];

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([videoTrack]);
            localVideoRef.current.play();
        }

        senderPc.addTrack(videoTrack);
    }

    return (
        <div className="text-black">
            Sender
            <div className="flex border-black border gap-4">
                <video
                    ref={localVideoRef}
                    className="border-white border h-[200px] w-[200px]"
                    autoPlay
                    playsInline
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="border-white border h-[200px] w-[200px]"
                />
            </div>
            <div
                className="cursor-pointer"
                onClick={sendVideo}
            >
                share Video
            </div>
        </div>
    );
};

export default Receiver;