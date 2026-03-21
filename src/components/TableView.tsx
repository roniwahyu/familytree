import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types/family';

interface TableViewProps {
  members: FamilyMember[];
  searchQuery: string;
  onSelectMember: (member: FamilyMember) => void;
  onEditMember?: (memberId: string) => void;
  onAddChild?: (parentId: string, parentName: string, parentGeneration: number) => void;
}

type SortField = 'name' | 'generation' | 'gender' | 'job';
type SortDirection = 'asc' | 'desc';

const TableView: React.FC<TableViewProps> = ({ members, searchQuery, onSelectMember, onEditMember: _onEditMember, onAddChild: _onAddChild }) => {
  const [sortField, setSortField] = useState<SortField>('generation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterGeneration, setFilterGeneration] = useState<number | 'all'>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'L' | 'P'>('all');

  const allMembers = members;
  
  const maxGeneration = useMemo(() => 
    Math.max(...allMembers.map(m => m.generation)), 
    [allMembers]
  );

  // Filter and sort
  const filteredMembers = useMemo(() => {
    let result = [...allMembers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.spouse?.name.toLowerCase().includes(query) ||
        m.job?.toLowerCase().includes(query) ||
        m.address?.toLowerCase().includes(query)
      );
    }

    // Generation filter
    if (filterGeneration !== 'all') {
      result = result.filter(m => m.generation === filterGeneration);
    }

    // Gender filter
    if (filterGender !== 'all') {
      result = result.filter(m => m.gender === filterGender);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'generation':
          comparison = a.generation - b.generation;
          break;
        case 'gender':
          comparison = a.gender.localeCompare(b.gender);
          break;
        case 'job':
          comparison = (a.job || '').localeCompare(b.job || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allMembers, searchQuery, filterGeneration, filterGender, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <span className={sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}>▲</span>
      <span className={sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}>▼</span>
    </span>
  );

  const getGenerationLabel = (gen: number) => {
    const labels = ['', 'Leluhur', 'Anak', 'Cucu', 'Cicit', 'Canggah', 'Wareng'];
    return labels[gen] || `Gen-${gen}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-3 md:p-4">
        <div className="flex flex-wrap gap-2 md:gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm text-gray-600 font-medium">Generasi:</label>
            <select
              value={filterGeneration}
              onChange={(e) => setFilterGeneration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="text-xs md:text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua</option>
              {Array.from({ length: maxGeneration }, (_, i) => (
                <option key={i + 1} value={i + 1}>G{i + 1} - {getGenerationLabel(i + 1)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm text-gray-600 font-medium">Gender:</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as 'all' | 'L' | 'P')}
              className="text-xs md:text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="ml-auto text-xs md:text-sm text-gray-500">
            Menampilkan {filteredMembers.length} dari {allMembers.length} anggota
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[800px] bg-white">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Foto
              </th>
              <th 
                className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Nama <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('generation')}
              >
                <div className="flex items-center">
                  Generasi <SortIcon field="generation" />
                </div>
              </th>
              <th 
                className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('gender')}
              >
                <div className="flex items-center">
                  Gender <SortIcon field="gender" />
                </div>
              </th>
              <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pasangan
              </th>
              <th 
                className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('job')}
              >
                <div className="flex items-center">
                  Pekerjaan <SortIcon field="job" />
                </div>
              </th>
              <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                TTL
              </th>
              <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Anak
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMembers.map((member, index) => (
              <tr 
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-3 md:px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Main Photo (Larger - Direct Descendant) */}
                    <img
                      src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${member.gender === 'L' ? '3b82f6' : 'ec4899'}&color=fff`}
                      alt={member.name}
                      className={`w-11 h-11 rounded-full object-cover ring-2 ring-offset-1 flex-shrink-0 ${
                        member.gender === 'L' ? 'ring-blue-500' : 'ring-pink-500'
                      }`}
                    />
                    {/* Spouse Photo (Smaller) - Side by Side */}
                    {member.spouse && member.children && member.children.length > 0 && (
                      <img
                        src={member.spouse.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.spouse.name)}&background=${member.gender === 'L' ? 'ec4899' : '3b82f6'}&color=fff`}
                        alt={member.spouse.name}
                        className={`w-8 h-8 rounded-full object-cover ring-2 ring-offset-1 flex-shrink-0 ${
                          member.gender === 'L' ? 'ring-pink-500' : 'ring-blue-500'
                        }`}
                      />
                    )}
                  </div>
                </td>
                <td className="px-3 md:px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{member.name}</div>
                </td>
                <td className="px-3 md:px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.generation === 1 ? 'bg-purple-100 text-purple-800' :
                    member.generation === 2 ? 'bg-blue-100 text-blue-800' :
                    member.generation === 3 ? 'bg-green-100 text-green-800' :
                    member.generation === 4 ? 'bg-yellow-100 text-yellow-800' :
                    member.generation === 5 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    G{member.generation} - {getGenerationLabel(member.generation)}
                  </span>
                </td>
                <td className="px-3 md:px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    member.gender === 'L' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-pink-100 text-pink-700'
                  }`}>
                    {member.gender === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
                  </span>
                </td>
                <td className="px-3 md:px-4 py-3">
                  {member.spouse ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={member.spouse.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.spouse.name)}&background=${member.gender === 'L' ? 'ec4899' : '3b82f6'}&color=fff`}
                        alt={member.spouse.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-700">{member.spouse.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-3 md:px-4 py-3 text-sm text-gray-700">
                  {member.job || '-'}
                </td>
                <td className="px-3 md:px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                  {member.dob || '-'}
                </td>
                <td className="px-3 md:px-4 py-3">
                  {member.children && member.children.length > 0 ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                      {member.children.length}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMembers.length === 0 && (
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

export default TableView;
