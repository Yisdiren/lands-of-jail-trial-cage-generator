export default function FirstVisitOnboarding() {
  const bootstrap = `
    try {
      const profileKey = "loj-member-profiles-v1";
      const activeKey = "loj-active-profile-v1";
      if (!localStorage.getItem(profileKey)) {
        const id = "new-player";
        const profile = {
          id,
          playerName: "New Player",
          server: "",
          role: "joiner",
          season: 6,
          ownedHeroes: [],
          heroStarLevels: {},
          warSkillLevels: {},
          ownedRobots: [],
          ownedFelons: [],
          rallyFills: true,
          seatHolder: false,
          joinerCapacity: 100000,
          leaderCapacity: 100000,
          joinerRatios: { shield: 0, bomber: 0, shooter: 100 },
          leaderRatios: { shield: 0, bomber: 10, shooter: 90 },
          troopTiers: { shield: "T10", bomber: "T10", shooter: "T10" },
          availableTroops: { shield: 0, bomber: 0, shooter: 0 },
          troopPreset: "shooters",
          joinCount: 6,
          verifiedOnly: false,
          updatedAt: Date.now()
        };
        localStorage.setItem(profileKey, JSON.stringify([profile]));
        localStorage.setItem(activeKey, id);
      }
    } catch {}
  `;

  return <script dangerouslySetInnerHTML={{ __html: bootstrap }} />;
}
