import { Gem, Layers, Palette, PaintRoller, Shield, Sparkles, Sun, VolumeX, Wrench } from 'lucide-react'

export const SERVICES = [
  {
    icon: Shield,
    title: 'Paint Protection Film',
    desc: 'Self-healing urethane film guards high-impact zones from stone chips, road debris, and UV fade — invisible armour for daily drivers.',
  },
  {
    icon: Gem,
    title: 'Ceramic & Graphene Coating',
    desc: 'Professional-grade 9H nano-ceramic bonded to your paint for years of hydrophobic protection and a mirror-deep gloss.',
  },
  {
    icon: PaintRoller,
    title: 'Panel Painting',
    desc: 'Factory-matched colour blending and clear-coated panel repairs that disappear into the original finish.',
  },
  {
    icon: Palette,
    title: 'Full Body Painting',
    desc: 'Complete strip-down respray or show-stopping colour change, finished to a concours-level standard.',
  },
  {
    icon: Wrench,
    title: 'Insurance & Accidental Repair',
    desc: 'We handle the dents, scratches, and paperwork — transparent estimates with your insurer, zero hassle for you.',
  },
  {
    icon: VolumeX,
    title: 'Sound Damping',
    desc: 'Multi-layer acoustic insulation that hushes road noise and lets your audio system finally breathe.',
  },
  {
    icon: Sun,
    title: 'Safety Glazing & Sunroof Film',
    desc: 'Heat-rejecting glazing and sunroof films that cut cabin temperatures and block up to 99% of UV.',
  },
  {
    icon: Layers,
    title: 'Vinyl Wrap',
    desc: 'Satin, gloss, or matte wraps in any colour — reversible style that protects the factory paint underneath.',
  },
  {
    icon: Sparkles,
    title: 'Detailing & Deep Clean',
    desc: 'Interior steam clean, headlight restoration, engine bay detail, and premium hand washes for showroom-fresh results.',
  },
]

export const PACKAGES = [
  {
    name: 'Essential',
    tagline: 'A clean start',
    price: 149,
    duration: '2–3 hrs',
    highlight: false,
    features: [
      'Exterior hand wash & dry',
      'Wheel & tire deep clean',
      'Window cleaning (exterior)',
      'Interior vacuum & wipe-down',
      'Tire shine & trim dressing',
    ],
  },
  {
    name: 'Signature',
    tagline: 'Our most popular',
    price: 299,
    duration: '4–5 hrs',
    highlight: true,
    features: [
      'Everything in Essential',
      'Clay bar decontamination',
      'One-stage paint polish',
      'Interior steam clean',
      'Leather conditioning',
      'Headlight polish & seal',
      '3-month paint sealant',
    ],
  },
  {
    name: 'Prestige',
    tagline: 'Concours-level finish',
    price: 599,
    duration: '8–10 hrs',
    highlight: false,
    features: [
      'Everything in Signature',
      'Multi-stage paint correction',
      'Engine bay detail',
      'Full ceramic coating (1 yr)',
      'Priority booking slot',
      '6-month complimentary maintenance wash',
      'Detailed estimate & e-invoice',
    ],
  },
]