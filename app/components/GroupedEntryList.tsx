'use client';
import { useState } from 'react';
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Category, Entry } from '@/lib/types';
import { DesktopEntryRow } from './DesktopEntryRow';
import { EntryRow } from './EntryRow';
import { useT } from './LanguageContext';

interface GroupItem { entry: Entry; flatIdx: number }
interface Group { name: string; items: GroupItem[] }

function buildGroups(entries: Entry[], groupOrder: string[]): Group[] {
  const groups: Group[] = [];
  const usedNames = new Set<string>(['']);

  groups.push({
    name: '',
    items: entries.map((e, i) => ({ entry: e, flatIdx: i })).filter(({ entry }) => !entry.subCategory),
  });

  for (const name of groupOrder) {
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    groups.push({
      name,
      items: entries.map((e, i) => ({ entry: e, flatIdx: i })).filter(({ entry }) => entry.subCategory === name),
    });
  }

  for (let i = 0; i < entries.length; i++) {
    const name = entries[i].subCategory ?? '';
    if (name && !usedNames.has(name)) {
      usedNames.add(name);
      groups.push({
        name,
        items: entries.map((e, j) => ({ entry: e, flatIdx: j })).filter(({ entry }) => entry.subCategory === name),
      });
    }
  }

  return groups;
}

function flattenGroups(groups: Group[]): Entry[] {
  return groups.flatMap(g =>
    g.items.map(({ entry }) => ({ ...entry, subCategory: g.name || undefined }))
  );
}

function itemId(catKey: Category, flatIdx: number) { return `gl-${catKey}-${flatIdx}`; }
function grpId(catKey: Category, name: string) { return `gg-${catKey}-${name || '__gen'}`; }

function parseFlatIdx(id: string): number { return parseInt(id.split('-').at(-1)!, 10); }

function EntryOverlay({ entry, color }: { entry: Entry; color: string }) {
  const { fmt } = useT();
  return (
    <div style={{
      padding: '8px 14px', background: 'var(--surface)', borderRadius: 10,
      boxShadow: '0 8px 28px oklch(0% 0 0 / 0.22)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      minWidth: 180,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color, flexShrink: 0 }}>{fmt(entry.amount)}</span>
    </div>
  );
}

function GroupDropZone({ id, isEmpty }: { id: string; isEmpty: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  if (!isEmpty) return <div ref={setNodeRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
  return (
    <div ref={setNodeRef} style={{
      minHeight: 40, borderRadius: 8, border: `1.5px dashed ${isOver ? 'var(--text-3)' : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500,
      background: isOver ? 'var(--bg)' : 'transparent', transition: 'all 0.15s',
      padding: '8px',
    }}>
      {isOver ? '↓' : '···'}
    </div>
  );
}

interface Props {
  entries: Entry[];
  groupOrder: string[];
  catKey: Category;
  catColor: string;
  isDesktop: boolean;
  onEdit: (flatIdx: number) => void;
  onDelete: (flatIdx: number) => void;
  onToggleConstant: (flatIdx: number) => void;
  onVerify: (flatIdx: number) => void;
  onEntriesChange: (newEntries: Entry[], newGroupOrder: string[]) => void;
}

export function GroupedEntryList({
  entries, groupOrder, catKey, catColor, isDesktop,
  onEdit, onDelete, onToggleConstant, onVerify, onEntriesChange,
}: Props) {
  const { t } = useT();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);

  const groups = buildGroups(entries, groupOrder);
  const hasNamedGroups = groups.length > 1;

  function handleDragStart({ active }: DragStartEvent) {
    const flatIdx = parseFlatIdx(active.id as string);
    setActiveEntry(entries[flatIdx] ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveEntry(null);
    if (!over || active.id === over.id) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;
    const fromFlatIdx = parseFlatIdx(activeStr);

    // Find source group + index in group
    let fromGi = -1, fromIi = -1;
    for (let gi = 0; gi < groups.length; gi++) {
      const ii = groups[gi].items.findIndex(it => it.flatIdx === fromFlatIdx);
      if (ii !== -1) { fromGi = gi; fromIi = ii; break; }
    }
    if (fromGi === -1) return;

    let toGi = -1, toIi = -1;
    if (overStr.startsWith('gg-')) {
      // Dropped on a group droppable — append to end of that group
      toGi = groups.findIndex(g => grpId(catKey, g.name) === overStr);
      toIi = -1; // append
    } else {
      // Dropped on an item
      const toFlatIdx = parseFlatIdx(overStr);
      for (let gi = 0; gi < groups.length; gi++) {
        const ii = groups[gi].items.findIndex(it => it.flatIdx === toFlatIdx);
        if (ii !== -1) { toGi = gi; toIi = ii; break; }
      }
    }
    if (toGi === -1) return;

    const newGroups: Group[] = groups.map(g => ({ ...g, items: [...g.items] }));

    const [movedItem] = newGroups[fromGi].items.splice(fromIi, 1);
    movedItem.entry = { ...movedItem.entry, subCategory: newGroups[toGi].name || undefined };

    if (fromGi === toGi) {
      // Within-group: use arrayMove semantics (toIi is position of over item, after removal)
      let insertAt = toIi;
      if (toIi > fromIi) insertAt--;
      if (insertAt < 0) insertAt = 0;
      newGroups[toGi].items.splice(insertAt, 0, movedItem);
    } else {
      // Cross-group: insert before target item (or append if -1)
      if (toIi === -1 || toIi >= newGroups[toGi].items.length) {
        newGroups[toGi].items.push(movedItem);
      } else {
        newGroups[toGi].items.splice(toIi, 0, movedItem);
      }
    }

    const newEntries = flattenGroups(newGroups);
    const newGroupOrder = newGroups.filter(g => g.name !== '').map(g => g.name);
    onEntriesChange(newEntries, newGroupOrder);
  }

  function moveGroup(gi: number, dir: -1 | 1) {
    const newGi = gi + dir;
    if (newGi <= 0 || newGi >= groups.length) return;
    const newGroups = [...groups];
    [newGroups[gi], newGroups[newGi]] = [newGroups[newGi], newGroups[gi]];
    const newEntries = flattenGroups(newGroups);
    const newGroupOrder = newGroups.filter(g => g.name !== '').map(g => g.name);
    onEntriesChange(newEntries, newGroupOrder);
  }

  const chevronStyle: React.CSSProperties = {
    width: 20, height: 20, borderRadius: 5,
    border: 'none', background: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-3)', padding: 0, fontSize: 12, fontFamily: 'inherit',
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: hasNamedGroups ? 6 : 0 }}>
        {groups.map((group, gi) => {
          const ids = group.items.map(it => itemId(catKey, it.flatIdx));
          const isGeneral = group.name === '';
          const showHeader = hasNamedGroups;

          return (
            <div key={group.name || '__gen'} style={{ position: 'relative' }}>
              {showHeader && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isDesktop ? '4px 10px 2px' : '4px 2px 2px',
                  marginBottom: 2,
                }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    color: isGeneral ? 'var(--text-3)' : 'var(--text-2)',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    {isGeneral ? t.general : group.name}
                  </span>
                  {!isGeneral && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <button
                        onClick={() => moveGroup(gi, -1)}
                        disabled={gi <= 1}
                        style={{ ...chevronStyle, opacity: gi <= 1 ? 0.3 : 1 }}
                        title="Move group up"
                      >▲</button>
                      <button
                        onClick={() => moveGroup(gi, 1)}
                        disabled={gi >= groups.length - 1}
                        style={{ ...chevronStyle, opacity: gi >= groups.length - 1 ? 0.3 : 1 }}
                        title="Move group down"
                      >▼</button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <GroupDropZone id={grpId(catKey, group.name)} isEmpty={group.items.length === 0} />
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {group.items.map(({ entry, flatIdx }) =>
                    isDesktop ? (
                      <DesktopEntryRow
                        key={itemId(catKey, flatIdx)}
                        id={itemId(catKey, flatIdx)}
                        entry={entry}
                        index={flatIdx}
                        color={catColor}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleConstant={onToggleConstant}
                        onVerify={onVerify}
                      />
                    ) : (
                      <EntryRow
                        key={itemId(catKey, flatIdx)}
                        id={itemId(catKey, flatIdx)}
                        entry={entry}
                        index={flatIdx}
                        color={catColor}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleConstant={onToggleConstant}
                        onVerify={onVerify}
                      />
                    )
                  )}
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeEntry ? <EntryOverlay entry={activeEntry} color={catColor} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
