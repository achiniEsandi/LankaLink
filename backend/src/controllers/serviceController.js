import {
  DISTRICTS,
  LAUNCH_DISTRICTS,
  PACKAGES,
  SERVICE_DESCRIPTIONS,
  SERVICE_LABELS,
  SERVICE_PRICES,
  SERVICE_TYPES,
} from '../constants/index.js';
import Provider from '../models/Provider.js';
import httpError from '../utils/httpError.js';

// Search and matching only ever see approved providers (team agreement 4)
function approvedFilter({ district, service }) {
  const filter = { status: 'approved' };
  if (district) filter.serviceAreas = district;
  if (service) filter.services = service;
  return filter;
}

function readFilters(query) {
  const district = query.district || undefined;
  const service = query.service || undefined;
  if (district && !DISTRICTS.includes(district)) throw httpError(400, 'Unknown district');
  if (service && !SERVICE_TYPES.includes(service)) throw httpError(400, 'Unknown service');
  return { district, service };
}

// Short public name, e.g. "Nimal P."
function publicName(fullName = '') {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

// Catalogue of services with prices, plus how many approved providers offer each
export async function listServices(req, res) {
  const { district } = readFilters(req.query);

  const counts = await Provider.aggregate([
    { $match: approvedFilter({ district }) },
    { $unwind: '$services' },
    { $group: { _id: '$services', count: { $sum: 1 } } },
  ]);
  const countOf = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  res.json({
    district: district ?? null,
    districts: DISTRICTS,
    launchDistricts: LAUNCH_DISTRICTS,
    services: SERVICE_TYPES.map((value) => ({
      value,
      label: SERVICE_LABELS[value],
      description: SERVICE_DESCRIPTIONS[value],
      priceFrom: SERVICE_PRICES[value],
      providerCount: countOf[value] ?? 0,
    })),
    packages: PACKAGES.map((p) => ({ ...p, includes: p.includes.map((s) => ({ value: s, label: SERVICE_LABELS[s] })) })),
  });
}

export async function listProviders(req, res) {
  const filters = readFilters(req.query);

  const providers = await Provider.find(approvedFilter(filters))
    .populate('user', 'name')
    .sort({ experienceYears: -1, createdAt: 1 })
    .limit(50);

  res.json(
    providers
      .filter((p) => p.user)
      .map((p) => ({
        id: p._id,
        name: publicName(p.user.name),
        services: p.services,
        serviceAreas: p.serviceAreas,
        experienceYears: p.experienceYears,
        bio: p.bio,
        verified: true,
      })),
  );
}
