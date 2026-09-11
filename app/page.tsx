import { createSampleAnalysis } from "@/lib/analysisService";
import { StudioClient } from "@/components/StudioClient";

// The initial view and uploaded results share the same server-side deterministic engine.
// No provider call, fabricated membership, or client-side scoring is used for the opening sample.
export default function HomePage() {
  return <StudioClient initialAnalysis={createSampleAnalysis()} />;
}
