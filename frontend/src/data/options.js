// Option lists shared by the registration and profile forms.
// The values must match the SET columns in backend/database/schema.sql.

export const COUNTRIES = [
  'Sri Lanka', 'India', 'USA', 'United Kingdom', 'Australia', 'Canada', 'Germany', 'France', 'Japan',
  'China', 'Singapore', 'Malaysia', 'UAE', 'Qatar', 'Saudi Arabia', 'New Zealand', 'Italy',
  'Netherlands', 'Sweden', 'Switzerland', 'Other',
]

export const CONTACT_BY = [
  { value: 'students_mentoring', label: 'Students for mentoring' },
  { value: 'university_events', label: 'University for events' },
  { value: 'other_alumni', label: 'Other alumni' },
]

export const CONTRIBUTE = [
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'guest_lecture', label: 'Guest lecture' },
  { value: 'internship', label: 'Providing Internships' },
  { value: 'donation', label: 'Donation (Cash or financial donations are not accepted.)' },
  { value: 'scholarships', label: 'Support scholarships' },
  { value: 'networking', label: 'Networking' },
  { value: 'not_now', label: 'Not now' },
]

export const FIRST_GRAD_YEAR = 1950
export const CURRENT_YEAR = new Date().getFullYear()
