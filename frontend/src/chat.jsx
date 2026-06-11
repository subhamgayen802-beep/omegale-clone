import React, { useEffect, useRef } from "react";
import { useWebRTC } from "./webrtc"; 

const S = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0a0a0a",
    fontFamily: "system-ui, sans-serif",
    userSelect: "none",
  },
  // ── Video area 
  videoArea: {
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 16,
    overflow: "hidden",
  },
  remoteBox: {
    flex: 3,
    position: "relative",
    background: "#111",
    borderRadius: 16,
    overflow: "hidden",
  },
  localBox: {
    flex: 1,
    position: "relative",
    background: "#111",
    borderRadius: 16,
    overflow: "hidden",
    minWidth: 140,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  videoLabel: {
    position: "absolute",
    bottom: 10,
    left: 12,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    color: "#fff",
    letterSpacing: 0.3,
  },
  // Shown when remote stream is not yet received
  waitingOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background: "#111",
    color: "#555",
    fontSize: 14,
  },
  waitingSpinner: {
    width: 36,
    height: 36,
    border: "3px solid #222",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px 20px",
    borderTop: "1px solid #1a1a1a",
  },
  ctrlBtn: (active) => ({
    padding: "10px 22px",
    background: active ? "#dc2626" : "#1e1e1e",
    border: "1px solid",
    borderColor: active ? "#dc2626" : "#2a2a2a",
    borderRadius: 30,
    color: active ? "#fff" : "#aaa",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  }),
  nextBtn: {
    padding: "10px 22px",
    background: "#d97706",
    border: "none",
    borderRadius: 30,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  endBtn: {
    padding: "10px 22px",
    background: "#dc2626",
    border: "none",
    borderRadius: 30,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(220,38,38,0.35)",
  },
};

export default function VideoCallView({ socket, onClose }) {
  const {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    toggleMute,
    toggleCamera,
    nextPartner,
  } = useWebRTC(socket);

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current)  localVideoRef.current.srcObject  = localStream  ?? null;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream ?? null;
  }, [remoteStream]);

  const handleNext = () => {
    nextPartner();
    onClose(); 
  };

  const handleEnd = () => {
    nextPartner();
    onClose();
  };

  return (
    <div style={S.page}>
     
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

     
      <div style={S.videoArea}>

       
        <div style={S.remoteBox}>
          {!remoteStream && (
            <div style={S.waitingOverlay}>
              <div style={S.waitingSpinner} />
              <span>Waiting for partner's video...</span>
            </div>
          )}
          <video ref={remoteVideoRef} autoPlay playsInline style={S.video} />
          <div style={S.videoLabel}>Partner</div>
        </div>


        <div style={S.localBox}>
          <video ref={localVideoRef} autoPlay muted playsInline style={S.video} />
          <div style={S.videoLabel}>
            You {isCamOff && "· Cam off"}
          </div>
        </div>

      </div>

      <div style={S.controls}>

        <button onClick={toggleMute}   style={S.ctrlBtn(isMuted)}>
          {isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </button>

        <button onClick={toggleCamera} style={S.ctrlBtn(isCamOff)}>
          {isCamOff ? "📷 Cam On" : "📷 Cam Off"}
        </button>

        <button onClick={handleNext}   style={S.nextBtn}>
          ⏭ Next
        </button>

        <button onClick={handleEnd}    style={S.endBtn}>
          ✕ End Call
        </button>

      </div>
    </div>
  );
}