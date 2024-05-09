import { WebSocket, WebSocketServer } from "ws";
import { ANSWER, ICECANDIDATES, OFFER, RECEIVER, SENDER } from "./messages/messages";

let SenderSocket: null | WebSocket = null
let ReceieverSocket: null | WebSocket = null

const wss= new  WebSocketServer({port:8080})

wss.on("connection",(ws:WebSocket)=>{
    
    ws.on("message",(data:any)=>{
        const message = JSON.parse(data)
        console.log(message,"event data")
        switch (message.type) {
            case SENDER:
                SenderSocket = ws
                break;
        
            case RECEIVER:
                ReceieverSocket = ws
                break;

            case OFFER:
                console.log("control offer")
                if(ws !== SenderSocket) return;
                console.log("offer set")                
                ReceieverSocket?.send(JSON.stringify({ type:OFFER, sdp:message.sdp}))
                break;
            case ANSWER:
                if(ws !== ReceieverSocket) return;
                console.log("answer set")                
                SenderSocket?.send(JSON.stringify({ type:ANSWER , sdp: message.sdp }))
                break;
            case ICECANDIDATES:
                if(SenderSocket === ws){
                    ReceieverSocket?.send(JSON.stringify({type:ICECANDIDATES,candidate:message.candidate}))
                }
                break;
            case ICECANDIDATES:
                if(ReceieverSocket === ws){
                    SenderSocket?.send(JSON.stringify({type:ICECANDIDATES,candidate:message.candidate}))
                }
                break;
        }
    })
})