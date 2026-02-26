type TabBtnProps = {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}


export function TabBtn({ active, onClick, icon, children }: TabBtnProps) {
    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${active ? "bg-primary text-white border-primary shadow-sm shadow-emerald-200" : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary"}`}>
            {icon}{children}
        </button>
    );
}
