export type Archetype =
    | 'AGGRESSIVE'
    | 'CONSERVATIVE'
    | 'MASTERMIND'
    | 'GREEDY'
    | 'HOARDER'
    | 'CHAOTIC'
    | 'BALANCED';

export interface PersonalityDefinition {
    id: Archetype;
    title: string;
    icon: string;
    description: string;
    color: string;
    quotes: string[];
    strategy: string;
}

export const PERSONALITIES: Record<Archetype, PersonalityDefinition> = {
    AGGRESSIVE: {
        id: 'AGGRESSIVE',
        title: "The Warlord",
        icon: "⚔️",
        description: "Focuses on overwhelming force and immediate power.",
        color: "text-red-400",
        strategy: "Highly aggressive. Will sacrifice longevity for a crushing victory.",
        quotes: [
            "Victory is written in blood.",
            "Mercy is for the weak.",
            "Total annihilation is the only goal.",
            "My legion will crush yours."
        ]
    },
    CONSERVATIVE: {
        id: 'CONSERVATIVE',
        title: "The Sentinel",
        icon: "🛡️",
        description: "Plays defensively and prioritizes steady consistency.",
        color: "text-blue-400",
        strategy: "Plays the long game. Avoids high-risk maneuvers.",
        quotes: [
            "The best offense is a perfect defense.",
            "Patience is the ultimate weapon.",
            "Wait for the opening, then strike.",
            "Slow and steady wins the campaign."
        ]
    },
    MASTERMIND: {
        id: 'MASTERMIND',
        title: "The Strategist",
        icon: "🧠",
        description: "Uses artifacts and traits with calculated precision.",
        color: "text-purple-400",
        strategy: "Maximizes synergy between items and player traits.",
        quotes: [
            "Everything is proceeding as I have foreseen.",
            "Strategy is the art of winning without fighting.",
            "You are merely a pawn in my grand game.",
            "Calculated risks are my specialty."
        ]
    },
    GREEDY: {
        id: 'GREEDY',
        title: "The Miser",
        icon: "💰",
        description: "Obsessed with gold and wealth accumulation.",
        color: "text-amber-400",
        strategy: "Will take penalties if the gold reward is high enough.",
        quotes: [
            "Everything has a price.",
            "I'm not here for glory, I'm here for gold.",
            "Profit is the only true metric of success.",
            "Keep the change... I'll take the rest."
        ]
    },
    HOARDER: {
        id: 'HOARDER',
        title: "The Collector",
        icon: "🎒",
        description: "Collects artifacts but rarely uses the consumable ones.",
        color: "text-emerald-400",
        strategy: "Relies on passive relic bonuses rather than activated cards.",
        quotes: [
            "My collection is incomplete...",
            "Every artifact tells a story.",
            "Beauty lies in the gathered power.",
            "One day, these will be worth a fortune."
        ]
    },
    CHAOTIC: {
        id: 'CHAOTIC',
        title: "The Mutant",
        icon: "🌀",
        description: "Unpredictable and prone to wild mutations.",
        color: "text-fuchsia-400",
        strategy: "Embraces high-variance plays and strange trait combinations.",
        quotes: [
            "Why so serious?",
            "Entropy is the natural state of the gridiron.",
            "Unexpected? Exactly as planned.",
            "Chaos is a ladder... and I'm climbing."
        ]
    },
    BALANCED: {
        id: 'BALANCED',
        title: "The Commander",
        icon: "🎖️",
        description: "A well-rounded leader with no specific biases.",
        color: "text-zinc-300",
        strategy: "Adapts to the situation as needed.",
        quotes: [
            "Forward, for the realm!",
            "Balance in all things.",
            "We stand together.",
            "To victory!"
        ]
    }
};

export function getRandomQuote(archetype: Archetype): string {
    const personality = PERSONALITIES[archetype] || PERSONALITIES.BALANCED;
    return personality.quotes[Math.floor(Math.random() * personality.quotes.length)];
}
