import { useState } from 'react';
import type { SkillsData } from '../../content/types';
import { asset } from '../../lib/asset';
import { useArtShowcase } from '../hero/useArtShowcase';
import { SkillsTitle } from './SkillsTitle';
import './SkillsSection.css';

export function SkillsSection({ data }: { data: SkillsData }) {
  const [active, setActive] = useState<string | null>(null);
  const art = useArtShowcase();
  const items = data.categories.find((c) => c.name === active)?.items ?? [];

  const open = (name: string) => {
    art.show();
    setActive(name);
  };
  const close = () => {
    art.hide();
    setActive(null);
  };

  return (
    <div className="section skill-section">
      <SkillsTitle title={data.title} categoryOpen={active !== null} />
      <div className={`skills ${active ? '' : 'active'}`}>
        {data.categories.map((category) => (
          <div key={category.name} className="skill" onClick={() => open(category.name)}>
            <div className="skill-name">
              {category.name}
              <div className="skill-underline" />
            </div>
          </div>
        ))}
      </div>

      <div className={`skill-details ${active ? 'active' : ''}`}>
        <div className="background-stripe">
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="background-square" />
        <h1 className="skill-details-title">{active}</h1>
        <img className="skill-back-button" src={asset('images/ui/chevron-back.png')} alt="Back" onClick={close} />
      </div>
    </div>
  );
}
