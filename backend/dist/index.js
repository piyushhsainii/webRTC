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
        switch (message.type) {
            case messages_1.USER1:
                senderSocket = ws;
                break;
            case messages_1.USER2:
                receiverSocket = ws;
                break;
            case messages_1.OFFER:
                if (ws === senderSocket && receiverSocket) {
                    receiverSocket.send(JSON.stringify({
                        type: messages_1.OFFER,
                        payload: { sdp: message.payload.sdp }
                    }));
                }
                if (ws === receiverSocket && senderSocket) {
                    senderSocket.send(JSON.stringify({
                        type: messages_1.OFFER,
                        payload: { sdp: message.payload.sdp }
                    }));
                }
                break;
            case messages_1.ANSWER:
                if (ws === receiverSocket && senderSocket) {
                    senderSocket.send(JSON.stringify({ type: messages_1.ANSWER, payload: { sdp: message.payload.sdp } }));
                }
                if (ws === senderSocket && receiverSocket) {
                    receiverSocket.send(JSON.stringify({ type: messages_1.ANSWER, payload: { sdp: message.payload.sdp } }));
                }
                break;
            case messages_1.ICECANDIDATES:
                const targetSocket = ws === senderSocket ? receiverSocket : senderSocket;
                if (targetSocket && message.payload.candidate) {
                    targetSocket.send(JSON.stringify({
                        type: messages_1.ICECANDIDATES,
                        payload: {
                            candidate: message.payload.candidate
                        }
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
