/**
 * @fileoverview Psychometric domain constants, 6 MHQ dimensions, 24 assessment items,
 * standardized spectrum tiers (-100 to +200), evidence-informed guidance, and preset sample profiles.
 * @license MIT
 */

export const MHQ_DIMENSIONS = [
  {
    id: 'mood_outlook',
    title: 'Mood & Outlook',
    shortTitle: 'Mood',
    color: '#0f766e',
    description: 'Emotional balance, optimism, frustration tolerance, and capacity to regulate sadness or worry.',
    clinicalFocus: 'Affective stability, positive valence, and emotional buoyancy'
  },
  {
    id: 'social_self',
    title: 'Social Self',
    shortTitle: 'Social',
    color: '#0369a1',
    description: 'Quality of interpersonal connections, empathy, social confidence, and sense of belonging.',
    clinicalFocus: 'Relational safety, perceived support, and social engagement'
  },
  {
    id: 'drive_motivation',
    title: 'Drive & Motivation',
    shortTitle: 'Drive',
    color: '#4338ca',
    description: 'Sense of purpose, task initiation, intrinsic momentum, and capacity to experience reward.',
    clinicalFocus: 'Behavioral activation, goal pursuit, and agency'
  },
  {
    id: 'cognition',
    title: 'Cognition',
    shortTitle: 'Cognition',
    color: '#7e22ce',
    description: 'Sustained attention, working memory, mental clarity, and flexible decision-making.',
    clinicalFocus: 'Executive function, focus endurance, and cognitive bandwidth'
  },
  {
    id: 'adaptability_resilience',
    title: 'Adaptability & Resilience',
    shortTitle: 'Resilience',
    color: '#b45309',
    description: 'Stress recovery speed, adaptability to uncertainty, and composure during disruption.',
    clinicalFocus: 'Autonomic recovery, cognitive reappraisal, and coping flexibility'
  },
  {
    id: 'mind_body',
    title: 'Mind-Body Connection',
    shortTitle: 'Mind-Body',
    color: '#047857',
    description: 'Restorative sleep, daily physical energy, somatic tension awareness, and mind-body harmony.',
    clinicalFocus: 'Circadian vitality, somatic regulation, and physical restoration'
  }
];

export const MHQ_SCALE_ANCHORS = [
  { value: 1, label: '1 — Severe Distress', mhqHint: '-100' },
  { value: 2, label: '2 — Marked Difficulty', mhqHint: '-67' },
  { value: 3, label: '3 — Mild Strain', mhqHint: '-33' },
  { value: 4, label: '4 — Functional Baseline', mhqHint: '0' },
  { value: 5, label: '5 — Stable', mhqHint: '+40' },
  { value: 6, label: '6 — Positive', mhqHint: '+80' },
  { value: 7, label: '7 — Strong', mhqHint: '+120' },
  { value: 8, label: '8 — Very Strong', mhqHint: '+160' },
  { value: 9, label: '9 — Optimal / Thriving', mhqHint: '+200' }
];

export const MHQ_QUESTIONS = [
  // Mood & Outlook
  {
    id: 'mood_1',
    dimensionId: 'mood_outlook',
    prompt: 'Over the past two weeks, how steady and positive has your day-to-day emotional mood felt?',
    lowAnchor: 'Persistently overwhelmed or distressed',
    highAnchor: 'Consistently upbeat, grounded, and hopeful'
  },
  {
    id: 'mood_2',
    dimensionId: 'mood_outlook',
    prompt: 'How effectively are you able to keep anxious thoughts or worry from disrupting your daily calm?',
    lowAnchor: 'Worry dominates daily routines',
    highAnchor: 'Calm perspective even with uncertainty'
  },
  {
    id: 'mood_3',
    dimensionId: 'mood_outlook',
    prompt: 'How hopeful and constructive is your outlook regarding the next several months of your life?',
    lowAnchor: 'Bleak or hopeless outlook',
    highAnchor: 'Strong sense of possibility and optimism'
  },
  {
    id: 'mood_4',
    dimensionId: 'mood_outlook',
    prompt: 'How well do you regulate irritability or sudden frustration when minor obstacles occur?',
    lowAnchor: 'Frequent intense frustration or emotional reactivity',
    highAnchor: 'Measured, composed emotional responses'
  },

  // Social Self
  {
    id: 'social_1',
    dimensionId: 'social_self',
    prompt: 'How supported, understood, and connected do you feel by trusted friends, family, or peers?',
    lowAnchor: 'Deeply isolated or disconnected',
    highAnchor: 'Strongly supported and genuinely connected'
  },
  {
    id: 'social_2',
    dimensionId: 'social_self',
    prompt: 'How comfortable and authentic do you feel expressing your true thoughts in social settings?',
    lowAnchor: 'Severe social withdrawal or dread',
    highAnchor: 'Confident, authentic, and socially at ease'
  },
  {
    id: 'social_3',
    dimensionId: 'social_self',
    prompt: 'How capable do you feel of empathizing with others without becoming emotionally depleted?',
    lowAnchor: 'Emotionally numb or overwhelmed by others',
    highAnchor: 'Healthy empathy with balanced boundaries'
  },
  {
    id: 'social_4',
    dimensionId: 'social_self',
    prompt: 'How satisfied are you with the quality and mutual trust in your closest personal relationships?',
    lowAnchor: 'Chronic relational conflict or strain',
    highAnchor: 'Deeply fulfilling and trusting relationships'
  },

  // Drive & Motivation
  {
    id: 'drive_1',
    dimensionId: 'drive_motivation',
    prompt: 'How strong is your daily drive to start meaningful tasks without prolonged procrastination or inertia?',
    lowAnchor: 'Severe apathy or inability to initiate tasks',
    highAnchor: 'Consistent, self-directed momentum'
  },
  {
    id: 'drive_2',
    dimensionId: 'drive_motivation',
    prompt: 'How clear and energizing is your sense of personal purpose in work, study, or daily life?',
    lowAnchor: 'Complete lack of direction or meaning',
    highAnchor: 'Deeply purposeful and engaged'
  },
  {
    id: 'drive_3',
    dimensionId: 'drive_motivation',
    prompt: 'How much satisfaction or reward do you feel after completing goals or engaging in hobbies?',
    lowAnchor: 'Little to no pleasure or reward (anhedonia)',
    highAnchor: 'Genuine enjoyment and pride in progress'
  },
  {
    id: 'drive_4',
    dimensionId: 'drive_motivation',
    prompt: 'How consistently do you follow through on commitments even when enthusiasm temporarily dips?',
    lowAnchor: 'Frequently abandon commitments',
    highAnchor: 'Dependable follow-through and grit'
  },

  // Cognition
  {
    id: 'cognition_1',
    dimensionId: 'cognition',
    prompt: 'How well can you sustain focused concentration on complex reading, work, or problem-solving?',
    lowAnchor: 'Severe brain fog or inability to focus',
    highAnchor: 'Sharp, sustained deep concentration'
  },
  {
    id: 'cognition_2',
    dimensionId: 'cognition',
    prompt: 'How reliable is your short-term memory for appointments, conversations, and multi-step tasks?',
    lowAnchor: 'Frequent disruptive forgetfulness',
    highAnchor: 'Clear, reliable recall and organization'
  },
  {
    id: 'cognition_3',
    dimensionId: 'cognition',
    prompt: 'How clear and decisive do you feel when weighing options and making everyday decisions?',
    lowAnchor: 'Paralyzed by indecision or confusion',
    highAnchor: 'Crisp, confident, well-reasoned judgment'
  },
  {
    id: 'cognition_4',
    dimensionId: 'cognition',
    prompt: 'How flexibly can you shift strategies when plans change or new information emerges?',
    lowAnchor: 'Rigid thinking or mental shutdown under change',
    highAnchor: 'Agile, creative cognitive reframing'
  },

  // Adaptability & Resilience
  {
    id: 'resilience_1',
    dimensionId: 'adaptability_resilience',
    prompt: 'How quickly do you emotionally recover after an unexpected setback, criticism, or stressful event?',
    lowAnchor: 'Setbacks trigger prolonged distress',
    highAnchor: 'Rapid, grounded recovery and perspective'
  },
  {
    id: 'resilience_2',
    dimensionId: 'adaptability_resilience',
    prompt: 'How steady is your composure when juggling competing deadlines or acute pressure?',
    lowAnchor: 'Rapidly overwhelmed or panicked under stress',
    highAnchor: 'Calm prioritization under high pressure'
  },
  {
    id: 'resilience_3',
    dimensionId: 'adaptability_resilience',
    prompt: 'How willing are you to adapt routines and try constructive coping strategies during disruption?',
    lowAnchor: 'Avoidant or overwhelmed by routine shifts',
    highAnchor: 'Proactive, resilient adaptation'
  },
  {
    id: 'resilience_4',
    dimensionId: 'adaptability_resilience',
    prompt: 'How strongly do you trust your ability to navigate difficult life transitions?',
    lowAnchor: 'Feel helpless against external stressors',
    highAnchor: 'High self-efficacy and inner steadiness'
  },

  // Mind-Body Connection
  {
    id: 'mindbody_1',
    dimensionId: 'mind_body',
    prompt: 'How restorative and consistent has your sleep quality been over the past two weeks?',
    lowAnchor: 'Severe insomnia, non-restorative or fragmented sleep',
    highAnchor: 'Deep, consistent, refreshing sleep'
  },
  {
    id: 'mindbody_2',
    dimensionId: 'mind_body',
    prompt: 'How balanced is your physical energy level across morning, afternoon, and evening hours?',
    lowAnchor: 'Persistent exhaustion or severe fatigue',
    highAnchor: 'Vibrant, sustainable energy all day'
  },
  {
    id: 'mindbody_3',
    dimensionId: 'mind_body',
    prompt: 'How free are you from stress-related physical symptoms (muscle tension, headaches, stomach unease)?',
    lowAnchor: 'Frequent distressing somatic symptoms',
    highAnchor: 'Physically relaxed and comfortable'
  },
  {
    id: 'mindbody_4',
    dimensionId: 'mind_body',
    prompt: 'How tuned-in and responsive are you to your body’s signals for rest, movement, and nourishment?',
    lowAnchor: 'Disconnected from bodily needs or neglecting care',
    highAnchor: 'Attentive, sustainable self-care rhythms'
  }
];

export const MHQ_TIERS = [
  {
    id: 'clinical',
    label: 'Clinical',
    min: -100,
    max: -50,
    inclusiveMax: false,
    color: '#b91c1c',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    summary: 'Indicates substantial psychological distress or functional impairment across daily activities. Dedicated professional clinical evaluation and supportive care are strongly encouraged.'
  },
  {
    id: 'struggling',
    label: 'Struggling',
    min: -50,
    max: 0,
    inclusiveMax: false,
    color: '#c2410c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    summary: 'Reflects active strain beneath the functional baseline. Daily demands may feel draining; structured self-care, peer support, or counseling can accelerate recovery.'
  },
  {
    id: 'enduring',
    label: 'Enduring',
    min: 0,
    max: 50,
    inclusiveMax: false,
    color: '#b45309',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    summary: 'Indicates functional coping at or slightly above baseline, yet with modest psychological reserve when facing heightened stress.'
  },
  {
    id: 'managing',
    label: 'Managing',
    min: 50,
    max: 100,
    inclusiveMax: false,
    color: '#0369a1',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    summary: 'Demonstrates steady day-to-day functioning and generally positive wellbeing, with clear targeted opportunities to deepen resilience and vitality.'
  },
  {
    id: 'succeeding',
    label: 'Succeeding',
    min: 100,
    max: 150,
    inclusiveMax: false,
    color: '#0f766e',
    bgColor: '#f0fdfa',
    borderColor: '#99f6e4',
    summary: 'Reflects strong mental wellbeing, dependable emotional regulation, and constructive momentum across personal and cognitive domains.'
  },
  {
    id: 'thriving',
    label: 'Thriving',
    min: 150,
    max: 200,
    inclusiveMax: true,
    color: '#047857',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    summary: 'Indicates peak multi-dimensional flourishing, abundant psychological reserve, resilient stress recovery, and sustained vitality.'
  }
];

export const DIMENSION_RECOMMENDATIONS = {
  mood_outlook: {
    negative: 'Establish low-friction mood stabilization anchors: daily daylight exposure, gentle behavioral journaling to spot worry loops, and consider consulting a qualified therapist.',
    moderate: 'Strengthen emotional buoyancy with a 5-minute evening gratitude/reappraisal log and deliberate boundaries around doomscrolling or late-night stressors.',
    high: 'Maintain your strong affective stability and consider mentoring or sharing grounding practices that reinforce positive emotional contagion.'
  },
  social_self: {
    negative: 'Reduce isolation gradually through one predictable, low-pressure weekly check-in with a trusted person or supportive community group.',
    moderate: 'Deepen existing connections by scheduling intentional unhurried conversations and practicing open, honest check-ins with close allies.',
    high: 'Your relational network is a major protective asset; continue nurturing reciprocal trust and balanced interpersonal boundaries.'
  },
  drive_motivation: {
    negative: 'Focus on micro-activation rather than grand goals: select one 10-minute meaningful task each morning and celebrate completion to rebuild reward pathways.',
    moderate: 'Clarify weekly top-two priorities aligned with personal values and remove friction around starting deep-focus sessions.',
    high: 'Channel your strong intrinsic drive sustainably by pairing ambitious sprints with deliberate recovery blocks to prevent burnout.'
  },
  cognition: {
    negative: 'Protect cognitive bandwidth by externalizing memory onto checklists, minimizing context-switching, and discussing persistent brain fog with a healthcare provider.',
    moderate: 'Use 45–60 minute single-task focus blocks separated by brief screen-free resets to sharpen sustained attention and recall.',
    high: 'Leverage your crisp executive clarity for strategic planning while safeguarding sleep and focus hygiene.'
  },
  adaptability_resilience: {
    negative: 'Build physiological down-regulation skills first (paced breathing, progressive muscle relaxation) and break unexpected disruptions into immediate 24-hour controllable steps.',
    moderate: 'Practice proactive stress inoculation—pre-planning "if-then" contingencies for recurring work or life pressures.',
    high: 'Your strong recovery capacity anchors overall stability; continue periodic reflection to keep coping strategies flexible across new contexts.'
  },
  mind_body: {
    negative: 'Prioritize foundational somatic restoration: consistent wake/sleep anchors, hydration, gentle daily movement, and medical review for persistent fatigue or sleep disruption.',
    moderate: 'Audit afternoon caffeine/screen habits and build a 20-minute physical movement or stretching buffer between work and evening wind-down.',
    high: 'Your sleep, energy, and somatic rhythms strongly support mental vitality; keep protecting these daily biological foundations.'
  }
};

export const SAMPLE_PROFILES = {
  thriving: {
    key: 'thriving',
    label: 'Thriving Profile (~+168)',
    metadata: {
      participantAlias: 'Sample — Maya Lin',
      ageGroup: '25-34',
      notes: 'Simulated high-flourishing profile demonstrating balanced resilience and vitality.'
    },
    responses: {
      mood_1: 8, mood_2: 8, mood_3: 9, mood_4: 8,
      social_1: 9, social_2: 8, social_3: 8, social_4: 9,
      drive_1: 8, drive_2: 9, drive_3: 8, drive_4: 8,
      cognition_1: 8, cognition_2: 8, cognition_3: 9, cognition_4: 8,
      resilience_1: 8, resilience_2: 8, resilience_3: 9, resilience_4: 8,
      mindbody_1: 8, mindbody_2: 8, mindbody_3: 8, mindbody_4: 9
    }
  },
  managing: {
    key: 'managing',
    label: 'Managing Profile (~+73)',
    metadata: {
      participantAlias: 'Sample — Jordan Patel',
      ageGroup: '35-44',
      notes: 'Simulated steady baseline profile with mild cognition and sleep optimization opportunities.'
    },
    responses: {
      mood_1: 6, mood_2: 6, mood_3: 6, mood_4: 5,
      social_1: 7, social_2: 6, social_3: 6, social_4: 6,
      drive_1: 6, drive_2: 6, drive_3: 6, drive_4: 6,
      cognition_1: 5, cognition_2: 6, cognition_3: 5, cognition_4: 6,
      resilience_1: 6, resilience_2: 5, resilience_3: 6, resilience_4: 6,
      mindbody_1: 5, mindbody_2: 5, mindbody_3: 6, mindbody_4: 6
    }
  },
  struggling: {
    key: 'struggling',
    label: 'Struggling Profile (~-31)',
    metadata: {
      participantAlias: 'Sample — Samira Vance',
      ageGroup: '18-24',
      notes: 'Simulated elevated-strain profile highlighting recovery, sleep, and emotional support priorities.'
    },
    responses: {
      mood_1: 3, mood_2: 2, mood_3: 3, mood_4: 3,
      social_1: 4, social_2: 3, social_3: 4, social_4: 3,
      drive_1: 3, drive_2: 3, drive_3: 2, drive_4: 4,
      cognition_1: 3, cognition_2: 4, cognition_3: 3, cognition_4: 3,
      resilience_1: 2, resilience_2: 3, resilience_3: 3, resilience_4: 3,
      mindbody_1: 2, mindbody_2: 3, mindbody_3: 3, mindbody_4: 4
    }
  }
};
