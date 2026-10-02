import { Fragment } from 'react';
import type { SplitText as SplitTextValue } from '../content/types';

/** Renders `head tail`; the tail wraps to its own line on narrow screens, or always with `hardBreak`. */
export function SplitText({ value, hardBreak = false }: { value: SplitTextValue; hardBreak?: boolean }) {
  if (!value.tail) return value.head;
  if (hardBreak) {
    return (
      <>
        {value.head}
        <br />
        {value.tail}
      </>
    );
  }
  return (
    <>
      {value.head} <span className="line-break">{value.tail}</span>
    </>
  );
}

/** `*word*` becomes a highlight span, a blank line becomes a double line break. */
export function RichText({ source }: { source: string }) {
  return source.split('\n\n').map((paragraph, p) => (
    <Fragment key={p}>
      {p > 0 && (
        <>
          <br />
          <br />{' '}
        </>
      )}
      {paragraph.split(/(\*[^*]+\*)/).map((part, i) =>
        part.startsWith('*') && part.endsWith('*') ? <span key={i}>{part.slice(1, -1)}</span> : part,
      )}
    </Fragment>
  ));
}
