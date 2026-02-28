type RoleType = 'humanEncryptor' | 'humanReceiver' | 'aiEncryptor' | 'aiReceiver' | 'aiInterceptor';

const config: Record<RoleType, { label: string; bg: string; text: string; border: string }> = {
  humanEncryptor: { label: '加密者', bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200/50' },
  humanReceiver: { label: '接收者', bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100' },
  aiEncryptor: { label: 'AI 加密者', bg: 'bg-red-100', text: 'text-red-500', border: 'border-red-200/50' },
  aiReceiver: { label: 'AI 接收者', bg: 'bg-red-50', text: 'text-red-400', border: 'border-red-100' },
  aiInterceptor: { label: 'AI 拦截者', bg: 'bg-red-50', text: 'text-red-400', border: 'border-red-100' },
};

export default function RoleBadge({ role }: { role: RoleType }) {
  const c = config[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${c.bg} ${c.text} border ${c.border}`}>
      {c.label}
    </span>
  );
}
