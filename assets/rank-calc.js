/* UltraTrain website: pure rank and plan maths, ported from the app's Domain layer.
   Sources (keep in sync by hand):
   - UltraTrain/Domain/Models/RankConfig.swift (equivalentDistance, raceTierThresholds,
     levelScoreTiers, backyardRaceTier anchors, divisionXP)
   - UltraTrain/Domain/UseCases/RaceTierCalculator.swift (tierFromKmLadder, backyard branch)
   - UltraTrain/Domain/UseCases/LevelScoreCalculator.swift (backyardLevelScore interpolation)
   - UltraTrain/Domain/Models/TaperProfile.swift, PhaseDistributor.swift, VolumeCapCalculator.swift
   No dependencies. Exposed as window.UTRank (browser) and module.exports (tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) { module.exports = factory(); }
  else { root.UTRank = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TIERS = ["bronze", "silver", "gold", "platinum", "diamond", "champion", "ultralegend"];

  var CONFIG = {
    metersPerKm: 100,                                  // equivalentDistance.metersPerKm
    raceTierMaxKm: [30, 60, 100, 150, 220, 350],       // bronze..champion exclusive upper edges
    levelTierMax: [350, 450, 550, 650, 750, 850],      // level-score exclusive upper edges
    backyardKmPerLoop: 6.7,
    backyardAnchors: [[6, 350], [12, 420], [24, 520], [36, 640], [48, 740], [60, 820], [75, 880], [100, 950]],
    divisionXP: { bronze: 500, silver: 900, gold: 1400, platinum: 2000, diamond: 2800, champion: 4400, ultralegend: null }
  };

  function equivalentKm(distanceKm, elevationGainM) {
    return distanceKm + elevationGainM / CONFIG.metersPerKm;
  }

  function tierFromLadder(value, edges) {
    for (var i = 0; i < edges.length; i++) { if (value < edges[i]) return TIERS[i]; }
    return TIERS[TIERS.length - 1];
  }

  function tierFromKm(eqKm) { return tierFromLadder(eqKm, CONFIG.raceTierMaxKm); }

  // LevelScoreCalculator.backyardLevelScore: linear interpolation, clamped to the end anchors.
  function backyardLevelScore(loops) {
    var a = CONFIG.backyardAnchors;
    if (loops <= a[0][0]) return a[0][1];
    if (loops >= a[a.length - 1][0]) return a[a.length - 1][1];
    for (var i = 1; i < a.length; i++) {
      if (loops <= a[i][0]) {
        var t = (loops - a[i - 1][0]) / (a[i][0] - a[i - 1][0]);
        return a[i - 1][1] + t * (a[i][1] - a[i - 1][1]);
      }
    }
    return a[a.length - 1][1];
  }

  function backyardTier(loops) { return tierFromLadder(backyardLevelScore(loops), CONFIG.levelTierMax); }

  // RaceTierCalculator: one entry point.
  function raceTier(input) {
    if (input.backyard) {
      var loops = Math.max(0, Math.round(input.loops || 0));
      return { tier: backyardTier(loops), equivalentKm: loops * CONFIG.backyardKmPerLoop, loops: loops, backyard: true };
    }
    var eq = equivalentKm(Number(input.distanceKm) || 0, Number(input.elevationGainM) || 0);
    return { tier: tierFromKm(eq), equivalentKm: eq, backyard: false };
  }

  // TaperProfile.forEffectiveKm
  function taperProfile(effectiveKm) {
    if (effectiveKm >= 100) return [0.80, 0.65, 0.50, 0.40, 0.30];
    if (effectiveKm >= 50) return [0.75, 0.55, 0.40, 0.28];
    if (effectiveKm >= 21) return [0.65, 0.37];
    return [0.45];
  }

  // VolumeCapCalculator.baseFraction / buildPhaseFraction
  function baseFraction(level, effectiveKm) {
    var f = { beginner: 0.25, intermediate: 0.18, advanced: 0.15, elite: 0.18 }[level];
    if (f === undefined) f = 0.18;
    if (effectiveKm >= 100) f += 0.08;
    return f;
  }
  function buildFraction(totalWeeks) {
    if (totalWeeks < 12) return 0.22;
    if (totalWeeks <= 20) return 0.18;
    return 0.16;
  }

  // PhaseDistributor.distribute (with a taper profile, the trail generator's path).
  function phaseSplit(totalWeeks, effectiveKm, level) {
    totalWeeks = Math.max(1, Math.round(totalWeeks));
    if (totalWeeks < 4) {
      return { base: Math.max(totalWeeks - 1, 1), build: 0, peak: 0, taper: 1 };
    }
    var profile = taperProfile(effectiveKm);
    var maxTaper = totalWeeks < 8 ? 2 : Math.floor(totalWeeks / 2);
    var taper = Math.min(profile.length, maxTaper);
    var remaining = totalWeeks - taper;
    var base = Math.max(Math.round(remaining * baseFraction(level, effectiveKm)), 1);
    var build = Math.max(Math.round(remaining * buildFraction(totalWeeks)), 1);
    var peak = Math.max(remaining - base - build, 1);
    return { base: base, build: build, peak: peak, taper: taper, taperFractions: profile.slice(0, taper) };
  }

  // Week bars for the demo: phase per week, relative volume with recovery weeks
  // (WeekSkeletonBuilder: cycle 3 for intermediate and up, 2 for beginners; none in taper
  // or on the last week before taper) and the taper fractions. The last week is race week.
  function weekBars(totalWeeks, effectiveKm, level) {
    var split = phaseSplit(totalWeeks, effectiveKm, level);
    var cycle = level === "beginner" ? 2 : 3;
    var weeks = [];
    var counter = 0;
    var nonTaper = split.base + split.build + split.peak;
    var i;
    for (i = 0; i < nonTaper; i++) {
      var phase = i < split.base ? "base" : (i < split.base + split.build ? "build" : "peak");
      counter += 1;
      var recovery = false;
      if (counter > cycle && i < nonTaper - 1) { recovery = true; counter = 0; }
      // Progressive load: ramps through base and build, holds high in peak.
      var ramp = 0.55 + 0.45 * Math.min(1, (i + 1) / Math.max(1, split.base + split.build));
      weeks.push({ phase: phase, volume: recovery ? ramp * 0.82 : ramp, recovery: recovery });
    }
    for (i = 0; i < split.taper; i++) {
      var last = i === split.taper - 1;
      weeks.push({ phase: last ? "race" : "taper", volume: split.taperFractions[i], recovery: false });
    }
    return weeks;
  }

  // SkipAdaptationCalculator demo: a single time skip changes nothing; a pattern eases next week.
  function skipDemo(mode, level) {
    if (mode === "pattern") {
      var factor = { beginner: 0.88, intermediate: 0.90, advanced: 0.93, elite: 0.95 }[level] || 0.90;
      return { nextWeekFactor: factor, key: "sk.024" };
    }
    return { nextWeekFactor: 1, key: "sk.039" };
  }

  return {
    TIERS: TIERS,
    CONFIG: CONFIG,
    equivalentKm: equivalentKm,
    tierFromKm: tierFromKm,
    backyardLevelScore: backyardLevelScore,
    backyardTier: backyardTier,
    raceTier: raceTier,
    phaseSplit: phaseSplit,
    weekBars: weekBars,
    skipDemo: skipDemo
  };
});
