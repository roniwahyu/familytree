import { useState } from 'react';
import { ViewMode } from '../types/family';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  totalMembers: number;
  totalGenerations: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenDataManager: () => void;
  onOpenSettings: () => void;
  onAddRoot: () => void;
  hasData: boolean;
}

const Header = ({
  searchQuery,
  onSearchChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  totalMembers,
  totalGenerations,
  viewMode,
  onViewModeChange,
  onOpenDataManager,
  onOpenSettings,
  onAddRoot,
  hasData
}: HeaderProps) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const viewModes: { mode: ViewMode; icon: string; label: string; shortLabel: string }[] = [
    { mode: 'vertical-tree', icon: 'fa-sitemap', label: 'Pohon Vertikal', shortLabel: 'Vertikal' },
    { mode: 'horizontal-tree', icon: 'fa-project-diagram', label: 'Pohon Horizontal', shortLabel: 'Horizontal' },
    { mode: 'table', icon: 'fa-table', label: 'Tampilan Tabel', shortLabel: 'Tabel' },
    { mode: 'list', icon: 'fa-list', label: 'Tampilan Daftar', shortLabel: 'Daftar' },
  ];

  const isTreeView = viewMode === 'vertical-tree' || viewMode === 'horizontal-tree';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <i className="fas fa-tree text-white text-sm sm:text-lg"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-800 leading-tight truncate">
                <span className="hidden xs:inline">Silsilah Keluarga Besar</span>
                <span className="xs:hidden">Silsilah Bani</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                Bani H. Ahmad Sulaiman
              </p>
            </div>
          </div>

          {/* View Mode Toggle - Desktop */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-xl p-1">
            {viewModes.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
                title={label}
              >
                <i className={`fas ${icon}`}></i>
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle - Tablet */}
          <div className="hidden md:flex lg:hidden items-center bg-gray-100 rounded-xl p-1">
            {viewModes.map(({ mode, icon, shortLabel }) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                <i className={`fas ${icon}`}></i>
                <span>{shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Stats - Hidden on mobile, visible xl+ */}
          <div className="hidden xl:flex items-center space-x-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-xl font-bold text-indigo-600">{totalMembers}</p>
              <p className="text-[10px] text-gray-500">Anggota</p>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-600">{totalGenerations}</p>
              <p className="text-[10px] text-gray-500">Generasi</p>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama anggota..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden w-9 h-9 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all"
              title="Search"
            >
              <i className={`fas ${showMobileSearch ? 'fa-times' : 'fa-search'} text-sm`}></i>
            </button>

            {/* Add Root Button - Only show when no data */}
            {!hasData && (
              <button
                onClick={onAddRoot}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all shadow-sm"
                title="Tambah Leluhur"
              >
                <i className="fas fa-plus"></i>
                <span className="hidden lg:inline">Tambah Leluhur</span>
              </button>
            )}

            {/* Database Button */}
            <button
              onClick={onOpenDataManager}
              className="hidden sm:flex w-9 h-9 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-600 hover:text-violet-700 items-center justify-center transition-all"
              title="Kelola Data"
            >
              <i className="fas fa-database text-sm"></i>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex w-9 h-9 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 hover:text-orange-700 items-center justify-center transition-all"
              title="Pengaturan ImageKit"
            >
              <i className="fas fa-cog text-sm"></i>
            </button>

            {/* Zoom Controls - Only show for tree views */}
            {isTreeView && (
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={onZoomIn}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all"
                  title="Zoom In"
                >
                  <i className="fas fa-plus text-xs sm:text-sm"></i>
                </button>
                <button
                  onClick={onZoomOut}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all"
                  title="Zoom Out"
                >
                  <i className="fas fa-minus text-xs sm:text-sm"></i>
                </button>
                <button
                  onClick={onResetView}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all"
                  title="Reset View"
                >
                  <i className="fas fa-compress-arrows-alt text-xs sm:text-sm"></i>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden w-9 h-9 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all"
              title="Menu"
            >
              <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-ellipsis-v'} text-sm`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-3 animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama anggota atau pasangan..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-3 animate-fadeIn space-y-3">
            {/* View Mode Toggle - Mobile */}
            <div className="grid grid-cols-4 gap-1 bg-gray-100 rounded-xl p-1">
              {viewModes.map(({ mode, icon, shortLabel }) => (
                <button
                  key={mode}
                  onClick={() => {
                    onViewModeChange(mode);
                    setShowMobileMenu(false);
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <i className={`fas ${icon} text-base`}></i>
                  <span className="text-[10px]">{shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex gap-2">
              {!hasData && (
                <button
                  onClick={() => {
                    onAddRoot();
                    setShowMobileMenu(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all"
                >
                  <i className="fas fa-plus"></i>
                  Tambah Leluhur
                </button>
              )}
              <button
                onClick={() => {
                  onOpenDataManager();
                  setShowMobileMenu(false);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-600 text-sm font-medium transition-all ${!hasData ? '' : 'flex-1'}`}
              >
                <i className="fas fa-database"></i>
                Kelola Data
              </button>
              <button
                onClick={() => {
                  onOpenSettings();
                  setShowMobileMenu(false);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 text-sm font-medium transition-all"
              >
                <i className="fas fa-cog"></i>
              </button>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              {/* Mobile Stats */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-600">{totalMembers}</p>
                  <p className="text-[10px] text-gray-500">Anggota</p>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">{totalGenerations}</p>
                  <p className="text-[10px] text-gray-500">Generasi</p>
                </div>
              </div>

              {/* Mobile Zoom Controls - Only for tree views */}
              {isTreeView && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onZoomIn}
                    className="w-9 h-9 rounded-full bg-white hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"
                    title="Zoom In"
                  >
                    <i className="fas fa-plus text-sm"></i>
                  </button>
                  <button
                    onClick={onZoomOut}
                    className="w-9 h-9 rounded-full bg-white hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"
                    title="Zoom Out"
                  >
                    <i className="fas fa-minus text-sm"></i>
                  </button>
                  <button
                    onClick={onResetView}
                    className="w-9 h-9 rounded-full bg-white hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center transition-all shadow-sm"
                    title="Reset View"
                  >
                    <i className="fas fa-compress-arrows-alt text-sm"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
