"use client";

interface PageGuideBannerProps {
  pageKey?: string;
  title?: string;
  description?: string;
  onOpenGuide?: (tab?: string) => void;
}

export default function PageGuideBanner(props: PageGuideBannerProps) {
  void props;
  // Page banners are suppressed in favor of clean, uncluttered headers and dedicated modals.
  return null;
}
