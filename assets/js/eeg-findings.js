/**
 * EEG Findings Module
 * Handles the display and management of EEG pattern findings and explanations
 */

// Findings data by pattern type
const findingsData = {
  // Normal patterns
  'pdr': {
    title: 'Posterior Dominant Rhythm (Alpha)',
    description: 'Normal alpha rhythm seen in awake, relaxed patients with eyes closed. Typically 8-13 Hz, maximal in the posterior regions.',
    clinical: 'Normal finding in awake patients.',
    acns: 'Consistent with a normal posterior dominant rhythm at 8-13 Hz.'
  },
  
  // Slowing patterns
  'mildSlowing': {
    title: 'Mild Diffuse Slowing',
    description: 'Mild slowing of background rhythm, predominantly in the theta range (4-7 Hz).',
    clinical: 'May be seen in mild encephalopathy, drowsiness, medication effect, or advanced age.',
    acns: 'Mild generalized slowing in theta range.'
  },
  'moderateSlowing': {
    title: 'Moderate Diffuse Slowing',
    description: 'Moderate slowing of background rhythm, with mixed theta and delta activity (1-7 Hz).',
    clinical: 'Seen in moderate encephalopathy of various causes including metabolic disorders, infection, or toxic-metabolic conditions.',
    acns: 'Moderate generalized slowing with theta and delta activity.'
  },
  'severeSlowing': {
    title: 'Severe Diffuse Slowing',
    description: 'Severe slowing of background rhythm, predominantly in delta range (1-3 Hz).',
    clinical: 'Indicates severe encephalopathy, often seen in coma, severe metabolic disturbances, or structural lesions.',
    acns: 'Severe generalized slowing with predominant delta activity.'
  },
  'focalSlowing': {
    title: 'Focal Slowing (LRDA)',
    description: 'Lateralized Rhythmic Delta Activity (LRDA): Rhythmic delta waves (1-3 Hz) in a focal area, in this case the left temporal region.',
    clinical: 'May indicate focal structural lesion, post-ictal state, or focal cortical irritation. Can be a precursor to seizures.',
    acns: 'Left temporal LRDA at 1-3 Hz.'
  },
  'generalizedSlowing': {
    title: 'Generalized Rhythmic Slowing (GRDA)',
    description: 'Generalized Rhythmic Delta Activity (GRDA): Rhythmic delta waves (1-3 Hz) occurring synchronously across all regions.',
    clinical: 'May be seen in toxic-metabolic encephalopathy, sedation, or as an abnormal variant. Can be a precursor to generalized seizures in some cases.',
    acns: 'GRDA at 2-3 Hz, generalized distribution.'
  },

  // Epileptiform patterns
  'spikes': {
    title: 'Epileptiform Spikes',
    description: 'Sharp waveforms with pointed peaks and duration <70ms. These are left temporal in distribution.',
    clinical: 'Strongly associated with epilepsy. Left temporal spikes suggest left temporal lobe epilepsy.',
    acns: 'Left temporal spikes, sporadic.'
  },
  'sharpWaves': {
    title: 'Sharp Waves',
    description: 'Sharply contoured waveforms with duration 70-200ms. These are right temporal in distribution.',
    clinical: 'Associated with epilepsy. Right temporal sharp waves suggest right temporal lobe epilepsy.',
    acns: 'Right temporal sharp waves, sporadic.'
  },
  'lpds': {
    title: 'Lateralized Periodic Discharges (LPDs)',
    description: 'Periodic lateralized epileptiform discharges occurring at regular intervals (typically 0.5-2 Hz).',
    clinical: 'Associated with acute focal cerebral lesions, commonly seen in stroke, herpes encephalitis, or tumors. May be associated with clinical seizures.',
    acns: 'Left temporal LPDs at approximately 1 Hz.'
  },
  'seizure': {
    title: 'Seizure Activity',
    description: 'Evolving rhythmic activity with changes in frequency, distribution, and amplitude over time.',
    clinical: 'Represents electrographic seizure activity originating from the right temporal region.',
    acns: 'Right temporal electrographic seizure with evolution in frequency, morphology, and amplitude.'
  },
  'spikeWave3Hz': {
    title: '3Hz Spike-and-Wave',
    description: 'Regular 3Hz spike-and-wave discharges with generalized distribution.',
    clinical: 'Classic pattern of absence epilepsy. Associated with absence (petit mal) seizures characterized by brief lapses of awareness.',
    acns: 'Generalized 3Hz spike-and-wave discharges.'
  },
  
  // Artifacts
  'eyeBlinks': {
    title: 'Eye Blink Artifacts',
    description: 'High amplitude waveforms seen primarily in the frontopolar leads (Fp1, Fp2).',
    clinical: 'Normal physiologic finding. Not associated with pathology.',
    acns: 'Eye blink artifacts present in frontopolar leads.'
  },
  'chewing': {
    title: 'Chewing (Muscle) Artifacts',
    description: 'High frequency, irregular activity that typically affects temporal leads.',
    clinical: 'Normal artifact caused by muscle activity during chewing or jaw movement.',
    acns: 'Muscle artifact consistent with chewing/jaw movement.'
  },
  'sweatArtifact': {
    title: 'Sweat Artifact',
    description: 'Slow, high-amplitude baseline shifts affecting multiple leads.',
    clinical: 'Normal physiologic artifact caused by sweating. May obscure underlying cerebral activity.',
    acns: 'Sweat artifact present.'
  },
  'sixtyHzArtifact': {
    title: '60Hz Artifact',
    description: 'Fast, regular oscillations at 60Hz caused by electrical interference.',
    clinical: 'Technical artifact caused by poor grounding or electrical interference. Not associated with cerebral activity.',
    acns: '60Hz artifact present, suggesting electrical interference.'
  },
  'ecgArtifact': {
    title: 'ECG Artifact',
    description: 'Regular waveforms corresponding to cardiac electrical activity.',
    clinical: 'Normal physiologic artifact representing cardiac electrical activity detected in EEG.',
    acns: 'ECG artifact present.'
  },
  'pulseArtifact': {
    title: 'Pulse Artifact',
    description: 'Rhythmic oscillations that occur shortly after each QRS complex of the ECG.',
    clinical: 'Normal physiologic artifact representing pulsation of cerebral arteries. Appears as a brief waveform that follows each heartbeat with a small delay, typically more prominent in posterior leads near major blood vessels.',
    acns: 'Pulse artifact present, predominantly in posterior channels.'
  },

  // Movement artifact
  Movement: {
    name: "Movement Artifact",
    description: "Irregular high-amplitude waveforms caused by patient movement during recording.",
    characteristics: [
      "Random distribution across multiple channels",
      "Variable amplitude and morphology",
      "Intermittent appearance with abrupt onset and offset",
      "Often obscures underlying brain activity",
      "May affect any lead, but often more prominent in the leads over the moving body part"
    ],
    significance: "A normal artifact that occurs when patients move during EEG recording. Not pathological, but can interfere with interpretation if excessive.",
    differential: [
      "Chewing artifacts (more rhythmic and primarily affect temporal leads)",
      "Seizure activity (more organized rhythmic pattern with evolution)",
      "Electrode artifacts (usually confined to individual electrodes)"
    ],
    examples: []
  }
};

/**
 * Initialize the findings display container
 * @param {HTMLElement} container - The container element for findings
 */
export function initializeFindingsDisplay(container) {
  // Create close button event listener
  const closeButton = container.querySelector('.findings-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      hideFindingsDisplay(container);
    });
  }
  
  // Initially hide the container
  hideFindingsDisplay(container);
}

/**
 * Show the findings display for a specific pattern
 * @param {HTMLElement} container - The container element for findings
 * @param {string} patternKey - The key for the pattern to display
 */
export function showFindingsForPattern(container, patternKey) {
  const findings = findingsData[patternKey];
  if (!findings) {
    console.warn(`No findings data available for pattern: ${patternKey}`);
    return;
  }
  
  // Update the content
  const contentContainer = container.querySelector('.findings-content');
  if (contentContainer) {
    contentContainer.innerHTML = `
      <h3>${findings.title}</h3>
      <div class="findings-section">
        <h4>Description</h4>
        <p>${findings.description}</p>
      </div>
      <div class="findings-section">
        <h4>Clinical Significance</h4>
        <p>${findings.clinical}</p>
      </div>
      <div class="findings-section">
        <h4>ACNS Terminology</h4>
        <p>${findings.acns}</p>
      </div>
    `;
  }
  
  // Show the container
  showFindingsDisplay(container);
}

/**
 * Show the findings display container
 * @param {HTMLElement} container - The container element for findings
 */
export function showFindingsDisplay(container) {
  container.style.display = 'block';
  // Add a small delay before adding the visible class for transition effect
  setTimeout(() => {
    container.classList.add('visible');
  }, 10);
}

/**
 * Hide the findings display container
 * @param {HTMLElement} container - The container element for findings
 */
export function hideFindingsDisplay(container) {
  container.classList.remove('visible');
  // Wait for transition to complete before hiding
  setTimeout(() => {
    container.style.display = 'none';
  }, 300); // Match this to the CSS transition duration
}

/**
 * Get the pattern key from a button element
 * @param {HTMLElement} button - The button element
 * @returns {string} The pattern key
 */
export function getPatternKeyFromButton(button) {
  // Extract pattern key from button ID (e.g., "pdrToggle" -> "pdr")
  const buttonId = button.id;
  if (buttonId.includes('pdr')) return 'pdr';
  if (buttonId.includes('eyeBlinks')) return 'eyeBlinks';
  if (buttonId.includes('chewing')) return 'chewing';
  if (buttonId.includes('sweatArtifact')) return 'sweatArtifact';
  if (buttonId.includes('sixtyHzArtifact')) return 'sixtyHzArtifact';
  if (buttonId.includes('ecgArtifact')) return 'ecgArtifact';
  if (buttonId.includes('pulseArtifact')) return 'pulseArtifact';
  if (buttonId.includes('mildSlowing')) return 'mildSlowing';
  if (buttonId.includes('moderateSlowing')) return 'moderateSlowing';
  if (buttonId.includes('severeSlowing')) return 'severeSlowing';
  if (buttonId.includes('focalSlowing')) return 'focalSlowing';
  if (buttonId.includes('generalizedSlowing')) return 'generalizedSlowing';
  if (buttonId.includes('spikes')) return 'spikes';
  if (buttonId.includes('sharpWaves')) return 'sharpWaves';
  if (buttonId.includes('lpds')) return 'lpds';
  if (buttonId.includes('seizure')) return 'seizure';
  if (buttonId.includes('spikeWave3Hz')) return 'spikeWave3Hz';
  
  // Default fallback
  return null;
}

/**
 * Attach event listeners to pattern buttons
 * @param {HTMLElement} findingsContainer - The container for findings display
 */
export function attachFindingsListeners(findingsContainer) {
  // Find all pattern toggle buttons
  const patternButtons = document.querySelectorAll('.pattern-toggle');
  
  patternButtons.forEach(button => {
    button.addEventListener('click', () => {
      const patternKey = getPatternKeyFromButton(button);
      if (patternKey) {
        showFindingsForPattern(findingsContainer, patternKey);
      }
    });
  });
} 