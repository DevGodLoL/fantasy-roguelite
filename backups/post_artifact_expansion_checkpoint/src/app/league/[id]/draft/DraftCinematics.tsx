"use client";

import { useState } from "react";
import SummoningStartOverlay from "./SummoningOverlay";

export default function DraftCinematics() {
    // We only want to show this once per session ideally, but for now showing on load is fine for the effect
    // In a real app we might check basic sessionStorage
    const [show, setShow] = useState(true);

    if (!show) return null;

    return <SummoningStartOverlay onComplete={() => setShow(false)} />;
}
