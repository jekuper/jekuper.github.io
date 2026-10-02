import { Fragment } from 'react';
import type { EngineHelp } from '../../content/types';

const GAP = '\u00a0'.repeat(7);

export function CanvasHint({ help }: { help: EngineHelp }) {
  return (
    <div className="canvas-hint">
      <p>
        {help.hint.map((item, i) => (
          <Fragment key={item.input}>
            {i > 0 && ` ${GAP} `}
            {item.input} -{' '}
            <strong>
              <i>{item.effect}</i>
            </strong>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
