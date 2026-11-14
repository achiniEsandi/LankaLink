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
