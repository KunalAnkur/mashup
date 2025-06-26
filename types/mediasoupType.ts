import {
  Device,
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
  MediaKind,
} from "mediasoup-client/types";

export interface MediaSoupClientConfig {
  socketUrl: string;
  debug?: boolean;
}

export interface RoomInfo {
  id: string;
  rtpCapabilities: RtpCapabilities;
}

export interface TransportInfo {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: DtlsParameters;
  sctpParameters?: any;
}

export interface ProducerInfo {
  id: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
}

export interface ConsumerInfo {
  id: string;
  producerId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  type: string;
  producerPaused: boolean;
}

export interface PeerInfo {
  id: string;
  name?: string;
  consumers: Map<string, Consumer>;
  videoElement?: HTMLVideoElement;
  audioElement?: HTMLAudioElement;
}
