# Delete Project Module Design Spec

**Date**: 2026-09-23  
**Status**: Approved  

---

## 1. Goal
Provide admins the ability to delete/remove an existing `ProjectModule` from a property's module registry in the Showcase OS Admin Control Center.

---

## 2. Architecture & Data Flow

```
[ Admin UI: Property Modules Registry Layout ]
                 │
                 │ (User clicks 🗑️ Delete & confirms prompt)
                 ▼
[ IPC Channel: 'module:delete' ]
                 │
                 ▼
[ Main Process: ModuleHandlers.delete(id) ]
                 │
                 ▼
[ SQLite DB: Delete ProjectModule by ID ]
                 │
                 ▼
[ Re-fetch & Update Module List UI ]
```

---

## 3. Detailed Changes

### 3.1 IPC Channel & Handler
1. **`src/main/ipc/channels.ts`**:
   - Add `MODULE_DELETE: 'module:delete'` to `IPC_CHANNELS`.

2. **`src/main/ipc/handlers/modules.ts`**:
   - Add `delete(id: string)` method:
     ```ts
     async delete(id: string) {
       return this.db.projectModule.delete({
         where: { id },
       })
     }
     ```
   - Register handler in `registerIpc()`:
     ```ts
     ipcMain.handle(IPC_CHANNELS.MODULE_DELETE, (_, id: string) => this.delete(id))
     ```

### 3.2 Renderer Component (`src/renderer/src/routes/AdminRoute.tsx`)
1. **Delete Handler Function**:
   - Create `handleDeleteModule(mod)`:
     - Prompt browser confirmation: `Are you sure you want to delete the ${mod.moduleType.replace(/_/g, ' ')} module from this project?`
     - Invoke `(window as any).api.invoke(IPC_CHANNELS.MODULE_DELETE, mod.id)`
     - Reset `editingModuleId` if `editingModuleId === mod.id`
     - Reload modules via `loadModules(selectedProjectId)`

2. **UI Button**:
   - Add a `🗑️ Delete` styled button in the header bar of each module item in `Property Modules Registry Layout`:
     ```tsx
     <button
       type="button"
       onClick={() => handleDeleteModule(mod)}
       style={{
         padding: '6px 12px',
         backgroundColor: 'transparent',
         border: '1px solid rgba(239,68,68,0.4)',
         borderRadius: '6px',
         color: '#ef4444',
         fontSize: '12px',
         fontWeight: 600,
         cursor: 'pointer'
       }}
     >
       🗑️ Delete
     </button>
     ```

---

## 4. Verification Plan

1. **Unit / Logic Verification**:
   - Verify `MODULE_DELETE` channel exists in `IPC_CHANNELS`.
   - Verify module deletion query in Prisma handler deletes module record by ID.
2. **UI Verification**:
   - Verify `🗑️ Delete` button appears on each module card in Admin -> Modules tab.
   - Click `🗑️ Delete` and cancel: verify module remains in list.
   - Click `🗑️ Delete` and confirm: verify module is removed from list and DB.
   - Open Kiosk view and verify deleted module is no longer displayed.
