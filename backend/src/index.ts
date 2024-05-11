import { WebSocket, WebSocketServer } from "ws";
import {
    ANSWER,
    ICECANDIDATES,
    OFFER,
    USER1,
    USER2,
} from "./messages/messages";

interface IMessage {
    type: string;
    payload: {
        remoteSdp: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
        type?: "sender" | "receiver";
    };
}

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data) => {
        const message: IMessage = JSON.parse(data.toString());
        console.log(message, "event data");

        switch (message.type) {
            case USER1:
                senderSocket = ws;
                break;
            case USER2:
                receiverSocket = ws;
                break;
            case OFFER:
                if (ws === senderSocket && receiverSocket) {
                    console.log(
                        "Offer received from sender, relaying to receiver"
                    );
                    receiverSocket.send(
                        JSON.stringify({
                            type: OFFER,
                            payload: {
                                remoteSdp: message.payload.remoteSdp,
                            },
                        })
                    );
                }
                if (ws === receiverSocket && senderSocket) {
                    console.log(
                        "Offer received from sender, relaying to receiver"
                    );
                    senderSocket.send(
                        JSON.stringify({
                            type: OFFER,
                            payload: {
                                remoteSdp: message.payload.remoteSdp,
                            },
                        })
                    );
                }
                break;
            case ANSWER:
                if (ws === receiverSocket && senderSocket) {
                    console.log(
                        "Answer received from receiver, relaying to sender"
                    );
                    senderSocket.send(
                        JSON.stringify({
                            type: ANSWER,
                            payload: {
                                remoteSdp: message.payload.remoteSdp,
                            },
                        })
                    );
                }
                if (ws === senderSocket && receiverSocket) {
                    console.log(
                        "Answer received from receiver, relaying to sender"
                    );
                    receiverSocket.send(
                        JSON.stringify({
                            type: ANSWER,
                            payload: {
                                remoteSdp: message.payload.remoteSdp,
                            },
                        })
                    );
                }
                break;
            case ICECANDIDATES:
                const targetSocket =
                    ws === senderSocket ? receiverSocket : senderSocket;

                if (targetSocket && message.payload.candidate) {
                    targetSocket.send(
                        JSON.stringify({
                            type: ICECANDIDATES,
                            payload: {
                                candidate: message.payload.candidate,
                                type: message.payload.type,
                            },
                        })
                    );
                }
                break;
        }
    });

    ws.on("close", () => {
        if (ws === senderSocket) senderSocket = null;
        if (ws === receiverSocket) receiverSocket = null;
        console.log("WebSocket connection closed");
    });
});