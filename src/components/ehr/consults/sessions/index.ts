/**
 * Telemedicine Session Components
 * All 6 consultation modes with distinct workflows
 */

// Store & Forward - Async Review
export { AsyncReviewSession } from '../AsyncReviewSession';

// Live Communication Modes
export { ChatSession } from './ChatSession';
export { AudioCallSession } from './AudioCallSession';
export { VideoCallSession } from './VideoCallSession';

// Scheduled Appointments
export { ScheduledAppointmentSession } from './ScheduledAppointmentSession';

// Multi-participant Case Reviews
export { CaseReviewBoardSession } from './CaseReviewBoardSession';

/**
 * Telemedicine Mode Overview:
 * 
 * 1. ASYNC (Store & Forward)
 *    - Specialist reviews case offline
 *    - Save & resume functionality
 *    - Split-pane: Referral Package | Response Form
 *    - Use: Non-urgent consultations, radiology reads, pathology reviews
 * 
 * 2. CHAT (Instant Messaging)
 *    - Real-time text conversation
 *    - File/image sharing
 *    - Can escalate to audio/video
 *    - Use: Quick queries, medication questions, follow-ups
 * 
 * 3. AUDIO (VOIP Calls)
 *    - Voice-only consultation
 *    - Lower bandwidth requirement
 *    - Hold/mute functionality
 *    - Use: Phone consultations, rural low-bandwidth areas
 * 
 * 4. VIDEO (Full A/V)
 *    - Complete video consultation
 *    - Screen sharing capability
 *    - Multiple layout modes
 *    - Use: Visual examinations, complex consultations
 * 
 * 5. SCHEDULED (Appointments)
 *    - Pre-booked teleconsultations
 *    - Waiting room management
 *    - Appointment reminders
 *    - Use: Planned follow-ups, specialist clinics
 * 
 * 6. BOARD (Case Review / MDT)
 *    - Multi-participant discussions
 *    - Structured agenda
 *    - Voting/decision tracking
 *    - Save & resume capability
 *    - Use: Tumor boards, M&M conferences, complex case reviews
 */
