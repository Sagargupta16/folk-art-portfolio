const BASE = import.meta.env.BASE_URL;
const WIDTHS = [400, 800, 1200];

type Props = {
  filename: string;
  alt: string;
  imgClass?: string;
  loading?: 'eager' | 'lazy';
  fetchpriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  pictureClass?: string;
};

export default function ArtworkImage({
  filename,
  alt,
  imgClass = '',
  loading = 'lazy',
  fetchpriority,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  pictureClass = '',
}: Props) {
  const slug = filename.replace(/\.(jpe?g|png)$/i, '');
  const optBase = `${BASE}_opt/artworks/${slug}`;
  const origUrl = `${BASE}artworks/${filename}`;

  const avifSrcset = WIDTHS.map((w) => `${optBase}-${w}.avif ${w}w`).join(', ');
  const webpSrcset = WIDTHS.map((w) => `${optBase}-${w}.webp ${w}w`).join(', ');

  return (
    <picture className={pictureClass}>
      <source type="image/avif" srcSet={avifSrcset} sizes={sizes} />
      <source type="image/webp" srcSet={webpSrcset} sizes={sizes} />
      <img
        src={origUrl}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchpriority}
        className={imgClass}
      />
    </picture>
  );
}
