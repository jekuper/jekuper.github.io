import { useEffect, useRef, type ElementType, type HTMLAttributes } from 'react';
import { rgb, textToArt, type Rgb } from '../engine';
import { useEngine } from '../react/engineContext';
import { useViewMorph, type ViewArt, type ViewMorphOptions } from '../react/useViewMorph';

interface DotTextProps extends ViewMorphOptions {
  text: string;
  as?: ElementType;
  className?: string;
  /** Distance between outline dots, CSS pixels. */
  spacing?: number;
  /** Grid step for dots inside the letters; 0 for outlines only. */
  fill?: number;
  color?: Rgb;
  /** Shrink the dot text when it is wider than the element (e.g. a long email). */
  fitWidth?: boolean;
  /** Called when a bomb knocks most of the dots out of formation. */
  onDamage?: () => void;
  /** Extra props for the element, such as handlers. */
  elementProps?: HTMLAttributes<HTMLElement>;
}

// One bomb usually knocks out only a few percent of the dots, so any real hit counts.
const DAMAGE_THRESHOLD = 0.97;
const DAMAGE_POLL_MS = 250;

const DEFAULT_COLOR = rgb(210, 210, 210);

/** Single-line text redrawn in dots at the exact spot of the real (now invisible) text. */
export function DotText({
  text,
  as: Tag = 'span',
  className = '',
  spacing = 3,
  fill = 0,
  color = DEFAULT_COLOR,
  fitWidth = false,
  onDamage,
  elementProps,
  ...options
}: DotTextProps) {
  const engine = useEngine();
  const ref = useRef<HTMLElement>(null);
  const { group, formed, reform } = useViewMorph(ref, async (el) => measure(el, text, spacing, fill, color, fitWidth), options);

  const reformRef = useRef(reform);
  reformRef.current = reform;
  useEffect(() => reformRef.current(), [text]);

  const onDamageRef = useRef(onDamage);
  onDamageRef.current = onDamage;
  const watchDamage = onDamage !== undefined;
  useEffect(() => {
    if (!engine || !watchDamage) return;
    const timer = window.setInterval(() => {
      if (engine.integrity(group) < DAMAGE_THRESHOLD) onDamageRef.current?.();
    }, DAMAGE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [engine, group, watchDamage]);

  return (
    <Tag ref={ref} className={`dot-text ${formed ? 'is-drawn' : ''} ${className}`} {...elementProps}>
      {text}
    </Tag>
  );
}

async function measure(el: HTMLElement, text: string, spacing: number, fill: number, color: Rgb, fitWidth: boolean): Promise<ViewArt> {
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
  await document.fonts.load(font.font, text);
  let shape = textToArt(text, { ...font, spacing, fill });
  if (fitWidth && shape.advance > contentWidth) {
    font = fontFor((contentWidth / shape.advance) * 0.96);
    shape = textToArt(text, { ...font, spacing, fill });
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
