import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router-dom'; 
import { loginUser } from "../authSlice";
import { useEffect, useState, useRef } from 'react';


const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak") 
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [covering, setCovering] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const pupilL = useRef(null);
  const pupilR = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  const movePupils = (dx, dy) => {
    if (pupilL.current) pupilL.current.style.transform = `translate(${dx}px, ${dy}px)`;
    if (pupilR.current) pupilR.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handleFocus = (field) => {
    if (field === 'password') {
      movePupils(0, 0);
      setCovering(true);
    } else {
      movePupils(3, 3);
      setCovering(false);
    }
  };

  const handleBlur = () => {
    movePupils(0, 0);
    setCovering(false);
  };

  const handleLoginClick = () => {
    movePupils(0, -3);
    setTimeout(() => movePupils(0, 0), 500);
  };

  const emailProps = register('emailId');
  const passwordProps = register('password');

  return (
    <>
      <style>{`
        .lamp-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111318;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding: 16px;
        }
        .lamp-scene {
          display: flex;
          align-items: center;
          gap: 32px;
          background: #1a1d24;
          border-radius: 24px;
          padding: 48px 52px;
          position: relative;
          overflow: hidden;
          flex-direction: row;
        }
        .lamp-scene::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 40% at 30% 80%, rgba(72,200,100,0.055) 0%, transparent 70%);
          pointer-events: none;
        }
        .lamp-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 190px;
          flex-shrink: 0;
        }
        .lamp-svg {
          animation: lampFloat 3.2s ease-in-out infinite;
          transform-origin: bottom center;
          overflow: visible !important;
        }
        @keyframes lampFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-9px) rotate(1deg); }
        }
        .light-beam { animation: beamPulse 3.2s ease-in-out infinite; }
        @keyframes beamPulse {
          0%,100% { opacity: 0.15; }
          50%      { opacity: 0.28; }
        }
        .ground-glow { animation: glowPulse 3.2s ease-in-out infinite; }
        @keyframes glowPulse {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 0.55; }
        }
        .pupil-l, .pupil-r {
          transition: transform 0.35s cubic-bezier(.34,1.56,.64,1);
        }
        .hand-l, .hand-r {
          transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
          transform-origin: 50% 100%;
          transform: translateY(60px);
        }
        .covering .hand-l { transform: translateY(0px); }
        .covering .hand-r { transform: translateY(0px); }
        .eyelid-l, .eyelid-r {
          animation: blink 5s ease-in-out infinite;
          transform-origin: center;
        }
        .eyelid-r { animation-delay: 0.05s; }
        @keyframes blink {
          0%,92%,100% { transform: scaleY(0); }
          94%,98%     { transform: scaleY(1); }
        }

        .login-card {
          background: #1f2530;
          border: 1.5px solid #3ddb60;
          border-radius: 16px;
          padding: 40px 36px;
          width: 300px;
          box-shadow: 0 0 28px rgba(61,219,96,0.18), 0 0 60px rgba(61,219,96,0.07);
          position: relative;
          z-index: 1;
        }
        .login-card h2 {
          color: #f0f4f8;
          font-size: 22px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 28px;
          letter-spacing: -0.01em;
        }
        .form-group {
          margin-bottom: 18px;
          position: relative;
        }
        .form-group label {
          display: block;
          color: #9ba8b8;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }
        .form-group input {
          width: 100%;
          background: #141820;
          border: 1px solid #2c3340;
          border-radius: 9px;
          padding: 11px 14px;
          color: #e8edf3;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .form-group input::placeholder { color: #4a5568; }
        .form-group input:focus {
          border-color: #3ddb60;
          box-shadow: 0 0 0 3px rgba(61,219,96,0.13);
        }
        .input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.13) !important;
        }
        .error-msg {
          color: #f87171;
          font-size: 12px;
          margin-top: 6px;
          margin-left: 2px;
        }
        .toggle-pwd {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7a8d;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .toggle-pwd:hover { color: #3ddb60; }
        .login-btn {
          width: 100%;
          background: #2ea84a;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 13px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          margin-top: 8px;
          letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.12s, box-shadow 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          background: #35c455;
          box-shadow: 0 4px 18px rgba(61,219,96,0.25);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: none;
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .form-footer {
          margin-top: 18px;
          text-align: center;
        }
        .form-footer span {
          color: #6b7a8d;
          font-size: 13px;
        }
        .form-footer a {
          color: #3ddb60;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .form-footer a:hover { color: #5cf07a; }

        @media (max-width: 640px) {
          .lamp-scene {
            flex-direction: column;
            padding: 32px 24px;
          }
          .lamp-col { width: 160px; }
          .login-card { width: 100%; max-width: 320px; }
        }
      `}</style>

      <div className="lamp-page">
        <div className="lamp-scene">
          {/* ── LAMP ── */}
          <div className="lamp-col">
            <svg className={`lamp-svg ${covering ? 'covering' : ''}`} width="190" height="300" viewBox="0 0 190 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse className="ground-glow" cx="95" cy="290" rx="62" ry="10" fill="#3ddb60" opacity="0.3"/>
              <polygon className="light-beam" points="52,176 22,268 168,268 138,176" fill="#7DF59C" opacity="0.15"/>
              <rect x="62" y="262" width="66" height="13" rx="5" fill="#c8d0d8"/>
              <rect x="79" y="250" width="32" height="16" rx="4" fill="#d8e0e8"/>
              <rect x="91" y="192" width="8" height="62" rx="3" fill="#d0dae3"/>
              <rect x="81" y="180" width="28" height="18" rx="6" fill="#c8d4de"/>

              <path d="M44 178 L58 90 L132 90 L146 178 Z" fill="#2a7a35"/>
              <path d="M48 174 L62 93 L128 93 L142 174 Z" fill="#3fae52"/>
              <path d="M68 97 L122 97 L120 93 L70 93 Z" fill="#50c464" opacity="0.6"/>
              <rect x="44" y="171" width="102" height="9" rx="4.5" fill="#2e9440"/>
              <rect x="60" y="88" width="70" height="7" rx="3.5" fill="#2e9440"/>

              <circle cx="82" cy="137" r="10" fill="#e8f5ea"/>
              <circle cx="108" cy="137" r="10" fill="#e8f5ea"/>

              <circle className="pupil-l" ref={pupilL} cx="82" cy="137" r="5" fill="#1a2e20"/>
              <circle cx="84" cy="135" r="2" fill="white" opacity="0.8"/>
              <circle className="pupil-r" ref={pupilR} cx="108" cy="137" r="5" fill="#1a2e20"/>
              <circle cx="110" cy="135" r="2" fill="white" opacity="0.8"/>

              <clipPath id="clipL"><circle cx="82" cy="137" r="10"/></clipPath>
              <rect className="eyelid-l" x="72" y="127" width="20" height="11" fill="#3fae52" clipPath="url(#clipL)" style={{transformOrigin:'82px 127px', transform:'scaleY(0)'}}/>
              <clipPath id="clipR"><circle cx="108" cy="137" r="10"/></clipPath>
              <rect className="eyelid-r" x="98" y="127" width="20" height="11" fill="#3fae52" clipPath="url(#clipR)" style={{transformOrigin:'108px 127px', transform:'scaleY(0)'}}/>

              <path d="M84 154 Q95 163 106 154" stroke="#1a2e20" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
              <ellipse cx="95" cy="160" rx="6" ry="4.5" fill="#e05555"/>

              <ellipse cx="72" cy="148" rx="7" ry="5" fill="#e8a0a0" opacity="0.4"/>
              <ellipse cx="118" cy="148" rx="7" ry="5" fill="#e8a0a0" opacity="0.4"/>

              <g className="hand-l">
                <path d="M62 158 Q46 168 44 148" stroke="#3fae52" strokeWidth="7" fill="none" strokeLinecap="round"/>
                <circle cx="44" cy="146" r="10" fill="#3fae52"/>
                <path d="M37 140 Q44 133 51 140" stroke="#2e9440" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </g>
              <g className="hand-r">
                <path d="M128 158 Q144 168 146 148" stroke="#3fae52" strokeWidth="7" fill="none" strokeLinecap="round"/>
                <circle cx="146" cy="146" r="10" fill="#3fae52"/>
                <path d="M139 140 Q146 133 153 140" stroke="#2e9440" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </g>
            </svg>
          </div>

          {/* ── LOGIN CARD ── */}
          <div className="login-card">
            <h2>Welcome Back</h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className={errors.emailId ? 'input-error' : ''}
                  {...emailProps}
                  onFocus={(e) => { emailProps.onFocus?.(e); handleFocus('emailId'); }}
                  onBlur={(e) => { emailProps.onBlur(e); handleBlur(); }}
                />
                {errors.emailId && (
                  <div className="error-msg">{errors.emailId.message}</div>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label>Password</label>
                <div style={{position:'relative'}}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={errors.password ? 'input-error' : ''}
                    {...passwordProps}
                    onFocus={(e) => { passwordProps.onFocus?.(e); handleFocus('password'); }}
                    onBlur={(e) => { passwordProps.onBlur(e); handleBlur(); }}
                  />
                  <button
                    type="button"
                    className="toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="error-msg">{errors.password.message}</div>
                )}
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
                onClick={handleLoginClick}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="form-footer">
              <span>
                Don't have an account?{' '}
                <NavLink to="/signup">Sign Up</NavLink>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;