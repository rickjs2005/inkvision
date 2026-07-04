import { getGallery, getTopArtists } from "@/server/queries/home";
import { Hero } from "@/components/marketing/hero";
import { StyleCategories } from "@/components/marketing/style-categories";
import { TopArtists } from "@/components/marketing/top-artists";
import { Gallery } from "@/components/marketing/gallery";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";
import { FAQ_ITEMS } from "@/components/marketing/faq-data";
import { CTA } from "@/components/marketing/cta";
import { FaqJsonLd, OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

// ISR: revalida a cada 5 min (dados de artistas/galeria vêm de cache com tags).
export const revalidate = 300;

export default async function HomePage() {
  const [artists, gallery] = await Promise.all([getTopArtists(), getGallery()]);

  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <FaqJsonLd items={FAQ_ITEMS.map((f) => ({ q: f.q, a: f.a }))} />
      <Hero />
      <StyleCategories />
      <TopArtists artists={artists} />
      <Gallery items={gallery} />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
