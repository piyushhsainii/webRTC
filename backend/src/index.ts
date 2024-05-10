import { WebSocket, WebSocketServer } from 'ws';
import {
  ANSWER,
  ICECANDIDATES,
  OFFER,
  RECEIVER,
  SENDER,
} from './messages/messages';

interface IMessage {
  type: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    const message: IMessage = JSON.parse(data);
    console.log(message, 'event data');

    switch (message.type) {
      case SENDER:
        senderSocket = ws;
        break;
      case RECEIVER:
        receiverSocket = ws;
        break;
      case OFFER:
        if (ws === senderSocket && receiverSocket) {
          console.log('Offer received from sender, relaying to receiver');
          receiverSocket.send(
            JSON.stringify({ type: OFFER, sdp: message.sdp })
          );
        }
        if (ws === receiverSocket && senderSocket) {
          console.log('Offer received from sender, relaying to receiver');
          senderSocket.send(
            JSON.stringify({ type: OFFER, sdp: message.sdp })
          );
        }
        break;
      case ANSWER:
        if (ws === receiverSocket && senderSocket) {
          console.log('Answer received from receiver, relaying to sender');
          senderSocket.send(JSON.stringify({ type: ANSWER, sdp: message.sdp }));
        }
        if (ws === senderSocket && receiverSocket) {
          console.log('Answer received from receiver, relaying to sender');
          receiverSocket.send(JSON.stringify({ type: ANSWER, sdp: message.sdp }));
        }
        break;
      case ICECANDIDATES:
        const targetSocket =
          ws === senderSocket ? receiverSocket : senderSocket;
        if (targetSocket && message.candidate) {
          targetSocket.send(
            JSON.stringify({
              type: ICECANDIDATES,
              candidate: message.candidate,
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
