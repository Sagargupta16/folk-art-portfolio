import siteData from '@/data/site.json';

export type ArtStyle = (typeof siteData.styles)[number];

export const site = siteData;
export const styles = siteData.styles as readonly ArtStyle[];
export const nav = siteData.nav;
export const brand = siteData.brand;
export const contact = siteData.contact;
export const sections = siteData.sections;
