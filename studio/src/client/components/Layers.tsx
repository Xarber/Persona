// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Type,
  LayoutTemplate,
  Image,
  Layers as LayersIcon,
  ChevronRight,
  EyeOff,
} from 'lucide-react';
import { registry, type SiteNode } from '../../shared/schema';
function flatten(nodes: SiteNode[], depth = 0): { node: SiteNode; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children, depth + 1)]);
}
function Row({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: SiteNode;
  depth: number;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
  });
  const Icon =
    node.type === 'heading' || node.type === 'paragraph'
      ? Type
      : node.type === 'image'
        ? Image
        : LayoutTemplate;
  return (
    <div
      ref={setNodeRef}
      data-layer-id={node.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        paddingLeft: 10 + depth * 16,
      }}
      className={'layer-row ' + (selected ? 'selected' : '')}
    >
      <button
        ref={setActivatorNodeRef}
        className="drag-handle"
        aria-label={`Reorder ${registry[node.type].label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} />
      </button>
      <button
        className="layer-label"
        onClick={(e) => onSelect(node.id, e.metaKey || e.ctrlKey || e.shiftKey)}
      >
        <Icon size={14} />
        <span>{node.props.text?.split('\n')[0].slice(0, 25) || registry[node.type].label}</span>
        {node.style.hidden && <EyeOff size={12} />}
      </button>
    </div>
  );
}
export function Layers({
  nodes,
  selected,
  onSelect,
  onMove,
}: {
  nodes: SiteNode[];
  selected: string[];
  onSelect: (id: string, multi: boolean) => void;
  onMove: (id: string, target: string) => void;
}) {
  const rows = flatten(nodes);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
      }}
    >
      <SortableContext items={rows.map((r) => r.node.id)} strategy={verticalListSortingStrategy}>
        <div className="layer-list">
          {rows.map((r) => (
            <Row
              key={r.node.id}
              {...r}
              selected={selected.includes(r.node.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
