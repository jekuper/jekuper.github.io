import { shuffle } from '../../engine';
import { asset } from '../../lib/asset';
import { ART_MANIFEST } from './scene';

interface Manifest {
  files: string[];
}

let manifest: Promise<string[]> | null = null;

function loadManifest(): Promise<string[]> {
  if (!manifest) {
    const base = ART_MANIFEST.slice(0, ART_MANIFEST.lastIndexOf('/') + 1);
    manifest = fetch(asset(ART_MANIFEST))
      .then((res) => res.json() as Promise<Manifest>)
      .then((m) => m.files.map((file) => asset(base + file)));
    manifest.catch(() => (manifest = null));
  }
  return manifest;
}

/** Hands out art URLs in shuffled order, reshuffling after each full pass. */
export class ArtDeck {
  private order: string[] = [];
  private index = 0;

  async next(): Promise<string> {
    await this.fill();
    const url = this.order[this.index++];
    if (this.index === this.order.length) {
      shuffle(this.order);
      this.index = 0;
    }
    return url;
  }

  async peek(): Promise<string> {
    await this.fill();
    return this.order[this.index];
  }

  private async fill(): Promise<void> {
    if (this.order.length === 0) this.order = shuffle([...(await loadManifest())]);
  }
}
