import { Socket } from 'socket.io-client';

export interface ChatMessage {
    id: string;
    sender: string;
    message: string;
    timestamp: string;
    isSystem?: boolean;
    isSelf?: boolean;
}

export type MessageCallback = (message: ChatMessage) => void;

export class ChatManager {
    private socket: Socket;
    private roomId: string | null = null;
    private onMessageReceived: MessageCallback | null = null;

    constructor(socket: Socket) {
        this.socket = socket;
        this.setupListeners();
    }

    public setRoomId(id: string) {
        this.roomId = id;
    }

    public onMessage(callback: MessageCallback) {
        this.onMessageReceived = callback;
    }

    private setupListeners() {
        this.socket.on('chat-message', (payload: any) => {
            const msg: ChatMessage = {
                id: Math.random().toString(36).substr(2, 9),
                sender: payload.sender,
                message: payload.message,
                timestamp: payload.timestamp || new Date().toISOString(),
                isSelf: false
            };
            this.onMessageReceived?.(msg);
        });
    }

    public sendMessage(message: string, senderName: string) {
        if (!this.roomId || !message.trim()) return;

        const payload = {
            message,
            sender: senderName,
            roomId: this.roomId
        };

        this.socket.emit('chat-message', payload);

        // Echo back to self immediately
        const selfMsg: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            sender: senderName,
            message: message,
            timestamp: new Date().toISOString(),
            isSelf: true
        };
        this.onMessageReceived?.(selfMsg);
    }
}
