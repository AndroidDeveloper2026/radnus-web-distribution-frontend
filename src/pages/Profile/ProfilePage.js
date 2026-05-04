import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Camera } from 'lucide-react';
import { selectAuthState } from '../../store/selectors/authSelector';
import { Button, Input, Card, toast } from '../../components/ui/UI';
import { updateProfile } from '../../services/features/profile/profileSlice'; // <-- added
import API from '../../services/API/api';
import { setUserData } from '../../services/AuthStorage/authStorage';
import './Profile.css';

const ROLE_GRADIENTS = {
  Admin:              'linear-gradient(135deg,#dc2626,#7c3aed)',
  Radnus:             'linear-gradient(135deg,#dc2626,#ea580c)',
  Distributor:        'linear-gradient(135deg,#2563eb,#7c3aed)',
  MarketingManager:   'linear-gradient(135deg,#059669,#2563eb)',
  MarketingExecutive: 'linear-gradient(135deg,#d97706,#dc2626)',
  FSE:                'linear-gradient(135deg,#7c3aed,#2563eb)',
  Retailer:           'linear-gradient(135deg,#059669,#0891b2)',
};

const ProfilePage = () => {
  const { user, role } = useSelector(selectAuthState);
  const dispatch = useDispatch(); // <-- added

  // Profile photo state - start with the existing permanent URL
  const [photoPreview, setPhotoPreview] = useState(user?.profileImage || user?.photo || null);
  const [photoFile, setPhotoFile]     = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Profile fields
  const [profile, setProfile] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || user?.mobile || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [pw, setPw]         = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrs, setPwErrs] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  /* ── Photo picker ─────────────────────────────────────────────────────────── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPhotoFile(file);
    // Show local preview temporarily
    setPhotoPreview(URL.createObjectURL(file));
  };

  /* ── Photo upload ─────────────────────────────────────────────────────────── */
  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    try {
      // Use the updated thunk that expects a File object
      const resultAction = await dispatch(
        updateProfile({
          role,               // required by backend
          data: {},           // no other profile fields to change
          photo: photoFile,   // <-- now a File object, not { uri, type, name }
        })
      ).unwrap();

      // resultAction is the response from the API (e.g. { user: { ... } })
      const updatedUser = resultAction.user || resultAction;

      // 1. Set the permanent server URL as the preview
      const permanentUrl = updatedUser.profileImage || updatedUser.photo;
      setPhotoPreview(permanentUrl);

      // 2. Update localStorage (so it survives a manual refresh)
      setUserData({ ...user, profileImage: permanentUrl });

      // 3. (Optional) Immediately reflect the change in the Redux auth state
      // If your auth slice has an updateUser action, dispatch it here.
      // dispatch(updateUser({ profileImage: permanentUrl }));

      setPhotoFile(null);
      toast.success('Profile photo updated');
    } catch (e) {
      toast.error(
        e?.message || e?.response?.data?.message || 'Photo upload failed'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  /* ── Profile save ─────────────────────────────────────────────────────────── */
  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const res = await API.put('/api/profile', profile);
      const updatedUser = { ...user, ...profile, ...(res.data?.user || {}) };
      setUserData(updatedUser);
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Password save ────────────────────────────────────────────────────────── */
  const handlePwSave = async () => {
    const e = {};
    if (!pw.current)             e.current = 'Current password required';
    if (pw.newPw.length < 6)     e.newPw   = 'Min 6 characters';
    if (pw.newPw !== pw.confirm) e.confirm  = 'Passwords do not match';
    setPwErrs(e);
    if (Object.keys(e).length) return;

    setSavingPw(true);
    try {
      await API.put('/api/profile/password', { currentPassword: pw.current, newPassword: pw.newPw });
      toast.success('Password updated');
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = (profile.name || user?.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="profile-page">

      {/* ── Hero Banner ── */}
      <div className="profile-hero" style={{ background: ROLE_GRADIENTS[role] || ROLE_GRADIENTS.Radnus }}>
        <div className="profile-hero-avatar-wrap">
          <div className="profile-avatar-ring">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">{initials}</div>
            )}
            <button
              className="profile-camera-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change photo"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>

          {photoFile && (
            <Button
              variant="primary"
              size="xs"
              loading={uploadingPhoto}
              onClick={handlePhotoUpload}
              style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}
            >
              Save Photo
            </Button>
          )}
        </div>

        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{profile.name || user?.name || 'User'}</h2>
          <p className="profile-hero-role">{role}</p>
          <p className="profile-hero-email">{profile.email || user?.email || ''}</p>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="profile-grid">

        {/* Edit Profile */}
        <Card className="card-pad">
          <h3 className="section-title" style={{ marginBottom: 20 }}>Edit Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Full Name"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
            />
            <Input
              label="Email Address"
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com"
            />
            <Input
              label="Phone / Mobile"
              type="tel"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="10-digit mobile"
            />
            <Button variant="primary" loading={savingProfile} onClick={handleProfileSave}>
              Save Changes
            </Button>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Change Password */}
          <Card className="card-pad">
            <h3 className="section-title" style={{ marginBottom: 20 }}>Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Current Password"
                type="password"
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                error={pwErrs.current}
                placeholder="Enter current password"
              />
              <Input
                label="New Password"
                type="password"
                value={pw.newPw}
                onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                error={pwErrs.newPw}
                placeholder="Min 6 characters"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                error={pwErrs.confirm}
                placeholder="Repeat new password"
              />
              <Button variant="secondary" loading={savingPw} onClick={handlePwSave}>
                Update Password
              </Button>
            </div>
          </Card>

          {/* Account Info */}
          <Card className="card-pad">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Account Info</h3>
            <div className="profile-info-rows">
              <div className="profile-info-row">
                <span className="profile-info-lbl">Role</span>
                <span className="profile-info-val">{role}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-lbl">User ID</span>
                <span className="profile-info-val profile-id">{user?._id || user?.id || '—'}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-lbl">Status</span>
                <span className="profile-info-val" style={{ color: 'var(--success)' }}>● Active</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-lbl">Platform</span>
                <span className="profile-info-val">Radnus DMS Web v2.0</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;