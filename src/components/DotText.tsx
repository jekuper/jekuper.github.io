import { useRef, type ElementType } from 'react';
import { rgb, textToArt, type Rgb } from '../engine';
import { useViewMorph, type ViewArt } from '../react/useViewMorph';

interface DotTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Distance between outline dots, CSS pixels. */
  spacing?: number;
  /** Grid step for dots inside the letters; 0 for outlines only. */
  fill?: number;
  color?: Rgb;
}

const DEFAULT_COLOR = rgb(210, 210, 210);

/** Single-line text redrawn in dots at the exact spot of the real (now invisible) text. */
export function DotText({ text, as: Tag = 'span', className = '', spacing = 3, fill = 0, color = DEFAULT_COLOR }: DotTextProps) {
  const ref = useRef<HTMLElement>(null);
  const { formed } = useViewMorph(ref, async (el) => measure(el, text, spacing, fill, color));
  return (
    <Tag ref={ref} className={`dot-text ${formed ? 'is-drawn' : ''} ${className}`}>
      {text}
    </Tag>
  );
}

async function measure(el: HTMLElement, text: string, spacing: number, fill: number, color: Rgb): Promise<ViewArt> {
  const style = getComputedStyle(el);
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  await document.fonts.load(font, text);
  const shape = textToArt(text, { font, letterSpacing: style.letterSpacing, spacing, fill });

  // Place the pen where the browser lays out the text: aligned in the content box, baseline centered in the line.
  const rect = el.getBoundingClientRect();
  const padLeft = parseFloat(style.paddingLeft);
  const padRight = parseFloat(style.paddingRight);
  const contentWidth = rect.width - padLeft - padRight;
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
