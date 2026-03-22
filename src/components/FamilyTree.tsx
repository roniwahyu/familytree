import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { FamilyMember } from '../types/family';

export interface FamilyTreeRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface FamilyTreeProps {
  data: FamilyMember;
  searchQuery: string;
  onSelectMember: (member: FamilyMember) => void;
  orientation: 'vertical' | 'horizontal';
  onAddChild?: (parentId: string, parentName: string, parentGeneration: number) => void;
  onEditMember?: (memberId: string) => void;
}

interface HierarchyNode extends d3.HierarchyPointNode<FamilyMember> {
  _children?: HierarchyNode[];
  x0?: number;
  y0?: number;
}

const FamilyTree = forwardRef<FamilyTreeRef, FamilyTreeProps>(({ 
  data, 
  searchQuery, 
  onSelectMember, 
  orientation, 
  onAddChild: _onAddChild, 
  onEditMember: _onEditMember 
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomFunctionsRef = useRef<FamilyTreeRef | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const isHorizontal = orientation === 'horizontal';
  
  // Expose zoom functions to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomFunctionsRef.current?.zoomIn(),
    zoomOut: () => zoomFunctionsRef.current?.zoomOut(),
    resetView: () => zoomFunctionsRef.current?.resetView()
  }));

  // Responsive node dimensions - CONDENSED for horizontal mode
  const getNodeDimensions = useCallback(() => {
    const width = window.innerWidth;
    
    if (isHorizontal) {
      // CONDENSED horizontal mode - much smaller and tighter
      if (width < 480) {
        return { 
          nodeWidth: 110, 
          nodeHeight: 48, 
          horizontalSpacing: 50,  // Much tighter horizontal gap
          verticalSpacing: 58,    // Narrow vertical gap between siblings
          fontSize: 8,
          compact: true
        };
      } else if (width < 640) {
        return { 
          nodeWidth: 120, 
          nodeHeight: 50, 
          horizontalSpacing: 55,
          verticalSpacing: 62,
          fontSize: 9,
          compact: true
        };
      } else if (width < 768) {
        return { 
          nodeWidth: 135, 
          nodeHeight: 52, 
          horizontalSpacing: 60,
          verticalSpacing: 68,
          fontSize: 10,
          compact: true
        };
      } else if (width < 1024) {
        return { 
          nodeWidth: 150, 
          nodeHeight: 55, 
          horizontalSpacing: 65,
          verticalSpacing: 72,
          fontSize: 10,
          compact: true
        };
      } else {
        return { 
          nodeWidth: 165, 
          nodeHeight: 58, 
          horizontalSpacing: 70,
          verticalSpacing: 78,
          fontSize: 11,
          compact: true
        };
      }
    } else {
      // Vertical mode - normal spacing
      if (width < 480) {
        return { 
          nodeWidth: 160, 
          nodeHeight: 75, 
          horizontalSpacing: 180, 
          verticalSpacing: 120,
          fontSize: 10,
          compact: false
        };
      } else if (width < 640) {
        return { 
          nodeWidth: 180, 
          nodeHeight: 80, 
          horizontalSpacing: 200, 
          verticalSpacing: 130,
          fontSize: 11,
          compact: false
        };
      } else if (width < 768) {
        return { 
          nodeWidth: 200, 
          nodeHeight: 85, 
          horizontalSpacing: 220, 
          verticalSpacing: 140,
          fontSize: 12,
          compact: false
        };
      } else {
        return { 
          nodeWidth: 220, 
          nodeHeight: 95, 
          horizontalSpacing: 260, 
          verticalSpacing: 160,
          fontSize: 13,
          compact: false
        };
      }
    }
  }, [isHorizontal]);

  // Check if node matches search
  const matchesSearch = useCallback((d: FamilyMember, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    const nameMatch = d.name.toLowerCase().includes(q);
    const spouseMatch = d.spouse?.name.toLowerCase().includes(q) || false;
    return nameMatch || spouseMatch;
  }, []);

  // Find all matching nodes recursively
  const findMatchingNodes = useCallback((root: d3.HierarchyNode<FamilyMember>, query: string): d3.HierarchyNode<FamilyMember>[] => {
    const matches: d3.HierarchyNode<FamilyMember>[] = [];
    root.each(node => {
      if (matchesSearch(node.data, query)) {
        matches.push(node);
      }
    });
    return matches;
  }, [matchesSearch]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight - (isMobile ? 56 : 64);
    const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, compact } = getNodeDimensions();

    svg.attr('width', width).attr('height', height);

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'tree-container');
    gRef.current = g.node();

    // Setup zoom behavior with touch support
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .touchable(true)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Disable double-tap zoom on mobile (prevents accidental zooming)
    svg.on('dblclick.zoom', null);

    // Create hierarchy
    const root = d3.hierarchy(data) as HierarchyNode;
    
    // Store initial positions
    root.x0 = 0;
    root.y0 = 0;

    // Create tree layout based on orientation - CONDENSED for horizontal
    const treeLayout = d3.tree<FamilyMember>()
      .nodeSize(isHorizontal 
        ? [verticalSpacing, horizontalSpacing + nodeWidth]  // [y-spacing between siblings, x-spacing between generations]
        : [horizontalSpacing, verticalSpacing]
      )
      .separation((a, b) => {
        // Tighter separation for horizontal mode
        if (isHorizontal) {
          return a.parent === b.parent ? 1 : 1.1;
        }
        return a.parent === b.parent ? 1 : 1.2;
      });

    // Link generators for both orientations
    const verticalLinkGenerator = d3.linkVertical<d3.HierarchyPointLink<FamilyMember>, d3.HierarchyPointNode<FamilyMember>>()
      .x(d => d.x)
      .y(d => d.y);

    const horizontalLinkGenerator = d3.linkHorizontal<d3.HierarchyPointLink<FamilyMember>, d3.HierarchyPointNode<FamilyMember>>()
      .x(d => d.y)
      .y(d => d.x);

    // Update function
    const update = (source: HierarchyNode) => {
      // Compute tree layout
      const treeData = treeLayout(root);
      const nodes = treeData.descendants() as HierarchyNode[];
      const links = treeData.links();

      // Duration for animations (shorter on mobile for better performance)
      const duration = isMobile ? 250 : 400;

      // ============ LINKS ============
      const linkSelection = g.selectAll<SVGPathElement, d3.HierarchyPointLink<FamilyMember>>('path.link')
        .data(links, d => (d.target as HierarchyNode).data.id);

      // Enter links
      const linkEnter = linkSelection.enter()
        .append('path')
        .attr('class', 'link link-path')
        .attr('d', () => {
          if (isHorizontal) {
            const o = { x: source.x0 || 0, y: source.y0 || 0 } as d3.HierarchyPointNode<FamilyMember>;
            return horizontalLinkGenerator({ source: o, target: o });
          } else {
            const o = { x: source.x0 || 0, y: source.y0 || 0 } as d3.HierarchyPointNode<FamilyMember>;
            return verticalLinkGenerator({ source: o, target: o });
          }
        });

      // Update links
      linkSelection.merge(linkEnter)
        .transition()
        .duration(duration)
        .attr('d', d => {
          if (isHorizontal) {
            // Horizontal tree - shorter bezier curve for condensed view
            const sourceX = d.source.y + nodeWidth / 2;
            const sourceY = d.source.x;
            const targetX = d.target.y - nodeWidth / 2;
            const targetY = d.target.x;
            
            // Shorter curve control points for tighter layout
            const curveOffset = Math.min(20, (targetX - sourceX) / 3);
            
            return `M${sourceX},${sourceY} 
                    C${sourceX + curveOffset},${sourceY} 
                     ${targetX - curveOffset},${targetY} 
                     ${targetX},${targetY}`;
          } else {
            // Vertical tree - bezier curve
            const sourceX = d.source.x;
            const sourceY = d.source.y + nodeHeight / 2;
            const targetX = d.target.x;
            const targetY = d.target.y - nodeHeight / 2;
            const midY = (sourceY + targetY) / 2;
            
            return `M${sourceX},${sourceY} 
                    C${sourceX},${midY} 
                     ${targetX},${midY} 
                     ${targetX},${targetY}`;
          }
        })
        .attr('stroke', isHorizontal ? '#a1a1aa' : '#94a3b8')
        .attr('stroke-width', compact ? 1 : (isMobile ? 1.5 : 2))
        .attr('fill', 'none');

      // Exit links
      linkSelection.exit()
        .transition()
        .duration(duration)
        .attr('d', () => {
          if (isHorizontal) {
            const o = { x: source.x || 0, y: source.y || 0 } as d3.HierarchyPointNode<FamilyMember>;
            return horizontalLinkGenerator({ source: o, target: o });
          } else {
            const o = { x: source.x || 0, y: source.y || 0 } as d3.HierarchyPointNode<FamilyMember>;
            return verticalLinkGenerator({ source: o, target: o });
          }
        })
        .remove();

      // ============ NODES ============
      const nodeSelection = g.selectAll<SVGGElement, HierarchyNode>('g.node')
        .data(nodes, d => d.data.id);

      // Enter nodes
      const nodeEnter = nodeSelection.enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', () => {
          if (isHorizontal) {
            return `translate(${source.y0 || 0},${source.x0 || 0})`;
          }
          return `translate(${source.x0 || 0},${source.y0 || 0})`;
        })
        .style('opacity', 0);

      // Add foreignObject for HTML content
      nodeEnter.append('foreignObject')
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .append('xhtml:div')
        .attr('class', 'node-wrapper')
        .html(d => createNodeHTML(d.data, nodeWidth, nodeHeight, compact))
        .on('click', (event, d) => {
          event.stopPropagation();
          onSelectMember(d.data);
        })
        .on('touchend', (event, d) => {
          event.preventDefault();
          event.stopPropagation();
          onSelectMember(d.data);
        });

      // Add expand/collapse button for nodes with children
      nodeEnter.each(function(d) {
        const node = d3.select(this);
        const hasChildren = d.data.children && d.data.children.length > 0;
        const hasCollapsedChildren = (d as HierarchyNode)._children && (d as HierarchyNode)._children!.length > 0;
        
        // Smaller button for condensed view
        const btnSize = compact ? 7 : (isMobile ? 10 : 12);

        if (hasChildren || hasCollapsedChildren) {
          const btnOffset = isHorizontal 
            ? `translate(${nodeWidth / 2 + (compact ? 4 : (isMobile ? 8 : 10))}, 0)`
            : `translate(0, ${nodeHeight / 2 + (isMobile ? 8 : 10)})`;

          node.append('g')
            .attr('class', 'expand-btn')
            .attr('transform', btnOffset)
            .style('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              toggleNode(d);
              update(d);
            })
            .on('touchend', (event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleNode(d);
              update(d);
            })
            .call(btnG => {
              btnG.append('circle')
                .attr('r', btnSize)
                .attr('fill', hasCollapsedChildren ? '#3b82f6' : '#e2e8f0')
                .attr('stroke', '#94a3b8')
                .attr('stroke-width', compact ? 1 : (isMobile ? 1.5 : 2))
                .attr('class', hasCollapsedChildren ? 'pulse-indicator' : '');
              
              btnG.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr('fill', hasCollapsedChildren ? 'white' : '#64748b')
                .attr('font-size', compact ? '10px' : (isMobile ? '12px' : '14px'))
                .attr('font-weight', 'bold')
                .text(hasCollapsedChildren ? '+' : '−');
            });
        }
      });

      // Update nodes
      const nodeUpdate = nodeSelection.merge(nodeEnter);
      
      nodeUpdate
        .transition()
        .duration(duration)
        .attr('transform', d => {
          if (isHorizontal) {
            return `translate(${d.y},${d.x})`;
          }
          return `translate(${d.x},${d.y})`;
        })
        .style('opacity', 1);

      // Update expand buttons
      nodeUpdate.select('.expand-btn').each(function(d) {
        const btn = d3.select(this);
        const hasCollapsedChildren = (d as HierarchyNode)._children && (d as HierarchyNode)._children!.length > 0;
        
        btn.select('circle')
          .attr('fill', hasCollapsedChildren ? '#3b82f6' : '#e2e8f0');
        
        btn.select('text')
          .attr('fill', hasCollapsedChildren ? 'white' : '#64748b')
          .text(hasCollapsedChildren ? '+' : '−');
      });

      // Exit nodes
      nodeSelection.exit()
        .transition()
        .duration(duration)
        .attr('transform', () => {
          if (isHorizontal) {
            return `translate(${source.y || 0},${source.x || 0})`;
          }
          return `translate(${source.x || 0},${source.y || 0})`;
        })
        .style('opacity', 0)
        .remove();

      // Store positions for next transition
      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };

    // Toggle children visibility
    const toggleNode = (d: HierarchyNode) => {
      if (d.children) {
        (d as HierarchyNode)._children = d.children;
        d.children = undefined;
      } else if ((d as HierarchyNode)._children) {
        d.children = (d as HierarchyNode)._children;
        (d as HierarchyNode)._children = undefined;
      }
    };

    // Initial render
    update(root);

    // Center the tree with responsive scale
    const initialScale = isHorizontal 
      ? (isMobile ? 0.6 : 0.75)  // Slightly higher scale for condensed horizontal
      : (isMobile ? 0.5 : 0.7);
      
    let initialTransform: d3.ZoomTransform;
    
    if (isHorizontal) {
      initialTransform = d3.zoomIdentity
        .translate(isMobile ? 60 : 100, height / 2)
        .scale(initialScale);
    } else {
      initialTransform = d3.zoomIdentity
        .translate(width / 2, isMobile ? 80 : 100)
        .scale(initialScale);
    }
    
    svg.call(zoom.transform, initialTransform);

    // Setup zoom controls via useImperativeHandle
    zoomFunctionsRef.current = {
      zoomIn: () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
      },
      zoomOut: () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
      },
      resetView: () => {
        svg.transition().duration(500).call(zoom.transform, initialTransform);
      }
    };

    // Search functionality
    if (searchQuery) {
      const matches = findMatchingNodes(root, searchQuery);
      
      // Update node opacity based on search
      g.selectAll<SVGGElement, HierarchyNode>('g.node')
        .each(function(d) {
          const isMatch = matchesSearch(d.data, searchQuery);
          d3.select(this)
            .select('foreignObject')
            .transition()
            .duration(300)
            .style('opacity', isMatch ? 1 : 0.3);
          
          // Add highlight to matching nodes
          d3.select(this).select('.node-wrapper > div')
            .classed('search-highlight', isMatch);
        });

      // Pan to first match
      if (matches.length > 0) {
        const firstMatch = matches[0] as HierarchyNode;
        let transform: d3.ZoomTransform;
        
        if (isHorizontal) {
          transform = d3.zoomIdentity
            .translate(width / 2 - firstMatch.y, height / 2 - firstMatch.x)
            .scale(isMobile ? 0.8 : 1);
        } else {
          transform = d3.zoomIdentity
            .translate(width / 2 - firstMatch.x, height / 2 - firstMatch.y)
            .scale(isMobile ? 0.8 : 1);
        }
        
        svg.transition().duration(750).call(zoom.transform, transform);
      }
    } else {
      // Reset all nodes to full opacity
      g.selectAll('g.node foreignObject')
        .transition()
        .duration(300)
        .style('opacity', 1);
      
      g.selectAll('.node-wrapper > div')
        .classed('search-highlight', false);
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - (newWidth < 640 ? 56 : 64);
      setIsMobile(newWidth < 640);
      svg.attr('width', newWidth).attr('height', newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [data, searchQuery, onSelectMember, matchesSearch, findMatchingNodes, isMobile, getNodeDimensions, isHorizontal]);

  // Create HTML for each node card - CONDENSED version for horizontal
  const createNodeHTML = (member: FamilyMember, nodeWidth: number, _nodeHeight: number, isCompact: boolean): string => {
    const genderBg = member.gender === 'L' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200';
    const genderAccent = member.gender === 'L' ? 'text-blue-600' : 'text-pink-600';
    const genClass = `gen-${Math.min(member.generation, 7)}`;
    const hasChildrenWithSpouse = member.spouse && member.children && member.children.length > 0;
    
    if (isCompact) {
      // ULTRA CONDENSED card for horizontal tree
      return `
        <div class="node-card ${genderBg} border rounded-lg p-1.5 h-full cursor-pointer shadow hover:shadow-md transition-all relative overflow-hidden" style="touch-action: manipulation;">
          <!-- Generation Badge - tiny -->
          <div class="absolute top-0.5 right-0.5 text-[7px] px-1 py-0 ${genClass} text-white font-bold rounded-full">
            G${member.generation}
          </div>
          
          <div class="flex items-center space-x-1.5">
            <!-- Photos Container - Side by Side -->
            <div class="flex items-center flex-shrink-0 gap-0.5">
              <!-- Main Photo (Larger - Direct Descendant) -->
              <div class="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow flex-shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" onclick="event.stopPropagation(); window.handleImageClick('${member.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}', '${member.name}', '${member.id}', false)">
                <img 
                  src="${member.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}" 
                  alt="${member.name}"
                  class="w-full h-full object-cover bg-gray-100"
                  onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}'"
                />
              </div>
              ${hasChildrenWithSpouse ? `
                <!-- Spouse Photo (Smaller) - Side by Side -->
                <div class="w-5 h-5 rounded-full overflow-hidden border border-white shadow flex-shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all" onclick="event.stopPropagation(); window.handleImageClick('${member.spouse!.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse!.name}`}', '${member.spouse!.name}', '${member.id}', true)">
                  <img 
                    src="${member.spouse!.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse!.name}`}" 
                    alt="${member.spouse!.name}"
                    class="w-full h-full object-cover bg-gray-100"
                    onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse!.name}'"
                  />
                </div>
              ` : ''}
            </div>
            
            <!-- Info - condensed -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-800 text-[9px] truncate leading-tight" title="${member.name}">
                ${member.name.split(' ').slice(0, 2).join(' ')}
              </h3>
              ${hasChildrenWithSpouse ? `
                <p class="text-[7px] text-gray-500 truncate flex items-center">
                  <span class="text-red-400 mr-0.5">♥</span>
                  <span class="truncate">${member.spouse!.name.split(' ')[0]}</span>
                </p>
              ` : `
                <p class="text-[8px] text-gray-500 truncate">
                  ${member.job ? member.job.substring(0, 10) + (member.job.length > 10 ? '..' : '') : '-'}
                </p>
              `}
            </div>
          </div>
          
          ${member.children && member.children.length > 0 ? `
            <div class="absolute bottom-0.5 right-1 text-[7px] text-gray-400 flex items-center">
              <span class="mr-0.5">👶</span>${member.children.length}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    // Normal card for vertical tree
    const isSmall = nodeWidth < 200;
    
    return `
      <div class="node-card ${genderBg} border-2 rounded-xl ${isSmall ? 'p-2' : 'p-3'} h-full cursor-pointer shadow-md hover:shadow-lg transition-all relative overflow-hidden" style="touch-action: manipulation;">
        <!-- Generation Badge -->
        <div class="absolute ${isSmall ? 'top-1 right-1 text-[9px] px-1.5 py-0.5' : 'top-2 right-2 text-xs px-2 py-0.5'} ${genClass} text-white font-bold rounded-full shadow">
          G${member.generation}
        </div>
        
        <div class="flex items-start ${isSmall ? 'space-x-2' : 'space-x-3'}">
          <!-- Photos Container - Side by Side -->
          <div class="flex items-center flex-shrink-0 gap-1">
            <!-- Main Photo (Larger - Direct Descendant) -->
            <div class="${isSmall ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" onclick="event.stopPropagation(); window.handleImageClick('${member.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}', '${member.name}', '${member.id}', false)">
              <img 
                src="${member.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}" 
                alt="${member.name}"
                class="w-full h-full object-cover bg-gray-100"
                onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}'"
              />
            </div>
            ${hasChildrenWithSpouse ? `
              <!-- Spouse Photo (Smaller) - Side by Side -->
              <div class="${isSmall ? 'w-7 h-7' : 'w-9 h-9'} rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all" onclick="event.stopPropagation(); window.handleImageClick('${member.spouse!.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse!.name}`}', '${member.spouse!.name}', '${member.id}', true)">
                <img 
                  src="${member.spouse!.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse!.name}`}" 
                  alt="${member.spouse!.name}"
                  class="w-full h-full object-cover bg-gray-100"
                  onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${member.spouse!.name}'"
                />
              </div>
            ` : ''}
          </div>
          
          <!-- Info -->
          <div class="flex-1 min-w-0 ${isSmall ? 'pt-0' : 'pt-0.5'}">
            <h3 class="font-semibold text-gray-800 ${isSmall ? 'text-xs' : 'text-sm'} truncate leading-tight" title="${member.name}">
              ${member.name}
            </h3>
            <p class="${isSmall ? 'text-[10px]' : 'text-xs'} text-gray-500 truncate mt-0.5">
              <i class="fas fa-briefcase mr-1 ${genderAccent}"></i>
              ${member.job || '-'}
            </p>
            
            ${member.spouse ? `
              <p class="${isSmall ? 'text-[10px]' : 'text-xs'} text-gray-500 truncate mt-0.5 flex items-center">
                <i class="fas fa-heart text-red-400 mr-1"></i>
                <span class="truncate">${member.spouse.name}</span>
              </p>
            ` : ''}
          </div>
        </div>
        
        ${member.children && member.children.length > 0 ? `
          <div class="absolute bottom-1 right-2 ${isSmall ? 'text-[10px]' : 'text-xs'} text-gray-400">
            <i class="fas fa-users mr-1"></i>${member.children.length}
          </div>
        ` : ''}
      </div>
    `;
  };

  return (
    <svg 
      ref={svgRef} 
      className="tree-canvas w-full h-full touch-none"
      style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)' }}
    />
  );
});

FamilyTree.displayName = 'FamilyTree';

export default FamilyTree;
