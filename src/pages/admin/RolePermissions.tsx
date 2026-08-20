import { useState } from 'react';
import { Shield, Save, RotateCcw, CheckSquare, Square } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/StatusBadge';
import { Dropdown, FormField } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { roles } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface ModuleDef { name: string; submodules: string[]; }
const modules: ModuleDef[] = [
  { name: 'Dashboard', submodules: ['Dashboard Overview'] },
  { name: 'Administration', submodules: ['Role Management', 'Role Permissions', 'User Management'] },
  { name: 'Masters', submodules: ['Deity Management', 'GST Management', 'Printing Group Master', 'Item Master', 'Service Master', 'Category Management', 'Customer Master', 'Payment Mode Master', 'Inventory Adjustment'] },
  { name: 'Transactions', submodules: ['POS Transactions', 'Customer Portal Bookings', 'Reprints'] },
  { name: 'Inventory', submodules: ['Inventory History', 'Low Stock Report'] },
  { name: 'Content Management', submodules: ['Menu List', 'CMS Pages'] },
  { name: 'Reports', submodules: ['POS Sales Report', 'Item Sales Report', 'Service Sales Report', 'GST Report', 'Payment Report'] },
];

const permissions = ['View', 'Write', 'Delete'] as const;
type Perm = typeof permissions[number];

type PermMap = Record<string, Record<Perm, boolean>>;

export function RolePermissions() {
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState(roles[0].name);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Dashboard: true });
  const [perms, setPerms] = useState<PermMap>(() => {
    const map: PermMap = {};
    modules.forEach((m) => {
      m.submodules.forEach((sm) => {
        map[sm] = { View: true, Write: false, Delete: false };
      });
    });
    return map;
  });
  const [original, setOriginal] = useState<PermMap>(perms);

  const togglePerm = (sub: string, perm: Perm) => {
    setPerms((p) => ({ ...p, [sub]: { ...p[sub], [perm]: !p[sub][perm] } }));
  };

  const selectAll = () => {
    const map: PermMap = {};
    modules.forEach((m) => m.submodules.forEach((sm) => { map[sm] = { View: true, Write: true, Delete: true }; }));
    setPerms(map);
  };

  const clearAll = () => {
    const map: PermMap = {};
    modules.forEach((m) => m.submodules.forEach((sm) => { map[sm] = { View: false, Write: false, Delete: false }; }));
    setPerms(map);
  };

  const reset = () => { setPerms(original); toast.info('Changes reset', 'Unsaved changes have been reverted.'); };

  const save = () => {
    setOriginal(perms);
    toast.success('Permissions saved', `Permissions for ${selectedRole} have been saved.`);
  };

  return (
    <div>
      <PageHeader
        title="Role Permissions"
        description="Configure module-level access for each role"
        actions={
          <>
            <button className="btn-outline" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset</button>
            <button className="btn-primary" onClick={save}><Save className="h-4 w-4" /> Save Permissions</button>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Role" required>
            <Dropdown value={selectedRole} onChange={setSelectedRole} options={roles.map((r) => ({ label: r.name, value: r.name }))} />
          </FormField>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-outline" onClick={selectAll}><CheckSquare className="h-4 w-4" /> Select All</button>
          <button className="btn-outline" onClick={clearAll}><Square className="h-4 w-4" /> Clear All</button>
        </div>
      </Card>

      <div className="space-y-2">
        {modules.map((mod) => {
          const isExpanded = expanded[mod.name];
          return (
            <Card key={mod.name} className="overflow-hidden">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [mod.name]: !p[mod.name] }))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cream-50"
              >
                <Shield className="h-5 w-5 text-maroon-600" />
                <span className="flex-1 font-medium text-brown-800">{mod.name}</span>
                <span className="text-xs text-brown-400">{mod.submodules.length} submodules</span>
                <span className={cn('text-brown-400 transition-transform', isExpanded && 'rotate-90')}>›</span>
              </button>
              {isExpanded && (
                <div className="border-t border-brown-50">
                  <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-brown-50 bg-cream-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brown-500">
                    <span>Submodule</span>
                    <div className="flex gap-6">{permissions.map((p) => <span key={p} className="w-12 text-center">{p}</span>)}</div>
                  </div>
                  {mod.submodules.map((sm) => (
                    <div key={sm} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-brown-50 px-4 py-2.5 last:border-0 hover:bg-cream-50">
                      <span className="text-sm text-brown-700">{sm}</span>
                      <div className="flex gap-6">
                        {permissions.map((p) => (
                          <label key={p} className="flex w-12 justify-center">
                            <input
                              type="checkbox"
                              checked={perms[sm]?.[p] ?? false}
                              onChange={() => togglePerm(sm, p)}
                              className="h-4 w-4 accent-maroon-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
