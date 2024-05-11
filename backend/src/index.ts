import { WebSocket, WebSocketServer } from 'ws';
import {
  ANSWER,
  ICECANDIDATES,
  OFFER,
  USER1,
  USER2
} from './messages/messages';

interface IMessage {
  type: string;
  payload: {
      sdp: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
      type?: "sender" | "receiver";
  };
}
let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    const message: IMessage = JSON.parse(data);

    switch (message.type) {
      case USER1:
        senderSocket = ws;
        break;
      case USER2:
        receiverSocket = ws;
        break;
      case OFFER:
        if (ws === senderSocket && receiverSocket) {
          receiverSocket.send(
            JSON.stringify(
              { 
                type: OFFER,
                payload: { sdp: message.payload.sdp }
                })
          );
        }
        if (ws === receiverSocket && senderSocket) {
          senderSocket.send(
            JSON.stringify(
              { 
                type: OFFER,
                payload: { sdp: message.payload.sdp }}
            )
          );
        }
        break;
      case ANSWER:
        if (ws === receiverSocket && senderSocket) {
          senderSocket.send(JSON.stringify({ type: ANSWER,payload: { sdp: message.payload.sdp }}));
        }
        if (ws === senderSocket && receiverSocket) {
          receiverSocket.send(JSON.stringify({ type: ANSWER,  payload: { sdp: message.payload.sdp }}));
        }
        break;
      case ICECANDIDATES:
        const targetSocket =
          ws === senderSocket ? receiverSocket : senderSocket;

        if (targetSocket && message.payload.candidate) {
          targetSocket.send(

            JSON.stringify({
              type: ICECANDIDATES,
              payload:{
                candidate:message.payload.candidate
              }
            })

          );
        }
        break;
    }
  });

  ws.on('close', () => {
    if (ws === senderSocket) senderSocket = null;
    if (ws === receiverSocket) receiverSocket = null;
    console.log('WebSocket connection closed');
  });
});
