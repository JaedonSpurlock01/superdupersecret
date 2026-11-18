import { climbs } from "@/lib/data/climbs";
import { ClimbRope } from "./climb-rope";
import Section from "./section";

export default function Climbing() {
  return (
    <Section title="CLIMBING">
      <ClimbRope climbs={climbs} />
    </Section>
  );
}
