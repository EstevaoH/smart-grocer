"use client"

type StatCardProps = {
    icon: React.ReactNode;
    label: string;
    value: string;
    bg: string;
}

export function StatCard({ icon, label, value, bg }: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <div className={`${bg} p-2 rounded-xl shrink-0`}>{icon}</div>
            <div className="min-w-0"><p className="text-xs text-gray-500 font-medium truncate">{label}</p><p className="text-base font-bold text-gray-800 truncate">{value}</p></div>
        </div>
    );
}
