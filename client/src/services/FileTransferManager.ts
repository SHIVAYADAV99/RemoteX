import { Socket } from 'socket.io-client';

export interface FileChunk {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    chunkIndex: number;
    totalChunks: number;
    data: string; // Base64
}

export interface IncomingFileStatus {
    id: string;
    name: string;
    size: number;
    receivedChunks: number;
    totalChunks: number;
    chunks: string[];
    isComplete: boolean;
}

export type FileProgressCallback = (progress: number, fileId: string) => void;
export type FileCompleteCallback = (file: Blob, fileName: string) => void;

export class FileTransferManager {
    private socket: Socket;
    private roomId: string | null = null;
    private CHUNK_SIZE = 16 * 1024; // 16KB chunks to prevent socket flooding
    private activeUploads: Map<string, boolean> = new Map();
    private incomingFiles: Map<string, IncomingFileStatus> = new Map();

    private onProgress: FileProgressCallback | null = null;
    private onComplete: FileCompleteCallback | null = null;

    constructor(socket: Socket) {
        this.socket = socket;
        this.setupListeners();
    }

    public setRoomId(id: string) {
        this.roomId = id;
    }

    public setCallbacks(onProgress: FileProgressCallback, onComplete: FileCompleteCallback) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
    }

    private setupListeners() {
        this.socket.on('file-transfer', (payload: FileChunk) => {
            this.handleIncomingChunk(payload);
        });
    }

    public async sendFile(file: File) {
        if (!this.roomId) {
            console.error('Room ID not set for file transfer');
            return;
        }

        const fileId = Math.random().toString(36).substr(2, 9);
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        this.activeUploads.set(fileId, true);

        console.log(`Starting transfer: ${file.name} (${file.size} bytes) in ${totalChunks} chunks`);

        for (let i = 0; i < totalChunks; i++) {
            if (!this.activeUploads.get(fileId)) break; // Cancelled

            const start = i * this.CHUNK_SIZE;
            const end = Math.min(file.size, start + this.CHUNK_SIZE);
            const chunkBlob = file.slice(start, end);
            const base64Data = await this.blobToBase64(chunkBlob);

            const chunkPayload: FileChunk = {
                fileId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                chunkIndex: i,
                totalChunks,
                data: base64Data
            };

            this.socket.emit('file-transfer', { ...chunkPayload, roomId: this.roomId });

            // Calculate progress
            const progress = Math.round(((i + 1) / totalChunks) * 100);
            this.onProgress?.(progress, fileId);

            // Small delay to prevent network congestion
            if (i % 10 === 0) await new Promise(r => setTimeout(r, 10));
        }
    }

    private handleIncomingChunk(chunk: FileChunk) {
        let fileStatus = this.incomingFiles.get(chunk.fileId);

        if (!fileStatus) {
            fileStatus = {
                id: chunk.fileId,
                name: chunk.fileName,
                size: chunk.fileSize,
                receivedChunks: 0,
                totalChunks: chunk.totalChunks,
                chunks: new Array(chunk.totalChunks),
                isComplete: false
            };
            this.incomingFiles.set(chunk.fileId, fileStatus);
            console.log(`Receiving new file: ${chunk.fileName}`);
        }

        fileStatus.chunks[chunk.chunkIndex] = chunk.data;
        fileStatus.receivedChunks++;

        const progress = Math.round((fileStatus.receivedChunks / fileStatus.totalChunks) * 100);
        this.onProgress?.(progress, chunk.fileId);

        if (fileStatus.receivedChunks === fileStatus.totalChunks) {
            this.reassembleFile(fileStatus, chunk.fileType);
        }
    }

    private async reassembleFile(fileStatus: IncomingFileStatus, type: string) {
        console.log(`File complete: ${fileStatus.name}`);
        fileStatus.isComplete = true;

        // Convert base64 chunks back to Blob
        const blobParts = await Promise.all(fileStatus.chunks.map(chunk => fetch(`data:${type};base64,${chunk}`).then(res => res.blob())));
        const finalBlob = new Blob(blobParts, { type });

        this.onComplete?.(finalBlob, fileStatus.name);
        this.incomingFiles.delete(fileStatus.id); // Cleanup memory
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g., "data:image/png;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    public cancelTransfer(fileId: string) {
        this.activeUploads.set(fileId, false);
        this.incomingFiles.delete(fileId);
    }
}
