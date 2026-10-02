import { useRef, useState } from 'react';
import type { Project } from '../../content/types';
import { asset } from '../../lib/asset';

interface CarouselProps {
  projects: Project[];
  /** Tap to expand instead of hover, native scrolling instead of arrows. */
  touch: boolean;
  onFocusChange: (focused: boolean) => void;
}

export function Carousel({ projects, touch, onFocusChange }: CarouselProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  const expand = (index: number | null) => {
    setExpanded(index);
    onFocusChange(index !== null);
  };

  const scroll = (direction: -1 | 1) => {
    const el = track.current;
    el?.scrollBy({ left: (direction * el.offsetWidth) / 2, behavior: 'smooth' });
  };

  return (
    <div className="carousel-container">
      {!touch && (
        <button className="nav-button left" type="button" aria-label="Previous" onClick={() => scroll(-1)}>
          <img src={asset('images/ui/chevron-left.png')} alt="" />
        </button>
      )}

      <div className="sliders-wrapper" ref={track} style={{ overflowX: touch ? 'auto' : 'hidden' }}>
        {projects.map((project, index) => {
          const open = expanded === index;
          return (
            <div
              key={project.title}
              className={`slide ${open ? 'hovered' : ''}`}
              onMouseEnter={touch ? undefined : () => expand(index)}
              onMouseLeave={touch ? undefined : () => expand(null)}
              onClick={touch ? () => expand(open ? null : index) : undefined}
            >
              <div className="box">
                <div className={`text ${index % 2 === 0 ? 'top' : 'bottom'}`}>{project.description}</div>
              </div>
              {/* On touch the first tap only expands; the link works once open. */}
              <a href={project.href} style={touch && !open ? { pointerEvents: 'none' } : undefined}>
                <img className={open ? 'hovered' : ''} src={asset(project.image)} alt={project.title} />
              </a>
            </div>
          );
        })}
      </div>

      {!touch && (
        <button className="nav-button right" type="button" aria-label="Next" onClick={() => scroll(1)}>
          <img src={asset('images/ui/chevron-left.png')} alt="" style={{ transform: 'scaleX(-1)' }} />
        </button>
      )}
    </div>
  );
}
