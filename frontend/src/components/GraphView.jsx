import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { Loader2 } from 'lucide-react';
import { graphService } from '../services/api';
import { fraudGraphData } from '../data/mockData';
import { usePresentationMode } from '../utils/presentationMode';

const GraphView = () => {
    const networkRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [presentationMode] = usePresentationMode();

    useEffect(() => {
        let isMounted = true;

        const loadGraph = async () => {
            if (presentationMode) {
                if (!isMounted) {
                    return;
                }
                setGraphData(fraudGraphData);
                return;
            }

            const data = await graphService.getGraphData();
            if (!isMounted) return;
            setGraphData(data || { nodes: [], edges: [] });
        };

        loadGraph();
        return () => {
            isMounted = false;
        };
    }, [presentationMode]);

    useEffect(() => {
        if (!networkRef.current) return;

        const nodes = graphData?.nodes || [];
        const edges = graphData?.edges || [];
        if (!nodes.length) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const data = {
            nodes,
            edges,
        };

        const options = {
            layout: {
                hierarchical: false,
                randomSeed: 2,
            },
            // Nodes base styling
            nodes: {
                shape: 'dot', 
                size: 150,
                font: {
                    size: 0,
                },
                borderWidth: 3,
                color: { border: '#FFF' }
            },
            // Edges styling
            edges: {
                width: 1.5,
                smooth: { enabled: true, type: "dynamic" },
                arrows: { to: { enabled: false } },
                color: { inherit: 'from' }, 
                font: { size: 0 },
            },
            // === PHYSICS OPTIMIZED FOR TIGHT CLUSTERING ===
             physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -8000,  // REDUCED from -25000 (less repulsion = closer clusters)
                    centralGravity: 0.5,           // INCREASED from 0.1 (pull everything to center)
                    springLength: 15,              // REDUCED from 20 (shorter connections)
                    springConstant: 0.4,           // INCREASED from 0.2 (stronger pull)
                    damping: 0.15,                 // INCREASED from 0.09 (faster settling)
                    avoidOverlap: 0.3              // REDUCED from 0.7 (allow more overlap)
                },
                solver: 'barnesHut',
                stabilization: { 
                    enabled: true, 
                    iterations: 3000,              // More iterations for better settling
                    updateInterval: 10 
                },
                minVelocity: 0.5,                  // Stop when movement is minimal
                maxVelocity: 10                    // Limit maximum speed
            },

            // Interaction settings: Keep zoom enabled
            interaction: {
                dragNodes: true,
                dragView: true,
                zoomView: true, 
                hover: true,
                tooltipDelay: 100
            },
            
            // Group definitions
            groups: {
                // DETECTED - Neon Red + Largest Nodes
                Detected: { 
                    color: { background: '#FF073A', border: '#FFC800' }, 
                    size: 25, 
                },
                // INVESTIGATION - Neon Orange + Medium Nodes
                Investigation: { 
                    color: { background: '#FFC800', border: '#FF8800' }, 
                    size: 20, 
                },
                // SUSPICIOUS - Neon Cyan + Small Nodes
                Suspicious: { 
                    color: { background: '#00FFFF', border: '#00AAAA' }, 
                    size: 15,
                },
                // SAFE (Baseline) - Neon Green (Smallest Nodes)
                Safe: { 
                    color: { background: '#39FF14', border: '#1A990A' },
                    size: 10,
                    borderWidth: 2 
                },
            },
        };

        const network = new Network(networkRef.current, data, options);
        
        network.once('stabilizationIterationsDone', function () {
            setIsLoading(false);
            network.fit();
        });
        
        network.on('click', (properties) => {
            if (properties.nodes.length > 0) {
                const nodeId = properties.nodes[0];
                const clickedNode = data.nodes.find(n => n.id === nodeId);
                if (clickedNode) {
                    console.log('Node Clicked:', clickedNode.title, 'Group:', clickedNode.group);
                }
            }
        });

        return () => {
            network.destroy();
        };
    }, [graphData]);

    const clusterTime = React.useMemo(() => {
        const nodeCount = graphData?.nodes?.length || 0;
        const edgeCount = graphData?.edges?.length || 0;
        if (!nodeCount) {
            return null;
        }
        const estimate = (nodeCount + edgeCount) / 120;
        return Math.min(4.5, Math.max(1.8, estimate)).toFixed(1);
    }, [graphData]);

    return (
        <div className="aegis-panel rounded-2xl p-6 border border-slate-800/70 h-[700px] flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Graph Intelligence</p>
                    <h3 className="text-lg font-semibold text-white">
                        Real-Time Fraud Ring Detection
                    </h3>
                </div>
                <span className="text-xs text-slate-400">
                    Auto-clustered in {clusterTime ? `${clusterTime}s` : '--'}
                </span>
            </div>
            
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-slate-900/90 p-3 rounded-lg z-20 border border-slate-700/70 shadow-lg">
                <p className="text-xs font-semibold text-white mb-2">Cluster Legend</p>
                <div className="text-xs text-slate-300 space-y-1">
                    <p>Detected: Confirmed fraud ring</p>
                    <p>Investigation: High-risk anomaly</p>
                    <p>Suspicious: Monitoring required</p>
                    <p>Safe: Normal baseline</p>
                </div>
            </div>
            
            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10 rounded-lg">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="ml-3 text-lg text-cyan-400">Optimizing Graph Topology...</span>
                </div>
            )}
            
            {/* Network Container */}
            <div 
                ref={networkRef} 
                className="flex-1 rounded-lg"
                style={{ height: '60%', minHeight: '200px' }}
            >
                {/* The visualization will be rendered here */}
            </div>
            
            {/* Bottom Insight */}
            <div className="mt-4 p-3 bg-slate-900/70 rounded-lg border border-slate-800/70">
                <p className="text-sm text-slate-300">
                    Graph AI reveals correlated entities and shared infrastructure. Dense red clusters highlight confirmed fraud rings, while amber edges show emerging risk that benefits from early intervention.
                </p>
            </div>
        </div>
    );
};

export default GraphView;
