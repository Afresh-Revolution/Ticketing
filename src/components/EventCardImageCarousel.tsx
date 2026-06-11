import { useEffect, useState } from 'react';
import { DEFAULT_EVENT_IMAGE } from '../utils/eventImages';
import './EventCardImageCarousel.css';

type EventCardImageCarouselProps = {
  images: string[];
  alt?: string;
  className?: string;
  imageClassName?: string;
  intervalMs?: number;
};

export function EventCardImageCarousel({
  images,
  alt = '',
  className = '',
  imageClassName = '',
  intervalMs = 3000,
}: EventCardImageCarouselProps) {
  const slides = images.length > 0 ? images : [DEFAULT_EVENT_IMAGE];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.join('|')]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [slides.length, intervalMs]);

  return (
    <div className={`event-card-carousel ${className}`.trim()} aria-hidden={alt ? undefined : true}>
      {slides.map((src, slideIndex) => (
        <img
          key={`${src}-${slideIndex}`}
          src={src}
          alt={slideIndex === index ? alt : ''}
          className={`event-card-carousel-img ${imageClassName} ${slideIndex === index ? 'is-active' : ''}`.trim()}
          aria-hidden={slideIndex !== index}
        />
      ))}
      {slides.length > 1 && (
        <div className="event-card-carousel-dots" aria-hidden>
          {slides.map((_, dotIndex) => (
            <span key={dotIndex} className={dotIndex === index ? 'is-active' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}
