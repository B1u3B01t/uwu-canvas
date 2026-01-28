'use client';

/**
 * Example component for uwu-canvas registry.
 * This component demonstrates the dynamic component feature.
 *
 * TRY IT: Hover over any element and press Cmd+C to capture it.
 * The prompt will be automatically copied to your clipboard!
 */

// Example data that would typically come from a JSON file
const teamMembers = [
  { id: '1', name: 'Sarah Chen', role: 'Design Lead', color: 'violet' },
  { id: '2', name: 'Marcus Johnson', role: 'Engineer', color: 'blue' },
  { id: '3', name: 'Emma Wilson', role: 'Product Manager', color: 'emerald' },
];

const stats = [
  { label: 'Components', value: '24' },
  { label: 'Data Files', value: '12' },
  { label: 'Active Users', value: '1.2k' },
];

function TeamMemberCard({ name, role, color }: { name: string; role: string; color: string }) {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-100 text-violet-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${colorClasses[color]}`}>
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/80 backdrop-blur-sm">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

export function ExampleComponent() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-5 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Dynamic Components Demo
        </h1>
        <p className="text-sm text-gray-500">
          Hover over any element + press Cmd+C to make it dynamic
        </p>
      </div>

      {/* Stats Row - Try capturing this! */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Team Section - Try capturing individual cards! */}
      <SectionTitle>Team Members</SectionTitle>
      <div className="space-y-2 mb-6">
        {teamMembers.map((member) => (
          <TeamMemberCard key={member.id} {...member} />
        ))}
      </div>

      {/* Features Section - Try capturing these! */}
      <SectionTitle>Features</SectionTitle>
      <div className="space-y-2">
        <FeatureItem
          emoji="🎯"
          title="Select Any Element"
          description="Hover and press Cmd+C to capture"
        />
        <FeatureItem
          emoji="📋"
          title="Auto-Generated Prompt"
          description="AI-ready instructions copied to clipboard"
        />
        <FeatureItem
          emoji="🔄"
          title="Convert to Dynamic"
          description="Paste prompt to create JSON data files"
        />
      </div>

      {/* Tip Box */}
      <div className="mt-6 p-4 rounded-xl bg-violet-50 border border-violet-100">
        <p className="text-xs text-violet-700">
          <span className="font-semibold">Tip:</span> After copying, paste the prompt into Claude or Cursor to convert the captured element into a dynamic, data-driven component.
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100">
      <span className="text-lg">{emoji}</span>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default ExampleComponent;
