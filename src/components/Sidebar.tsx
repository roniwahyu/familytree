import { FamilyMember } from '../types/family';

interface SidebarProps {
  member: FamilyMember | null;
  onClose: () => void;
  totalDescendants: number;
  onEditMember?: (memberId: string) => void;
  onAddChild?: (parentId: string, parentName: string, parentGeneration: number) => void;
}

const Sidebar = ({ member, onClose, totalDescendants, onEditMember: _onEditMember, onAddChild: _onAddChild }: SidebarProps) => {
  if (!member) return null;

  const childCount = member.children?.length || 0;
  const grandchildrenCount = totalDescendants - childCount;

  const genderBg = member.gender === 'L' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600';
  const genderLight = member.gender === 'L' ? 'bg-blue-50' : 'bg-pink-50';

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar - Full width on mobile, fixed width on larger screens */}
      <aside className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 animate-slideIn">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${genderBg} p-4 sm:p-6 pt-6 sm:pt-8 relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-white text-lg sm:text-base"></i>
          </button>
          
{/* Profile Photo with Spouse - Side by Side */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                {/* Main Photo (Larger - Direct Descendant) */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={member.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-full h-full object-cover bg-gray-100"
                  />
                </div>
                {/* Spouse Photo (Smaller) - Side by Side */}
                {member.spouse && member.children && member.children.length > 0 && (
                  <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-4 border-white shadow-xl overflow-hidden flex-shrink-0" style={{ width: '72px', height: '72px' }}>
                    <img 
                      src={member.spouse.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse.name}`}
                      alt={member.spouse.name}
                      className="w-full h-full object-cover bg-gray-100"
                    />
                  </div>
                )}
              </div>
            {member.spouse && member.children && member.children.length > 0 ? (
              <>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1 px-2">
                  {member.name.split(' ')[0]} & {member.spouse.name.split(' ')[0]}
                </h2>
                <p className="text-xs text-white/80 mb-1">
                  ({member.name})
                </p>
              </>
            ) : (
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1 px-2">{member.name}</h2>
            )}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              Generasi {member.generation}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
          {/* Spouse Info */}
          {member.spouse && (
            <div className={`${genderLight} rounded-xl p-3 sm:p-4`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                <i className="fas fa-heart text-red-400 mr-2"></i>
                Pasangan
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow flex-shrink-0">
                  <img 
                    src={member.spouse.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse.name}`}
                    alt={member.spouse.name}
                    className="w-full h-full object-cover bg-gray-100"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{member.spouse.name}</p>
                  {member.spouse.job && (
                    <p className="text-sm text-gray-500 truncate">{member.spouse.job}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Personal Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
              <i className="fas fa-user text-indigo-500 mr-2"></i>
              Informasi Pribadi
            </h3>
            
            <div className="space-y-2 sm:space-y-3">
              {member.dob && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-birthday-cake text-amber-600 text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Tempat, Tanggal Lahir</p>
                    <p className="text-sm font-medium text-gray-800">{member.dob}</p>
                  </div>
                </div>
              )}
              
              {member.job && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-briefcase text-green-600 text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Pekerjaan</p>
                    <p className="text-sm font-medium text-gray-800">{member.job}</p>
                  </div>
                </div>
              )}
              
              {member.address && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-map-marker-alt text-blue-600 text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Alamat</p>
                    <p className="text-sm font-medium text-gray-800 break-words">{member.address}</p>
                  </div>
                </div>
              )}
              
              {member.phone && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-phone text-purple-600 text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Telepon</p>
                    <a 
                      href={`tel:${member.phone}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {member.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descendants Statistics */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center">
              <i className="fas fa-users text-indigo-500 mr-2"></i>
              Statistik Keturunan
            </h3>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">{childCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Anak</p>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{grandchildrenCount > 0 ? grandchildrenCount : 0}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Cucu +</p>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                <p className="text-xl sm:text-2xl font-bold text-pink-600">{totalDescendants}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>

          {/* Children List */}
          {member.children && member.children.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                <i className="fas fa-child text-indigo-500 mr-2"></i>
                Daftar Anak ({childCount} orang)
              </h3>
              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {member.children.map((child, index) => (
                  <div 
                    key={child.id}
                    className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg ${child.gender === 'L' ? 'bg-blue-50' : 'bg-pink-50'}`}
                  >
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-600 shadow-sm flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white shadow-sm flex-shrink-0">
                      <img 
                        src={child.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`}
                        alt={child.name}
                        className="w-full h-full object-cover bg-gray-100"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{child.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{child.job || '-'}</p>
                    </div>
                    <i className={`fas fa-${child.gender === 'L' ? 'mars' : 'venus'} ${child.gender === 'L' ? 'text-blue-400' : 'text-pink-400'} text-sm`}></i>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile bottom safe area padding */}
        <div className="sm:hidden h-4 bg-white"></div>
      </aside>
    </>
  );
};

export default Sidebar;
