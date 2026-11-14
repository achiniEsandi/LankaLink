// Copy for the public pages. Prices come from the API (Business Plan); plans are from Annex III.
export const PLANS = [
  {
    id: 'property',
    name: 'Property care plan',
    price: 10000,
    photo: 'svc-property_inspection',
    points: ['Monthly property inspection with photos', 'Garden and cleaning visits', 'One report for every visit'],
  },
  {
    id: 'family',
    name: 'Family support plan',
    price: 45000,
    photo: 'svc-family_welfare_visit',
    points: ['Regular welfare visits to your parents', 'Errands, groceries and bill payments', 'Updates after every visit'],
  },
]

export const CONTACT = {
  phone: '070 267 8393',
  phoneHref: 'tel:+94702678393',
  email: 'lankalink26@gmail.com',
  address: '10/A, Hansagiri Road, Gampaha',
}

export const formatRs = (amount) => `Rs ${amount.toLocaleString('en-LK')}`
