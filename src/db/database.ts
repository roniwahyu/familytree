import Dexie, { Table } from 'dexie';

// Interface untuk data anggota keluarga di database (flat structure)
export interface FamilyMemberDB {
  id: string;
  parentId: string | null; // null untuk root/leluhur
  name: string;
  gender: 'L' | 'P';
  dob: string;
  job: string;
  address: string;
  phone: string;
  photo: string;
  generation: number;
  spouseName?: string;
  spousePhoto?: string;
  orderIndex: number; // untuk mengurutkan anak-anak
  createdAt: Date;
  updatedAt: Date;
}

// Interface untuk settings
export interface SettingsDB {
  id: string;
  key: string;
  value: string;
}

// Database class
class FamilyDatabase extends Dexie {
  members!: Table<FamilyMemberDB, string>;
  settings!: Table<SettingsDB, string>;

  constructor() {
    super('FamilyTreeDB');
    
    this.version(1).stores({
      members: 'id, parentId, name, gender, generation, createdAt',
      settings: 'id, key'
    });
  }
}

export const db = new FamilyDatabase();

// Helper functions untuk konversi data
export function flatToTree(members: FamilyMemberDB[]): any {
  if (members.length === 0) return null;

  // Buat map untuk akses cepat
  const memberMap = new Map<string, any>();
  
  members.forEach(member => {
    memberMap.set(member.id, {
      id: member.id,
      name: member.name,
      gender: member.gender,
      dob: member.dob,
      job: member.job,
      address: member.address,
      phone: member.phone,
      photo: member.photo,
      generation: member.generation,
      spouse: member.spouseName ? {
        name: member.spouseName,
        photo: member.spousePhoto || ''
      } : undefined,
      children: []
    });
  });

  let root: any = null;

  // Bangun tree structure
  members.forEach(member => {
    const node = memberMap.get(member.id);
    if (member.parentId === null) {
      root = node;
    } else {
      const parent = memberMap.get(member.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Sort children berdasarkan orderIndex
  const sortChildren = (node: any) => {
    const memberData = members.find(m => m.id === node.id);
    node._orderIndex = memberData?.orderIndex || 0;
    
    if (node.children && node.children.length > 0) {
      node.children.sort((a: any, b: any) => {
        const aData = members.find(m => m.id === a.id);
        const bData = members.find(m => m.id === b.id);
        return (aData?.orderIndex || 0) - (bData?.orderIndex || 0);
      });
      node.children.forEach(sortChildren);
    }
  };

  if (root) {
    sortChildren(root);
  }

  return root;
}

export function treeToFlat(node: any, parentId: string | null = null, orderIndex: number = 0): FamilyMemberDB[] {
  const members: FamilyMemberDB[] = [];
  const now = new Date();

  const member: FamilyMemberDB = {
    id: node.id,
    parentId: parentId,
    name: node.name,
    gender: node.gender,
    dob: node.dob || '',
    job: node.job || '',
    address: node.address || '',
    phone: node.phone || '',
    photo: node.photo || '',
    generation: node.generation,
    spouseName: node.spouse?.name,
    spousePhoto: node.spouse?.photo,
    orderIndex: orderIndex,
    createdAt: now,
    updatedAt: now
  };

  members.push(member);

  if (node.children && node.children.length > 0) {
    node.children.forEach((child: any, index: number) => {
      members.push(...treeToFlat(child, node.id, index));
    });
  }

  return members;
}

// CRUD Operations
export const dbOperations = {
  // Get all members
  async getAllMembers(): Promise<FamilyMemberDB[]> {
    return await db.members.toArray();
  },

  // Get member by ID
  async getMemberById(id: string): Promise<FamilyMemberDB | undefined> {
    return await db.members.get(id);
  },

  // Get children of a member
  async getChildren(parentId: string): Promise<FamilyMemberDB[]> {
    return await db.members.where('parentId').equals(parentId).sortBy('orderIndex');
  },

  // Add new member
  async addMember(member: Omit<FamilyMemberDB, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    await db.members.add({
      ...member,
      createdAt: now,
      updatedAt: now
    });
    return member.id;
  },

  // Update member
  async updateMember(id: string, updates: Partial<FamilyMemberDB>): Promise<void> {
    await db.members.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  // Delete member and all descendants
  async deleteMember(id: string): Promise<void> {
    const toDelete: string[] = [id];
    
    // Find all descendants recursively
    const findDescendants = async (parentId: string) => {
      const children = await db.members.where('parentId').equals(parentId).toArray();
      for (const child of children) {
        toDelete.push(child.id);
        await findDescendants(child.id);
      }
    };
    
    await findDescendants(id);
    await db.members.bulkDelete(toDelete);
  },

  // Clear all data
  async clearAll(): Promise<void> {
    await db.members.clear();
  },

  // Import data from tree structure
  async importFromTree(treeData: any): Promise<void> {
    const flatData = treeToFlat(treeData);
    await db.members.clear();
    await db.members.bulkAdd(flatData);
  },

  // Export data as tree structure
  async exportAsTree(): Promise<any> {
    const members = await db.members.toArray();
    return flatToTree(members);
  },

  // Export data as flat array (for CSV/XLSX)
  async exportAsFlat(): Promise<FamilyMemberDB[]> {
    return await db.members.orderBy('generation').toArray();
  },

  // Import data from flat array (from CSV/XLSX)
  async importFromFlat(rows: Partial<FamilyMemberDB>[]): Promise<void> {
    const now = new Date();
    const members: FamilyMemberDB[] = rows.map((row, index) => ({
      id: row.id || crypto.randomUUID(),
      parentId: row.parentId ?? null,
      name: row.name || '',
      gender: (row.gender === 'L' || row.gender === 'P') ? row.gender : 'L',
      dob: row.dob || '',
      job: row.job || '',
      address: row.address || '',
      phone: row.phone || '',
      photo: row.photo || '',
      generation: row.generation || 1,
      spouseName: row.spouseName || undefined,
      spousePhoto: row.spousePhoto || undefined,
      orderIndex: row.orderIndex ?? index,
      createdAt: now,
      updatedAt: now
    }));
    await db.members.clear();
    await db.members.bulkAdd(members);
  },

  // Get family statistics
  async getStatistics(): Promise<{
    totalMembers: number;
    totalGenerations: number;
    maleCount: number;
    femaleCount: number;
  }> {
    const members = await db.members.toArray();
    const generations = new Set(members.map(m => m.generation));
    
    return {
      totalMembers: members.length,
      totalGenerations: generations.size,
      maleCount: members.filter(m => m.gender === 'L').length,
      femaleCount: members.filter(m => m.gender === 'P').length
    };
  },

  // Check if database has data
  async hasData(): Promise<boolean> {
    const count = await db.members.count();
    return count > 0;
  },

  // Save setting
  async saveSetting(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.update(existing.id, { value });
    } else {
      await db.settings.add({
        id: crypto.randomUUID(),
        key,
        value
      });
    }
  },

  // Get setting
  async getSetting(key: string): Promise<string | null> {
    const setting = await db.settings.where('key').equals(key).first();
    return setting?.value || null;
  }
};
