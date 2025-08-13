// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import { RemoteInfo } from "node:dgram";
import { append_crc_legacy, SoeOpcode, Soeprotocol } from "h1emu-core";
import Client from "./soeclient";
import SOEClient from "./soeclient";
import { crc_length_options } from "../../types/soeserver";
import { LogicalPacket } from "./logicalPacket";
import { json } from "types/shared";
import { SOEOutputChannels } from "./soeoutputstream";
import dgram from "node:dgram";
import { PacketsQueue } from "./PacketsQueue";
const debug = require("debug")("SOEServer");

// Constants for better maintainability
const DEFAULT_CONFIG = {
  UDP_LENGTH: 512,
  WAIT_TIME_MS: 24,
  KEEP_ALIVE_TIMEOUT: 40000,
  RESEND_TIMEOUT: 250,
  MAX_RESENT_TRIES: 24,
  CRC_LENGTH: 2 as crc_length_options,
  EVENT_LOOP_LAG_SAMPLES: 100,
  PERFORMANCE_INTERVAL: 100,
  STATS_RESET_INTERVAL: 60000,
  BUFFER_POOL_SIZE: 1024 * 1024, // 1MB
  SOCKET_BUFFER_SIZE: 2 * 1024 * 1024 // 2MB
} as const;

export class SOEServer extends EventEmitter {
  private readonly _serverPort: number;
  private readonly _cryptoKey: Uint8Array;
  private _protocol!: Soeprotocol;
  private _udpLength: number = DEFAULT_CONFIG.UDP_LENGTH;
  _useEncryption: boolean = true;
  private readonly _clients: Map<string, SOEClient> = new Map();
  private readonly _connection: dgram.Socket;
  private readonly _connectionv6: dgram.Socket;
  private readonly _crcSeed: number = Math.floor(Math.random() * 255);
  private _crcLength: crc_length_options = DEFAULT_CONFIG.CRC_LENGTH;
  private _waitTimeMs: number = DEFAULT_CONFIG.WAIT_TIME_MS;
  keepAliveTimeoutTime: number = DEFAULT_CONFIG.KEEP_ALIVE_TIMEOUT;
  private readonly _maxMultiBufferSize: number;
  private _resendTimeout: number = DEFAULT_CONFIG.RESEND_TIMEOUT;
  private _maxResentTries: number = DEFAULT_CONFIG.MAX_RESENT_TRIES;
  private _allowRawDataReception: boolean = false;
  private _packetResetInterval: NodeJS.Timeout | undefined;

  // Performance monitoring
  public avgEventLoopLag: number = 0;
  public eventLoopLagValues: number[] = [];
  public currentEventLoopLag: number = 0;
  constructor(serverPort: number, cryptoKey: Uint8Array) {
    super();

    // Initialize core properties
    Buffer.poolSize = DEFAULT_CONFIG.BUFFER_POOL_SIZE;
    this._serverPort = serverPort;
    this._cryptoKey = cryptoKey;
    this._maxMultiBufferSize = this._udpLength - 4 - this._crcLength;

    // Create UDP sockets
    this._connection = this._createSocket("udp4");
    this._connectionv6 = this._createSocket("udp6");

    // Initialize performance monitoring
    this._initializePerformanceMonitoring();
  }

  private _createSocket(type: "udp4" | "udp6"): dgram.Socket {
    return dgram.createSocket({
      type,
      reuseAddr: true,
      recvBufferSize: DEFAULT_CONFIG.SOCKET_BUFFER_SIZE,
      sendBufferSize: DEFAULT_CONFIG.BUFFER_POOL_SIZE
    });
  }

  private _initializePerformanceMonitoring(): void {
    try {
      const obs = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        this.currentEventLoopLag =
          Math.floor(entry.duration) - DEFAULT_CONFIG.PERFORMANCE_INTERVAL;

        // Maintain rolling average of event loop lag
        if (
          this.eventLoopLagValues.length >=
          DEFAULT_CONFIG.EVENT_LOOP_LAG_SAMPLES
        ) {
          this.eventLoopLagValues.shift();
        }

        this.eventLoopLagValues.push(this.currentEventLoopLag);
        this.avgEventLoopLag =
          this.eventLoopLagValues.reduce((sum, val) => sum + val, 0) /
          this.eventLoopLagValues.length;

        performance.clearMarks();
        performance.clearMeasures();
        performance.mark("A");
      });

      obs.observe({ entryTypes: ["measure"], buffered: true });
      performance.mark("A");

      setInterval(() => {
        performance.mark("B");
        performance.measure("A to B", "A", "B");
      }, DEFAULT_CONFIG.PERFORMANCE_INTERVAL);
    } catch (error) {
      console.error("Failed to initialize performance monitoring:", error);
      console.log("PerformanceObserver not available");
    }
  }

  public getNetworkStats(): string[] {
    const avgServerLag =
      this.avgEventLoopLag > 1
        ? Number(this.avgEventLoopLag.toFixed(1)) - 1
        : 0;
    return [`Avg Server lag: ${avgServerLag}ms`];
  }

  public getSoeClient(soeClientId: string): SOEClient | undefined {
    return this._clients.get(soeClientId);
  }

  public getClientCount(): number {
    return this._clients.size;
  }

  public getServerStats(): { clientCount: number; avgEventLoopLag: number } {
    return {
      clientCount: this._clients.size,
      avgEventLoopLag: this.avgEventLoopLag
    };
  }

  // create a physical packet and send it
  private _sendAndBuildPhysicalPacket(
    client: Client,
    logicalPacket: LogicalPacket
  ): void {
    const data =
      logicalPacket.canCrc && this._crcLength
        ? append_crc_legacy(logicalPacket.data, this._crcSeed)
        : logicalPacket.data;
    //FIXME: that's shit
    if (logicalPacket.isReliable) {
      client.unAckData.set(logicalPacket.sequence as number, Date.now());
    }
    this._sendPhysicalPacket(client, data);
  }

  // Send a physical packet
  private _sendPhysicalPacket(client: Client, packet: Uint8Array): void {
    client.packetsSentThisSec++;
    client.stats.totalPhysicalPacketSent++;
    debug("Sending physical packet", packet);
    if (client.family === "IPv4") {
      this._connection.send(packet, client.port, client.address);
    } else {
      this._connectionv6.send(packet, client.port, client.address);
    }
  }

  // Get an array of packet that we need to resend
  getResends(client: Client): LogicalPacket[] {
    const currentTime = Date.now();
    const resends: LogicalPacket[] = [];
    const resendedSequences = new Set<number>();

    // Process timeout-based resends
    this._processTimeoutResends(
      client,
      currentTime,
      resends,
      resendedSequences
    );

    // Process accelerated resends based on out-of-order packets
    this._processAcceleratedResends(client, resends, resendedSequences);

    // Clear out of order array after processing
    client.outputStream.outOfOrder.clear();

    return resends;
  }

  private _processTimeoutResends(
    client: Client,
    currentTime: number,
    resends: LogicalPacket[],
    resendedSequences: Set<number>
  ): void {
    const resendThreshold = this._resendTimeout + client.avgPing;

    for (const [sequence, timestamp] of client.unAckData) {
      if (timestamp + resendThreshold >= currentTime) continue;

      const dataCache = client.outputStream.getDataCache(sequence);
      if (!dataCache || dataCache.resendCounter >= this._maxResentTries)
        continue;

      const logicalPacket = this._createResendPacket(dataCache, sequence);
      if (logicalPacket) {
        dataCache.resendCounter++;
        client.stats.packetResend++;
        resendedSequences.add(sequence);
        resends.push(logicalPacket);
      }
    }
  }

  private _processAcceleratedResends(
    client: Client,
    resends: LogicalPacket[],
    resendedSequences: Set<number>
  ): void {
    const lastAck = client.outputStream.lastAck.get();

    for (const outOfOrderSequence of client.outputStream.outOfOrder) {
      if (outOfOrderSequence < lastAck) continue;

      // Resend packets between lastAck and out-of-order sequence
      for (let seq = lastAck; seq < outOfOrderSequence; seq++) {
        if (
          client.outputStream.outOfOrder.has(seq) ||
          resendedSequences.has(seq)
        )
          continue;

        const dataCache = client.outputStream.getDataCache(seq);
        if (!dataCache) continue;

        const logicalPacket = this._createResendPacket(dataCache, seq);
        if (logicalPacket) {
          resendedSequences.add(seq);
          resends.push(logicalPacket);
        }
      }
    }
  }

  private _createResendPacket(
    dataCache: any,
    sequence: number
  ): LogicalPacket | null {
    const opcode = dataCache.fragment ? SoeOpcode.DataFragment : SoeOpcode.Data;
    return this.createLogicalPacket(opcode, { sequence, data: dataCache.data });
  }

  // Use the lastAck value to acknowlege multiple packets as a time
  private getAck(client: Client): LogicalPacket | undefined {
    const lastAck = client.inputStream._lastAck.get();
    // If we already sent an ack for that lastAck then we don't send another one
    if (client.lastAckSend.get() != lastAck) {
      client.lastAckSend.set(lastAck);
      return this.createLogicalPacket(SoeOpcode.Ack, {
        sequence: lastAck
      });
    }
  }

  private setupResendForQueuedPackets(client: Client, queue: PacketsQueue) {
    for (let index = 0; index < queue.packets.length; index++) {
      const packet = queue.packets[index];
      if (packet.isReliable) {
        client.unAckData.set(packet.sequence as number, Date.now());
      }
    }
  }

  // Get buffered queued packets if any and build a multipacket
  // The queue is cleared after that
  private getClientWaitQueuePacket(
    client: Client,
    queue: PacketsQueue
  ): LogicalPacket | null {
    if (queue.packets.length > 1) {
      this.setupResendForQueuedPackets(client, queue);
      const multiPacket = this.createLogicalPacket(SoeOpcode.MultiPacket, {
        sub_packets: queue.packets.map((packet) => {
          return Array.from(packet.data);
        })
      });
      queue.clear();
      return multiPacket;
      // if there is only one packet then we don't need to build a multipacket
    } else if (queue.packets.length === 1) {
      // no need for a structuredClone , the variable hold the ref
      const singlePacketCopy = queue.packets[0];
      queue.clear();
      return singlePacketCopy;
    } else {
      return null;
    }
  }

  private _createClient(remote: RemoteInfo) {
    const client = new SOEClient(remote, this._crcSeed, this._cryptoKey);
    client.inputStream.on("appdata", (data: Buffer) => {
      this.emit("appdata", client, data);
    });

    client.inputStream.on("outOfOrder", (sequence: number) => {
      this._sendAndBuildLogicalPacket(client, SoeOpcode.OutOfOrder, {
        sequence: sequence
      });
    });

    client.inputStream.on("error", (err: Error) => {
      console.error(err);
      this.emit("disconnect", client);
    });

    client.outputStream.on(SOEOutputChannels.Reliable, () => {
      // some reliables are available, we send them
      this._activateSendingTimer(client);
    });

    client.outputStream.on(
      SOEOutputChannels.Ordered,
      (data: Buffer, sequence: number) => {
        console.log("ordered");
        this._sendAndBuildLogicalPacket(client, SoeOpcode.Ordered, {
          sequence: sequence,
          data: data
        });
      }
    );

    // client.outputStream.on(SOEOutputChannels.Raw, (data: Buffer) => {
    //  unused in h1z1
    // });
    this._clients.set(client.soeClientId, client);
    return client;
  }

  // activate the sending timer if it's not already activated
  private _activateSendingTimer(client: SOEClient, additonalTime: number = 0) {
    if (!client.sendingTimer) {
      client.sendingTimer = setTimeout(() => {
        this.sendingProcess(client);
      }, this._waitTimeMs + additonalTime);
    }
  }

  // Handle the packet received from the client
  private handlePacket(client: SOEClient, packet: any): void {
    const packetHandlers = {
      SessionRequest: () => this._handleSessionRequest(client, packet),
      FatalError: () => this._handleDisconnect(client),
      Disconnect: () => this._handleDisconnect(client),
      MultiPacket: () => this._handleMultiPacket(client, packet),
      Ping: () => this._handlePing(client),
      NetStatusRequest: () => debug("Received net status request from client"),
      Data: () => this._handleData(client, packet, false),
      DataFragment: () => this._handleData(client, packet, true),
      OutOfOrder: () => this._handleOutOfOrder(client, packet),
      Ack: () => this._handleAck(client, packet)
    };

    const handler = packetHandlers[packet.name as keyof typeof packetHandlers];
    if (handler) {
      handler();
    } else {
      console.log(
        `Unknown SOE packet received from ${client.sessionId}:`,
        packet
      );
    }
  }

  private _handleSessionRequest(client: SOEClient, packet: any): void {
    debug(`Received session request from ${client.address}:${client.port}`);

    // Configure client session
    Object.assign(client, {
      sessionId: packet.session_id,
      clientUdpLength: packet.udp_length,
      protocolName: packet.protocol,
      serverUdpLength: this._udpLength,
      crcSeed: this._crcSeed,
      crcLength: this._crcLength
    });

    // Configure encryption and fragmentation
    client.inputStream.setEncryption(this._useEncryption);
    client.outputStream.setEncryption(this._useEncryption);
    client.outputStream.setFragmentSize(
      client.clientUdpLength - (4 + this._crcLength)
    );

    // Setup keep-alive timer
    if (this.keepAliveTimeoutTime) {
      client.lastKeepAliveTimer = setTimeout(() => {
        debug("Client keep alive timeout");
        this.emit("disconnect", client);
      }, this.keepAliveTimeoutTime);
    }

    // Send session reply
    const sessionReply = this.createLogicalPacket(SoeOpcode.SessionReply, {
      session_id: client.sessionId,
      crc_seed: client.crcSeed,
      crc_length: client.crcLength,
      encrypt_method: 0,
      udp_length: client.serverUdpLength
    });
    this._sendAndBuildPhysicalPacket(client, sessionReply);
  }

  private _handleDisconnect(client: SOEClient): void {
    debug("Received disconnect from client");
    this.deleteClient(client);
    this.emit("disconnect", client);
  }

  private _handleMultiPacket(client: SOEClient, packet: any): void {
    packet.sub_packets.forEach((subPacket: any) =>
      this.handlePacket(client, subPacket)
    );
  }

  private _handlePing(client: SOEClient): void {
    debug("Received ping from client");
    const ping = this.createLogicalPacket(SoeOpcode.Ping, {});
    this._sendAndBuildPhysicalPacket(client, ping);
  }

  private _handleData(
    client: SOEClient,
    packet: any,
    isFragment: boolean
  ): void {
    client.inputStream.write(
      Buffer.from(packet.data),
      packet.sequence,
      isFragment
    );
  }

  private _handleOutOfOrder(client: SOEClient, packet: any): void {
    client.stats.packetsOutOfOrder++;
    client.outputStream.outOfOrder.add(packet.sequence);
  }

  private _handleAck(client: SOEClient, packet: any): void {
    const packetTime = client.unAckData.get(packet.sequence);
    if (packetTime) {
      const dataCache = client.outputStream.getDataCache(packet.sequence);
      if (dataCache) {
        const ping =
          Date.now() -
          packetTime -
          (this.currentEventLoopLag || 0) +
          this._resendTimeout * dataCache.resendCounter;
        client.addPing(ping);
      }
    }
    client.outputStream.ack(packet.sequence, client.unAckData);
  }

  onMessage(data: Buffer, remote: RemoteInfo): void {
    try {
      const clientId = SOEClient.getClientId(remote);
      debug(`${data.length} bytes from ${clientId}`);

      const client = this._getOrCreateClient(remote, data);
      if (!client) return;

      if (data[0] === 0x00) {
        this._processProtocolPacket(client, data, clientId);
      } else {
        this._processRawData(client, data, clientId);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      process.exitCode = 1;
    }
  }

  private _getOrCreateClient(
    remote: RemoteInfo,
    data: Buffer
  ): SOEClient | null {
    const clientId = SOEClient.getClientId(remote);

    if (this._clients.has(clientId)) {
      return this._clients.get(clientId)!;
    }

    // Only create new client for session requests
    if (data[1] !== 1) {
      debug(`Ignoring non-session-request from unknown client: ${clientId}`);
      return null;
    }

    return this._createClient(remote);
  }

  private _processProtocolPacket(
    client: SOEClient,
    data: Buffer,
    clientId: string
  ): void {
    const rawParsedData = this._protocol.parse(data);

    if (!rawParsedData) {
      console.error(`Failed to parse packet from client ${clientId}:`, data);
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawParsedData);
    } catch (error) {
      console.error(`Invalid JSON from client ${clientId}:`, rawParsedData);
      return;
    }

    if (parsedData.name === "Error") {
      console.error(
        `Protocol parsing error from ${clientId}:`,
        parsedData.error
      );
      return;
    }

    // Refresh keep-alive timer
    client.lastKeepAliveTimer?.refresh();

    this.handlePacket(client, parsedData);
  }

  private _processRawData(
    client: SOEClient,
    data: Buffer,
    clientId: string
  ): void {
    if (this._allowRawDataReception) {
      debug(`Raw data received from client ${clientId}`);
      this.emit("appdata", client, data, true); // Unreliable + Unordered
    } else {
      debug(
        `Raw data ignored from client ${clientId} (raw reception disabled)`
      );
    }
  }

  start(crcLength?: crc_length_options, udpLength?: number): void {
    if (crcLength !== undefined) {
      this._crcLength = crcLength;
    }
    this._protocol = new Soeprotocol(Boolean(this._crcLength), this._crcSeed);
    if (udpLength !== undefined) {
      this._udpLength = udpLength;
    }
    this._connection.on("message", (data, remote) => {
      this.onMessage(data, remote);
    });
    this._connectionv6.on("message", (data, remote) => {
      this.onMessage(data, remote);
    });
    this._connection.bind(this._serverPort);
    if (!process.env.DISABLE_IPV6) {
      this._connectionv6.bind(this._serverPort);
    }
  }

  async stop(): Promise<void> {
    clearInterval(this._packetResetInterval);
    // delete all _clients
    for (const client of this._clients.values()) {
      client.closeTimers();
    }
    await new Promise<void>((resolve) => {
      this._connection.close(() => {
        resolve();
      });
    });
    await new Promise<void>((resolve) => {
      this._connectionv6.close(() => {
        resolve();
      });
    });
  }

  private packLogicalData(packetOpcode: SoeOpcode, packet: json): Buffer {
    let logicalData;
    switch (packetOpcode) {
      case SoeOpcode.SessionRequest:
        logicalData = this._protocol.pack_session_request_packet(
          packet.session_id,
          packet.crc_length,
          packet.udp_length,
          packet.protocol
        );
        break;
      case SoeOpcode.SessionReply:
        logicalData = this._protocol.pack_session_reply_packet(
          packet.session_id,
          packet.crc_seed,
          packet.crc_length,
          packet.encrypt_method,
          packet.udp_length
        );
        break;
      case SoeOpcode.MultiPacket:
        logicalData = this._protocol.pack_multi_fromjs(packet);
        break;
      case SoeOpcode.Ack:
        logicalData = this._protocol.pack_ack_packet(packet.sequence);
        break;
      case SoeOpcode.OutOfOrder:
        logicalData = this._protocol.pack_out_of_order_packet(packet.sequence);
        break;
      case SoeOpcode.Ordered:
        logicalData = this._protocol.pack_ordered_packet(
          packet.data,
          packet.sequence
        );
        break;
      case SoeOpcode.Data:
        logicalData = this._protocol.pack_data_packet(
          packet.data,
          packet.sequence
        );
        break;
      case SoeOpcode.DataFragment:
        logicalData = this._protocol.pack_fragment_data_packet(
          packet.data,
          packet.sequence
        );
        break;
      default:
        logicalData = this._protocol.pack(packetOpcode, JSON.stringify(packet));
        break;
    }
    return Buffer.from(logicalData);
  }
  private _clearSendingTimer(client: Client) {
    if (client.sendingTimer) {
      clearTimeout(client.sendingTimer);
      client.sendingTimer = null;
    }
  }

  // Get an array of logical app packets that can be sent
  private getAvailableAppPackets(client: Client): LogicalPacket[] {
    const dataCaches = client.outputStream.getAvailableReliableData();
    const appPackets: LogicalPacket[] = [];
    for (const dataCache of dataCaches) {
      const logicalPacket = this.createLogicalPacket(
        dataCache.fragment ? SoeOpcode.DataFragment : SoeOpcode.Data,
        { sequence: dataCache.sequence, data: dataCache.data }
      );
      if (logicalPacket) {
        appPackets.push(logicalPacket);
      }
    }
    return appPackets;
  }
  private sendingProcess(client: Client): void {
    this._clearSendingTimer(client);

    if (client.isDeleted) return;

    // Process packets in priority order: resends, new app data, acks
    this._processResends(client);
    this._processNewAppData(client);
    this._processAcks(client);
    this._flushWaitingQueue(client);

    // Schedule next sending cycle if needed
    if (client.unAckData.size > 0) {
      this._activateSendingTimer(client);
    }
  }

  private _processResends(client: Client): void {
    const resends = this.getResends(client);

    for (const resend of resends) {
      client.stats.totalLogicalPacketSent++;
      this._tryBufferOrSend(client, resend);
      client.unAckData.delete(resend.sequence as number);
    }
  }

  private _processNewAppData(client: Client): void {
    if (!client.outputStream.isReliableAvailable()) return;

    const appPackets = this.getAvailableAppPackets(client);
    client.delayedLogicalPackets.push(...appPackets);

    // Process delayed packets
    while (client.delayedLogicalPackets.length > 0) {
      const packet = client.delayedLogicalPackets.shift();
      if (!packet) break;

      this._tryBufferOrSend(client, packet);
    }
  }

  private _processAcks(client: Client): void {
    const ackPacket = this.getAck(client);
    if (!ackPacket) return;

    client.stats.totalLogicalPacketSent++;

    if (!this._canBeBufferedIntoQueue(ackPacket, client.waitingQueue)) {
      this._flushWaitingQueue(client);
    }
    client.waitingQueue.addPacket(ackPacket);
  }

  private _tryBufferOrSend(client: Client, packet: LogicalPacket): void {
    if (this._canBeBufferedIntoQueue(packet, client.waitingQueue)) {
      client.waitingQueue.addPacket(packet);
    } else {
      // Flush current queue first
      this._flushWaitingQueue(client);

      // Try buffering again after flush
      if (this._canBeBufferedIntoQueue(packet, client.waitingQueue)) {
        client.waitingQueue.addPacket(packet);
      } else {
        // Packet too large for buffering, send directly
        this._sendAndBuildPhysicalPacket(client, packet);
      }
    }
  }

  private _flushWaitingQueue(client: Client): void {
    const queuedPacket = this.getClientWaitQueuePacket(
      client,
      client.waitingQueue
    );
    if (queuedPacket) {
      this._sendAndBuildPhysicalPacket(client, queuedPacket);
    }
  }
  // Build the logical packet via the soeprotocol
  private createLogicalPacket(
    packetOpcode: SoeOpcode,
    packet: json
  ): LogicalPacket {
    try {
      const logicalPacket = new LogicalPacket(
        this.packLogicalData(packetOpcode, packet),
        packet.sequence
      );
      return logicalPacket;
    } catch (e) {
      console.error(
        `Failed to create packet ${packetOpcode} packet data : ${JSON.stringify(
          packet,
          null,
          4
        )}`
      );
      throw e;
    }
  }

  private _canBeBufferedIntoQueue(
    logicalPacket: LogicalPacket,
    queue: PacketsQueue
  ): boolean {
    return (
      this._waitTimeMs > 0 &&
      logicalPacket.canBeBuffered &&
      queue.CurrentByteLength + logicalPacket.data.length <=
        this._maxMultiBufferSize
    );
  }

  private _sendLogicalPacket(
    client: Client,
    logicalPacket: LogicalPacket
  ): void {
    client.stats.totalLogicalPacketSent++;
    if (this._canBeBufferedIntoQueue(logicalPacket, client.waitingQueue)) {
      client.waitingQueue.addPacket(logicalPacket);
      this._activateSendingTimer(client);
    } else {
      client.delayedLogicalPackets.push(logicalPacket);
      this.sendingProcess(client);
    }
  }

  // The packets is builded from schema and added to one of the queues
  private _sendAndBuildLogicalPacket(
    client: Client,
    packetOpcode: SoeOpcode,
    packet: json
  ): void {
    const logicalPacket = this.createLogicalPacket(packetOpcode, packet);
    this._sendLogicalPacket(client, logicalPacket);
  }

  // Public API methods
  public sendAppData(
    client: Client,
    data: Uint8Array,
    channel: SOEOutputChannels = SOEOutputChannels.Reliable
  ): void {
    if (client.isDeleted) {
      debug(`Attempted to send data to deleted client ${client.soeClientId}`);
      return;
    }
    client.outputStream.write(data, channel);
  }

  public setEncryption(client: Client, value: boolean): void {
    client.outputStream.setEncryption(value);
    client.inputStream.setEncryption(value);
  }

  public toggleEncryption(client: Client): void {
    client.outputStream.toggleEncryption();
    client.inputStream.toggleEncryption();
  }

  public deleteClient(client: SOEClient): void {
    if (client.isDeleted) return;

    client.isDeleted = true;
    client.closeTimers();
    this._clearSendingTimer(client);
    this._clients.delete(client.soeClientId);

    debug(`Client connection from ${client.address}:${client.port} deleted`);
  }
}
