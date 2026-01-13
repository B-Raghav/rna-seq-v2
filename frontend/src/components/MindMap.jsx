
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

// Custom Node Style for "NotebookLM" look
const nodeStyles = {
  root: {
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    width: 150,
    textAlign: 'center',
  },
  topic: {
    background: '#fff',
    color: '#000',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    width: 120,
    textAlign: 'center',
  },
  subtopic: {
    background: '#f0f0f0',
    color: '#333',
    border: '1px solid #eee',
    padding: '5px 10px',
    borderRadius: '15px',
    fontSize: '11px',
    width: 100,
    textAlign: 'center',
  }
};

const CustomNode = ({ data, type }) => {
  const style = nodeStyles[data.type] || nodeStyles.topic;
  return (
    <div style={style}>
      {data.label}
    </div>
  );
};

const nodeTypes = {
  default: CustomNode,
};

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 150;
  const nodeHeight = 50;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export default function MindMap({ data, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (data) {
        // Transform backend data to ReactFlow format
        const initialNodes = data.nodes.map(n => ({
            id: n.id,
            type: 'default', // Using our custom 'default' type which handles styles
            data: { label: n.label, type: n.type, content: n.content },
            position: { x: 0, y: 0 } // Layout will fix this
        }));
        
        const initialEdges = data.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }
  }, [data, setNodes, setEdges]);

  const onNodeClickCallback = useCallback((event, node) => {
      onNodeClick(node.data);
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickCallback}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}
