/** English strings. {name} placeholders are filled by format(). */
export const en = {
  // App
  appName: 'Saans',
  tagline: 'Breathe easier through winter smog',
  skipToContent: 'Skip to main content',
  language: 'Language',
  largeText: 'Large text',
  disclaimer: 'Not medical advice. For symptoms, see a doctor. In an emergency, call 112.',
  dataLabel: 'Modelled data (CAMS via Open-Meteo), not station readings.',
  attribution:
    'Air quality: Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo, CC BY 4.0.',
  privacyNote: 'Your household details stay in this browser. Saans never stores them on a server.',

  // Location
  locationHeading: '1. Where are you?',
  searchLabel: 'Search a city',
  searchPlaceholder: 'e.g. Delhi, Noida, Lucknow',
  searchButton: 'Search',
  useMyLocation: 'Use my location',
  myLocation: 'My location',
  quickCities: 'Quick picks',
  noPlaceFound: 'No place found for "{query}". Check the spelling or try a nearby city.',
  searchTooShort: 'Type at least 2 letters.',
  searchInvalid: 'Use letters only, for example "Delhi".',
  geoDenied: 'Location permission was denied. Search for your city instead.',
  geoUnavailable: 'Your browser could not share a location. Search for your city instead.',
  loading: 'Loading…',
  errorGeneric: 'Something went wrong. Please try again.',
  errorRateLimited: 'Too many requests. Please wait a minute and try again.',
  errorUpstream: 'The air quality service is not responding. Please try again shortly.',
  chooseResult: 'Choose a place',

  // Air
  airHeading: 'Air right now in {place}',
  indianAqi: 'Indian AQI (CPCB)',
  usAqi: 'US AQI',
  dominant: 'Main pollutant: {pollutant}',
  aqiNote:
    'Indian AQI uses 24-hour averages (8-hour for ozone and CO), computed by Saans from CPCB breakpoints.',
  usAqiNote: 'US AQI as reported by Open-Meteo.',
  pollutantsHeading: 'Pollutants now (µg/m³)',
  forecastHeading: 'PM2.5 forecast, next 72 hours',
  forecastTable: 'Show forecast as a table',
  time: 'Time',
  wind: 'Wind',
  windValue: '{speed} km/h from {dir}',
  calmWindNote: 'Low wind traps smog near the ground. Stronger wind usually means cleaner air.',
  aqiUnavailable: 'Not enough data to compute the Indian AQI.',

  // Bands
  band_good: 'Good',
  band_satisfactory: 'Satisfactory',
  band_moderate: 'Moderate',
  band_poor: 'Poor',
  band_very_poor: 'Very Poor',
  band_severe: 'Severe',
  health_good: 'Minimal impact.',
  health_satisfactory: 'Minor breathing discomfort for sensitive people.',
  health_moderate:
    'Breathing discomfort for people with lung or heart disease, children and older adults.',
  health_poor: 'Breathing discomfort for most people on long exposure.',
  health_very_poor: 'Respiratory illness on long exposure.',
  health_severe: 'Affects healthy people and seriously affects people with existing disease.',

  // Profile
  profileHeading: '2. Your household',
  profileIntro:
    'A few details make the plan fit your family. Nothing here leaves your browser except for the calculation.',
  people: 'People at home',
  sensitiveLegend: 'Anyone more sensitive to smog?',
  hasChild: 'A child',
  hasElderly: 'An older adult (60+)',
  hasBreathingCondition: 'Someone with a breathing condition',
  commuteMode: 'Main commute',
  commuteKm: 'Commute distance, one way (km)',
  cookingFuel: 'Cooking fuel',
  heating: 'Heating',
  hasPurifier: 'We have an air purifier',
  hasAc: 'We have an AC',
  usesGenerator: 'We run a diesel generator during power cuts',
  roomSizeM2: 'Main room size (m²)',
  roomSizeHint: 'A 12 x 12 ft room is about 13 m².',
  wfhDays: 'Work-from-home days per week',
  budget: 'Budget for air fixes',
  usualOutdoorHour: 'Usual time for a walk, exercise or play (hour, 24h)',
  saveProfile: 'Make my plan',
  sampleFamily: 'Try a sample family',
  profileSaved: 'Saved in this browser.',
  clearProfile: 'Clear saved details',

  mode_none: 'No commute',
  mode_walk: 'Walk',
  mode_cycle: 'Cycle',
  mode_two_wheeler: 'Two-wheeler',
  mode_car: 'Car (alone)',
  mode_carpool: 'Carpool',
  mode_auto: 'Auto-rickshaw',
  mode_bus: 'Bus',
  mode_metro: 'Metro',
  fuel_lpg: 'LPG',
  fuel_png: 'Piped gas (PNG)',
  fuel_induction: 'Induction / electric',
  fuel_biomass: 'Wood, dung or crop waste',
  fuel_kerosene: 'Kerosene',
  heat_none: 'None',
  heat_electric: 'Electric heater',
  heat_gas: 'Gas heater',
  heat_coal_wood: 'Coal or wood (angithi)',
  budget_low: 'Low',
  budget_medium: 'Medium',
  budget_high: 'High',

  // Plan
  planHeading: "3. Today's plan",
  planSourceAi: 'AI explanation (Gemini)',
  planSourceRules: 'Rule-based text',
  planSourceNote: 'Times and numbers come from Saans calculations. {source} only words them.',
  bestWindow: 'Cleanest hour',
  worstWindow: 'Dirtiest hour',
  planEmpty: 'Choose a place and fill in your household to see your plan.',

  outdoor_best:
    'Best time to go out or exercise: {time} (PM2.5 about {pm25} µg/m³, the cleanest hour).',
  outdoor_light_only:
    'If you need to go out, go at {time} (PM2.5 about {pm25} µg/m³). Keep it to a light walk, no running.',
  outdoor_indoor_only:
    'Even the cleanest hour ({time}, PM2.5 about {pm25} µg/m³) is Severe. Exercise indoors today.',
  windows_open_ok: 'The air is clean enough to keep windows open today.',
  windows_air_out:
    'Keep windows shut. Air out for 10 minutes around {time}, the cleanest hour, to clear cooking fumes and stale air.',
  mask_none: 'No mask needed outdoors today.',
  mask_sensitive:
    'Children, older adults and anyone with a breathing condition should wear a well-fitted N95 outdoors.',
  mask_all:
    'Everyone should wear a well-fitted N95 or FFP2 mask outdoors. Cloth and surgical masks do little against PM2.5.',
  mask_stay_in:
    'Severe air. Stay indoors as much as you can. If you go out, wear a well-fitted N95. Children and older adults should stay in.',
  commute_active:
    'Walking or cycling {km} km in this air means breathing hard in smog. Wear an N95, use quieter roads, or take the metro or bus today.',
  commute_two_wheeler:
    'On a two-wheeler you breathe traffic exhaust directly. Wear an N95 under the helmet and avoid peak traffic if you can.',
  commute_car:
    'In the car, keep windows up and set the AC to recirculate. Replace an old cabin filter.',
  commute_public:
    'Good choice: public transport keeps cars off the road. Wear an N95 while walking to and from the stop.',
  commute_wfh: 'The air is very poor. If you can, make today one of your work-from-home days.',
  cooking_clean: 'Induction adds little smoke. Still use a lid and run the exhaust when frying.',
  cooking_gas:
    'Cook with lids on, run the exhaust or chimney, and skip deep frying on bad-air days.',
  cooking_solid_fuel:
    'Wood, dung or kerosene smoke is the biggest indoor polluter. Cook outside or under a chimney if you can, and keep children away from the smoke. LPG is far cleaner.',
  heating_coal_danger:
    'Never burn coal or wood (angithi) in a closed room. It gives off carbon monoxide, which can kill in sleep. Use an electric heater instead.',
  cleaning_wet:
    'Clean with a wet mop and damp cloth. Dry sweeping and dusting throw fine dust back into the air.',
  no_burning:
    'Skip incense, mosquito coils and candles on bad-air days. Never burn leaves or garbage.',

  // Impact
  impactHeading: '4. What your choices change',
  doseHeadline: "This plan cuts today's PM2.5 dose by about {percent}%",
  doseDetail:
    'About {baseline} µg inhaled if you change nothing, {plan} µg with the plan (one adult, next 24 hours).',
  doseByPlace: 'Where the dose comes from',
  place_home: 'Home',
  place_work: 'Work',
  place_commute: 'Commute',
  place_outdoor: 'Outdoors',
  baseline: 'Change nothing',
  withPlan: 'With the plan',
  howCalculated: 'How this is calculated',
  doseFormula: 'Dose = PM2.5 you breathe x breathing rate x hours, added up hour by hour.',
  indoorFormula: 'Indoor PM2.5 = (P x a x Outdoor + S/V) / (a + k + CADR/V)',
  doseAssumptions:
    'Change nothing: windows open 08:00 to 20:00, no purifier, your usual outdoor hour. With the plan: windows shut, purifier on if you have one, outdoor time moved to the cleanest hour, car air on recirculate.',
  confidence_high: 'High confidence',
  confidence_medium: 'Medium confidence',
  confidence_low: 'Low confidence (assumption)',
  sources: 'Sources and assumptions',
  hacksHeading: 'Low-cost indoor hacks',
  hack_close_windows: 'Keep windows shut during smog hours',
  hack_close_windows_detail:
    'Indoor PM2.5 goes from about {before} to {after} µg/m³ ({percent}% lower). Shutting windows alone helps less than most people think.',
  hack_run_purifier: 'Run your purifier in the room you use most',
  hack_run_purifier_detail:
    'About {before} → {after} µg/m³ ({percent}% lower) with the doors shut.',
  hack_fan_filter: 'Make a DIY fan filter',
  hack_fan_filter_detail:
    'Tape a MERV-13 filter to the back of a box or table fan. Estimated {before} → {after} µg/m³ ({percent}% lower).',
  hack_no_incense: 'Skip incense on bad-air days',
  hack_no_incense_detail:
    'One stick can add about {avoided} µg/m³ to a closed room while it burns.',
  hack_cook_smart: 'Exhaust on, lid on',
  hack_cook_smart_detail:
    'Running the exhaust while frying keeps about {avoided} µg/m³ out of a closed home.',
  hack_wet_mop: 'Wet mop instead of sweeping',
  hack_wet_mop_detail:
    'Stops settled dust going back into the air. No number here: the evidence is thin.',
  altHeading: 'One sustainable switch',
  alt_commute: 'Switch from {from} to {to} for your {km} km commute',
  alt_commute_detail:
    'Saves about {gramsPerDay} g of CO2 a day, {kgPerWeek} kg a week ({percent}% less). Fewer cars also means less exhaust and road dust where you live.',
  alt_generator: 'Use a battery inverter instead of the diesel generator',
  alt_generator_detail:
    'CO2 is about the same ({dieselKg} vs {inverterKg} kg for {kwh} kWh), because the grid is coal heavy. The real gain is no diesel smoke at your door during smog hours.',
  alt_cooking_fuel: 'Move from wood or kerosene to LPG or induction',
  alt_cooking_fuel_detail:
    'Solid fuel smoke indoors is often worse than the smog outside. Ask about subsidised LPG connections under PM Ujjwala Yojana.',
  alt_walk_errands: 'Walk or cycle for errands under 2 km',
  alt_walk_errands_detail:
    'Short car trips pollute the most per km because the engine is still cold.',

  // Chat
  chatHeading: '5. Ask Saans',
  chatIntro:
    'Ask about today’s air, the best time to go out, masks, indoor air or cleaner commutes.',
  chatLabel: 'Your question',
  chatPlaceholder: 'e.g. Can my child play outside at 5 pm today?',
  chatSend: 'Ask',
  chatThinking: 'Saans is checking the data…',
  chatNeedsPlace: 'Choose a place first so Saans can look up your air.',
  chatTooLong: 'Please keep questions under 500 characters.',
  chatEmpty: 'Type a question first.',
  you: 'You',
  saans: 'Saans',
  traceButton: 'How Saans answered',
  traceSentToGemini: 'Context sent to Gemini (no personal details)',
  traceToolCall: 'Tool call: {name}',
  traceToolResult: 'Result',
  traceVerified: 'Every number in this answer was found in the tool results.',
  traceUnverified:
    'This answer has a number that was not in the tool results: {numbers}. Treat it with care.',
  traceSourceGemini: 'Answered by Gemini using Saans tools',
  traceSourceRules: 'Rule-based answer (Gemini not used)',
  chat_fallback_note:
    'Gemini is unavailable right now, so this is a rule-based answer from Saans calculations.',
  chat_outdoor:
    'The cleanest hour in the next 24 hours is {time}, with PM2.5 around {pm25} µg/m³ ({band}). {advice}',
  chat_at_hour: 'At {time}, PM2.5 is forecast at about {pm25} µg/m³ ({band}).',
  chat_mask: 'The Indian AQI is {aqi} ({band}). {advice}',
  chat_windows: '{advice}',
  chat_purifier: '{title}: {detail}',
  chat_commute: '{advice} {alt}',
  chat_aqi:
    'The Indian AQI in {place} is {aqi} ({band}), mainly from {pollutant}. PM2.5 now is about {pm25} µg/m³. The cleanest hour today is {time}.',
  chat_general:
    'Today in {place}: Indian AQI {aqi} ({band}). Cleanest hour: {time}. Your plan cuts today’s PM2.5 dose by about {percent}%.',
  safety_emergency:
    'This could be a medical emergency. Call 112 now or go to the nearest hospital. Trouble breathing, chest pain, bluish lips or confusion need a doctor right away. Saans cannot give medical advice.',
  safety_refusal:
    'I can only help with air quality, smog and cleaner daily routines. Try asking about today’s air, the best time to go out, masks, indoor air or commutes.',
  safety_medical:
    'I can’t give medical advice. For symptoms, please see a doctor. I can help with lowering smog exposure at home and outside.',

  pollutant_pm2_5: 'PM2.5',
  pollutant_pm10: 'PM10',
  pollutant_no2: 'NO₂',
  pollutant_o3: 'Ozone',
  pollutant_so2: 'SO₂',
  pollutant_co: 'CO',

  footerSource: 'Source code',
  footerMethod: 'Method and sources in the README',
} as const;

export type MessageKey = keyof typeof en;
