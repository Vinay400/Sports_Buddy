import React from 'react';
import './ParticipantsModal.css';

const ParticipantsModal = ({ isOpen, onClose, participants }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Activity Participants</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="modal-content">
          {participants.length === 0 ? (
            <p>No participants available.</p>
          ) : (
            participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <strong>{participant.displayName || 'Unnamed User'}</strong><br />
                <small>{participant.email || 'No email provided'}</small><br />
                <div className="participant-actions">
                  <button className="message-btn">Message</button>
                  <button className="add-buddy-btn">Add Buddy</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantsModal;
