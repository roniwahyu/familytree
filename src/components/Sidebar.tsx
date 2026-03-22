import { FamilyMember } from '../types/family';

interface SidebarProps {
  member: FamilyMember | null;
  onClose: () => void;
  totalDescendants: number;
  onEditMember?: (memberId: string) => void;
  onAddChild?: (parentId: string, parentName: string, parentGeneration: number) => void;
  onSelectMember?: (member: FamilyMember) => void;
}

const Sidebar = ({ member, onClose, totalDescendants, onEditMember, onAddChild, onSelectMember }: SidebarProps) => {
  if (!member) return null;

  const childCount = member.children?.length || 0;
  const grandchildrenCount = totalDescendants - childCount;

  const isMale = member.gender === 'L';
  const genderGradient = isMale ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600';
  const genderLight = isMale ? 'bg-blue-50' : 'bg-pink-50';
  const genderRing = isMale ? 'ring-blue-200' : 'ring-pink-200';

  const hasSpouse = member.spouse && member.children && member.children.length > 0;

  const avatarUrl = (name: string, photo?: string) =>
    photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Mobile: full-screen slide-up | Desktop: centered modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-auto sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slideIn max-h-[95vh] sm:max-h-[85vh] flex flex-col">

          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${genderGradient} relative`}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
            >
              <i className="fas fa-times text-white"></i>
            </button>

            {/* Desktop: horizontal layout | Mobile: centered */}
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Photos */}
                <div className="flex items-end gap-[-8px] flex-shrink-0">
                  <div 
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ${genderRing}/30 cursor-pointer hover:ring-8 transition-all`}
                    onClick={(e) => {
                      e.stopPropagation();
                      (window as any).handleImageClick?.(avatarUrl(member.name, member.photo), member.name, member.id, false);
                    }}
                  >
                    <img
                      src={avatarUrl(member.name, member.photo)}
                      alt={member.name}
                      className="w-full h-full object-cover bg-gray-100"
                    />
                  </div>
                  {hasSpouse && (
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-xl overflow-hidden -ml-4 ring-4 ring-white/30 cursor-pointer hover:ring-8 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        (window as any).handleImageClick?.(avatarUrl(member.spouse!.name, member.spouse!.photo), member.spouse!.name, member.id, true);
                      }}
                    >
                      <img
                        src={avatarUrl(member.spouse!.name, member.spouse!.photo)}
                        alt={member.spouse!.name}
                        className="w-full h-full object-cover bg-gray-100"
                      />
                    </div>
                  )}
                </div>

                {/* Name & Badge */}
                <div className="text-center sm:text-left flex-1 min-w-0">
                  {hasSpouse ? (
                    <>
                      <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                        {member.name.split(' ')[0]} & {member.spouse!.name.split(' ')[0]}
                      </h2>
                      <p className="text-sm text-white/70 mt-0.5 truncate">
                        {member.name}
                      </p>
                    </>
                  ) : (
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {member.name}
                    </h2>
                  )}

                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                      <i className="fas fa-layer-group text-[10px]"></i>
                      Generasi {member.generation}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                      <i className={`fas fa-${isMale ? 'mars' : 'venus'} text-[10px]`}></i>
                      {isMale ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                    {onEditMember && (
                      <button
                        onClick={() => { onEditMember(member.id); onClose(); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/25 hover:bg-white/35 text-white transition-colors"
                      >
                        <i className="fas fa-pen text-[10px]"></i>
                        Edit
                      </button>
                    )}
                    {onAddChild && (
                      <button
                        onClick={() => { onAddChild(member.id, member.name, member.generation); onClose(); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/25 hover:bg-white/35 text-white transition-colors"
                      >
                        <i className="fas fa-plus text-[10px]"></i>
                        Tambah Anak
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body - scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Desktop: 2-column layout */}
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">

                {/* Left Column */}
                <div className="space-y-5">
                  {/* Spouse Info */}
                  {member.spouse && (
                    <div className={`${genderLight} rounded-xl p-4`}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <i className="fas fa-heart text-red-400 mr-2"></i>
                        Pasangan
                      </h3>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            (window as any).handleImageClick?.(avatarUrl(member.spouse!.name, member.spouse!.photo), member.spouse!.name, member.id, true);
                          }}
                        >
                          <img
                            src={avatarUrl(member.spouse.name, member.spouse.photo)}
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
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <i className="fas fa-user text-indigo-500 mr-2"></i>
                      Informasi Pribadi
                    </h3>
                    <div className="space-y-3">
                      {member.dob && (
                        <InfoRow icon="fa-birthday-cake" iconBg="bg-amber-100" iconColor="text-amber-600" label="Tempat, Tanggal Lahir" value={member.dob} />
                      )}
                      {member.job && (
                        <InfoRow icon="fa-briefcase" iconBg="bg-green-100" iconColor="text-green-600" label="Pekerjaan" value={member.job} />
                      )}
                      {member.address && (
                        <InfoRow icon="fa-map-marker-alt" iconBg="bg-blue-100" iconColor="text-blue-600" label="Alamat" value={member.address} />
                      )}
                      {member.phone && (
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-phone text-purple-600 text-sm"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Telepon</p>
                            <a
                              href={`tel:${member.phone}`}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              {member.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {!member.dob && !member.job && !member.address && !member.phone && (
                        <p className="text-sm text-gray-400 italic">Belum ada informasi pribadi</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Descendants Statistics */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <i className="fas fa-users text-indigo-500 mr-2"></i>
                      Statistik Keturunan
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard value={childCount} label="Anak" color="text-indigo-600" />
                      <StatCard value={grandchildrenCount > 0 ? grandchildrenCount : 0} label="Cucu +" color="text-purple-600" />
                      <StatCard value={totalDescendants} label="Total" color="text-pink-600" />
                    </div>
                  </div>

                  {/* Children List */}
                  {member.children && member.children.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <i className="fas fa-child text-indigo-500 mr-2"></i>
                        Daftar Anak ({childCount} orang)
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {member.children.map((child, index) => (
                          <div
                            key={child.id}
                            onClick={() => onSelectMember?.(child)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                              child.gender === 'L' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-pink-50 hover:bg-pink-100'
                            } ${onSelectMember ? 'cursor-pointer' : ''}`}
                          >
                            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm flex-shrink-0">
                              {index + 1}
                            </span>
                            <div 
                              className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                (window as any).handleImageClick?.(avatarUrl(child.name, child.photo), child.name, child.id, false);
                              }}
                            >
                              <img
                                src={avatarUrl(child.name, child.photo)}
                                alt={child.name}
                                className="w-full h-full object-cover bg-gray-100"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{child.name}</p>
                              <p className="text-xs text-gray-500 truncate">{child.job || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <i className={`fas fa-${child.gender === 'L' ? 'mars' : 'venus'} ${child.gender === 'L' ? 'text-blue-400' : 'text-pink-400'} text-sm`}></i>
                              {onSelectMember && (
                                <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function InfoRow({ icon, iconBg, iconColor, label, value }: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <i className={`fas ${icon} ${iconColor} text-sm`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default Sidebar;
