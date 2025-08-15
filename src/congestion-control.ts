/**
 * TCP-like Congestion Control Implementation
 * Supports multiple congestion control algorithms with full configurability
 */

export interface CongestionControlConfig {
  // Basic configuration
  initialCwnd: number;           // Initial congestion window size (in packets)
  initialSsthresh: number;       // Initial slow start threshold
  minRto: number;               // Minimum RTO in milliseconds
  maxRto: number;               // Maximum RTO in milliseconds
  rttAlpha: number;             // RTT smoothing factor (0.125 for RFC 6298)
  rttBeta: number;              // RTT variation factor (0.25 for RFC 6298)
  
  // Algorithm-specific parameters
  algorithm: 'reno' | 'cubic' | 'bbr' | 'vegas' | 'bic';
  
  // Reno/Cubic specific
  fastRetransmitThreshold: number;  // Number of duplicate ACKs for fast retransmit
  fastRecoveryMultiplier: number;   // Multiplier for fast recovery (usually 0.5)
  
  // CUBIC specific
  cubicBeta: number;            // CUBIC beta parameter (0.7 for RFC 8312)
  cubicC: number;               // CUBIC scaling factor (0.4 for RFC 8312)
  
  // BBR specific
  bbrMinRttWindow: number;      // Window for min RTT measurement (ms)
  bbrProbeRttDuration: number;  // Probe RTT duration (ms)
  bbrBtlBwFilterLength: number; // Bottleneck bandwidth filter length
  
  // Vegas specific
  vegasAlpha: number;           // Vegas alpha parameter (1-3 packets)
  vegasBeta: number;            // Vegas beta parameter (3-6 packets)
  vegasGamma: number;           // Vegas gamma parameter (1-2 packets)
  
  // BIC specific
  bicLowWindow: number;         // BIC low window threshold
  bicMaxIncrement: number;      // BIC maximum increment
  bicMinRttWindow: number;      // BIC minimum RTT window
  
  // General behavior
  enableEcn: boolean;           // Enable Explicit Congestion Notification
  enableSack: boolean;          // Enable Selective ACK
  enableTimestamps: boolean;    // Enable TCP timestamps
}

export interface CongestionState {
  cwnd: number;                 // Current congestion window size
  ssthresh: number;             // Slow start threshold
  rtt: number;                  // Current RTT estimate
  rttVar: number;              // RTT variation
  rto: number;                 // Retransmission timeout
  inSlowStart: boolean;        // Whether in slow start phase
  inRecovery: boolean;         // Whether in fast recovery
  inCongestionAvoidance: boolean; // Whether in congestion avoidance
  duplicateAcks: number;       // Number of duplicate ACKs
  lastAckedSeq: number;        // Last acknowledged sequence number
  minRtt: number;              // Minimum RTT observed
  maxRtt: number;              // Maximum RTT observed
  packetsInFlight: number;     // Number of packets in flight
  totalPacketsSent: number;    // Total packets sent
  totalPacketsAcked: number;   // Total packets acknowledged
  totalPacketsLost: number;    // Total packets lost
  totalRetransmissions: number; // Total retransmissions
  algorithmState: any;         // Algorithm-specific state
}

export class CongestionControl {
  private config: CongestionControlConfig;
  private state: CongestionState;
  private rttSamples: number[] = [];
  private maxRttSamples = 100;
  private lastUpdateTime: number = Date.now();

  constructor(config: Partial<CongestionControlConfig> = {}) {
    this.config = this.getDefaultConfig();
    Object.assign(this.config, config);
    
    this.state = {
      cwnd: this.config.initialCwnd,
      ssthresh: this.config.initialSsthresh,
      rtt: 0,
      rttVar: 0,
      rto: this.config.minRto,
      inSlowStart: true,
      inRecovery: false,
      inCongestionAvoidance: false,
      duplicateAcks: 0,
      lastAckedSeq: 0,
      minRtt: Infinity,
      maxRtt: 0,
      packetsInFlight: 0,
      totalPacketsSent: 0,
      totalPacketsAcked: 0,
      totalPacketsLost: 0,
      totalRetransmissions: 0,
      algorithmState: {}
    };

    this.initializeAlgorithm();
  }

  private getDefaultConfig(): CongestionControlConfig {
    return {
      initialCwnd: 400, // Increased for higher bandwidth
      initialSsthresh: 800, // Increased slow start threshold
      minRto: 100, // Reduced for faster recovery
      maxRto: 60000,
      rttAlpha: 0.125,
      rttBeta: 0.25,
      algorithm: 'reno',
      fastRetransmitThreshold: 3,
      fastRecoveryMultiplier: 0.5,
      cubicBeta: 0.7,
      cubicC: 0.4,
      bbrMinRttWindow: 10000,
      bbrProbeRttDuration: 200,
      bbrBtlBwFilterLength: 10,
      vegasAlpha: 1,
      vegasBeta: 3,
      vegasGamma: 1,
      bicLowWindow: 14,
      bicMaxIncrement: 16,
      bicMinRttWindow: 1000,
      enableEcn: false,
      enableSack: false,
      enableTimestamps: true
    };
  }

  private initializeAlgorithm(): void {
    switch (this.config.algorithm) {
      case 'reno':
        this.initializeReno();
        break;
      case 'cubic':
        this.initializeCubic();
        break;
      case 'bbr':
        this.initializeBBR();
        break;
      case 'vegas':
        this.initializeVegas();
        break;
      case 'bic':
        this.initializeBIC();
        break;
    }
  }

  private initializeReno(): void {
    this.state.algorithmState = {
      recoveryPoint: 0,
      fastRecoveryExit: 0
    };
  }

  private initializeCubic(): void {
    this.state.algorithmState = {
      epochStart: 0,
      lastMaxCwnd: 0,
      bicOriginPoint: 0,
      bicK: 0,
      bicTargetCwnd: 0,
      bicWindowTarget: 0
    };
  }

  private initializeBBR(): void {
    this.state.algorithmState = {
      btlBw: 0,
      rtProp: Infinity,
      deliveryRate: 0,
      roundCount: 0,
      roundStart: 0,
      nextRoundDelivered: 0,
      probeRttDone: 0,
      probeRttRoundDone: 0,
      minRttStamp: 0,
      probeRttMinStamp: 0,
      probeRttMinRtt: Infinity,
      btlBwFilter: [],
      mode: 'STARTUP',
      pacingGain: 1.25,
      cwndGain: 2.0
    };
  }

  private initializeVegas(): void {
    this.state.algorithmState = {
      baseRtt: Infinity,
      expectedThroughput: 0,
      actualThroughput: 0,
      diff: 0
    };
  }

  private initializeBIC(): void {
    this.state.algorithmState = {
      lowWindow: this.config.bicLowWindow,
      maxIncrement: this.config.bicMaxIncrement,
      smoothPart: 0,
      bicOriginPoint: 0,
      bicTargetCwnd: 0
    };
  }

  /**
   * Called when a packet is sent
   */
  public onPacketSent(sequenceNumber: number): void {
    this.state.packetsInFlight++;
    this.state.totalPacketsSent++;
    this.lastUpdateTime = Date.now();
    
    console.log(`[CONGESTION-CORE] Packet ${sequenceNumber} sent - packetsInFlight: ${this.state.packetsInFlight}, cwnd: ${this.state.cwnd}`);
  }

  /**
   * Called when a packet is acknowledged
   */
  public onPacketAcked(sequenceNumber: number, rtt?: number): void {
    this.state.packetsInFlight--;
    this.state.totalPacketsAcked++;
    this.lastUpdateTime = Date.now();

    if (rtt !== undefined) {
      this.updateRTT(rtt);
    }

    // Reset duplicate ACK counter for new ACK
    if (sequenceNumber > this.state.lastAckedSeq) {
      this.state.duplicateAcks = 0;
      this.state.lastAckedSeq = sequenceNumber;
    } else {
      this.state.duplicateAcks++;
    }

    this.handleAck(sequenceNumber);
    
    console.log(`[CONGESTION-CORE] Packet ${sequenceNumber} acked - packetsInFlight: ${this.state.packetsInFlight}, cwnd: ${this.state.cwnd}, rtt: ${rtt}ms`);
  }

  /**
   * Called when a packet timeout occurs
   */
  public onTimeout(): void {
    this.state.totalRetransmissions++;
    this.state.totalPacketsLost++;
    this.lastUpdateTime = Date.now();

    this.handleTimeout();
    
    console.log(`[CONGESTION-CORE] Timeout occurred - cwnd: ${this.state.cwnd}, ssthresh: ${this.state.ssthresh}, totalLost: ${this.state.totalPacketsLost}`);
  }

  /**
   * Called when duplicate ACKs are received
   */
  public onDuplicateAck(): void {
    this.state.duplicateAcks++;
    this.lastUpdateTime = Date.now();

    console.log(`[CONGESTION-CORE] Duplicate ACK received - count: ${this.state.duplicateAcks}, threshold: ${this.config.fastRetransmitThreshold}`);

    if (this.state.duplicateAcks >= this.config.fastRetransmitThreshold) {
      console.log(`[CONGESTION-CORE] Fast retransmit triggered`);
      this.handleFastRetransmit();
    }
  }

  /**
   * Get current congestion state
   */
  public getState(): CongestionState {
    return { ...this.state };
  }

  /**
   * Get current congestion window size
   */
  public getCwnd(): number {
    return this.state.cwnd;
  }

  /**
   * Get current RTO
   */
  public getRTO(): number {
    return this.state.rto;
  }

  /**
   * Check if we can send a packet
   */
  public canSendPacket(): boolean {
    const canSend = this.state.packetsInFlight < this.state.cwnd;
    console.log(`[CONGESTION-CORE] canSendPacket: ${canSend} (packetsInFlight: ${this.state.packetsInFlight}, cwnd: ${this.state.cwnd})`);
    return canSend;
  }

  /**
   * Update RTT estimate using Jacobson/Karels algorithm
   */
  private updateRTT(sampleRtt: number): void {
    if (this.state.rtt === 0) {
      // First RTT sample
      this.state.rtt = sampleRtt;
      this.state.rttVar = sampleRtt / 2;
    } else {
      // Update RTT variation
      this.state.rttVar = (1 - this.config.rttBeta) * this.state.rttVar + 
                          this.config.rttBeta * Math.abs(this.state.rtt - sampleRtt);
      
      // Update RTT estimate
      this.state.rtt = (1 - this.config.rttAlpha) * this.state.rtt + 
                       this.config.rttAlpha * sampleRtt;
    }

    // Update RTO
    this.state.rto = Math.max(
      this.config.minRto,
      Math.min(this.config.maxRto, this.state.rtt + 4 * this.state.rttVar)
    );

    // Update min/max RTT
    this.state.minRtt = Math.min(this.state.minRtt, sampleRtt);
    this.state.maxRtt = Math.max(this.state.maxRtt, sampleRtt);

    // Store RTT sample
    this.rttSamples.push(sampleRtt);
    if (this.rttSamples.length > this.maxRttSamples) {
      this.rttSamples.shift();
    }

    // Algorithm-specific RTT handling
    this.handleRTTUpdate(sampleRtt);
  }

  /**
   * Handle ACK based on current algorithm
   */
  private handleAck(sequenceNumber: number): void {
    switch (this.config.algorithm) {
      case 'reno':
        this.handleRenoAck(sequenceNumber);
        break;
      case 'cubic':
        this.handleCubicAck(sequenceNumber);
        break;
      case 'bbr':
        this.handleBBRAck(sequenceNumber);
        break;
      case 'vegas':
        this.handleVegasAck(sequenceNumber);
        break;
      case 'bic':
        this.handleBICAck(sequenceNumber);
        break;
    }
  }

  /**
   * Handle timeout based on current algorithm
   */
  private handleTimeout(): void {
    switch (this.config.algorithm) {
      case 'reno':
        this.handleRenoTimeout();
        break;
      case 'cubic':
        this.handleCubicTimeout();
        break;
      case 'bbr':
        this.handleBBRTimeout();
        break;
      case 'vegas':
        this.handleVegasTimeout();
        break;
      case 'bic':
        this.handleBICTimeout();
        break;
    }
  }

  /**
   * Handle fast retransmit based on current algorithm
   */
  private handleFastRetransmit(): void {
    switch (this.config.algorithm) {
      case 'reno':
        this.handleRenoFastRetransmit();
        break;
      case 'cubic':
        this.handleCubicFastRetransmit();
        break;
      case 'bbr':
        this.handleBBRFastRetransmit();
        break;
      case 'vegas':
        this.handleVegasFastRetransmit();
        break;
      case 'bic':
        this.handleBICFastRetransmit();
        break;
    }
  }

  /**
   * Handle RTT update based on current algorithm
   */
  private handleRTTUpdate(sampleRtt: number): void {
    switch (this.config.algorithm) {
      case 'reno':
        // Reno doesn't use RTT for congestion control beyond RTO calculation
        break;
      case 'cubic':
        this.handleCubicRTTUpdate(sampleRtt);
        break;
      case 'bbr':
        this.handleBBRRTTUpdate(sampleRtt);
        break;
      case 'vegas':
        this.handleVegasRTTUpdate(sampleRtt);
        break;
      case 'bic':
        this.handleBICRTTUpdate(sampleRtt);
        break;
    }
  }

  // Reno Algorithm Implementation
  private handleRenoAck(sequenceNumber: number): void {
    const oldCwnd = this.state.cwnd;
    
    if (this.state.inRecovery) {
      if (sequenceNumber >= this.state.algorithmState.recoveryPoint) {
        this.state.inRecovery = false;
        this.state.inCongestionAvoidance = true;
        this.state.cwnd = this.state.ssthresh;
        console.log(`[CONGESTION-RENO] Recovery complete - cwnd: ${oldCwnd} -> ${this.state.cwnd}`);
      }
    } else {
      if (this.state.inSlowStart) {
        this.state.cwnd += 1;
        if (this.state.cwnd >= this.state.ssthresh) {
          this.state.inSlowStart = false;
          this.state.inCongestionAvoidance = true;
          console.log(`[CONGESTION-RENO] Slow start -> Congestion avoidance - cwnd: ${this.state.cwnd}`);
        } else {
          console.log(`[CONGESTION-RENO] Slow start - cwnd: ${oldCwnd} -> ${this.state.cwnd}`);
        }
      } else {
        // Congestion avoidance: increase by 1/cwnd per ACK
        this.state.cwnd += 1 / this.state.cwnd;
        console.log(`[CONGESTION-RENO] Congestion avoidance - cwnd: ${oldCwnd} -> ${this.state.cwnd}`);
      }
    }
  }

  private handleRenoTimeout(): void {
    const oldCwnd = this.state.cwnd;
    this.state.ssthresh = Math.max(10, this.state.cwnd / 2); // Minimum ssthresh of 10
    this.state.cwnd = Math.max(5, this.state.cwnd / 4); // Minimum cwnd of 5, less aggressive reduction
    this.state.inSlowStart = true;
    this.state.inRecovery = false;
    this.state.inCongestionAvoidance = false;
    
    console.log(`[CONGESTION-RENO] Timeout - cwnd: ${oldCwnd} -> ${this.state.cwnd}, ssthresh: ${this.state.ssthresh}`);
  }

  private handleRenoFastRetransmit(): void {
    const oldCwnd = this.state.cwnd;
    this.state.ssthresh = Math.max(10, this.state.cwnd / 2); // Minimum ssthresh of 10
    this.state.cwnd = Math.max(10, this.state.ssthresh + 3); // Minimum cwnd of 10 for fast recovery
    this.state.inRecovery = true;
    this.state.inSlowStart = false;
    this.state.inCongestionAvoidance = false;
    this.state.algorithmState.recoveryPoint = this.state.lastAckedSeq;
    
    console.log(`[CONGESTION-RENO] Fast retransmit - cwnd: ${oldCwnd} -> ${this.state.cwnd}, ssthresh: ${this.state.ssthresh}`);
  }

  // CUBIC Algorithm Implementation
  private handleCubicAck(sequenceNumber: number): void {
    const now = Date.now();
    const t = (now - this.state.algorithmState.epochStart) / 1000; // Convert to seconds
    
    if (this.state.inSlowStart) {
      this.state.cwnd += 1;
      if (this.state.cwnd >= this.state.ssthresh) {
        this.state.inSlowStart = false;
        this.state.inCongestionAvoidance = true;
        this.state.algorithmState.epochStart = now;
        this.state.algorithmState.lastMaxCwnd = this.state.cwnd;
      }
    } else {
      // CUBIC window calculation
      const K = Math.cbrt((this.state.algorithmState.lastMaxCwnd * (1 - this.config.cubicBeta)) / this.config.cubicC);
      const targetCwnd = this.config.cubicC * Math.pow(t - K, 3) + this.state.algorithmState.lastMaxCwnd;
      
      this.state.cwnd = Math.min(targetCwnd, this.state.cwnd + 1);
    }
  }

  private handleCubicTimeout(): void {
    this.state.algorithmState.lastMaxCwnd = this.state.cwnd;
    this.state.ssthresh = Math.max(2, this.state.cwnd * this.config.cubicBeta);
    this.state.cwnd = this.state.ssthresh;
    this.state.inSlowStart = true;
    this.state.inRecovery = false;
    this.state.inCongestionAvoidance = false;
    this.state.algorithmState.epochStart = Date.now();
  }

  private handleCubicFastRetransmit(): void {
    this.state.algorithmState.lastMaxCwnd = this.state.cwnd;
    this.state.ssthresh = Math.max(2, this.state.cwnd * this.config.cubicBeta);
    this.state.cwnd = this.state.ssthresh;
    this.state.inRecovery = true;
    this.state.inSlowStart = false;
    this.state.inCongestionAvoidance = false;
  }

  private handleCubicRTTUpdate(sampleRtt: number): void {
    // CUBIC doesn't use RTT for window calculation beyond RTO
  }

  // BBR Algorithm Implementation
  private handleBBRAck(sequenceNumber: number): void {
    const now = Date.now();
    
    // Update delivery rate
    const delivered = this.state.totalPacketsAcked;
    const interval = now - this.state.algorithmState.roundStart;
    
    if (interval > 0) {
      const deliveryRate = delivered / (interval / 1000);
      this.state.algorithmState.deliveryRate = deliveryRate;
      
      // Update bottleneck bandwidth
      if (deliveryRate > this.state.algorithmState.btlBw) {
        this.state.algorithmState.btlBw = deliveryRate;
      }
    }
    
    // Update round count
    if (delivered >= this.state.algorithmState.nextRoundDelivered) {
      this.state.algorithmState.roundCount++;
      this.state.algorithmState.roundStart = now;
      this.state.algorithmState.nextRoundDelivered = delivered;
    }
    
    // BBR state machine
    this.updateBBRState();
  }

  private handleBBRTimeout(): void {
    this.state.algorithmState.rtProp = Math.min(this.state.algorithmState.rtProp, this.state.rtt);
    this.state.cwnd = Math.max(4, this.state.algorithmState.rtProp * this.state.algorithmState.btlBw);
  }

  private handleBBRFastRetransmit(): void {
    // BBR doesn't use fast retransmit in the same way as Reno
    this.state.algorithmState.rtProp = Math.min(this.state.algorithmState.rtProp, this.state.rtt);
  }

  private handleBBRRTTUpdate(sampleRtt: number): void {
    // Update RTT propagation
    if (sampleRtt < this.state.algorithmState.rtProp || 
        sampleRtt > this.state.algorithmState.rtProp + this.config.bbrMinRttWindow) {
      this.state.algorithmState.rtProp = sampleRtt;
      this.state.algorithmState.minRttStamp = Date.now();
    }
  }

  private updateBBRState(): void {
    const now = Date.now();
    
    switch (this.state.algorithmState.mode) {
      case 'STARTUP':
        if (this.state.algorithmState.btlBw > 0) {
          this.state.algorithmState.mode = 'DRAIN';
        }
        break;
      case 'DRAIN':
        if (this.state.packetsInFlight <= this.getBBRInflight()) {
          this.state.algorithmState.mode = 'PROBE_BW';
        }
        break;
      case 'PROBE_BW':
        // BBR cycles through pacing gains
        break;
      case 'PROBE_RTT':
        if (now - this.state.algorithmState.probeRttDone > this.config.bbrProbeRttDuration) {
          this.state.algorithmState.mode = 'PROBE_BW';
        }
        break;
    }
  }

  private getBBRInflight(): number {
    return this.state.algorithmState.rtProp * this.state.algorithmState.btlBw;
  }

  // Vegas Algorithm Implementation
  private handleVegasAck(sequenceNumber: number): void {
    const now = Date.now();
    
    // Calculate expected and actual throughput
    const expectedThroughput = this.state.cwnd / this.state.algorithmState.baseRtt;
    const actualThroughput = this.state.totalPacketsAcked / (now / 1000);
    
    this.state.algorithmState.expectedThroughput = expectedThroughput;
    this.state.algorithmState.actualThroughput = actualThroughput;
    
    const diff = expectedThroughput - actualThroughput;
    this.state.algorithmState.diff = diff;
    
    // Vegas congestion control
    if (diff > this.config.vegasBeta) {
      // Too much congestion, decrease window
      this.state.cwnd = Math.max(2, this.state.cwnd - 1);
    } else if (diff < this.config.vegasAlpha) {
      // Not enough congestion, increase window
      this.state.cwnd += 1;
    }
    // If diff is between alpha and beta, maintain current window
  }

  private handleVegasTimeout(): void {
    this.state.ssthresh = Math.max(2, this.state.cwnd / 2);
    this.state.cwnd = 1;
    this.state.inSlowStart = true;
  }

  private handleVegasFastRetransmit(): void {
    this.state.ssthresh = Math.max(2, this.state.cwnd / 2);
    this.state.cwnd = this.state.ssthresh;
  }

  private handleVegasRTTUpdate(sampleRtt: number): void {
    // Update base RTT (minimum RTT observed)
    if (sampleRtt < this.state.algorithmState.baseRtt) {
      this.state.algorithmState.baseRtt = sampleRtt;
    }
  }

  // BIC Algorithm Implementation
  private handleBICAck(sequenceNumber: number): void {
    if (this.state.inSlowStart) {
      this.state.cwnd += 1;
      if (this.state.cwnd >= this.state.ssthresh) {
        this.state.inSlowStart = false;
        this.state.inCongestionAvoidance = true;
        this.state.algorithmState.bicOriginPoint = this.state.cwnd;
        this.state.algorithmState.bicTargetCwnd = this.state.cwnd;
      }
    } else {
      // BIC window increase
      const distance = this.state.algorithmState.bicTargetCwnd - this.state.cwnd;
      if (distance > 0) {
        const increment = Math.min(distance, this.state.algorithmState.maxIncrement);
        this.state.cwnd += increment;
      } else {
        // Binary search increase
        this.state.algorithmState.bicTargetCwnd = this.state.cwnd + 
          (this.state.algorithmState.bicOriginPoint - this.state.cwnd) / 2;
      }
    }
  }

  private handleBICTimeout(): void {
    this.state.algorithmState.bicOriginPoint = this.state.cwnd;
    this.state.ssthresh = Math.max(2, this.state.cwnd / 2);
    this.state.cwnd = this.state.ssthresh;
    this.state.inSlowStart = true;
    this.state.inRecovery = false;
    this.state.inCongestionAvoidance = false;
  }

  private handleBICFastRetransmit(): void {
    this.state.algorithmState.bicOriginPoint = this.state.cwnd;
    this.state.ssthresh = Math.max(2, this.state.cwnd / 2);
    this.state.cwnd = this.state.ssthresh;
    this.state.inRecovery = true;
    this.state.inSlowStart = false;
    this.state.inCongestionAvoidance = false;
  }

  private handleBICRTTUpdate(sampleRtt: number): void {
    // BIC doesn't use RTT for window calculation beyond RTO
  }

  /**
   * Reset congestion control state
   */
  public reset(): void {
    this.state.cwnd = this.config.initialCwnd;
    this.state.ssthresh = this.config.initialSsthresh;
    this.state.inSlowStart = true;
    this.state.inRecovery = false;
    this.state.inCongestionAvoidance = false;
    this.state.duplicateAcks = 0;
    this.state.packetsInFlight = 0;
    this.initializeAlgorithm();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CongestionControlConfig>): void {
    Object.assign(this.config, newConfig);
    if (newConfig.algorithm && newConfig.algorithm !== this.config.algorithm) {
      this.initializeAlgorithm();
    }
  }

  /**
   * Get statistics
   */
  public getStats(): any {
    return {
      algorithm: this.config.algorithm,
      cwnd: this.state.cwnd,
      ssthresh: this.state.ssthresh,
      rtt: this.state.rtt,
      rto: this.state.rto,
      packetsInFlight: this.state.packetsInFlight,
      totalPacketsSent: this.state.totalPacketsSent,
      totalPacketsAcked: this.state.totalPacketsAcked,
      totalPacketsLost: this.state.totalPacketsLost,
      totalRetransmissions: this.state.totalRetransmissions,
      lossRate: this.state.totalPacketsSent > 0 ? 
        this.state.totalPacketsLost / this.state.totalPacketsSent : 0,
      avgRtt: this.rttSamples.length > 0 ? 
        this.rttSamples.reduce((a, b) => a + b, 0) / this.rttSamples.length : 0,
      minRtt: this.state.minRtt === Infinity ? 0 : this.state.minRtt,
      maxRtt: this.state.maxRtt
    };
  }
} 