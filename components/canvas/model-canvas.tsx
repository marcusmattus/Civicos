'use client'

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import type { Connection, Edge, NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowRight, Plus, Redo2, Save, ShieldCheck, Undo2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { validateSimulation } from '@/lib/engine/validate'
import { buildGraphFromSelection } from '@/lib/engine/graph'
import { useWorkspace, workspaceToSimulation } from '@/lib/store/workspace'
import type { ModelGraph, ModelNode, ModelNodeType, Simulation, ValidationReport } from '@/lib/types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../ui/utils'
import { CanvasNodeCard } from './canvas-node'
import type { CanvasNode } from './canvas-node'
import { NodeInspector } from './node-inspector'

const nodeTypes: NodeTypes = { civic: CanvasNodeCard }

const ADDABLE: { type: ModelNodeType; label: string }[] = [
  { type: 'industry', label: 'Industry' },
  { type: 'instrument', label: 'Policy instrument' },
  { type: 'assumption', label: 'Assumption' },
  { type: 'metric', label: 'Metric' },
  { type: 'outcome', label: 'Outcome' },
]

function toFlow(graph: ModelGraph): { nodes: CanvasNode[]; edges: Edge[] } {
  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      type: 'civic' as const,
      position: node.position,
      data: node as CanvasNode['data'],
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  }
}

function fromFlow(nodes: CanvasNode[], edges: Edge[]): ModelGraph {
  return {
    nodes: nodes.map((node) => ({ ...(node.data as ModelNode), position: node.position })),
    edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
  }
}

function CanvasInner() {
  const router = useRouter()
  const workspace = useWorkspace()
  const { fitView } = useReactFlow()

  const initial = useMemo(
    () =>
      toFlow(
        workspace.graph ??
          buildGraphFromSelection(
            workspace.geographySlug,
            workspace.industrySlugs,
            workspace.instrumentSlugs,
          ),
      ),
    // Rebuild only when the selection itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace.geographySlug, workspace.industrySlugs.join(), workspace.instrumentSlugs.join()],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // Undo/redo history. `skip` stops the history effect from recording the
  // state change that undo/redo itself just applied.
  const history = useRef<{ nodes: CanvasNode[]; edges: Edge[] }[]>([initial])
  const cursor = useRef(0)
  const skip = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    setNodes(initial.nodes)
    setEdges(initial.edges)
    history.current = [initial]
    cursor.current = 0
    setCanUndo(false)
    setCanRedo(false)
  }, [initial, setNodes, setEdges])

  const commit = useCallback(
    (nextNodes: CanvasNode[], nextEdges: Edge[]) => {
      history.current = history.current.slice(0, cursor.current + 1)
      history.current.push({ nodes: nextNodes, edges: nextEdges })
      cursor.current = history.current.length - 1
      setCanUndo(cursor.current > 0)
      setCanRedo(false)
    },
    [],
  )

  const undo = useCallback(() => {
    if (cursor.current === 0) return
    cursor.current -= 1
    const snapshot = history.current[cursor.current]!
    skip.current = true
    setNodes(snapshot.nodes)
    setEdges(snapshot.edges)
    setCanUndo(cursor.current > 0)
    setCanRedo(true)
  }, [setNodes, setEdges])

  const redo = useCallback(() => {
    if (cursor.current >= history.current.length - 1) return
    cursor.current += 1
    const snapshot = history.current[cursor.current]!
    skip.current = true
    setNodes(snapshot.nodes)
    setEdges(snapshot.edges)
    setCanUndo(true)
    setCanRedo(cursor.current < history.current.length - 1)
  }, [setNodes, setEdges])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      }
      if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => {
        const next = addEdge({ ...connection, id: `e-${connection.source}-${connection.target}` }, current)
        commit(nodes, next)
        return next
      })
    },
    [setEdges, commit, nodes],
  )

  function addNode(type: ModelNodeType) {
    const id = `n-${type}-${Date.now().toString(36)}`
    const node: CanvasNode = {
      id,
      type: 'civic',
      position: { x: 300 + Math.random() * 200, y: 380 + Math.random() * 80 },
      data: {
        id,
        type,
        label: `New ${type}`,
        description: 'Describe what this node represents.',
        position: { x: 0, y: 0 },
        dataSourceIds: [],
        assumptions: [],
        requiredDatasetIds: [],
        metricIds: [],
        validation: 'warning',
        validationNote: 'New node — connect it and attach data before running.',
      } as CanvasNode['data'],
    }
    const next = [...nodes, node]
    setNodes(next)
    commit(next, edges)
  }

  function removeNode(id: string) {
    const nextNodes = nodes.filter((n) => n.id !== id)
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id)
    setNodes(nextNodes)
    setEdges(nextEdges)
    commit(nextNodes, nextEdges)
    setSelectedId(null)
  }

  function saveDraft() {
    workspace.setGraph(fromFlow(nodes, edges))
    workspace.markSaved()
    setSaved(new Date().toISOString())
  }

  function validate() {
    const simulation = {
      ...workspaceToSimulation(workspace),
      graph: fromFlow(nodes, edges),
      status: 'draft',
      owner: '',
      organisation: '',
      createdAt: '',
      updatedAt: '',
      demo: false,
    } as Simulation
    setReport(validateSimulation(simulation, workspace.activeScenario))
  }

  const selectedNode = nodes.find((n) => n.id === selectedId)?.data as ModelNode | undefined
  const errors = report?.issues.filter((i) => i.severity === 'error') ?? []
  const warnings = report?.issues.filter((i) => i.severity === 'warning') ?? []

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col">
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">Build the system model</h1>
          <p className="mt-1 text-muted">
            Define how systems interact and outcomes emerge. Drag to rearrange, drag between handles
            to connect, click a node to inspect it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo (⌘Z)"
              title="Undo (⌘Z)"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo (⇧⌘Z)"
              title="Redo (⇧⌘Z)"
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <details className="relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-md border border-line bg-surface px-4 text-sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add node
            </summary>
            <ul className="absolute right-0 z-30 mt-1 w-52 rounded-md border border-line bg-surface p-1 shadow-lg">
              {ADDABLE.map((entry) => (
                <li key={entry.type}>
                  <button
                    type="button"
                    onClick={() => addNode(entry.type)}
                    className="w-full rounded px-2.5 py-2 text-left text-[13px] hover:bg-canvas"
                  >
                    {entry.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <Button onClick={saveDraft} className="gap-1.5">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save draft
          </Button>
          <Button onClick={validate} className="gap-1.5">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Validate model
          </Button>
          <Button variant="primary" onClick={() => router.push('/scenarios')} className="gap-1.5">
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {saved ? (
        <p role="status" className="mb-3 text-[13px] text-teal">
          Draft saved locally.
        </p>
      ) : null}

      {report ? (
        <Card
          className={cn(
            'mb-4 p-4',
            errors.length
              ? 'border-danger-line bg-danger-tint'
              : warnings.length
                ? 'border-warning-line bg-warning-tint'
                : 'border-teal-line bg-teal-tint',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {errors.length
                ? `${errors.length} error${errors.length === 1 ? '' : 's'} must be fixed`
                : warnings.length
                  ? `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
                  : '✓ No issues detected'}
            </span>
            <Badge tone={errors.length ? 'danger' : warnings.length ? 'warning' : 'positive'}>
              {workspace.activeScenario}
            </Badge>
          </div>
          {report.issues.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[13px]">
              {report.issues.map((issue, i) => (
                <li key={`${issue.code}-${i}`}>
                  <span className="font-medium">
                    {issue.severity === 'error' ? 'Error' : 'Warning'}:
                  </span>{' '}
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <div className="min-h-[520px] flex-1 overflow-hidden rounded-lg border border-line bg-surface">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={(changes) => {
            onNodesChange(changes)
            // Record a history entry when a drag finishes, not on every frame.
            if (changes.some((c) => c.type === 'position' && c.dragging === false)) {
              setNodes((current) => {
                if (skip.current) {
                  skip.current = false
                  return current
                }
                commit(current, edges)
                return current
              })
            }
          }}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => {
            setSelectedId(node.id)
            setInspectorOpen(true)
          }}
          onInit={() => fitView({ padding: 0.15 })}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.8}
          aria-label="Model canvas"
        >
          <Background color="#d8dee8" gap={20} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            className="!bg-canvas"
            nodeColor={() => '#c7cedb'}
            ariaLabel="Canvas minimap"
          />
        </ReactFlow>
      </div>

      <p className="mt-2 text-xs text-faint">
        {nodes.length} nodes · {edges.length} connections · Zoom and pan with the controls, or
        scroll to zoom.
      </p>

      <NodeInspector
        node={selectedNode ?? null}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        onDelete={removeNode}
      />
    </div>
  )
}

export function ModelCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
