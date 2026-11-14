export const ROLES = ['customer', 'provider', 'admin'];

// Services offered through the platform (Business Plan, Product / Service Mix)
export const SERVICE_TYPES = [
  'property_inspection',
  'house_cleaning',
  'garden_maintenance',
  'minor_repairs',
  'pet_care',
  'family_welfare_visit',
  'errand_assistance',
];

export const SERVICE_LABELS = {
  property_inspection: 'Property inspection',
  house_cleaning: 'House cleaning',
  garden_maintenance: 'Garden maintenance',
  minor_repairs: 'Minor repairs',
  pet_care: 'Pet care',
  family_welfare_visit: 'Family welfare visits',
  errand_assistance: 'Errands',
};

// Shown to providers while they choose what they offer
export const SERVICE_DESCRIPTIONS = {
  property_inspection: 'Check empty houses for leaks, damage or break-ins and send photos',
  house_cleaning: 'Sweep, mop, dust and tidy homes, one-off or regularly',
  garden_maintenance: 'Cut grass, trim plants, clear leaves and water the garden',
  minor_repairs: 'Fix taps, switches, doors and other small jobs around the house',
  pet_care: 'Feed, walk and look after pets while owners are away',
  family_welfare_visit: 'Visit elderly parents, keep them company and report back (non-medical)',
  errand_assistance: 'Buy groceries, pay bills, collect medicine or documents',
};

// Starting prices in LKR (Business Plan, Annex I and III)
export const SERVICE_PRICES = {
  property_inspection: 3000,
  house_cleaning: 3500,
  garden_maintenance: 4000,
  minor_repairs: 2000,
  pet_care: 3500,
  family_welfare_visit: 5000,
  errand_assistance: 2000,
};

export const PROVINCES = {
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Southern: ['Galle', 'Matara', 'Hambantota'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Uva: ['Badulla', 'Monaragala'],
  Sabaragamuwa: ['Kegalle', 'Ratnapura'],
};

export const DISTRICTS = Object.values(PROVINCES).flat().sort();

// Initial operating area (Business Plan, section 4)
export const LAUNCH_DISTRICTS = ['Colombo', 'Gampaha'];

export const PROVIDER_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

// Verification documents; certificates are optional and may be uploaded more than once
export const DOCUMENT_TYPES = {
  nic_front: { label: 'NIC (front)', required: true, multiple: false },
  nic_back: { label: 'NIC (back)', required: true, multiple: false },
  police_report: { label: 'Police clearance report', required: true, multiple: false },
  certificate: { label: 'Certificate or qualification', required: false, multiple: true },
};

export const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'];

// Weekly availability, used by booking matching
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const PERIODS = {
  morning: '8 am to 12 pm',
  afternoon: '12 pm to 4 pm',
  evening: '4 pm to 8 pm',
};

export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Booking lifecycle agreed in the team doc; checked_in/completed get GPS and photo proof from Ahmed's module
export const BOOKING_STATUSES = ['requested', 'assigned', 'accepted', 'checked_in', 'completed', 'confirmed', 'cancelled'];
// Statuses that occupy a provider's time slot
export const ACTIVE_BOOKING_STATUSES = ['assigned', 'accepted', 'checked_in'];
export const RECURRING_FREQUENCIES = { weekly: 7, fortnightly: 14, monthly: 28 };
export const BOOKING_MAX_DAYS_AHEAD = 60;
// How long an assigned provider has to accept before the job moves to the next match
export const ASSIGNMENT_RESPONSE_HOURS = 24;

// A provider is flagged for review when their average falls below this with enough reviews
export const LOW_RATING_THRESHOLD = 3;
export const LOW_RATING_MIN_REVIEWS = 3;

export const REQUIRED_DOCUMENT_TYPES = Object.entries(DOCUMENT_TYPES)
  .filter(([, t]) => t.required)
  .map(([type]) => type);

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_CERTIFICATES = 5;
