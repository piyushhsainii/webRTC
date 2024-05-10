"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const messages_1 = require("./messages/messages");
let senderSocket = null;
let receiverSocket = null;
const wss = new ws_1.WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log(message, 'event data');
        switch (message.type) {
            case messages_1.SENDER:
                senderSocket = ws;
                break;
            case messages_1.RECEIVER:
                receiverSocket = ws;
                break;
            case messages_1.OFFER:
                if (ws === senderSocket && receiverSocket) {
                    console.log('Offer received from sender, relaying to receiver');
                    receiverSocket.send(JSON.stringify({ type: messages_1.OFFER, sdp: message.sdp }));
                }
                if (ws === receiverSocket && senderSocket) {
                    console.log('Offer received from sender, relaying to receiver');
                    senderSocket.send(JSON.stringify({ type: messages_1.OFFER, sdp: message.sdp }));
                }
                break;
            case messages_1.ANSWER:
                if (ws === receiverSocket && senderSocket) {
                    console.log('Answer received from receiver, relaying to sender');
                    senderSocket.send(JSON.stringify({ type: messages_1.ANSWER, sdp: message.sdp }));
                }
                if (ws === senderSocket && receiverSocket) {
                    console.log('Answer received from receiver, relaying to sender');
                    receiverSocket.send(JSON.stringify({ type: messages_1.ANSWER, sdp: message.sdp }));
                }
                break;
            case messages_1.ICECANDIDATES:
                const targetSocket = ws === senderSocket ? receiverSocket : senderSocket;
                if (targetSocket && message.candidate) {
                    targetSocket.send(JSON.stringify({
                        type: messages_1.ICECANDIDATES,
                        candidate: message.candidate,
                    }));
                }
                break;
        }
    });
    ws.on('close', () => {
        if (ws === senderSocket)
            senderSocket = null;
        if (ws === receiverSocket)
            receiverSocket = null;
        console.log('WebSocket connection closed');
    });
});
