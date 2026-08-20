import { useState } from 'react';
import { PageHeader, Card } from '@/components/ui/StatusBadge';
import { FormField, TextInput, Toggle } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { currentUser } from '@/lib/mockData';
import { AuditInfo } from '@/components/ui/States';
import { FileUpload } from '@/components/ui/FileUpload';
import { formatDate } from '@/lib/utils';

export function Profile() {
  const toast = useToast();
  return (
    <div>
      <PageHeader title="Profile" description="Manage your account profile"
        actions={<button className="btn-primary" onClick={() => toast.success('Profile saved')}>Save Changes</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-maroon-700 text-2xl font-semibold text-white">{currentUser.name.charAt(0)}</div>
            <p className="mt-3 font-medium text-brown-800">{currentUser.name}</p>
            <p className="text-sm text-brown-500">{currentUser.designation}</p>
            <p className="text-xs text-brown-400">{currentUser.role}</p>
          </div>
          <div className="mt-5 space-y-3 border-t border-brown-100 pt-4 text-sm">
            <div><p className="text-xs text-brown-400">Email</p><p className="font-medium text-brown-800">{currentUser.email}</p></div>
            <div><p className="text-xs text-brown-400">Email</p><p className="font-medium text-brown-800">{currentUser.email}</p></div>
            <div><p className="text-xs text-brown-400">Mobile</p><p className="font-medium text-brown-800">{currentUser.mobile}</p></div>
            <div><p className="text-xs text-brown-400">Access Upto</p><p className="font-medium text-brown-800">{formatDate(currentUser.accessUpto)}</p></div>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">Edit Profile</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name"><TextInput defaultValue={currentUser.name} /></FormField>
            <FormField label="Designation"><TextInput defaultValue={currentUser.designation} /></FormField>
            <FormField label="Email"><TextInput type="email" defaultValue={currentUser.email} /></FormField>
            <FormField label="Mobile"><TextInput defaultValue={currentUser.mobile} /></FormField>
            <FormField label="Profile Image" className="sm:col-span-2"><FileUpload /></FormField>
          </div>
          <div className="mt-6">
            <AuditInfo created="30/01/2026 10:00 AM" updated="30/07/2026 02:30 PM" createdBy="system" updatedBy={currentUser.email} />
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ApplicationSettings() {
  const toast = useToast();
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  return (
    <div>
      <PageHeader title="Application Settings" description="Configure system-wide settings"
        actions={<button className="btn-primary" onClick={() => toast.success('Settings saved')}>Save Settings</button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">General</h3>
          <div className="grid gap-4">
            <FormField label="Temple Name"><TextInput defaultValue="Sri Siva Durga Temple" /></FormField>
            <FormField label="Currency"><TextInput defaultValue="SGD" disabled /></FormField>
            <FormField label="Default Language"><TextInput defaultValue="English" /></FormField>
            <FormField label="GST Registration Number"><TextInput defaultValue="M9-1234567-8" /></FormField>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-brown-900">Notifications & Backup</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-brown-100 p-3"><div><p className="text-sm font-medium text-brown-700">Email Notifications</p><p className="text-xs text-brown-400">Send transaction and booking alerts</p></div><Toggle checked={emailNotif} onChange={setEmailNotif} /></div>
            <div className="flex items-center justify-between rounded-lg border border-brown-100 p-3"><div><p className="text-sm font-medium text-brown-700">SMS Notifications</p><p className="text-xs text-brown-400">Send SMS for critical alerts</p></div><Toggle checked={smsNotif} onChange={setSmsNotif} /></div>
            <div className="flex items-center justify-between rounded-lg border border-brown-100 p-3"><div><p className="text-sm font-medium text-brown-700">Auto Backup</p><p className="text-xs text-brown-400">Daily database backup at 2 AM</p></div><Toggle checked={autoBackup} onChange={setAutoBackup} /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
