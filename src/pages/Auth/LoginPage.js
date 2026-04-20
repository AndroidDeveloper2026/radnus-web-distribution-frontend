import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../../services/features/auth/authSlice';
import { adminLogin } from '../../services/features/auth/adminAuthSlice';
import { Button, Input, Select } from '../../components/ui/UI';
import './Auth.css';

const ROLES = [
  { value: '',                   label: 'Select your role' },
  { value: 'Distributor',        label: 'Distributor' },
  { value: 'FSE',                label: 'Field Sales Executive (FSE)' },
  { value: 'Retailer',           label: 'Retailer' },
  { value: 'MarketingManager',   label: 'Marketing Manager' },
  { value: 'MarketingExecutive', label: 'Marketing Executive' },
  { value: 'Radnus',             label: 'Radnus Employee' },
];

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading } = useSelector(s => s.auth);
  const { loading: adminLoading } = useSelector(s => s.adminAuth);

  const [mode,    setMode]    = useState('user');   // 'user' | 'admin'
  const [showPw,  setShowPw]  = useState(false);
  const [values,  setValues]  = useState({ email: '', password: '', role: '' });
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');

  const set = (k, v) => { setValues(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); setApiErr(''); };

  const validate = () => {
    const e = {};
    if (!values.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) e.email = 'Invalid email';
    if (!values.password) e.password = 'Password is required';
    else if (values.password.length < 6) e.password = 'Min 6 characters';
    if (mode === 'user' && !values.role) e.role = 'Please select a role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (mode === 'admin') {
        await dispatch(adminLogin({ email: values.email.trim(), password: values.password.trim() })).unwrap();
      } else {
        await dispatch(loginUser({ email: values.email.trim(), password: values.password.trim(), role: values.role })).unwrap();
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiErr(typeof err === 'string' ? err : err?.message || 'Login failed');
    }
  };

  const isLoading = loading || adminLoading;

  return (
    <div className="auth-root">
      <div className="auth-grid" />
      <div className="auth-panel">

        {/* Left Brand */}
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
              ['Territory Management',    'State · District · Taluk mapped to sales force'],
              ['Real-Time FSE Tracking',  'Monitor field executives, routes and live sessions'],
              ['Retailer & Distributor',  'Complete CRM, onboarding and invoicing workflows'],
              ['Product & Stock Control', 'Central stock visibility and order management'],
            ].map(([title, desc]) => (
              <div className="brand-feature" key={title}>
                <div className="brand-dot" />
                <div className="brand-feature-text">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="brand-footer">© 2025 Radnus Pvt. Ltd.</div>
        </div>

        {/* Right Form */}
        <div className="auth-form-pane">
          <div className="auth-form-title">Welcome Back</div>
          <div className="auth-form-sub">Sign in to your account to continue</div>

          {/* User / Admin tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'user'  ? 'active' : ''}`} onClick={() => setMode('user')}>User</button>
            <button className={`auth-tab ${mode === 'admin' ? 'active' : ''}`} onClick={() => setMode('admin')}>Admin</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={values.email}
              onChange={e => set('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter password"
                value={values.password}
                onChange={e => set('password', e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />
              <button type="button" className="pw-toggle" style={{ bottom: errors.password ? 28 : 10, top: 'auto', transform: 'none' }} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'user' && (
              <Select
                label="Your Role"
                options={ROLES}
                value={values.role}
                onChange={e => set('role', e.target.value)}
                error={errors.role}
              />
            )}

            {apiErr && (
              <div className="auth-error">
                <span>⚠</span>{apiErr}
              </div>
            )}

            <div className="auth-links">
              <span />
              <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
              Sign In
            </Button>
          </form>

          {mode === 'user' && (
            <div className="auth-form-footer">
              New user?{' '}
              <Link to="/register" className="auth-link">Create account</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
