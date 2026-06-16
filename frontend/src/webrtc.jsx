import react, { useCallback, useEffect, useRef, useState } from "react";

const FALLBACK_ICE = [{ urls: "stun:stun.l.google.com:19302" }];

export const useWebRTC = (socket, { onCallStart, onCallEnd } = {}) => {

  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCamOff,     setIsCamOff]     = useState(false);
  const [iceServers,   setIceServers]   = useState(FALLBACK_ICE);

  const peerRef        = useRef(null);
  const localStreamRef = useRef(null);
  const iceServersRef  = useRef(FALLBACK_ICE); 

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { iceServersRef.current  = iceServers;  }, [iceServers]);


  useEffect(() => {
    fetch("/api/ice-servers")
      .then((r) => r.json())
      .then((servers) => {
        setIceServers(servers);
        console.log(" ICE servers loaded from backend");
      })
      .catch(() => {
        console.warn("⚠️ ICE server fetch failed — using fallback STUN");
        setIceServers(FALLBACK_ICE);
      });
  }, []);

 
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    console.log("🎥 Local stream ready");
    return stream;
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    console.log("🎥 Local stream stopped");
  }, []);

  const closePeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    setRemoteStream(null);
  }, []);

  const buildPeer = useCallback((onIceCandidate) => {
   
    const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });
    peerRef.current = peer;

    localStreamRef.current?.getTracks().forEach((track) =>
      peer.addTrack(track, localStreamRef.current)
    );

    peer.ontrack = (e) => {
      console.log("📺 Remote stream received");
      setRemoteStream(e.streams[0]);
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) onIceCandidate(e.candidate);
    };

    return peer;
  }, []);

  const waitForStream = useCallback(() =>
    new Promise((resolve) => {
      if (localStreamRef.current) return resolve();
      const check = setInterval(() => {
        if (localStreamRef.current) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 1500);
    }), []);

  useEffect(() => {
    if (!socket) return;

    const onPartnerFound = async ({ initiator }) => {
      console.log(`🤝 Partner found — I am the ${initiator ? "INITIATOR" : "RESPONDER"}`);
      onCallStart?.();
      if (!initiator) return;

      closePeer();
      await waitForStream();

      const peer  = buildPeer((c) => socket.emit("candidate", c));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", offer);
      console.log("📤 Offer sent");
    };

    const onOffer = async (offer) => {
      console.log("📥 Offer received — sending answer");
      closePeer();
      await waitForStream();

      const peer   = buildPeer((c) => socket.emit("candidate", c));
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", answer);
      console.log("📤 Answer sent");
    };

    const onAnswer = async (answer) => {
      console.log("📥 Answer received");
      await peerRef.current?.setRemoteDescription(answer);
    };

    const onCandidate = async (candidate) => {
      try {
        await peerRef.current?.addIceCandidate(candidate);
      } catch (err) {
        console.warn("ICE candidate skipped:", err.message);
      }
    };

    const onPartnerLeft = () => {
      console.log("👋 Partner left");
      closePeer();
      onCallEnd?.("partner_left");
    };

    const onSearchAgain = () => { onCallEnd?.("connected"); };

    socket.on("partner-found", onPartnerFound);
    socket.on("offer",         onOffer);
    socket.on("answer",        onAnswer);
    socket.on("candidate",     onCandidate);
    socket.on("partner-left",  onPartnerLeft);
    socket.on("search-again",  onSearchAgain);

    return () => {
      socket.off("partner-found", onPartnerFound);
      socket.off("offer",         onOffer);
      socket.off("answer",        onAnswer);
      socket.off("candidate",     onCandidate);
      socket.off("partner-left",  onPartnerLeft);
      socket.off("search-again",  onSearchAgain);
    };
  }, [socket, closePeer, buildPeer, waitForStream, onCallStart, onCallEnd]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCamOff(!track.enabled);
  }, []);

  const nextPartner = useCallback(() => {
    closePeer();
    socket?.emit("next");
  }, [socket, closePeer]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    toggleMute,
    toggleCamera,
    nextPartner,
    startMedia,
    stopMedia,
  };
};