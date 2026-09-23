# Delete Project Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow administrators to delete/remove project modules directly from the Property Modules Registry Layout in the Admin Control Center.

**Architecture:** Extend IPC IPC_CHANNELS with `MODULE_DELETE`, implement a Prisma delete handler in `ModuleHandlers`, and add a `🗑️ Delete` button with confirmation to the module list items in `AdminRoute.tsx`.

**Tech Stack:** React, TypeScript, Electron IPC (`ipcMain` / `ipcRenderer`), Prisma (SQLite).

---

### Task 1: Add IPC Channel & Backend Module Handler

**Files:**
- Modify: `src/main/ipc/channels.ts:9-11`
- Modify: `src/main/ipc/handlers/modules.ts:15-37`

- [ ] **Step 1: Add `MODULE_DELETE` channel to `IPC_CHANNELS`**

Update `src/main/ipc/channels.ts` to include `MODULE_DELETE`:

```typescript
export const IPC_CHANNELS = {
  // Modules
  MODULE_LIST:              'module:list',
  MODULE_UPSERT:            'module:upsert',
  MODULE_DELETE:            'module:delete',
```

- [ ] **Step 2: Add `delete` method and register IPC in `src/main/ipc/handlers/modules.ts`**

In `ModuleHandlers`:

```typescript
  async delete(id: string) {
    return this.db.projectModule.delete({
      where: { id },
    })
  }

  registerIpc() {
    ipcMain.handle(IPC_CHANNELS.MODULE_LIST, (_, projectId: string) => this.list(projectId))
    ipcMain.handle(IPC_CHANNELS.MODULE_UPSERT, (_, data: any) => this.upsert(data))
    ipcMain.handle(IPC_CHANNELS.MODULE_DELETE, (_, id: string) => this.delete(id))
  }
```

- [ ] **Step 3: Commit backend changes**

```bash
git add src/main/ipc/channels.ts src/main/ipc/handlers/modules.ts
git commit -m "feat(ipc): add MODULE_DELETE channel and handler"
```

---

### Task 2: Frontend Module Deletion Button and Handler

**Files:**
- Modify: `src/renderer/src/routes/AdminRoute.tsx`

- [ ] **Step 1: Add `handleDeleteModule` in `AdminRoute.tsx`**

Add the delete handler function inside `AdminRoute` component:

```typescript
  const handleDeleteModule = async (mod: any) => {
    if (!confirm(`Are you sure you want to delete the "${mod.moduleType.replace(/_/g, ' ')}" module from this project?`)) {
      return
    }
    try {
      await (window as any).api.invoke(IPC_CHANNELS.MODULE_DELETE, mod.id)
      if (editingModuleId === mod.id) {
        setEditingModuleId('')
      }
      if (selectedProjectId) {
        loadModules(selectedProjectId)
      }
    } catch (err: any) {
      alert(`Failed to delete module: ${err.message}`)
    }
  }
```

- [ ] **Step 2: Add `🗑️ Delete` button in module header row in `AdminRoute.tsx`**

In the module registry list rendering loop (around lines 2138-2161), insert the `🗑️ Delete` button next to `Configure ▾`:

```tsx
                          <button onClick={() => handleMoveModule(idx, 'UP')} disabled={idx === 0} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>▲</button>
                          <button onClick={() => handleMoveModule(idx, 'DOWN')} disabled={idx === modules.length - 1} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>▼</button>
                          <button
                            type="button"
                            onClick={() => handleDeleteModule(mod)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => {
                              if (editingModuleId === mod.id) {
                                setEditingModuleId('')
                              } else {
                                setEditingModuleId(mod.id)
                                setModuleConfigInput(mod.config || '{}')
                              }
                            }}
                            style={{
                              padding: '6px 14px',
```

- [ ] **Step 3: Commit frontend changes**

```bash
git add src/renderer/src/routes/AdminRoute.tsx
git commit -m "feat(admin): add delete module action and button to module registry"
```

---

### Task 3: Verification & Typecheck

**Files:**
- `package.json`

- [ ] **Step 1: Run TypeScript typecheck / build check**

Run build or typecheck command to ensure no TypeScript compilation errors:

```bash
npm run build
```

Expected: Clean build output with 0 TypeScript errors.

- [ ] **Step 2: Commit verification state**

```bash
git commit --allow-empty -m "chore: verify module delete feature builds cleanly"
```
