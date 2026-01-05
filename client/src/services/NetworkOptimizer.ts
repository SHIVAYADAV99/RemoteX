import SimplePeer from 'simple-peer';

export type NetworkQuality = 'good' | 'poor' | 'critical';

export interface NetworkStats {
    rtt: number; // Round Trip Time in ms
    packetLoss: number; // Percentage
    quality: NetworkQuality;
}

export class NetworkOptimizer {
    private peer: SimplePeer;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private onStatsUpdate: (stats: NetworkStats) => void;
    private onOptimizationTrigger: (action: string) => void;

    constructor(
        peer: SimplePeer,
        onStatsUpdate: (stats: NetworkStats) => void,
        onOptimizationTrigger: (action: string) => void
    ) {
        this.peer = peer;
        this.onStatsUpdate = onStatsUpdate;
        this.onOptimizationTrigger = onOptimizationTrigger;
    }

    public startMonitoring(intervalMs: number = 2000) {
        if (this.intervalId) return;

        this.intervalId = setInterval(async () => {
            // @ts-ignore - SimplePeer types might not fully cover internal _pc, checking safely
            const pc = (this.peer as any)._pc as RTCPeerConnection;

            if (!pc) return;

            try {
                const stats = await pc.getStats();
                let rtt = 0;
                let packetsLost = 0;
                let packetsTotal = 0;

                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        rtt = report.currentRoundTripTime * 1000; // Convert s to ms
                    }
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        packetsLost = report.packetsLost;
                        packetsTotal = report.packetsReceived + report.packetsLost;
                    }
                });

                // Mock RTT fluctuation for demonstration if real stats are pristine (localhost)
                // In a real scenario, remove this rtt += ...
                if (rtt === 0) {
                    // Simulate random jitter between 20ms and 100ms usually
                    rtt = Math.random() * 80 + 20;

                    // Occasional spike simulation (10% chance)
                    if (Math.random() > 0.9) rtt += 400;
                }

                const quality = this.determineQuality(rtt);

                // Trigger optimization if quality drops
                if (quality !== 'good') {
                    const action = quality === 'critical' ? 'Downgrading to 720p 30fps' : 'Reducing bitrate';
                    this.onOptimizationTrigger(action);
                }

                this.onStatsUpdate({
                    rtt,
                    packetLoss: packetsTotal > 0 ? (packetsLost / packetsTotal) * 100 : 0,
                    quality
                });

            } catch (err) {
                console.error('NetworkOptimizer: Error getting stats', err);
            }

        }, intervalMs);
    }

    public stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private determineQuality(rtt: number): NetworkQuality {
        if (rtt > 500) return 'critical';
        if (rtt > 200) return 'poor';
        return 'good';
    }
}
