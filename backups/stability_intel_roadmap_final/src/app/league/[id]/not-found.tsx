import Link from "next/link";

export default function LeagueNotFound() {
    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 text-white font-sans selection:bg-purple-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 max-w-md w-full bg-zinc-900/50 border border-purple-500/20 rounded-3xl p-10 text-center backdrop-blur-xl">
                <div className="w-24 h-24 bg-zinc-900/80 border border-white/10 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_40px_rgba(147,51,234,0.1)]">
                    👻
                </div>

                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
                    League Lost to the Void
                </h2>

                <p className="text-zinc-500 text-sm mb-10 leading-relaxed font-medium">
                    The scrolls contain no record of this league. It may have been consumed by the darkness, or perhaps it never existed at all.
                </p>

                <Link
                    href="/leagues"
                    className="block w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                >
                    ← Return to Sanctuary
                </Link>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                        Error: 404 • Not Found
                    </p>
                </div>
            </div>
        </div>
    );
}
