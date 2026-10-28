/**
 * site-quiz.ts — which app questions the site's own quizzes use. Each id is a
 * question in src/data/app/questions.json; the question text, options and the
 * explanation come from the snapshot, never from here.
 */

/** /aviation-quiz: 15 questions, one from each lesson group, in the app's group order. */
export const SITE_QUIZ_IDS = [
  'how-wings-lift_q4', // How Flight Works
  'wings-flaps-slats_q4', // Anatomy of an Airplane
  'turbojets_q4', // Engines & Propulsion
  'callsigns-phonetic_q2', // In the Cockpit
  'runway-markings_q1', // Airports & Air Traffic Control
  'turbulence-jetstreams-contrails_q3', // Navigation & Weather
  'wright-brothers_q4', // Pioneers of Flight
  'wwi-aircraft-aces_q3', // Early Air Power
  'spitfire-hurricane_q4', // WWII in the Air
  'sound-barrier_q2', // The Jet Age
  'the-a380_q1', // Airliners & Airlines
  'sr-71-blackbird_q1', // Speed & Altitude Legends
  'how-helicopters-fly_q3', // Military Aviation
  'black-boxes_q1', // Safety & Lessons Learned
  'drones-evtols_q4', // Modern & Future Flight
] as const;

/** The home page's "Try one" sample. */
export const HOME_TRY_IDS = ['why-planes-stall_q1', 'airport-codes_q3', 'concorde_q3'] as const;
