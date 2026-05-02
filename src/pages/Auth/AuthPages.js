import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { registerUser }                        from '../../services/features/auth/registerSlice';
import { verifyOtp, resendOtp, resetOtpState } from '../../services/features/auth/otpSlice';
import { Button, Input, Select, toast }        from '../../components/ui/UI';
import locationData                            from '../../assets/json/Location.json';
import './Auth.css';

/* ─── Roles — exact same as mobile app ──────────────────────────────────────── */
const ROLES = [
  { value: '',                   label: 'Select Role'           },
  { value: 'MarketingManager',   label: 'Marketing Manager'     },
  { value: 'MarketingExecutive', label: 'Marketing Executive'   },
  { value: 'Distributor',        label: 'Distributor'           },
  { value: 'FSE',                label: 'Field Sales Executive' },
  { value: 'Retailer',           label: 'Retailer'              },
  { value: 'Radnus',             label: 'Radnus'                },
];

/* ─── Shared left brand panel ───────────────────────────────────────────────── */
const AuthBrand = () => (
  <div className="auth-brand">
    <div>
      <div className="brand-logo-row">
        <div className="brand-icon">R</div>
        <div>
          <div className="brand-title">Radnus DMS</div>
          <div className="brand-sub">Distribution Platform</div>
        </div>
      </div>
    </div>
    <div className="brand-features">
      {[
        ['Secure Registration', 'OTP-verified onboarding for all roles'],
        ['Role-Based Access',   'Each role sees exactly what they need'],
        ['Password Recovery',   'Quick and secure reset via email OTP'],
      ].map(([t, d]) => (
        <div className="brand-feature" key={t}>
          <div className="brand-dot" />
          <div className="brand-feature-text">
            <strong>{t}</strong><span>{d}</span>
          </div>
        </div>
      ))}
    </div>
    <div className="brand-footer">© 2025 Radnus Pvt. Ltd.</div>
  </div>
);

/* ═══ REGISTER PAGE ══════════════════════════════════════════════════════════════
   Mirrors mobile RegisterScreen exactly:
   name, email, mobile, password, confirmPassword, role, state, district, taluk
══════════════════════════════════════════════════════════════════════════════ */
export const RegisterPage = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { loading } = useSelector(s => s.register);

  const [step,     setStep]     = useState('form');
  const [showPw,   setShowPw]   = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [apiErr,   setApiErr]   = useState('');
  const [errs,     setErrs]     = useState({});

  const [vals, setVals] = useState({
    name:            '',
    email:           '',
    mobile:          '',
    password:        '',
    confirmPassword: '',
    role:            '',
    state:           '',
    district:        '',
    taluk:           '',
  });

  /* ── Cascading location lists — same logic as mobile RegisterScreen ────────── */
  const states    = Object.keys(locationData);
  const districts = vals.state
    ? Object.keys(locationData[vals.state] || {})
    : [];
  const taluks    = vals.state && vals.district
    ? locationData[vals.state]?.[vals.district] || []
    : [];

  const set = (key, value) => {
    setVals(prev => ({
      ...prev,
      [key]: value,
      // Reset children when parent changes — mirrors mobile behaviour
      ...(key === 'state'    ? { district: '', taluk: '' } : {}),
      ...(key === 'district' ? { taluk: ''               } : {}),
    }));
    setErrs(prev => ({ ...prev, [key]: '' }));
    setApiErr('');
  };

  /* ── Validation — mirrors mobile Yup schema ──────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!vals.name.trim())                       e.name     = 'Name is required';
    if (!/\S+@\S+\.\S+/.test(vals.email))       e.email    = 'Valid email is required';
    if (!/^[6-9]\d{9}$/.test(vals.mobile))      e.mobile   = 'Valid 10-digit mobile required';
    if (!vals.role)                              e.role     = 'Role is required';
    if (!vals.state)                             e.state    = 'State is required';
    if (!vals.district)                          e.district = 'District is required';
    if (!vals.taluk)                             e.taluk    = 'Taluk is required';
    if (vals.password.length < 6)               e.password = 'Min 6 characters';
    if (vals.password !== vals.confirmPassword)  e.confirmPassword = 'Passwords do not match';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validate()) setStep('terms');
  };

  const handleRegister = async () => {
    if (!accepted) { setApiErr('Please accept the Terms & Conditions'); return; }
    const { confirmPassword, ...payload } = vals;
    try {
      await dispatch(registerUser(payload)).unwrap();
      navigate('/otp', { state: { mobile: vals.mobile, type: 'register' } });
    } catch (err) {
      setApiErr(typeof err === 'string' ? err : err?.message || 'Registration failed');
      setStep('form');
    }
  };

  /* Build option arrays */
  const stateOpts    = [{ value: '', label: 'Select State'    }, ...states.map(s    => ({ value: s, label: s }))];
  const districtOpts = [{ value: '', label: 'Select District' }, ...districts.map(d => ({ value: d, label: d }))];
  const talukOpts    = [{ value: '', label: 'Select Taluk'    }, ...taluks.map(t    => ({ value: t, label: t }))];

  /* ── Terms step ─────────────────────────────────────────────────────────── */
  if (step === 'terms') return (
    <div className="auth-root">
      <div className="auth-grid" />
      <div className="auth-panel">
        <AuthBrand />
        <div className="auth-form-pane">
          <div className="auth-form-title">Terms &amp; Conditions</div>
          <div className="auth-form-sub">Read carefully before creating your account</div>

          <div className="terms-scroll">
            {[
              ['Terms of Use',   'By using this application you agree to comply with all company policies related to sales operations, stock handling, billing, and customer management.'],
              ['Location Data',  'Location data may be captured during working hours to verify retailer visits and ensure accurate reporting. No tracking is performed outside working hours.'],
              ['Misuse Policy',  'Any misuse of the application, data manipulation, or unauthorized access may lead to suspension or termination of access.'],
              ['Policy Updates', 'The company reserves the right to update these terms at any time. Continued use implies acceptance of updated terms.'],
              ['Disclaimer',     'If you do not agree with these terms, please do not proceed with registration.'],
            ].map(([h, t]) => (
              <div key={h} className="terms-section">
                <div className="terms-heading">{h}</div>
                <div className="terms-text">{t}</div>
              </div>
            ))}
          </div>

          <button
            className="terms-checkbox-row"
            type="button"
            onClick={() => { setAccepted(a => !a); setApiErr(''); }}
          >
            {accepted
              ? <CheckSquare size={20} color="var(--red)" />
              : <Square      size={20} color="var(--text-muted)" />}
            <span className="terms-checkbox-lbl">
              I have read and agree to the Terms &amp; Conditions
            </span>
          </button>

          {apiErr && <div className="auth-error"><span>⚠</span>{apiErr}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost"   size="lg" style={{ flex: 1 }}
              onClick={() => { setStep('form'); setApiErr(''); }}>
              ← Back
            </Button>
            <Button variant="primary" size="lg" style={{ flex: 2 }}
              loading={loading} disabled={!accepted}
              onClick={handleRegister}>
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Registration form ───────────────────────────────────────────────────── */
  return (
    <div className="auth-root">
      <div className="auth-grid" />
      <div className="auth-panel" style={{ width: 'min(1040px, 96vw)' }}>
        <AuthBrand />
        <div className="auth-form-pane" style={{ overflowY: 'auto' }}>
          <div className="auth-form-title">Create Account</div>
          <div className="auth-form-sub">Register your account to get started</div>

          <form className="auth-form" onSubmit={handleNext}>

            {/* Row 1: Name + Mobile */}
            <div className="form-row">
              <Input
                label="Full Name"
                placeholder="Enter your name"
                value={vals.name}
                onChange={e => set('name', e.target.value)}
                error={errs.name}
                autoComplete="name"
              />
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="Enter your mobile number"
                value={vals.mobile}
                onChange={e => set('mobile', e.target.value)}
                error={errs.mobile}
                maxLength={10}
              />
            </div>

            {/* Email */}
            <Input
              label="Email ID"
              type="email"
              placeholder="Enter your email ID"
              value={vals.email}
              onChange={e => set('email', e.target.value)}
              error={errs.email}
              autoComplete="email"
            />

            {/* Password row */}
            <div className="form-row">
              <div style={{ position: 'relative' }}>
                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your Password"
                  value={vals.password}
                  onChange={e => set('password', e.target.value)}
                  error={errs.password}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  style={{ bottom: errs.password ? 28 : 10, top: 'auto', transform: 'none' }}
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Enter your Confirm Password"
                value={vals.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                error={errs.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            {/* Role */}
            <Select
              label="Role"
              options={ROLES}
              value={vals.role}
              onChange={e => set('role', e.target.value)}
              error={errs.role}
            />

            {/* State */}
            <Select
              label="State"
              options={stateOpts}
              value={vals.state}
              onChange={e => set('state', e.target.value)}
              error={errs.state}
            />

            {/* District — enabled only when state selected */}
            <Select
              label="District"
              options={districtOpts}
              value={vals.district}
              onChange={e => set('district', e.target.value)}
              error={errs.district}
              disabled={!vals.state}
            />

            {/* Taluk — enabled only when district selected */}
            <Select
              label="Taluk"
              options={talukOpts}
              value={vals.taluk}
              onChange={e => set('taluk', e.target.value)}
              error={errs.taluk}
              disabled={!vals.district}
            />

            {apiErr && <div className="auth-error"><span>⚠</span>{apiErr}</div>}

            <Button type="submit" variant="primary" size="lg" fullWidth>
              Next — Review Terms
            </Button>
          </form>

          <div className="auth-form-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ OTP PAGE ═══════════════════════════════════════════════════════════════════
   register → verify with mobile  → /api/auth/verify-otp        { mobile, otp }
   reset    → verify with email   → /api/auth/verify-reset-otp  { email,  otp }
══════════════════════════════════════════════════════════════════════════════ */
const OTP_LENGTH = 6;
const OTP_TIMER  = 45;

export const OtpPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { loading, error, verified, type: verifiedType } = useSelector(s => s.otp);

  const { mobile, email, type } = location.state || {};

  const [otp,       setOtp]       = useState(Array(OTP_LENGTH).fill(''));
  const [timer,     setTimer]     = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [apiErr,    setApiErr]    = useState('');
  const inputRefs = useRef([]);

  /* Countdown */
  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  /* Redirect on success */
  useEffect(() => {
    if (!verified) return;
    dispatch(resetOtpState());
    if (verifiedType === 'register') {
      toast.success('Account verified! Please sign in.');
      navigate('/login', { replace: true });
    } else {
      navigate('/reset-password', { state: { email, otp: otp.join('') } });
    }
  }, [verified, verifiedType, email, otp, dispatch, navigate]);

  /* Show error */
  useEffect(() => {
    if (error) {
      setApiErr(error);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [error]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    setApiErr('');
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setApiErr('Enter the complete 6-digit OTP'); return; }
    setApiErr('');
    dispatch(verifyOtp({ type, mobile, email, otp: code }));
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    setCanResend(false);
    setTimer(OTP_TIMER);
    setApiErr('');
    try {
      await dispatch(resendOtp({ type, mobile, email })).unwrap();
      toast.success('OTP resent successfully');
    } catch {
      setApiErr('Failed to resend OTP. Try again.');
    }
  };

  // Store the latest handleSubmit in a ref to avoid stale closure issues
  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;

  /* Auto-submit when all 6 digits entered */
  useEffect(() => {
    if (otp.every(d => d !== '') && !loading) {
      submitRef.current();
    }
  }, [otp, loading]);   // all dependencies properly listed

  const maskedTarget = type === 'register'
    ? `+91 ******${mobile?.slice(-4) || '****'}`
    : email || '';

  return (
    <div className="auth-root">
      <div className="auth-grid" />
      <div className="auth-panel">
        <AuthBrand />
        <div className="auth-form-pane">
          <div className="auth-form-title">Verify OTP</div>
          <div className="auth-form-sub">
            6-digit code sent to <strong>{maskedTarget}</strong>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="otp-row" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className={`otp-input ${digit ? 'otp-filled' : ''}`}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  inputMode="numeric"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="otp-timer-row">
              {canResend
                ? <button type="button" className="auth-link" onClick={handleResend} disabled={loading}>Resend OTP</button>
                : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resend in <strong style={{ color: 'var(--red)' }}>{timer}s</strong></span>
              }
            </div>

            {apiErr && <div className="auth-error"><span>⚠</span>{apiErr}</div>}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Verify OTP
            </Button>
          </form>

          <div className="auth-form-footer">
            <Link to="/login" className="auth-link">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ FORGOT PASSWORD ════════════════════════════════════════════════════════════
   POST /api/auth/forgot-password  { email }
══════════════════════════════════════════════════════════════════════════════ */
export const ForgotPasswordPage = () => {
  const navigate       = useNavigate();
  const [email,   setEmail]   = useState('');
  const [errMsg,  setErrMsg]  = useState('');
  const [apiErr,  setApiErr]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email)                       { setErrMsg('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErrMsg('Invalid email address'); return; }
    setLoading(true); setApiErr('');
    try {
      const { default: API } = await import('../../services/API/api');
      const res = await API.post('/api/auth/forgot-password', { email: email.trim() });
      if (res.data?.success !== false) {
        navigate('/otp', { state: { email: email.trim(), type: 'reset' } });
      } else {
        setApiErr(res.data?.message || 'Failed to send OTP');
      }
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-grid" />
      <div className="auth-panel">
        <AuthBrand />
        <div className="auth-form-pane">
          <div className="auth-form-title">Forgot Password</div>
          <div className="auth-form-sub">Enter your email and we'll send a reset OTP</div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email Address" type="email" placeholder="you@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrMsg(''); setApiErr(''); }}
              error={errMsg}
              autoFocus
            />
            {apiErr && <div className="auth-error"><span>⚠</span>{apiErr}</div>}
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Send OTP
            </Button>
          </form>
          <div className="auth-form-footer">
            <Link to="/login" className="auth-link">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ RESET PASSWORD ═════════════════════════════════════════════════════════════
   POST /api/auth/reset-password  { email, otp, password }
══════════════════════════════════════════════════════════════════════════════ */
export const ResetPasswordPage = () => {
  const navigate       = useNavigate();
  const location       = useLocation();
  const { email, otp } = location.state || {};

  const [vals,    setVals]    = useState({ password: '', confirm: '' });
  const [errs,    setErrs]    = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (vals.password.length < 6)       e2.password = 'Min 6 characters';
    if (vals.password !== vals.confirm) e2.confirm  = 'Passwords do not match';
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true); setApiErr('');
    try {
      const { default: API } = await import('../../services/API/api');
      await API.post('/api/auth/reset-password', { email, otp, password: vals.password });
      toast.success('Password reset successfully!');
      navigate('/login', { replace: true });
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Reset failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-grid" />
      <div className="auth-panel">
        <AuthBrand />
        <div className="auth-form-pane">
          <div className="auth-form-title">Reset Password</div>
          <div className="auth-form-sub">Set a new password for <strong>{email}</strong></div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <Input
                label="New Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={vals.password}
                onChange={e => { setVals(p => ({ ...p, password: e.target.value })); setErrs(p => ({ ...p, password: '' })); }}
                error={errs.password}
                autoFocus
              />
              <button
                type="button"
                className="pw-toggle"
                style={{ bottom: errs.password ? 28 : 10, top: 'auto', transform: 'none' }}
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat new password"
              value={vals.confirm}
              onChange={e => { setVals(p => ({ ...p, confirm: e.target.value })); setErrs(p => ({ ...p, confirm: '' })); }}
              error={errs.confirm}
            />
            {apiErr && <div className="auth-error"><span>⚠</span>{apiErr}</div>}
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};