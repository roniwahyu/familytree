import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types/family';

interface ListViewProps {
  data: FamilyMember;
  searchQuery: string;
  onSelectMember: (member: FamilyMember) => void;
  onEditMember?: (memberId: string) => void;
  onAddChild?: (parentId: string, parentName: string, parentGeneration: number) => void;
}

const ListView: React.FC<ListViewProps> = ({ data, searchQuery, onSelectMember, onEditMember: _onEditMember, onAddChild: _onAddChild }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [viewType, setViewType] = useState<'hierarchy' | 'flat'>('hierarchy');
  const [filterGeneration, setFilterGeneration] = useState<number | 'all'>('all');

  // Flatten tree to array
  const flattenTree = (node: FamilyMember): FamilyMember[] => {
    const result: FamilyMember[] = [node];
    if (node.children) {
      node.children.forEach(child => {
        result.push(...flattenTree(child));
      });
    }
    return result;
  };

  const allMembers = useMemo(() => flattenTree(data), [data]);
  
  const maxGeneration = useMemo(() => 
    Math.max(...allMembers.map(m => m.generation)), 
    [allMembers]
  );

  const filteredFlatMembers = useMemo(() => {
    let result = [...allMembers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.spouse?.name.toLowerCase().includes(query) ||
        m.job?.toLowerCase().includes(query)
      );
    }

    if (filterGeneration !== 'all') {
      result = result.filter(m => m.generation === filterGeneration);
    }

    return result;
  }, [allMembers, searchQuery, filterGeneration]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set(allMembers.map(m => m.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set(['1']));
  };

  const getGenerationLabel = (gen: number) => {
    const labels = ['', 'Leluhur', 'Anak', 'Cucu', 'Cicit', 'Canggah', 'Wareng'];
    return labels[gen] || `Gen-${gen}`;
  };

  const getGenerationColor = (gen: number) => {
    const colors = [
      '',
      'border-l-purple-500 bg-purple-50',
      'border-l-blue-500 bg-blue-50',
      'border-l-green-500 bg-green-50',
      'border-l-yellow-500 bg-yellow-50',
      'border-l-orange-500 bg-orange-50',
      'border-l-red-500 bg-red-50'
    ];
    return colors[gen] || 'border-l-gray-500 bg-gray-50';
  };

  const countDescendants = (node: FamilyMember): number => {
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);
  };

  const isHighlighted = (member: FamilyMember) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return member.name.toLowerCase().includes(query) ||
      member.spouse?.name.toLowerCase().includes(query);
  };

  // Recursive tree node component
  const TreeNode: React.FC<{ member: FamilyMember; depth: number }> = ({ member, depth }) => {
    const hasChildren = member.children && member.children.length > 0;
    const isExpanded = expandedIds.has(member.id);
    const highlighted = isHighlighted(member);
    const descendants = countDescendants(member);

    return (
      <div className="select-none">
        <div
          onClick={() => onSelectMember(member)}
          className={`flex items-center gap-3 p-3 md:p-4 border-l-4 rounded-r-lg mb-2 cursor-pointer
            transition-all duration-200 hover:shadow-md ${getGenerationColor(member.generation)}
            ${highlighted ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          `}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="flex-shrink-0 w-6">
            {hasChildren && (
              <button
                onClick={(e) => toggleExpand(member.id, e)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <svg 
                  className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Photo with Spouse Photo - Side by Side */}
          <div className="flex items-center flex-shrink-0 gap-1.5">
            {/* Main Photo (Larger - Direct Descendant) */}
            <img
              src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${member.gender === 'L' ? '3b82f6' : 'ec4899'}&color=fff`}
              alt={member.name}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-offset-2 flex-shrink-0 ${
                member.gender === 'L' ? 'ring-blue-400' : 'ring-pink-400'
              }`}
            />
            {/* Spouse Photo (Smaller) - Side by Side */}
            {member.spouse && member.children && member.children.length > 0 && (
              <img
                src={member.spouse.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.spouse.name)}&background=${member.gender === 'L' ? 'ec4899' : '3b82f6'}&color=fff`}
                alt={member.spouse.name}
                className={`w-9 h-9 md:w-11 md:h-11 rounded-full object-cover ring-2 ring-offset-1 flex-shrink-0 ${
                  member.gender === 'L' ? 'ring-pink-400' : 'ring-blue-400'
                }`}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                {member.name}
              </h3>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                member.generation === 1 ? 'bg-purple-200 text-purple-800' :
                member.generation === 2 ? 'bg-blue-200 text-blue-800' :
                member.generation === 3 ? 'bg-green-200 text-green-800' :
                member.generation === 4 ? 'bg-yellow-200 text-yellow-800' :
                member.generation === 5 ? 'bg-orange-200 text-orange-800' :
                'bg-red-200 text-red-800'
              }`}>
                G{member.generation}
              </span>
              <span className={`flex-shrink-0 text-xs ${member.gender === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>
                {member.gender === 'L' ? '♂' : '♀'}
              </span>
            </div>
            
            <p className="text-xs md:text-sm text-gray-500 truncate">
              {member.job || 'Tidak ada pekerjaan'}
            </p>

            {member.spouse && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-red-400 text-xs">❤</span>
                <img
                  src={member.spouse.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.spouse.name)}&background=${member.gender === 'L' ? 'ec4899' : '3b82f6'}&color=fff&size=24`}
                  alt={member.spouse.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs text-gray-600 truncate">{member.spouse.name}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 text-right hidden sm:block">
            {hasChildren && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{member.children?.length} anak</span>
                </div>
                {descendants > (member.children?.length || 0) && (
                  <div className="text-xs text-emerald-600 font-medium">
                    {descendants} total keturunan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-3 border-l-2 border-gray-200">
            {member.children!.map(child => (
              <TreeNode key={child.id} member={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Flat list card component
  const FlatCard: React.FC<{ member: FamilyMember }> = ({ member }) => {
    const highlighted = isHighlighted(member);
    
    return (
      <div
        onClick={() => onSelectMember(member)}
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer
          transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
          ${highlighted ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex items-start gap-4">
          {/* Photo with Spouse Photo - Side by Side */}
          <div className="flex items-center flex-shrink-0 gap-2">
            {/* Main Photo (Larger - Direct Descendant) */}
            <img
              src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${member.gender === 'L' ? '3b82f6' : 'ec4899'}&color=fff`}
              alt={member.name}
              className={`w-16 h-16 rounded-xl object-cover ring-2 ring-offset-2 flex-shrink-0 ${
                member.gender === 'L' ? 'ring-blue-400' : 'ring-pink-400'
              }`}
            />
            {/* Spouse Photo (Smaller) - Side by Side */}
            {member.spouse && member.children && member.children.length > 0 && (
              <img
                src={member.spouse.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.spouse.name)}&background=${member.gender === 'L' ? 'ec4899' : '3b82f6'}&color=fff`}
                alt={member.spouse.name}
                className={`w-12 h-12 rounded-xl object-cover ring-2 ring-offset-1 flex-shrink-0 ${
                  member.gender === 'L' ? 'ring-pink-400' : 'ring-blue-400'
                }`}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                member.generation === 1 ? 'bg-purple-100 text-purple-700' :
                member.generation === 2 ? 'bg-blue-100 text-blue-700' :
                member.generation === 3 ? 'bg-green-100 text-green-700' :
                member.generation === 4 ? 'bg-yellow-100 text-yellow-700' :
                member.generation === 5 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                G{member.generation} - {getGenerationLabel(member.generation)}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <span className={`flex items-center gap-1 ${member.gender === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>
                {member.gender === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
              </span>
              {member.job && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {member.job}
                </span>
              )}
            </div>

            {member.spouse && (
              <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                <span className="text-red-400">❤</span>
                <img
                  src={member.spouse.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.spouse.name)}&background=${member.gender === 'L' ? 'ec4899' : '3b82f6'}&color=fff&size=32`}
                  alt={member.spouse.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">{member.spouse.name}</span>
              </div>
            )}

            {member.children && member.children.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{member.children.length} anak</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Controls */}
      <div className="bg-white border-b border-gray-200 p-3 md:p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* View Type Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewType('hierarchy')}
                className={`px-3 py-1.5 text-xs md:text-sm font-medium transition-colors ${
                  viewType === 'hierarchy' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Hierarki
              </button>
              <button
                onClick={() => setViewType('flat')}
                className={`px-3 py-1.5 text-xs md:text-sm font-medium transition-colors ${
                  viewType === 'flat' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
            </div>

            {viewType === 'hierarchy' && (
              <div className="flex gap-1">
                <button
                  onClick={expandAll}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Buka Semua
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Tutup Semua
                </button>
              </div>
            )}

            {viewType === 'flat' && (
              <select
                value={filterGeneration}
                onChange={(e) => setFilterGeneration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="text-xs md:text-sm border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="all">Semua Generasi</option>
                {Array.from({ length: maxGeneration }, (_, i) => (
                  <option key={i + 1} value={i + 1}>G{i + 1} - {getGenerationLabel(i + 1)}</option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs md:text-sm text-gray-500">
            {viewType === 'flat' 
              ? `${filteredFlatMembers.length} anggota` 
              : `${allMembers.length} total anggota`
            }
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {viewType === 'hierarchy' ? (
          <div className="max-w-4xl mx-auto">
            <TreeNode member={data} depth={0} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFlatMembers.map(member => (
              <FlatCard key={member.id} member={member} />
            ))}
          </div>
        )}

        {viewType === 'flat' && filteredFlatMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
