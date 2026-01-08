export class RecordingManager {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private isRecording: boolean = false;
    private onStopCallback: ((blob: Blob) => void) | null = null;

    constructor() { }

    public startRecording(stream: MediaStream) {
        if (this.isRecording) return;

        try {
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
        } catch (e) {
            // Fallback for Safari/Legacy
            try {
                this.mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm'
                });
            } catch (e2) {
                console.error("MediaRecorder not supported or codec unavailable", e2);
                return;
            }
        }

        this.recordedChunks = [];
        this.isRecording = true;

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, {
                type: 'video/webm'
            });
            this.isRecording = false;

            if (this.onStopCallback) {
                this.onStopCallback(blob);
            } else {
                this.downloadRecording(blob);
            }
        };

        this.mediaRecorder.start(1000); // Collect 1s chunks
    }

    public stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.mediaRecorder.stop();
        this.isRecording = false;
    }

    public setOnStop(callback: (blob: Blob) => void) {
        this.onStopCallback = callback;
    }

    private downloadRecording(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `remotex-session-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    public isActive(): boolean {
        return this.isRecording;
    }
}
