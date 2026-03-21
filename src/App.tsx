import { useState, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FamilyTree from './components/FamilyTree';
import TableView from './components/TableView';
import ListView from './components/ListView';
import MemberFormModal from './components/MemberFormModal';
import ImportExportModal from './components/ImportExportModal';
import { FamilyMember, ViewMode, TreeNode } from './types/family';
import { db, dbOperations, flatToTree, FamilyMemberDB } from './db/database';
import { familyData as sampleFamilyData } from './data/familyData';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('vertical-tree');
  const [showHelp, setShowHelp] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  
  // Database modals
  const [showDataManager, setShowDataManager] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberFormMode, setMemberFormMode] = useState<'add' | 'edit' | 'addChild'>('add');
  const [editingMember, setEditingMember] = useState<FamilyMemberDB | null>(null);
  const [parentForNewChild, setParentForNewChild] = useState<{ id: string; name: string; generation: number } | null>(null);
  
  const treeRef = useRef<{ zoomIn: () => void; zoomOut: () => void; resetView: () => void } | null>(null);

  // Live query dari database
  const allMembers = useLiveQuery(() => db.members.toArray(), []);
  const hasData = (allMembers?.length || 0) > 0;

  // Convert flat data ke tree structure untuk visualisasi
  const familyData = allMembers ? flatToTree(allMembers) : null;

  // Calculate statistics
  const totalMembers = allMembers?.length || 0;
  const totalGenerations = allMembers 
    ? new Set(allMembers.map(m => m.generation)).size 
    : 0;

  // Fungsi untuk mendapatkan semua anggota dalam format FamilyMember
  const getAllMembersAsFamilyMember = useCallback((): FamilyMember[] => {
    if (!allMembers) return [];
    return allMembers.map(m => ({
      id: m.id,
      name: m.name,
      gender: m.gender,
      dob: m.dob,
      job: m.job,
      address: m.address,
      phone: m.phone,
      photo: m.photo,
      generation: m.generation,
      spouse: m.spouseName ? { name: m.spouseName, photo: m.spousePhoto || '' } : undefined,
      children: []
    }));
  }, [allMembers]);

  // Fungsi untuk menghitung total keturunan dari node tertentu
  const countDescendants = (node: TreeNode): number => {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
  };

  // Handle member select - convert to FamilyMember format with proper children
  const handleSelectMember = useCallback((member: FamilyMember) => {
    if (!allMembers) return;
    
    // Get children dari database
    const children = allMembers.filter(m => m.parentId === member.id);
    const memberWithChildren: FamilyMember = {
      ...member,
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        gender: child.gender,
        dob: child.dob,
        job: child.job,
        address: child.address,
        phone: child.phone,
        photo: child.photo,
        generation: child.generation,
        spouse: child.spouseName ? { name: child.spouseName, photo: child.spousePhoto || '' } : undefined,
        children: []
      }))
    };
    
    setSelectedMember(memberWithChildren);
  }, [allMembers]);

  // Database operations
  const handleImportData = async (data: any) => {
    await dbOperations.importFromTree(data);
  };

  const handleExportData = async () => {
    return await dbOperations.exportAsTree();
  };

  const handleClearAll = async () => {
    await dbOperations.clearAll();
    setSelectedMember(null);
  };

  const handleLoadSampleData = async () => {
    await dbOperations.importFromTree(sampleFamilyData);
  };

  // Add root member (leluhur)
  const handleAddRoot = () => {
    setEditingMember(null);
    setParentForNewChild(null);
    setMemberFormMode('add');
    setShowMemberForm(true);
  };

  // Add child
  const handleAddChild = (parentId: string, parentName: string, parentGeneration: number) => {
    setEditingMember(null);
    setParentForNewChild({ id: parentId, name: parentName, generation: parentGeneration });
    setMemberFormMode('addChild');
    setShowMemberForm(true);
  };

  // Edit member
  const handleEditMember = async (memberId: string) => {
    const member = await dbOperations.getMemberById(memberId);
    if (member) {
      setEditingMember(member);
      setParentForNewChild(null);
      setMemberFormMode('edit');
      setShowMemberForm(true);
    }
  };

  // Save member
  const handleSaveMember = async (memberData: Partial<FamilyMemberDB>) => {
    if (memberFormMode === 'edit' && editingMember) {
      await dbOperations.updateMember(editingMember.id, memberData);
    } else {
      const newId = crypto.randomUUID();
      const childrenCount = parentForNewChild 
        ? (await dbOperations.getChildren(parentForNewChild.id)).length 
        : 0;
      
      await dbOperations.addMember({
        id: newId,
        parentId: memberData.parentId || null,
        name: memberData.name || '',
        gender: memberData.gender || 'L',
        dob: memberData.dob || '',
        job: memberData.job || '',
        address: memberData.address || '',
        phone: memberData.phone || '',
        photo: memberData.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        generation: memberData.generation || 1,
        spouseName: memberData.spouseName,
        spousePhoto: memberData.spousePhoto,
        orderIndex: childrenCount
      });
    }
    
    setShowMemberForm(false);
    setEditingMember(null);
    setParentForNewChild(null);
  };

  // Delete member
  const handleDeleteMember = async () => {
    if (editingMember) {
      await dbOperations.deleteMember(editingMember.id);
      setShowMemberForm(false);
      setEditingMember(null);
      setSelectedMember(null);
    }
  };

  // Render view based on mode
  const renderView = () => {
    if (!hasData) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center p-8 max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <i className="fas fa-users text-4xl text-indigo-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang!</h2>
            <p className="text-gray-600 mb-6">
              Mulai buat silsilah keluarga Anda dengan menambahkan leluhur pertama atau import data yang sudah ada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleAddRoot}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                <i className="fas fa-plus"></i>
                Tambah Leluhur
              </button>
              <button
                onClick={() => setShowDataManager(true)}
                className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30"
              >
                <i className="fas fa-file-import"></i>
                Import Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isTreeView = viewMode === 'vertical-tree' || viewMode === 'horizontal-tree';

    if (isTreeView && familyData) {
      return (
        <FamilyTree
          ref={treeRef}
          data={familyData}
          onSelectMember={handleSelectMember}
          searchQuery={searchQuery}
          orientation={viewMode === 'horizontal-tree' ? 'horizontal' : 'vertical'}
          onAddChild={handleAddChild}
          onEditMember={handleEditMember}
        />
      );
    }

    if (viewMode === 'table') {
      return (
        <TableView
          members={getAllMembersAsFamilyMember()}
          onSelectMember={handleSelectMember}
          searchQuery={searchQuery}
          onEditMember={handleEditMember}
          onAddChild={handleAddChild}
        />
      );
    }

    if (viewMode === 'list' && familyData) {
      return (
        <ListView
          data={familyData}
          onSelectMember={handleSelectMember}
          searchQuery={searchQuery}
          onEditMember={handleEditMember}
          onAddChild={handleAddChild}
        />
      );
    }

    return null;
  };

  const isTreeView = viewMode === 'vertical-tree' || viewMode === 'horizontal-tree';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onZoomIn={() => treeRef.current?.zoomIn()}
        onZoomOut={() => treeRef.current?.zoomOut()}
        onResetView={() => treeRef.current?.resetView()}
        totalMembers={totalMembers}
        totalGenerations={totalGenerations}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenDataManager={() => setShowDataManager(true)}
        onAddRoot={handleAddRoot}
        hasData={hasData}
      />

      <main className="flex-1 pt-14 sm:pt-16 overflow-hidden relative">
        {renderView()}

        {/* Sidebar */}
        <Sidebar
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          totalDescendants={selectedMember && familyData ? (() => {
            // Find the node in the tree and count descendants
            const findNode = (node: TreeNode, id: string): TreeNode | null => {
              if (node.id === id) return node;
              for (const child of node.children || []) {
                const found = findNode(child, id);
                if (found) return found;
              }
              return null;
            };
            const node = findNode(familyData, selectedMember.id);
            return node ? countDescendants(node) : 0;
          })() : 0}
          onEditMember={handleEditMember}
          onAddChild={handleAddChild}
        />

        {/* Floating Action Button for adding - mobile */}
        {hasData && (
          <button
            onClick={() => setShowDataManager(true)}
            className="fixed bottom-20 right-4 sm:hidden w-12 h-12 bg-violet-500 hover:bg-violet-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-20"
          >
            <i className="fas fa-database"></i>
          </button>
        )}

        {/* Help Panel */}
        {isTreeView && hasData && (
          <>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="fixed bottom-20 sm:bottom-4 left-4 w-10 h-10 sm:hidden bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-all z-20"
            >
              <i className="fas fa-question"></i>
            </button>
            
            <div className={`fixed bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 z-20 transition-all duration-300 ${showHelp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:pointer-events-auto'}`}>
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm mb-2">Petunjuk:</h4>
              <ul className="text-[10px] sm:text-xs text-gray-600 space-y-1">
                <li><i className="fas fa-mouse-pointer mr-2 text-indigo-500"></i>Klik kartu untuk detail</li>
                <li><i className="fas fa-arrows-alt mr-2 text-indigo-500"></i>Drag untuk menggeser</li>
                <li><i className="fas fa-search-plus mr-2 text-indigo-500"></i>Scroll untuk zoom</li>
                <li><i className="fas fa-plus-circle mr-2 text-indigo-500"></i>Klik [+] untuk buka cabang</li>
                <li><i className="fas fa-edit mr-2 text-emerald-500"></i>Double-click untuk edit</li>
              </ul>
            </div>
          </>
        )}

        {/* Legend Panel */}
        {isTreeView && hasData && (
          <>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="fixed bottom-20 sm:bottom-4 right-4 w-10 h-10 sm:hidden bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-all z-20"
            >
              <i className="fas fa-palette"></i>
            </button>
            
            <div className={`fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 z-20 transition-all duration-300 ${showLegend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:pointer-events-auto'}`}>
              <h4 className="font-semibold text-gray-800 text-xs sm:text-sm mb-2">Legenda:</h4>
              <div className="space-y-1.5 text-[10px] sm:text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-100 border border-blue-300"></div>
                  <span className="text-gray-600">Laki-laki</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-pink-100 border border-pink-300"></div>
                  <span className="text-gray-600">Perempuan</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Bottom Bar */}
        {isTreeView && hasData && (
          <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between z-30 safe-area-bottom">
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <p className="text-sm font-bold text-indigo-600">{totalMembers}</p>
                <p className="text-[8px] text-gray-500">Anggota</p>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-center">
                <p className="text-sm font-bold text-purple-600">{totalGenerations}</p>
                <p className="text-[8px] text-gray-500">Generasi</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => treeRef.current?.zoomOut()}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
              >
                <i className="fas fa-minus text-sm"></i>
              </button>
              <button
                onClick={() => treeRef.current?.resetView()}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
              >
                <i className="fas fa-compress-arrows-alt text-sm"></i>
              </button>
              <button
                onClick={() => treeRef.current?.zoomIn()}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
              >
                <i className="fas fa-plus text-sm"></i>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Member Form Modal */}
      <MemberFormModal
        isOpen={showMemberForm}
        onClose={() => {
          setShowMemberForm(false);
          setEditingMember(null);
          setParentForNewChild(null);
        }}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        member={editingMember}
        parentId={parentForNewChild?.id}
        parentName={parentForNewChild?.name}
        mode={memberFormMode}
        nextGeneration={parentForNewChild ? parentForNewChild.generation + 1 : 1}
      />

      {/* Import/Export Modal */}
      <ImportExportModal
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
        onImport={handleImportData}
        onExport={handleExportData}
        onClearAll={handleClearAll}
        onLoadSampleData={handleLoadSampleData}
      />
    </div>
  );
}

export default App;
