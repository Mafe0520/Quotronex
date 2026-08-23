import { AppShell } from '@/components/app/AppShell';

// TEMP preview route — remove before deploy
export default function PreviewAppPage() {
  const mockUser = { id: 'preview', email: 'marco@example.com', firstName: 'Marco' };
  const mockBusiness = { id: 'preview', name: 'Reyes Painting Co.' };
  const mockQuotes = [
    {
      id: 'Q-1041',
      status: 'accepted',
      total_cents: 420000,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      clients: { name: 'Rodriguez Family' },
      quote_items: [{ name: 'Exterior repaint · 2,400 sq ft' }, { name: 'Labor' }],
    },
    {
      id: 'Q-1040',
      status: 'sent',
      total_cents: 1850000,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      clients: { name: 'Williams Remodel' },
      quote_items: [{ name: 'Kitchen gut & rebuild' }],
    },
    {
      id: 'Q-1039',
      status: 'viewed',
      total_cents: 680000,
      created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
      clients: { name: 'Chen Residence' },
      quote_items: [{ name: 'New AC install + ducts' }],
    },
    {
      id: 'Q-1038',
      status: 'converted',
      total_cents: 310000,
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      clients: { name: 'Park Apartments' },
      quote_items: [{ name: 'Water heater + repipe' }],
    },
    {
      id: 'Q-1037',
      status: 'draft',
      total_cents: 540000,
      created_at: new Date(Date.now() - 74 * 3600000).toISOString(),
      clients: { name: 'Torres Home' },
      quote_items: [{ name: '200A panel upgrade' }],
    },
  ];
  const mockPriceBook = [
    { id: '1', name: 'Interior paint — per room', price_cents: 45000, unit: 'room', trade: 'Painting', active: true },
    { id: '2', name: 'Exterior repaint — 2,000 sq ft', price_cents: 380000, unit: 'job', trade: 'Painting', active: true },
    { id: '3', name: 'Ceiling paint', price_cents: 28000, unit: 'room', trade: 'Painting', active: true },
    { id: '4', name: 'Water heater replacement', price_cents: 150000, unit: 'job', trade: 'Plumbing', active: true },
    { id: '5', name: 'AC install + ducts', price_cents: 680000, unit: 'job', trade: 'HVAC', active: true },
  ];

  return (
    <AppShell
      user={mockUser}
      business={mockBusiness}
      quotes={mockQuotes as Parameters<typeof AppShell>[0]['quotes']}
      priceBookItems={mockPriceBook}
    />
  );
}
