import { useEffect, useRef, type ElementType, type HTMLAttributes } from 'react';
import { rgb, textToArt, type Rgb, type TextArt } from '../engine';
import { useViewMorph, type ViewArt, type ViewMorphOptions } from '../react/useViewMorph';

interface DotTextProps extends ViewMorphOptions {
  text: string;
  /** SVG path data (24 x 24 box) drawn in dots before the text, or alone when the text is empty. */
  icon?: string;
  as?: ElementType;
  className?: string;
  /** Distance between outline dots, CSS pixels. */
  spacing?: number;
  /** Grid step for dots inside the letters; 0 for outlines only. */
  fill?: number;
  color?: Rgb;
  /** Shrink the dot text when it is wider than the element (e.g. a long email). */
  fitWidth?: boolean;
  /** Extra props for the element, such as handlers. */
  elementProps?: HTMLAttributes<HTMLElement>;
}


const DEFAULT_COLOR = rgb(210, 210, 210);

/** Single-line text redrawn in dots at the exact spot of the real (now invisible) text. */
export function DotText({
  text,
  icon,
  as: Tag = 'span',
  className = '',
  spacing = 3,
  fill = 0,
  color = DEFAULT_COLOR,
  fitWidth = false,
  elementProps,
  ...options
}: DotTextProps) {
  const ref = useRef<HTMLElement>(null);
  const { formed, reform } = useViewMorph(ref, async (el) => measure(el, text, icon, spacing, fill, color, fitWidth), options);

  const reformRef = useRef(reform);
  reformRef.current = reform;
  // A text, fill or color change re-targets dots that are already formed, so it uses the quick
  // transition. Pass a constant color, or every render re-forms.

  const firstText = useRef(true);
  useEffect(() => {
    if (firstText.current) {
      firstText.current = false;
      return;
    }
    reformRef.current(true);
  }, [text, icon, fill, color, className]);

  return (
    <Tag ref={ref} className={`dot-text ${formed ? 'is-drawn' : ''} ${className}`} {...elementProps}>
      {/* A lone icon still needs a line box, or the heading would collapse. */}
      {text || ' '}
    </Tag>
  );
}

// Rasterizing and tracing text takes a few milliseconds; swapping back and forth on hover reuses it.
const shapes = new Map<string, TextArt>();
const MAX_CACHED_SHAPES = 64;

function cachedTextArt(text: string, icon: string | undefined, font: { font: string; letterSpacing: string }, spacing: number, fill: number): TextArt {
  const key = `${font.font}|${font.letterSpacing}|${spacing}|${fill}|${icon ?? ''}|${text}`;
  let shape = shapes.get(key);
  if (!shape) {
    if (shapes.size >= MAX_CACHED_SHAPES) shapes.delete(shapes.keys().next().value!);
    shape = textToArt(text, { ...font, spacing, fill, icon });
    shapes.set(key, shape);
  }
  return shape;
}

async function measure(el: HTMLElement, text: string, icon: string | undefined, spacing: number, fill: number, color: Rgb, fitWidth: boolean): Promise<ViewArt> {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const padLeft = parseFloat(style.paddingLeft);
  const padRight = parseFloat(style.paddingRight);
  const contentWidth = rect.width - padLeft - padRight;

  const fontFor = (scale: number) => ({
    font: `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize) * scale}px ${style.fontFamily}`,
    letterSpacing: `${(parseFloat(style.letterSpacing) || 0) * scale}px`,
  });
  let font = fontFor(1);
  await document.fonts.load(font.font, text || 'H');
  let shape = cachedTextArt(text, icon, font, spacing, fill);
  if (fitWidth && shape.advance > contentWidth) {
    font = fontFor((contentWidth / shape.advance) * 0.96);
    shape = cachedTextArt(text, icon, font, spacing, fill);
  }

  // Place the pen where the browser lays out the text: aligned in the content box, baseline centered in the line.
  const align = style.textAlign;
  let penX = rect.left + padLeft;
  if (align === 'center') penX += (contentWidth - shape.advance) / 2;
  else if (align === 'right' || align === 'end') penX += contentWidth - shape.advance;
  const glyphHeight = shape.ascent + shape.descent;
  const lineHeight = style.lineHeight === 'normal' ? glyphHeight : parseFloat(style.lineHeight);
  const penY = rect.top + parseFloat(style.paddingTop) + (lineHeight - glyphHeight) / 2 + shape.ascent;

  return {
    art: shape.art,
    left: penX + shape.offsetX,
    top: penY + shape.offsetY,
    width: shape.art.width,
    height: shape.art.height,
    color,
  };
}
