import { rgb } from '../engine/math';
import type { Theme } from './types';

export const purple: Theme = {
  accent: rgb(150, 110, 255),
  deep: rgb(67, 21, 140),
  shade: rgb(60, 36, 120),
  tint: rgb(236, 232, 248),
  soft: rgb(185, 169, 224),
  well: rgb(98, 0, 204),
  hover: rgb(255, 150, 120),
};

export const orange: Theme = {
  accent: rgb(255, 145, 64),
  deep: rgb(205, 85, 20),
  shade: rgb(110, 42, 8),
  tint: rgb(252, 238, 227),
  soft: rgb(255, 214, 184),
  well: rgb(255, 120, 30),
  hover: rgb(58, 18, 0),
};
