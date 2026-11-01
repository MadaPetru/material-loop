import type { Category, Subcategory } from '@/lib/types';

export const CATEGORIES: Category[] = [
  { id: 'cat-cement', slug: 'cement-adhesives', name: 'Ciment și adezivi', sortOrder: 1, isActive: true },
  { id: 'cat-tiles', slug: 'tiles-masonry', name: 'Plăci și zidărie', sortOrder: 2, isActive: true },
  { id: 'cat-insulation', slug: 'insulation', name: 'Izolații', sortOrder: 3, isActive: true },
  { id: 'cat-paint', slug: 'paint-finishing', name: 'Vopsele și finisaje', sortOrder: 4, isActive: true },
  { id: 'cat-electrical', slug: 'electrical', name: 'Materiale electrice', sortOrder: 5, isActive: true },
  { id: 'cat-plumbing', slug: 'plumbing-heating', name: 'Instalații și încălzire', sortOrder: 6, isActive: true },
  { id: 'cat-wood', slug: 'wood-timber', name: 'Lemn și cherestea', sortOrder: 7, isActive: true },
  { id: 'cat-metal', slug: 'metal-profiles', name: 'Metal și profile', sortOrder: 8, isActive: true },
  { id: 'cat-tools', slug: 'tools-accessories', name: 'Unelte și accesorii', sortOrder: 9, isActive: true },
  { id: 'cat-other', slug: 'other', name: 'Alte materiale de construcții', sortOrder: 10, isActive: true },
];

export const SUBCATEGORIES: Subcategory[] = [
  { id: 'sub-cement', categoryId: 'cat-cement', slug: 'cement', name: 'Ciment', sortOrder: 1, isActive: true },
  { id: 'sub-tile-adhesive', categoryId: 'cat-cement', slug: 'tile-adhesive', name: 'Adeziv pentru plăci', sortOrder: 2, isActive: true },
  { id: 'sub-mortar', categoryId: 'cat-cement', slug: 'mortar', name: 'Mortar', sortOrder: 3, isActive: true },
  { id: 'sub-grout', categoryId: 'cat-cement', slug: 'grout', name: 'Chit de rosturi', sortOrder: 4, isActive: true },
  { id: 'sub-mixtures', categoryId: 'cat-cement', slug: 'mixtures', name: 'Amestecuri de construcții', sortOrder: 5, isActive: true },

  { id: 'sub-ceramic', categoryId: 'cat-tiles', slug: 'ceramic-tiles', name: 'Plăci ceramice', sortOrder: 1, isActive: true },
  { id: 'sub-porcelain', categoryId: 'cat-tiles', slug: 'porcelain-tiles', name: 'Gresie porțelanată', sortOrder: 2, isActive: true },
  { id: 'sub-bricks', categoryId: 'cat-tiles', slug: 'bricks', name: 'Cărămidă', sortOrder: 3, isActive: true },
  { id: 'sub-blocks', categoryId: 'cat-tiles', slug: 'concrete-blocks', name: 'BCA / blocuri', sortOrder: 4, isActive: true },
  { id: 'sub-paving', categoryId: 'cat-tiles', slug: 'paving-stones', name: 'Pavele', sortOrder: 5, isActive: true },

  { id: 'sub-eps', categoryId: 'cat-insulation', slug: 'eps', name: 'EPS', sortOrder: 1, isActive: true },
  { id: 'sub-xps', categoryId: 'cat-insulation', slug: 'xps', name: 'XPS', sortOrder: 2, isActive: true },
  { id: 'sub-mineral-wool', categoryId: 'cat-insulation', slug: 'mineral-wool', name: 'Vată minerală', sortOrder: 3, isActive: true },
  { id: 'sub-roof-ins', categoryId: 'cat-insulation', slug: 'roof-insulation', name: 'Izolație acoperiș', sortOrder: 4, isActive: true },
  { id: 'sub-acoustic', categoryId: 'cat-insulation', slug: 'acoustic', name: 'Izolație fonică', sortOrder: 5, isActive: true },

  { id: 'sub-int-paint', categoryId: 'cat-paint', slug: 'interior-paint', name: 'Vopsea interior', sortOrder: 1, isActive: true },
  { id: 'sub-ext-paint', categoryId: 'cat-paint', slug: 'exterior-paint', name: 'Vopsea exterior', sortOrder: 2, isActive: true },
  { id: 'sub-plaster', categoryId: 'cat-paint', slug: 'decorative-plaster', name: 'Tencuială decorativă', sortOrder: 3, isActive: true },
  { id: 'sub-primers', categoryId: 'cat-paint', slug: 'primers', name: 'Grunduri', sortOrder: 4, isActive: true },
  { id: 'sub-finishing', categoryId: 'cat-paint', slug: 'finishing', name: 'Materiale de finisaj', sortOrder: 5, isActive: true },

  { id: 'sub-cables', categoryId: 'cat-electrical', slug: 'cables', name: 'Cabluri electrice', sortOrder: 1, isActive: true },
  { id: 'sub-switches', categoryId: 'cat-electrical', slug: 'switches', name: 'Întrerupătoare', sortOrder: 2, isActive: true },
  { id: 'sub-sockets', categoryId: 'cat-electrical', slug: 'sockets', name: 'Prize', sortOrder: 3, isActive: true },
  { id: 'sub-distribution', categoryId: 'cat-electrical', slug: 'distribution', name: 'Echipamente de distribuție', sortOrder: 4, isActive: true },
  { id: 'sub-lighting', categoryId: 'cat-electrical', slug: 'lighting', name: 'Iluminat', sortOrder: 5, isActive: true },

  { id: 'sub-pipes', categoryId: 'cat-plumbing', slug: 'pipes', name: 'Țevi', sortOrder: 1, isActive: true },
  { id: 'sub-fittings', categoryId: 'cat-plumbing', slug: 'fittings', name: 'Fitinguri', sortOrder: 2, isActive: true },
  { id: 'sub-radiators', categoryId: 'cat-plumbing', slug: 'radiators', name: 'Radiatoare', sortOrder: 3, isActive: true },
  { id: 'sub-heating', categoryId: 'cat-plumbing', slug: 'heating-accessories', name: 'Accesorii încălzire', sortOrder: 4, isActive: true },
  { id: 'sub-sanitary', categoryId: 'cat-plumbing', slug: 'sanitary', name: 'Sanitare', sortOrder: 5, isActive: true },

  { id: 'sub-timber', categoryId: 'cat-wood', slug: 'construction-timber', name: 'Cherestea de construcții', sortOrder: 1, isActive: true },
  { id: 'sub-boards', categoryId: 'cat-wood', slug: 'boards', name: 'Plăci', sortOrder: 2, isActive: true },
  { id: 'sub-flooring', categoryId: 'cat-wood', slug: 'flooring', name: 'Pardoseli', sortOrder: 3, isActive: true },
  { id: 'sub-beams', categoryId: 'cat-wood', slug: 'beams', name: 'Grinzi', sortOrder: 4, isActive: true },
  { id: 'sub-panels', categoryId: 'cat-wood', slug: 'panels', name: 'Panouri', sortOrder: 5, isActive: true },

  { id: 'sub-rebar', categoryId: 'cat-metal', slug: 'rebar', name: 'Oțel beton', sortOrder: 1, isActive: true },
  { id: 'sub-profiles', categoryId: 'cat-metal', slug: 'metal-profiles', name: 'Profile metalice', sortOrder: 2, isActive: true },
  { id: 'sub-sheets', categoryId: 'cat-metal', slug: 'metal-sheets', name: 'Table metalice', sortOrder: 3, isActive: true },
  { id: 'sub-aluminium', categoryId: 'cat-metal', slug: 'aluminium', name: 'Profile aluminiu', sortOrder: 4, isActive: true },

  { id: 'sub-hand-tools', categoryId: 'cat-tools', slug: 'hand-tools', name: 'Unelte de mână', sortOrder: 1, isActive: true },
  { id: 'sub-power-tools', categoryId: 'cat-tools', slug: 'power-tools', name: 'Unelte electrice', sortOrder: 2, isActive: true },
  { id: 'sub-fasteners', categoryId: 'cat-tools', slug: 'fasteners', name: 'Elemente de fixare', sortOrder: 3, isActive: true },
  { id: 'sub-screws', categoryId: 'cat-tools', slug: 'screws', name: 'Șuruburi', sortOrder: 4, isActive: true },
  { id: 'sub-other-acc', categoryId: 'cat-tools', slug: 'other-accessories', name: 'Alte accesorii', sortOrder: 5, isActive: true },

  { id: 'sub-other-mat', categoryId: 'cat-other', slug: 'other-materials', name: 'Diverse', sortOrder: 1, isActive: true },
];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function getSubcategory(id: string) {
  return SUBCATEGORIES.find((s) => s.id === id);
}

export function subcategoriesFor(categoryId: string) {
  return SUBCATEGORIES.filter((s) => s.categoryId === categoryId && s.isActive);
}
