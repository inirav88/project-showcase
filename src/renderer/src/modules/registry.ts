import { lazy } from 'react'

type ModuleComponent = React.LazyExoticComponent<
  React.ComponentType<{ config: Record<string, any>; projectId: string }>
>

export const moduleRegistry: Record<string, ModuleComponent> = {
  OVERVIEW:              lazy(() => import('./components/OverviewModule')),
  GALLERY:               lazy(() => import('./components/GalleryModule')),
  VIDEOS:                lazy(() => import('./components/VideosModule')),
  TOUR_360:              lazy(() => import('./components/Tour360Module')),
  MASTER_PLAN:           lazy(() => import('./components/MasterPlanModule')),
  AMENITIES:             lazy(() => import('./components/AmenitiesModule')),
  LOCATION:              lazy(() => import('./components/LocationModule')),
  PRICING:               lazy(() => import('./components/PricingModule')),
  BROCHURE:              lazy(() => import('./components/BrochureModule')),
  COMPARE_UNITS:         lazy(() => import('./components/CompareUnitsModule')),
  CALCULATORS:           lazy(() => import('./components/CalculatorsModule')),
  USP_SPOTLIGHT:         lazy(() => import('./components/UspSpotlightModule')),
  FOUNDERS_NOTE:         lazy(() => import('./components/FoundersNoteModule')),
  COMMUNITY_LIFESTYLE:   lazy(() => import('./components/CommunityLifestyleModule')),
  SUSTAINABILITY:        lazy(() => import('./components/SustainabilityModule')),
  SMART_HOME:            lazy(() => import('./components/SmartHomeModule')),
  SPORTS_CAROUSEL:       lazy(() => import('./components/SportsCarouselModule')),
  CONSTRUCTION_TIMELINE: lazy(() => import('./components/ConstructionTimelineModule')),
  FINANCING_PARTNER:     lazy(() => import('./components/FinancingPartnerModule')),
  TESTIMONIALS:          lazy(() => import('./components/TestimonialsModule')),
  RERA_TRUST:            lazy(() => import('./components/ReraTrustModule')),
}

export function isRegisteredModule(type: string): boolean {
  return type in moduleRegistry
}
