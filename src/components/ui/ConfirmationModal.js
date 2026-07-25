import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  children,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isProcessing]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return ReactDOM.createPortal(
    <div 
      className="confirmation-overlay" 
      onClick={!isProcessing ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div 
        className="confirmation-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirmation-header">
          <h3 id="confirmation-title" className="confirmation-title">
            {title}
          </h3>
          <button 
            className="confirmation-close" 
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="confirmation-body">
          {children}
        </div>
        
        <div className="confirmation-footer">
          <button 
            className="confirmation-btn confirmation-btn-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button 
            className="confirmation-btn confirmation-btn-confirm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('root')
  );
};

export default ConfirmationModal;

//+++++++++++++++++++++++++++++++++++++++++++++++++++++

// import React, { useEffect } from 'react';
// import ReactDOM from 'react-dom';
// import { X } from 'lucide-react';
// import './ConfirmationModal.css';

// const ConfirmationModal = ({
//   isOpen,
//   onClose,
//   onConfirm,
//   title = 'Confirm Action',
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   children,
//   isProcessing = false,
// }) => {
//   if (!isOpen) return null;

//   // Handle ESC key
//   useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === 'Escape' && isOpen && !isProcessing) {
//         onClose();
//       }
//     };
//     window.addEventListener('keydown', handleEsc);
//     return () => window.removeEventListener('keydown', handleEsc);
//   }, [isOpen, onClose, isProcessing]);

//   // Prevent body scroll when modal is open
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isOpen]);

//   return ReactDOM.createPortal(
//     <div 
//       className="confirmation-overlay" 
//       onClick={!isProcessing ? onClose : undefined}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="confirmation-title"
//     >
//       <div 
//         className="confirmation-modal" 
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="confirmation-header">
//           <h3 id="confirmation-title" className="confirmation-title">
//             {title}
//           </h3>
//           <button 
//             className="confirmation-close" 
//             onClick={onClose}
//             disabled={isProcessing}
//             aria-label="Close dialog"
//           >
//             <X size={20} />
//           </button>
//         </div>
        
//         <div className="confirmation-body">
//           {children}
//         </div>
        
//         <div className="confirmation-footer">
//           <button 
//             className="confirmation-btn confirmation-btn-cancel"
//             onClick={onClose}
//             disabled={isProcessing}
//           >
//             {cancelText}
//           </button>
//           <button 
//             className="confirmation-btn confirmation-btn-confirm"
//             onClick={onConfirm}
//             disabled={isProcessing}
//           >
//             {isProcessing ? (
//               <>
//                 <span className="spinner"></span>
//                 Processing...
//               </>
//             ) : (
//               confirmText
//             )}
//           </button>
//         </div>
//       </div>
//     </div>,
//     document.getElementById('root')
//   );
// };

// export default ConfirmationModal;

//+++++++++++++++++++++++++++++++++++++++

// import React from 'react';
// import ReactDOM from 'react-dom';
// import { X } from 'lucide-react';
// import './ConfirmationModal.css';

// const ConfirmationModal = ({
//   isOpen,
//   onClose,
//   onConfirm,
//   title = 'Confirm Action',
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   children,
//   isProcessing = false,
// }) => {
//   if (!isOpen) return null;

//   // Handle ESC key
//   React.useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === 'Escape' && isOpen && !isProcessing) {
//         onClose();
//       }
//     };
//     window.addEventListener('keydown', handleEsc);
//     return () => window.removeEventListener('keydown', handleEsc);
//   }, [isOpen, onClose, isProcessing]);

//   // Prevent body scroll when modal is open
//   React.useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isOpen]);

//   return ReactDOM.createPortal(
//     <div 
//       className="confirmation-overlay" 
//       onClick={!isProcessing ? onClose : undefined}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="confirmation-title"
//     >
//       <div 
//         className="confirmation-modal" 
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="confirmation-header">
//           <h3 id="confirmation-title" className="confirmation-title">
//             {title}
//           </h3>
//           <button 
//             className="confirmation-close" 
//             onClick={onClose}
//             disabled={isProcessing}
//             aria-label="Close dialog"
//           >
//             <X size={20} />
//           </button>
//         </div>
        
//         <div className="confirmation-body">
//           {children}
//         </div>
        
//         <div className="confirmation-footer">
//           <button 
//             className="confirmation-btn confirmation-btn-cancel"
//             onClick={onClose}
//             disabled={isProcessing}
//           >
//             {cancelText}
//           </button>
//           <button 
//             className="confirmation-btn confirmation-btn-confirm"
//             onClick={onConfirm}
//             disabled={isProcessing}
//           >
//             {isProcessing ? (
//               <>
//                 <span className="spinner"></span>
//                 Processing...
//               </>
//             ) : (
//               confirmText
//             )}
//           </button>
//         </div>
//       </div>
//     </div>,
//     document.getElementById('root')
//   );
// };

// export default ConfirmationModal;