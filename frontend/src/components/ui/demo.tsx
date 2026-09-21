import { Cta69 } from "./cta69";

export default function Cta69Demo() {
  return (
    <Cta69
      badge={{ label: "Last word" }}
      heading="Let's make something worth keeping."
      button={{ label: "Start the conversation", href: "https://beste.co" }}
      labels={{
        marqueePhrase: "Worth keeping",
        note: "No decks, no detours: one room, your problem, and a studio that ships.",
        footnote: "Booking two new partners for the autumn cycle.",
      }}
    />
  );
}
