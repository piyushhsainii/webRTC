"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const messages_1 = require("./messages/messages");
let SenderSocket = null;
let ReceieverSocket = null;
const wss = new ws_1.WebSocketServer({ port: 8080 });
wss.on("connection", (ws) => {
    ws.on("message", (data) => {
        const message = JSON.parse(data);
        console.log(message, "event data");
        switch (message.type) {
            case messages_1.SENDER:
                SenderSocket = ws;
                break;
            case messages_1.RECEIVER:
                ReceieverSocket = ws;
                break;
            case messages_1.OFFER:
                console.log("control offer");
                if (ws !== SenderSocket)
                    return;
                console.log("offer set");
                ReceieverSocket === null || ReceieverSocket === void 0 ? void 0 : ReceieverSocket.send(JSON.stringify({ type: messages_1.OFFER, sdp: message.sdp }));
                break;
            case messages_1.ANSWER:
                if (ws !== ReceieverSocket)
                    return;
                console.log("answer set");
                SenderSocket === null || SenderSocket === void 0 ? void 0 : SenderSocket.send(JSON.stringify({ type: messages_1.ANSWER, sdp: message.sdp }));
                break;
            case messages_1.ICECANDIDATES:
                if (SenderSocket === ws) {
                    ReceieverSocket === null || ReceieverSocket === void 0 ? void 0 : ReceieverSocket.send(JSON.stringify({ type: messages_1.ICECANDIDATES, candidate: message.candidate }));
                }
                break;
            case messages_1.ICECANDIDATES:
                if (ReceieverSocket === ws) {
                    SenderSocket === null || SenderSocket === void 0 ? void 0 : SenderSocket.send(JSON.stringify({ type: messages_1.ICECANDIDATES, candidate: message.candidate }));
                }
                break;
        }
    });
});
