// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { selectAuthState } from '../../store/selectors/authSelector';
// import { Button, Input, Card, toast, Avatar } from '../../components/ui/UI';
// import API from '../../services/API/api';
// import './Profile.css';

// const ProfilePage = () => {
//   const { user, role } = useSelector(selectAuthState);

//   const [profile, setProfile] = useState({
//     name:  user?.name  || '',
//     email: user?.email || '',
//     phone: user?.phone || '',
//   });
//   const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
//   const [pwErrs, setPwErrs] = useState({});
//   const [savingProfile, setSavingProfile] = useState(false);
//   const [savingPw, setSavingPw]           = useState(false);

//   const handleProfileSave = async () => {
//     setSavingProfile(true);
//     try {
//       await API.put('/api/profile', profile);
//       toast.success('Profile updated successfully');
//     } catch (e) {
//       toast.error(e?.response?.data?.message || 'Update failed');
//     } finally {
//       setSavingProfile(false);
//     }
//   };

//   const handlePwSave = async () => {
//     const e = {};
//     if (!pw.current)               e.current = 'Current password required';
//     if (pw.newPw.length < 6)       e.newPw   = 'Min 6 characters';
//     if (pw.newPw !== pw.confirm)   e.confirm  = 'Passwords do not match';
//     setPwErrs(e);
//     if (Object.keys(e).length) return;

//     setSavingPw(true);
//     try {
//       await API.put('/api/profile/password', { currentPassword: pw.current, newPassword: pw.newPw });
//       toast.success('Password updated');
//       setPw({ current: '', newPw: '', confirm: '' });
//     } catch (e) {
//       toast.error(e?.response?.data?.message || 'Password change failed');
//     } finally {
//       setSavingPw(false);
//     }
//   };

//   const ROLE_COLORS = {
//     Admin:              'linear-gradient(135deg,#dc2626,#7c3aed)',
//     Radnus:             'linear-gradient(135deg,#dc2626,#ea580c)',
//     Distributor:        'linear-gradient(135deg,#2563eb,#7c3aed)',
//     MarketingManager:   'linear-gradient(135deg,#059669,#2563eb)',
//     MarketingExecutive: 'linear-gradient(135deg,#d97706,#dc2626)',
//     FSE:                'linear-gradient(135deg,#7c3aed,#2563eb)',
//     Retailer:           'linear-gradient(135deg,#059669,#0891b2)',
//   };

//   return (
//     <div className="profile-page">
//       {/* Profile header */}
//       <div className="profile-hero" style={{ background: ROLE_COLORS[role] || 'linear-gradient(135deg,#dc2626,#7c3aed)' }}>
//         <div className="profile-hero-avatar">
//           <Avatar name={user?.name || 'U'} size="xl" />
//         </div>
//         <div className="profile-hero-info">
//           <h2 className="profile-hero-name">{user?.name || 'User'}</h2>
//           <p className="profile-hero-role">{role}</p>
//           <p className="profile-hero-email">{user?.email || ''}</p>
//         </div>
//       </div>

//       <div className="profile-grid">
//         {/* Edit Profile */}
//         <Card className="card-pad">
//           <h3 className="section-title" style={{ marginBottom: 20 }}>Edit Profile</h3>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//             <Input
//               label="Full Name"
//               value={profile.name}
//               onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
//               placeholder="Your full name"
//             />
//             <Input
//               label="Email Address"
//               type="email"
//               value={profile.email}
//               onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
//               placeholder="your@email.com"
//             />
//             <Input
//               label="Phone Number"
//               type="tel"
//               value={profile.phone}
//               onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
//               placeholder="10-digit mobile"
//             />
//             <Button variant="primary" loading={savingProfile} onClick={handleProfileSave}>
//               Save Changes
//             </Button>
//           </div>
//         </Card>

//         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
//           {/* Change Password */}
//           <Card className="card-pad">
//             <h3 className="section-title" style={{ marginBottom: 20 }}>Change Password</h3>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//               <Input
//                 label="Current Password"
//                 type="password"
//                 value={pw.current}
//                 onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
//                 error={pwErrs.current}
//                 placeholder="••••••••"
//               />
//               <Input
//                 label="New Password"
//                 type="password"
//                 value={pw.newPw}
//                 onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
//                 error={pwErrs.newPw}
//                 placeholder="Min 6 characters"
//               />
//               <Input
//                 label="Confirm New Password"
//                 type="password"
//                 value={pw.confirm}
//                 onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
//                 error={pwErrs.confirm}
//                 placeholder="Repeat new password"
//               />
//               <Button variant="secondary" loading={savingPw} onClick={handlePwSave}>
//                 Update Password
//               </Button>
//             </div>
//           </Card>

//           {/* Account Info */}
//           <Card className="card-pad">
//             <h3 className="section-title" style={{ marginBottom: 16 }}>Account Info</h3>
//             <div className="profile-info-rows">
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">Role</span>
//                 <span className="profile-info-val">{role}</span>
//               </div>
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">User ID</span>
//                 <span className="profile-info-val profile-id">{user?._id || user?.id || '—'}</span>
//               </div>
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">Account Status</span>
//                 <span className="profile-info-val" style={{ color: 'var(--success)' }}>Active</span>
//               </div>
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">Platform</span>
//                 <span className="profile-info-val">Radnus DMS Web v2.0</span>
//               </div>
//             </div>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;

//---------------old code---------------

// import React, { useState, useRef } from 'react';
// import { useSelector } from 'react-redux';
// import { Camera } from 'lucide-react';
// import { selectAuthState } from '../../store/selectors/authSelector';
// import { Button, Input, Card, toast } from '../../components/ui/UI';
// import API from '../../services/API/api';
// import { setUserData } from '../../services/AuthStorage/authStorage';
// import './Profile.css';

// const ROLE_GRADIENTS = {
//   Admin:              'linear-gradient(135deg,#dc2626,#7c3aed)',
//   Radnus:             'linear-gradient(135deg,#dc2626,#ea580c)',
//   Distributor:        'linear-gradient(135deg,#2563eb,#7c3aed)',
//   MarketingManager:   'linear-gradient(135deg,#059669,#2563eb)',
//   MarketingExecutive: 'linear-gradient(135deg,#d97706,#dc2626)',
//   FSE:                'linear-gradient(135deg,#7c3aed,#2563eb)',
//   Retailer:           'linear-gradient(135deg,#059669,#0891b2)',
// };

// const ProfilePage = () => {
//   const { user, role } = useSelector(selectAuthState);

//   // Profile photo state
//   const [photoPreview,  setPhotoPreview]  = useState(user?.profileImage || user?.photo || null);
//   const [photoFile,     setPhotoFile]     = useState(null);
//   const [uploadingPhoto, setUploadingPhoto] = useState(false);
//   const fileInputRef = useRef(null);

//   // Profile fields
//   const [profile, setProfile] = useState({
//     name:  user?.name  || '',
//     email: user?.email || '',
//     phone: user?.phone || user?.mobile || '',
//   });
//   const [savingProfile, setSavingProfile] = useState(false);

//   // Password fields
//   const [pw, setPw]         = useState({ current: '', newPw: '', confirm: '' });
//   const [pwErrs, setPwErrs] = useState({});
//   const [savingPw, setSavingPw] = useState(false);

//   /* ── Photo picker ─────────────────────────────────────────────────────────── */
//   const handlePhotoChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
//     setPhotoFile(file);
//     setPhotoPreview(URL.createObjectURL(file));
//   };

//   const handlePhotoUpload = async () => {
//     if (!photoFile) return;
//     setUploadingPhoto(true);
//     try {
//       const fd = new FormData();
//       fd.append('profileImage', photoFile);
//       const res = await API.put('/api/profile/photo', fd, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       const updatedUser = { ...user, profileImage: res.data?.profileImage || photoPreview };
//       setUserData(updatedUser);
//       setPhotoFile(null);
//       toast.success('Profile photo updated');
//     } catch (e) {
//       toast.error(e?.response?.data?.message || 'Photo upload failed');
//     } finally {
//       setUploadingPhoto(false);
//     }
//   };

//   /* ── Profile save ─────────────────────────────────────────────────────────── */
//   const handleProfileSave = async () => {
//     setSavingProfile(true);
//     try {
//       const res = await API.put('/api/profile', profile);
//       const updatedUser = { ...user, ...profile, ...(res.data?.user || {}) };
//       setUserData(updatedUser);
//       toast.success('Profile updated successfully');
//     } catch (e) {
//       toast.error(e?.response?.data?.message || 'Update failed');
//     } finally {
//       setSavingProfile(false);
//     }
//   };

//   /* ── Password save ────────────────────────────────────────────────────────── */
//   const handlePwSave = async () => {
//     const e = {};
//     if (!pw.current)             e.current = 'Current password required';
//     if (pw.newPw.length < 6)     e.newPw   = 'Min 6 characters';
//     if (pw.newPw !== pw.confirm) e.confirm  = 'Passwords do not match';
//     setPwErrs(e);
//     if (Object.keys(e).length) return;

//     setSavingPw(true);
//     try {
//       await API.put('/api/profile/password', { currentPassword: pw.current, newPassword: pw.newPw });
//       toast.success('Password updated');
//       setPw({ current: '', newPw: '', confirm: '' });
//     } catch (e) {
//       toast.error(e?.response?.data?.message || 'Password change failed');
//     } finally {
//       setSavingPw(false);
//     }
//   };

//   const initials = (profile.name || user?.name || 'U')
//     .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

//   return (
//     <div className="profile-page">

//       {/* ── Hero Banner ── */}
//       <div className="profile-hero" style={{ background: ROLE_GRADIENTS[role] || ROLE_GRADIENTS.Radnus }}>
//         <div className="profile-hero-avatar-wrap">
//           {/* Avatar / Photo */}
//           <div className="profile-avatar-ring">
//             {photoPreview ? (
//               <img src={photoPreview} alt="Profile" className="profile-avatar-img" />
//             ) : (
//               <div className="profile-avatar-placeholder">{initials}</div>
//             )}
//             {/* Camera overlay button */}
//             <button
//               className="profile-camera-btn"
//               onClick={() => fileInputRef.current?.click()}
//               title="Change photo"
//             >
//               <Camera size={16} />
//             </button>
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               style={{ display: 'none' }}
//               onChange={handlePhotoChange}
//             />
//           </div>

//           {/* Upload button — shows when new photo selected */}
//           {photoFile && (
//             <Button
//               variant="primary"
//               size="xs"
//               loading={uploadingPhoto}
//               onClick={handlePhotoUpload}
//               style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }}
//             >
//               Save Photo
//             </Button>
//           )}
//         </div>

//         <div className="profile-hero-info">
//           <h2 className="profile-hero-name">{profile.name || user?.name || 'User'}</h2>
//           <p className="profile-hero-role">{role}</p>
//           <p className="profile-hero-email">{profile.email || user?.email || ''}</p>
//         </div>
//       </div>

//       {/* ── Grid ── */}
//       <div className="profile-grid">

//         {/* Edit Profile */}
//         <Card className="card-pad">
//           <h3 className="section-title" style={{ marginBottom: 20 }}>Edit Profile</h3>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//             <Input
//               label="Full Name"
//               value={profile.name}
//               onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
//               placeholder="Your full name"
//             />
//             <Input
//               label="Email Address"
//               type="email"
//               value={profile.email}
//               onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
//               placeholder="your@email.com"
//             />
//             <Input
//               label="Phone / Mobile"
//               type="tel"
//               value={profile.phone}
//               onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
//               placeholder="10-digit mobile"
//             />
//             <Button variant="primary" loading={savingProfile} onClick={handleProfileSave}>
//               Save Changes
//             </Button>
//           </div>
//         </Card>

//         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

//           {/* Change Password */}
//           <Card className="card-pad">
//             <h3 className="section-title" style={{ marginBottom: 20 }}>Change Password</h3>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//               <Input label="Current Password" type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} error={pwErrs.current} placeholder="••••••••" />
//               <Input label="New Password"     type="password" value={pw.newPw}   onChange={e => setPw(p => ({ ...p, newPw:   e.target.value }))} error={pwErrs.newPw}   placeholder="Min 6 characters" />
//               <Input label="Confirm Password" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} error={pwErrs.confirm} placeholder="Repeat new password" />
//               <Button variant="secondary" loading={savingPw} onClick={handlePwSave}>Update Password</Button>
//             </div>
//           </Card>

//           {/* Account Info */}
//           <Card className="card-pad">
//             <h3 className="section-title" style={{ marginBottom: 16 }}>Account Info</h3>
//             <div className="profile-info-rows">
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">Role</span>
//                 <span className="profile-info-val">{role}</span>
//               </div>
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">User ID</span>
//                 <span className="profile-info-val profile-id">{user?._id || user?.id || '—'}</span>
//               </div>
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">Status</span>
//                 <span className="profile-info-val" style={{ color: 'var(--success)' }}>● Active</span>
//               </div>
//               <div className="profile-info-row">
//                 <span className="profile-info-lbl">Platform</span>
//                 <span className="profile-info-val">Radnus DMS Web v2.0</span>
//               </div>
//             </div>
//           </Card>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;


//--------------------------------

import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Camera } from 'lucide-react';
import { selectAuthState } from '../../store/selectors/authSelector';
import { Button, Input, Card, toast } from '../../components/ui/UI';
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

  // Profile photo state
  const [photoPreview,  setPhotoPreview]  = useState(user?.profileImage || user?.photo || null);
  const [photoFile,     setPhotoFile]     = useState(null);
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
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('profileImage', photoFile);
      const res = await API.put('/api/profile/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = { ...user, profileImage: res.data?.profileImage || photoPreview };
      setUserData(updatedUser);
      setPhotoFile(null);
      toast.success('Profile photo updated');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Photo upload failed');
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
          {/* Avatar / Photo */}
          <div className="profile-avatar-ring">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">{initials}</div>
            )}
            {/* Camera overlay button */}
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

          {/* Upload button — shows when new photo selected */}
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
                onChange={e => setPw(p => ({ ...p, newPw:   e.target.value }))} 
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