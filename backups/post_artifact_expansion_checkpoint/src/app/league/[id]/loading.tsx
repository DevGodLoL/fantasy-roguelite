export default function LeagueLoading() {
    return (
        <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 lg:p-12 space-y-12 animate-pulse">
            <header className="space-y-8">
                <div className="h-4 w-32 bg-zinc-800 rounded-full" />
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="h-12 w-64 bg-zinc-800 rounded-xl" />
                        <div className="h-4 w-48 bg-zinc-800 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                        <div className="h-20 w-32 bg-zinc-800 rounded-2xl" />
                        <div className="h-20 w-32 bg-zinc-800 rounded-2xl" />
                        <div className="h-20 w-32 bg-zinc-800 rounded-2xl" />
                    </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-white/5 overflow-x-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 w-24 bg-zinc-800 rounded-xl shrink-0" />
                    ))}
                </div>
            </header>

            <section className="h-48 w-full bg-zinc-900/40 rounded-3xl border border-white/5" />

            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 h-96 bg-zinc-900/40 rounded-3xl border border-white/5" />
                <div className="lg:col-span-4 space-y-10">
                    <div className="h-64 bg-zinc-900/40 rounded-3xl border border-white/5" />
                    <div className="h-64 bg-zinc-900/40 rounded-3xl border border-white/5" />
                </div>
            </div>
        </div>
    );
}
