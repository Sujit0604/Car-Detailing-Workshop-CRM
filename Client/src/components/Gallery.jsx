import SectionHeading from './SectionHeading'
import { ACCENT, PANEL_STRONG } from '../config/theme'

const GALLERY_IMAGES = [
  { id: '1494976388531-d1058494cdd8', label: 'Paint Correction', caption: 'After' },
  { id: '1503376780353-7e6692767b70', label: 'Exterior Detail', caption: 'After' },
  { id: '1520031441872-265e4ff70366', label: 'Interior Steam Clean', caption: 'After' },
  { id: '1558618666-fcd25c85cd64', label: 'Ceramic Coating', caption: 'After' },
]

export default function Gallery() {
  return (
    <section id="gallery" className="py-28 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Our Work"
          title="Results That Speak"
          sub="A look at recent projects — paint correction, coatings, interiors, and full restorations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GALLERY_IMAGES.map((img, i) => (
            <div
              key={i}
              className="relative overflow-hidden group"
              style={{ aspectRatio: '16/10', background: PANEL_STRONG }}
            >
              <img
                src={`https://images.unsplash.com/photo-${img.id}?w=900&h=562&fit=crop&auto=format`}
                alt={img.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6"
                style={{
                  background: 'linear-gradient(to top, rgba(12,12,12,0.9) 0%, transparent 60%)',
                }}
              >
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ color: ACCENT, letterSpacing: '0.2em' }}
                >
                  {img.caption}
                </span>
                <span
                  className="text-xl font-black uppercase"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {img.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}