import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { logoutUser } from "../authSlice";
import VideoCallView from "./videoCall";
import { useWebRTC } from "../webrtc";
import React from "react";

const SOCKET_URL = "https://omegale-clone.onrender.com" || "http://localhost:5000";

const STATUS_META = {
  idle:         { label: "Offline",          dot: "bg-zinc-600" },
  connecting:   { label: "Connecting...",    dot: "bg-amber-400 animate-pulse" },
  connected:    { label: "Online",           dot: "bg-emerald-400" },
  searching:    { label: "Searching...",     dot: "bg-violet-400 animate-pulse" },
  inCall:       { label: "In Call",          dot: "bg-emerald-300" },
  partner_left: { label: "Partner Left",     dot: "bg-amber-500" },
  error:        { label: "Connection Error", dot: "bg-rose-500" },
};

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  const [socket,     setSocket]     = useState(null);
  const [status,     setStatus]     = useState("idle");
  const [mediaError, setMediaError] = useState(null);
  const socketRef = useRef(null);

  const onCallStart = useCallback(() => setStatus("inCall"), []);
  const onCallEnd   = useCallback((s) => setStatus(s ?? "connected"), []);

  const {
    localStream, remoteStream,
    isMuted, isCamOff,
    toggleMute, toggleCamera, nextPartner,
    startMedia, stopMedia,
  } = useWebRTC(socket, { onCallStart, onCallEnd });

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => socketRef.current?.disconnect();
  }, []);

  const handleConnect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    if (socketRef.current?.connected) return;

    setStatus("connecting");
    setMediaError(null);

    const s = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    s.on("connect",       () => setStatus("connected"));
    s.on("connect_error", (err) => {
      const isAuth = err.message.includes("expired") || err.message.toLowerCase().includes("token");
      if (isAuth) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setStatus("error");
      }
    });
    s.on("waiting",      () => setStatus("searching"));
    s.on("partner_left", () => setStatus("partner_left"));
    s.on("disconnect",   () => { setStatus("idle"); setSocket(null); });

    socketRef.current = s;
    setSocket(s);
  }, [navigate]);

 
  const handleFindPartner = useCallback(async () => {
    if (!socketRef.current?.connected) return;
    if (!["connected", "partner_left"].includes(status)) return;

    setMediaError(null);
    try {
      await startMedia(); // 🔑 camera/mic permission asked HERE, not on mount
      socketRef.current.emit("find-partner", { userId: user?._id });
      setStatus("searching");
    } catch (err) {
      console.error("Media error:", err);
      setMediaError("Camera or microphone access was denied. Allow permissions and try again.");
    }
  }, [status, user, startMedia]);


  const handleDisconnect = useCallback(() => {
    stopMedia();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    setStatus("idle");
    setMediaError(null);
  }, [stopMedia]);

  const handleLogout = useCallback(async () => {
    handleDisconnect();
    await dispatch(logoutUser());
    navigate("/login");
  }, [handleDisconnect, dispatch, navigate]);

 
  if (status === "inCall") {
    return (
      <VideoCallView
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCamOff={isCamOff}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onNext={() => { nextPartner(); setStatus("connected"); }}
        onEndCall={() => { nextPartner(); setStatus("connected"); }}
      />
    );
  }

  const { label: statusLabel, dot: dotClass } = STATUS_META[status] ?? STATUS_META.idle;

  return (
    <div className="min-h-screen bg-[#07070A] flex items-center justify-center relative overflow-hidden text-[#E4E4E7]">

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
       
        <div className="absolute top-[-100px] left-[30%] w-[500px] h-[400px] rounded-full bg-violet-950/30 blur-[100px]" />
        <div className="absolute bottom-[-80px] right-[20%] w-[400px] h-[300px] rounded-full bg-emerald-950/25 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] px-5 flex flex-col items-center gap-5">

        <div className="flex flex-col items-center gap-2.5 mb-1">
 
          <div className="w-14 h-14 rounded-[18px] bg-[#111116] border border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Random Chat
            </h1>
            <p className="text-zinc-600 text-[11px] tracking-widest font-mono uppercase mt-0.5">
              Anonymous · P2P · Encrypted
            </p>
          </div>
        </div>

        <div className="w-full bg-[#0E0E12] border border-[#1C1C24] rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.05),0_24px_48px_rgba(0,0,0,0.5)]">

          <div className="h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

          <div className="p-6 flex flex-col gap-5">

        
            <div className="flex items-center gap-3 pb-4 border-b border-[#1C1C24]">

           
              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm text-white
                bg-gradient-to-br from-violet-600/50 to-violet-900/30
                border border-violet-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                {user?.firstName?.[0]?.toUpperCase() ?? "?"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-zinc-100 font-semibold text-[13px] truncate"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {user?.firstName ?? "Guest"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                  <span className="text-zinc-600 text-[11px] font-mono">{statusLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {user?.role === "admin" && (
                  <button onClick={() => navigate("/admin")}
                    className="px-2 py-1 rounded-lg bg-transparent border border-zinc-700/50 text-zinc-400 text-[11px] font-mono hover:bg-zinc-800/60 hover:text-zinc-200 hover:border-zinc-600 transition-all duration-150">
                    ADMIN
                  </button>
                )}
                <button onClick={handleLogout}
                  className="px-2 py-1 rounded-lg bg-transparent border border-zinc-800/80 text-zinc-600 text-[11px] font-mono hover:text-zinc-300 hover:border-zinc-600 transition-all duration-150">
                  EXIT
                </button>
              </div>
            </div>

            <div className="min-h-[155px] flex items-center justify-center bg-[#09090D] border border-[#181820] rounded-xl p-5">

              {status === "idle" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#111116] border border-zinc-800/60 flex items-center justify-center text-2xl mb-1">
                    🛰️
                  </div>
                  <p className="text-zinc-200 font-semibold text-sm"
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Not Connected
                  </p>
                  <p className="text-zinc-600 text-[11px] leading-relaxed max-w-[180px] font-mono">
                    Connect to the signal network to get started
                  </p>
                </div>
              )}

              {status === "connecting" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                  </div>
                  <p className="text-zinc-500 text-[11px] font-mono tracking-[0.2em]">ESTABLISHING CONNECTION</p>
                </div>
              )}

              {status === "connected" && (
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                    <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: "2.5s" }} />
                    <span className="relative w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                  </div>
                  <p className="text-zinc-100 font-semibold text-sm"
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Network Ready
                  </p>
                  <p className="text-zinc-600 text-[11px] font-mono">Find a partner to begin</p>
                </div>
              )}

              {status === "searching" && (
                <div className="flex flex-col items-center gap-3 text-center">
                  {/* Sonar rings */}
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <span className="sonar-r1 absolute inset-0 rounded-full border border-violet-500/40" />
                    <span className="sonar-r2 absolute inset-1.5 rounded-full border border-violet-400/25" />
                    <span className="sonar-r3 absolute inset-3 rounded-full border border-violet-300/15" />
                    <span className="w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.8)]" />
                  </div>
                  <p className="text-zinc-200 text-[11px] font-mono tracking-[0.2em]">SCANNING FOR PEERS</p>
                  <p className="text-zinc-600 text-[10px] font-mono">This may take a moment...</p>
                </div>
              )}

              {status === "partner_left" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl mb-1">
                    👋
                  </div>
                  <p className="text-zinc-200 font-semibold text-sm"
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Session Ended
                  </p>
                  <p className="text-zinc-600 text-[11px] font-mono">Your partner disconnected</p>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl mb-1">
                    ⚠️
                  </div>
                  <p className="text-rose-400 font-semibold text-sm"
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Signal Error
                  </p>
                  <p className="text-zinc-600 text-[11px] font-mono">Check network & retry</p>
                </div>
              )}

            </div>

            {mediaError && (
              <div className="flex items-start gap-3 px-3.5 py-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl">
                <span className="text-amber-400 text-base flex-shrink-0">🎙️</span>
                <div>
                  <p className="text-amber-300 text-[11px] font-semibold font-mono tracking-wide">PERMISSION DENIED</p>
                  <p className="text-amber-600 text-[11px] font-mono mt-0.5 leading-relaxed">{mediaError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {["idle", "error"].includes(status) ? (
                <button onClick={handleConnect}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-black
                    bg-white hover:bg-zinc-100 active:bg-zinc-200
                    shadow-[0_1px_0_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.1)]
                    transition-all duration-150"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Connect
                </button>
              ) : (
                <button onClick={handleDisconnect}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-rose-400
                    bg-rose-500/[0.07] border border-rose-500/20
                    hover:bg-rose-500/15 hover:border-rose-500/30
                    active:bg-rose-500/20
                    transition-all duration-150"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Disconnect
                </button>
              )}

              {["connected", "partner_left"].includes(status) && (
                <button onClick={handleFindPartner}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white
                    bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                    shadow-[0_0_24px_rgba(139,92,246,0.30),0_1px_0_rgba(0,0,0,0.4)]
                    transition-all duration-150"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Find Partner
                </button>
              )}

          
              {status === "searching" && (
                <button onClick={handleDisconnect}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-zinc-500
                    border border-[#1C1C24]
                    hover:text-zinc-300 hover:border-zinc-700 hover:bg-white/[0.02]
                    transition-all duration-150"
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Cancel
                </button>
              )}

            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent" />
        </div>

        <p className="text-zinc-800 text-[10px] tracking-[0.25em] font-mono uppercase">
          v1.0 · Signal Network
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes sonar {
          0%   { transform: scale(0.7); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        .sonar-r1 { animation: sonar 2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        .sonar-r2 { animation: sonar 2s cubic-bezier(0.16, 1, 0.3, 1) 0.35s infinite; }
        .sonar-r3 { animation: sonar 2s cubic-bezier(0.16, 1, 0.3, 1) 0.70s infinite; }
      `}</style>
    </div>
  );
}