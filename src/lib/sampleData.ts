import { Contract, Video, PaymentRecord } from '../types';

export const DEFAULT_CONTRACT: Contract = {
  id: 'contract-default-001',
  user_id: 'user-default-editor',
  name: 'Video Editing Master Contract',
  monthly_reference_minutes: 90,
  milestone_minutes: 90,
  milestone_payment: 25000,
  total_contract_value: 150000,
  total_required_minutes: 540,
  start_date: '2026-06-01',
  status: 'active',
  created_at: new Date('2026-06-01T00:00:00Z').toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_SAMPLE_VIDEOS: Video[] = [
  {
    id: 'vid-001',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'The History of Ancient Rome - Rise of the Republic',
    duration_seconds: 1472, // 24m 32s
    completion_date: '2026-06-12',
    youtube_url: 'https://youtube.com/watch?v=sample1',
    notes: 'Color graded and multi-track audio mixed.',
    created_at: new Date('2026-06-12T14:30:00Z').toISOString(),
    updated_at: new Date('2026-06-12T14:30:00Z').toISOString(),
  },
  {
    id: 'vid-002',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'Documentary: Deep Ocean Exploration Mysteries',
    duration_seconds: 1950, // 32m 30s
    completion_date: '2026-06-25',
    youtube_url: 'https://youtube.com/watch?v=sample2',
    notes: 'Complex underwater footage motion tracking.',
    created_at: new Date('2026-06-25T18:00:00Z').toISOString(),
    updated_at: new Date('2026-06-25T18:00:00Z').toISOString(),
  },
  {
    id: 'vid-003',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'Cinematic Travel Vlog: Alpine Expeditions',
    duration_seconds: 2010, // 33m 30s -> Total June: 90m 32s (Crossed Milestone 1: 90m! Earned ৳25k, 32s carry-over)
    completion_date: '2026-06-29',
    youtube_url: 'https://youtube.com/watch?v=sample3',
    notes: 'High frame rate speed ramping.',
    created_at: new Date('2026-06-29T11:20:00Z').toISOString(),
    updated_at: new Date('2026-06-29T11:20:00Z').toISOString(),
  },
  {
    id: 'vid-004',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'Cybersecurity Masterclass: Defending Web Apps',
    duration_seconds: 2700, // 45m 00s
    completion_date: '2026-07-10',
    youtube_url: 'https://youtube.com/watch?v=sample4',
    notes: 'Added custom kinetic typography and lower thirds.',
    created_at: new Date('2026-07-10T16:45:00Z').toISOString(),
    updated_at: new Date('2026-07-10T16:45:00Z').toISOString(),
  },
  {
    id: 'vid-005',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'Podcast Episode 42: Future of Artificial Intelligence',
    duration_seconds: 2730, // 45m 30s -> Total: 181m 02s (Crossed Milestone 2: 180m! Earned ৳50k, 1m 02s carry-over)
    completion_date: '2026-07-28',
    youtube_url: 'https://youtube.com/watch?v=sample5',
    notes: 'Multi-camera switcher sync.',
    created_at: new Date('2026-07-28T20:10:00Z').toISOString(),
    updated_at: new Date('2026-07-28T20:10:00Z').toISOString(),
  },
  {
    id: 'vid-006',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'Complete TypeScript Guide 2026 Edition',
    duration_seconds: 2430, // 40m 30s
    completion_date: '2026-08-08',
    youtube_url: 'https://youtube.com/watch?v=sample6',
    notes: 'Code syntax highlighting overlay overlays.',
    created_at: new Date('2026-08-08T09:15:00Z').toISOString(),
    updated_at: new Date('2026-08-08T09:15:00Z').toISOString(),
  },
  {
    id: 'vid-007',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    title: 'Inside SpaceX Starship Orbital Architecture',
    duration_seconds: 1590, // 26m 30s -> Current Total: 248m 02s (Milestone 3 progress: 68m 02s / 90m = 75.6%, 21m 58s remaining for next ৳25,000!)
    completion_date: '2026-08-21',
    youtube_url: 'https://youtube.com/watch?v=sample7',
    notes: '3D rendering compositing.',
    created_at: new Date('2026-08-21T17:40:00Z').toISOString(),
    updated_at: new Date('2026-08-21T17:40:00Z').toISOString(),
  },
];

export const INITIAL_SAMPLE_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    milestone_number: 1,
    milestone_minutes: 90,
    earned_amount: 25000,
    payment_status: 'paid',
    payment_date: '2026-07-02',
    actual_amount_received: 25000,
    notes: 'Transferred via Bank Wire. Transaction #BK748291.',
    created_at: new Date('2026-06-29T12:00:00Z').toISOString(),
    updated_at: new Date('2026-07-02T10:00:00Z').toISOString(),
  },
  {
    id: 'pay-002',
    user_id: 'user-default-editor',
    contract_id: 'contract-default-001',
    milestone_number: 2,
    milestone_minutes: 90,
    earned_amount: 25000,
    payment_status: 'pending',
    payment_date: null,
    actual_amount_received: null,
    notes: 'Invoice #INV-002 sent on Aug 1st. Awaiting client clearance.',
    created_at: new Date('2026-07-28T21:00:00Z').toISOString(),
    updated_at: new Date('2026-07-28T21:00:00Z').toISOString(),
  },
];
