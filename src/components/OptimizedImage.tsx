interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  eager?: boolean;
  responsive?: boolean;
}

const getWebPSrc = (src: string) => {
  if (src.endsWith('.svg') || src.endsWith('.webp') || src.endsWith('.avif')) return null;
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
};

const getResponsiveSrcSet = (src: string) => {
  const base = src.replace(/\.(png|jpe?g)$/i, '');
  return `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${base}.webp 1200w`;
};

const OptimizedImage = ({ src, alt, width, height, eager, responsive, className, ...rest }: OptimizedImageProps) => {
  const webpSrc = getWebPSrc(src);
  const loadingAttr = eager ? "eager" : "lazy";
  const fetchPriorityAttr = eager ? "high" : "auto";

  if (webpSrc) {
    return (
      <picture>
        {responsive && (
          <source
            type="image/webp"
            srcSet={getResponsiveSrcSet(src)}
            sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
          />
        )}
        {!responsive && <source type="image/webp" srcSet={webpSrc} />}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loadingAttr}
          decoding="async"
          fetchPriority={fetchPriorityAttr as "high" | "auto" | "low"}
          className={className}
          {...rest}
        />
      </picture>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loadingAttr}
      decoding="async"
      fetchPriority={fetchPriorityAttr as "high" | "auto" | "low"}
      className={className}
      {...rest}
    />
  );
};

export default OptimizedImage;
