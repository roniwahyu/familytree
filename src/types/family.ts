export interface Spouse {
  name: string;
  photo?: string;
  dob?: string;
  job?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  gender: 'L' | 'P';
  dob?: string;
  job?: string;
  address?: string;
  phone?: string;
  photo?: string;
  generation: number;
  spouse?: Spouse;
  children?: FamilyMember[];
  _collapsed?: boolean;
}

export interface TreeNode extends FamilyMember {
  children?: TreeNode[];
}

export type ViewMode = 'vertical-tree' | 'horizontal-tree' | 'table' | 'list';
