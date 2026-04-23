import {
  PAGE_V2_BLOCK_TYPES as SHARED_PAGE_V2_BLOCK_TYPES,
  PAGE_V2_BLUEPRINTS as SHARED_PAGE_V2_BLUEPRINTS,
  getPageV2Blueprint as getSharedPageV2Blueprint,
} from '../../../config/page-v2-blueprints.mjs';

export const PAGE_V2_BLOCK_TYPES = SHARED_PAGE_V2_BLOCK_TYPES;

export type PageV2BlockType = (typeof PAGE_V2_BLOCK_TYPES)[number];

export interface PageV2Blueprint {
  id: string;
  pageKind: string;
  templateVariant: string;
  requiredBlocks: PageV2BlockType[];
  allowedBlocks: PageV2BlockType[];
}

export const PAGE_V2_BLUEPRINTS: Record<string, PageV2Blueprint> = SHARED_PAGE_V2_BLUEPRINTS;

export function getPageV2Blueprint(id: string) {
  return getSharedPageV2Blueprint(id);
}
