/**
 * EEG Sleep Waveform Integration
 * Integrates with the main EEG Waveform Demo to provide sleep features
 */

class EEGSleepModule {
  constructor(mainDemo) {
    this.mainDemo = mainDemo;
    this.isActive = false;
    this.originalLeads = null; // To store original montage
    
    // Check if the main demo is properly initialized
    if (!this.mainDemo) {
      console.error("Sleep module: Main demo not provided to constructor");
      return;
    }
    
    // Ensure mainDemo has required properties
    if (!this.mainDemo.waveforms) {
      console.error("Sleep module: Main demo missing waveforms property");
      this.mainDemo.waveforms = {};
    }
    
    console.log("Sleep module: Constructor initialized with main demo", 
                "Active waveforms:", Array.from(this.mainDemo.activeWaveforms || []));
    
    // Define sleep montage with central leads replacing temporal leads
    this.sleepMontage = [
      { name: 'Fp1-F7', color: '#0000ff', region: 'frontal', ampFactor: 0.7 },  // Left frontal - Blue
      { name: 'F7-C3', color: '#0000ff', region: 'frontal-central', ampFactor: 0.75 },   // Left frontal-central
      { name: 'C3-P3', color: '#0000ff', region: 'central-posterior' }, // Left central-posterior
      { name: 'P3-O1', color: '#0000ff', region: 'posterior' }, // Left posterior
      { name: 'Fp2-F8', color: '#ff0000', region: 'frontal', ampFactor: 0.7 },  // Right frontal - Red
      { name: 'F8-C4', color: '#ff0000', region: 'frontal-central', ampFactor: 0.75 },   // Right frontal-central
      { name: 'C4-P4', color: '#ff0000', region: 'central-posterior' }, // Right central-posterior
      { name: 'P4-O2', color: '#ff0000', region: 'posterior' }  // Right posterior
    ];
    
    // Setup sleep-specific waveforms
    this.setupSleepWaveforms();
    this.setupTransitionCapabilities();
  }
  
  /**
   * Setup sleep-specific waveform parameters
   */
  setupSleepWaveforms() {
    if (!this.mainDemo || !this.mainDemo.waveforms) {
      console.error("Main demo not properly initialized");
      return;
    }
    
    // Vertex sharp waves - sharp waves that occur in central regions during drowsiness/N1
    this.mainDemo.waveforms.vertexWaves = {
      custom: true,
      color: '#FF3300',
      description: 'Vertex Waves',
      draw: (x, centerY, leadName, timePosition) => {
        // Only affect central leads
        if (!leadName) return centerY;
        
        // Determine which leads show vertex waves and their polarity
        let polarity = 0;
        let amplitude = 0;
        
        // Central leads show vertex waves with phase reversal
        if (leadName === 'F7-C3' || leadName === 'F8-C4') {
          polarity = -1; // Downward in frontocentral leads
          amplitude = 1000;
        } else if (leadName === 'C3-P3' || leadName === 'C4-P4') {
          polarity = 1; // Upward in centroparietal leads (phase reversal)
          amplitude = 1000;
        } else {
          return centerY; // No effect on other leads
        }
        
        // Create vertex waves every ~1 second
        const waveInterval = 1.0 + (Math.sin(timePosition * 0.3) * 0.2); // 0.8-1.2 second variability
        const waveTime = Math.floor(timePosition / waveInterval) * waveInterval;
        const timeFromWave = timePosition - waveTime;
        
        // Vertex wave duration is ~200ms
        const waveDuration = 0.2;
        
        // Check if we're within a vertex wave window
        if (timeFromWave < waveDuration) {
          // Calculate normalized position within the wave
          const normalizedTime = timeFromWave / waveDuration;
          
          // Create the sharp waveform - sharper rising phase, slower falling phase
          let waveAmplitude;
          if (normalizedTime < 0.3) {
            // Sharp component (first 30% of the wave)
            waveAmplitude = Math.sin(normalizedTime * Math.PI / 0.3) * amplitude * polarity;
          } else {
            // Slower return to baseline (remaining 70%)
            waveAmplitude = Math.sin(Math.PI / 2 + (normalizedTime - 0.3) * Math.PI / 0.7) * amplitude * polarity * 0.5;
          }
          
          return centerY + waveAmplitude;
        }
        
        return centerY; // No effect outside wave window
      },
      priority: 10 // Higher priority than background rhythms
    };
    
    // Sleep spindles (12-14 Hz bursts) - characteristic of N2 sleep
    this.mainDemo.waveforms.sleepSpindles = {
      custom: true,
      color: '#00AAFF',
      description: 'Sleep Spindles',
      draw: (x, centerY, leadName, timePosition) => {
        // Only affect central and frontocentral leads
        if (!leadName) return centerY;
        
        // Sleep spindles are maximal in central regions
        let amplitudeScale = 0;
        if (leadName === 'C3-P3' || leadName === 'C4-P4') {
          amplitudeScale = 1.0; // Full amplitude in central leads
        } else if (leadName === 'F7-C3' || leadName === 'F8-C4') {
          amplitudeScale = 0.8; // 80% amplitude in frontocentral
        } else if (leadName === 'P3-O1' || leadName === 'P4-O2') {
          amplitudeScale = 0.6; // 60% amplitude in posterior
        } else {
          amplitudeScale = 0.3; // Minimal in frontal polar
        }
        
        // If no amplitude, skip calculation
        if (amplitudeScale <= 0) return centerY;
        
        // Create spindles every ~10 seconds
        const spindleInterval = 10 + (Math.sin(timePosition * 0.05) * 2); // 8-12 second variability
        const spindleTime = Math.floor(timePosition / spindleInterval) * spindleInterval;
        const timeFromSpindle = timePosition - spindleTime;
        
        // Spindles last 0.5-1.5 seconds
        const spindleDuration = 1.0 + (Math.sin(spindleTime * 0.7) * 0.5);
        
        // Check if we're within a spindle window
        if (timeFromSpindle < spindleDuration) {
          // Calculate spindle envelope (crescendo-decrescendo pattern)
          const normalizedTime = timeFromSpindle / spindleDuration;
          
          // Create symmetric amplitude envelope for spindle
          const envelope = Math.sin(normalizedTime * Math.PI);
          
          // Spindle frequency is 12-14 Hz
          const frequency = 13 + (Math.sin(timePosition * 0.9) * 1); // 12-14 Hz variability
          
          // Maximum amplitude of 60 microvolts
          const baseAmplitude = 60 * amplitudeScale;
          
          // Calculate spindle oscillation
          const oscillation = Math.sin(2 * Math.PI * frequency * timePosition) * baseAmplitude * envelope;
          
          return centerY + oscillation;
        }
        
        return centerY; // No effect outside spindle window
      },
      priority: 8 // Medium priority
    };
    
    // K-complexes - high amplitude biphasic waves in N2 sleep
    this.mainDemo.waveforms.kComplexes = {
      custom: true,
      color: '#007700',
      description: 'K-Complexes',
      draw: (x, centerY, leadName, timePosition) => {
        // K-complexes are most prominent in frontal and central leads
        if (!leadName) return centerY;
        
        // Define which leads show K-complexes and their amplitude
        let amplitudeScale = 0;
        if (leadName === 'F7-C3' || leadName === 'F8-C4') {
          amplitudeScale = 1.0; // Full amplitude in frontocentral
        } else if (leadName === 'C3-P3' || leadName === 'C4-P4') {
          amplitudeScale = 0.8; // 80% in central
        } else if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8') {
          amplitudeScale = 0.6; // 60% in frontopolar
        } else if (leadName === 'P3-O1' || leadName === 'P4-O2') {
          amplitudeScale = 0.4; // 40% in posterior
        } else {
          return centerY; // No effect on other leads
        }
        
        // Create K-complexes every ~30 seconds with some variability
        const complexInterval = 30 + (Math.sin(timePosition * 0.02) * 5); // 25-35 second variability
        const complexTime = Math.floor(timePosition / complexInterval) * complexInterval;
        const timeFromComplex = timePosition - complexTime;
        
        // K-complexes last about 0.5-0.7 seconds
        const complexDuration = 0.6;
        
        // Check if we're within a K-complex window
        if (timeFromComplex < complexDuration) {
          // Calculate normalized position within the K-complex
          const normalizedTime = timeFromComplex / complexDuration;
          
          // Create the characteristic K-complex shape: sharp negative followed by slower positive component
          let complexAmplitude;
          
          // Maximum amplitude of 150 microvolts
          const baseAmplitude = 150 * amplitudeScale;
          
          if (normalizedTime < 0.3) {
            // Initial sharp negative wave (first 30% of duration)
            complexAmplitude = -baseAmplitude * (normalizedTime / 0.3);
          } else if (normalizedTime < 0.4) {
            // Rapid transition from negative to positive (next 10% of duration)
            complexAmplitude = -baseAmplitude * (1 - ((normalizedTime - 0.3) / 0.1)) * 1.2;
          } else {
            // Slower positive component (remaining 60% of duration)
            complexAmplitude = baseAmplitude * 0.6 * (1 - ((normalizedTime - 0.4) / 0.6));
          }
          
          return centerY + complexAmplitude;
        }
        
        return centerY; // No effect outside K-complex window
      },
      priority: 9 // High priority, but lower than vertex waves
    };
    
    // Sawtooth waves (for REM sleep)
    this.mainDemo.waveforms.sawtoothWaves = {
      custom: true,
      color: '#FF9900',
      description: 'Sawtooth Waves',
      draw: (x, centerY, leadName, timePosition) => {
        // Sawtooth waves are most prominent in central regions
        if (!leadName) return centerY;
        
        // Define leads that show sawtooth waves
        let amplitudeScale = 0;
        if (leadName === 'C3-P3' || leadName === 'C4-P4') {
          amplitudeScale = 1.0; // Full amplitude in central leads
        } else if (leadName === 'F7-C3' || leadName === 'F8-C4') {
          amplitudeScale = 0.7; // 70% in frontocentral
        } else if (leadName === 'P3-O1' || leadName === 'P4-O2') {
          amplitudeScale = 0.5; // 50% in posterior
        } else {
          return centerY; // No effect in other leads
        }
        
        // Create bursts of sawtooth waves that last 1-2 seconds
        const burstInterval = 5 + (Math.sin(timePosition * 0.1) * 1); // 4-6 second variability
        const burstTime = Math.floor(timePosition / burstInterval) * burstInterval;
        const timeFromBurst = timePosition - burstTime;
        
        // Bursts last 1-2 seconds
        const burstDuration = 1.5 + (Math.sin(burstTime * 0.3) * 0.5);
        
        // Check if we're within a sawtooth wave burst
        if (timeFromBurst < burstDuration) {
          // Calculate envelope for the burst
          const normalizedTime = timeFromBurst / burstDuration;
          
          // Create amplitude envelope - gradual onset and offset
          let envelope;
          if (normalizedTime < 0.2) {
            // Gradual onset (first 20%)
            envelope = normalizedTime / 0.2;
          } else if (normalizedTime > 0.8) {
            // Gradual offset (last 20%)
            envelope = (1 - normalizedTime) / 0.2;
          } else {
            // Full amplitude in middle
            envelope = 1.0;
          }
          
          // Sawtooth waves are 2-3 Hz
          const frequency = 2.5;
          
          // Maximum amplitude of 40 microvolts
          const baseAmplitude = 40 * amplitudeScale;
          
          // Calculate phase within sawtooth cycle
          const cycleDuration = 1 / frequency;
          const phaseInCycle = (timePosition % cycleDuration) / cycleDuration;
          
          // Create sawtooth waveform (slow rise, fast fall)
          let waveform;
          if (phaseInCycle < 0.8) {
            // Slow rise (80% of cycle)
            waveform = (phaseInCycle / 0.8) * 2 - 1; // -1 to +1 range
            } else {
            // Rapid fall (20% of cycle)
            waveform = (1 - ((phaseInCycle - 0.8) / 0.2)) * 2 - 1; // +1 to -1 range
          }
          
          // Apply envelope and amplitude
          const sawtoothAmplitude = waveform * baseAmplitude * envelope;
          
          return centerY + sawtoothAmplitude;
        }
        
        return centerY; // No effect outside burst window
      },
      priority: 7 // Lower priority than other sleep features
    };
    
    // Slow eye movements (for N1 sleep)
    this.mainDemo.waveforms.slowEyeMovements = {
      custom: true,
      color: '#DD00DD',
      description: 'Slow Eye Movements',
      draw: (x, centerY, leadName, timePosition) => {
        // Slow eye movements only affect frontal leads
        if (leadName !== 'Fp1-F7' && leadName !== 'Fp2-F8') {
          return centerY; // No effect on non-frontal leads
        }
        
        // Slow, rolling eye movements every 2-4 seconds
        const movementFrequency = 0.3; // ~3 seconds per movement
        
        // Maximum amplitude of 100 microvolts
        const amplitude = 100;
        
        // Create slow sinusoidal oscillation
        const oscillation = Math.sin(2 * Math.PI * movementFrequency * timePosition) * amplitude;
        
        return centerY + oscillation;
      },
      priority: 6 // Lower priority
    };
    
    // Slow waves (for N3 sleep - delta waves)
    this.mainDemo.waveforms.slowWaves = {
      custom: true,
      color: '#0000AA',
      description: 'Slow Waves (Delta)',
      draw: (x, centerY, leadName, timePosition) => {
        // Delta waves are diffuse but more prominent frontally
        if (!leadName) return centerY;
        
        // Define amplitude scaling by lead
        let amplitudeScale = 0;
        if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8' || 
            leadName === 'F7-C3' || leadName === 'F8-C4') {
          amplitudeScale = 1.0; // Full amplitude in frontal
        } else if (leadName === 'C3-P3' || leadName === 'C4-P4') {
          amplitudeScale = 0.9; // 90% in central
        } else if (leadName === 'P3-O1' || leadName === 'P4-O2') {
          amplitudeScale = 0.8; // 80% in posterior
        } else {
          return centerY;
        }
        
        // Generate delta waves (~0.5-2 Hz)
        // Mix multiple frequencies for natural appearance
        const frequency1 = 0.7; // Primary delta component
        const frequency2 = 1.2; // Secondary component
        
        // High amplitude: 100-150 μV
        const baseAmplitude = 125 * amplitudeScale;
        
        // Create asymmetric, non-sinusoidal slow waves
        const phase1 = 2 * Math.PI * frequency1 * timePosition;
        const phase2 = 2 * Math.PI * frequency2 * timePosition;
        
        // Combine primary wave with harmonics for non-sinusoidal shape
        const wave1 = Math.sin(phase1) * baseAmplitude * 0.8;
        const wave2 = Math.sin(phase2) * baseAmplitude * 0.2;
        
        // Add slight asymmetry with cubic component
        const asymmetry = Math.pow(Math.sin(phase1), 3) * baseAmplitude * 0.15;
        
        // Combine components
        const deltaWave = wave1 + wave2 + asymmetry;
        
        return centerY + deltaWave;
      },
      priority: 5 // Base slow wave priority
    };
  }
  
  /**
   * Set up transition capabilities
   */
  setupTransitionCapabilities() {
    const demo = this.mainDemo;
    
    // Make sure we have patternTransitions map
    if (!demo.patternTransitions) {
      demo.patternTransitions = new Map();
    }
    
    // Add pattern transition methods if they don't exist
    if (!demo.startPatternTransition) {
      demo.startPatternTransition = function(patternName, duration = 1000) {
        this.patternTransitions.set(patternName, {
          startTime: performance.now(),
          duration: duration,
          progress: 0
        });
      };
    }
    
    if (!demo.getPatternTransitionFactor) {
      demo.getPatternTransitionFactor = function(patternName) {
        const transition = this.patternTransitions.get(patternName);
        if (!transition) return 1;
        return transition.progress;
      };
    }
    
    if (!demo.updatePatternTransitions) {
      demo.updatePatternTransitions = function(time) {
        for (const [patternName, transition] of this.patternTransitions.entries()) {
          const elapsedTime = performance.now() - transition.startTime;
          transition.progress = Math.min(elapsedTime / transition.duration, 1);
          
          if (transition.progress >= 1) {
            this.patternTransitions.delete(patternName);
          }
        }
      };
    }
  }
  
  /**
   * Initialize sleep mode on the main EEG demo
   */
  initializeSleepMode() {
    if (!this.mainDemo) {
      console.error("Cannot initialize sleep mode: Main demo not available");
      return;
    }
    
    console.log("Initializing sleep mode on main EEG demo");
    
    this.isActive = true;
    
    // Save original montage
    this.originalLeads = [...this.mainDemo.leads];
    
    // Switch to sleep montage with central leads
    this.mainDemo.leads = [...this.sleepMontage];
    
    // Set up a basic background of alpha and theta as requested
    this.setupBaselineSleepWaveforms();
    
    console.log("Switched to sleep montage with central leads and baseline sleep waveforms");
  }
  
  /**
   * Set up the baseline sleep waveforms (alpha and theta)
   */
  setupBaselineSleepWaveforms() {
    const demo = this.mainDemo;
    
    // Clear any previously active waveforms
    demo.activeWaveforms.clear();
    
    // Add alpha rhythm
    demo.activeWaveforms.add('alpha');
    demo.waveforms.alpha = {
      frequency: 9.5, // Slightly slower than awake alpha
      amplitude: 30,
      variability: 0.3,
      regions: ['posterior', 'central-posterior'],
      fading: 0.7 // Attenuated in drowsiness
    };
    
    // Add theta rhythm
    demo.activeWaveforms.add('theta');
    demo.waveforms.theta = {
      frequency: 5.5,
      amplitude: 25,
      variability: 0.3,
      regions: ['central', 'central-posterior', 'frontal-central'],
      occurrence: 0.8
    };
    
    // Reset time to show the beginning
    demo.currentTime = 0;
    
    // Ensure animation is running
    if (!demo.isPlaying) {
      demo.play();
    }
  }
  
  /**
   * Exit sleep mode and restore previous state
   */
  exitSleepMode() {
    if (!this.mainDemo) return;
    
    this.isActive = false;
    this.mainDemo.activeWaveforms.clear();
    
    // Restore original montage
    if (this.originalLeads) {
      this.mainDemo.leads = [...this.originalLeads];
      console.log("Restored original montage");
    }
    
    // Re-add basic waveforms
    this.mainDemo.activeWaveforms.add('alpha');
    this.mainDemo.activeWaveforms.add('beta');
    
    // Force redraw
    this.mainDemo.draw();
  }
  
  /**
   * Toggle an individual sleep pattern
   */
  toggleSleepPattern(pattern, isActive) {
    if (!this.mainDemo || !this.mainDemo.waveforms[pattern]) {
      console.error(`Sleep pattern '${pattern}' not found in main demo waveforms`);
      return;
    }
    
    // Toggle based on current state if not specified
    if (isActive === undefined) {
      isActive = !this.mainDemo.activeWaveforms.has(pattern);
    }
    
    try {
    if (isActive) {
      // Turn on pattern
      this.mainDemo.activeWaveforms.add(pattern);
        
        // Start pattern transition for smooth appearance
        if (!this.mainDemo.patternTransitions) {
          this.mainDemo.patternTransitions = new Map();
        }
        
        this.mainDemo.startPatternTransition(pattern, 1000);
        console.log(`Activated sleep pattern: ${pattern}`);
        
        // Force redraw
        this.mainDemo.draw();
        
        // Update UI button if it exists
        const button = document.getElementById(`${pattern}Toggle`);
        if (button) {
          button.classList.add('active');
        }
      } else {
        // Turn off pattern
        this.mainDemo.activeWaveforms.delete(pattern);
        
        if (this.mainDemo.patternTransitions) {
          this.mainDemo.patternTransitions.delete(pattern);
        }
        
        console.log(`Deactivated sleep pattern: ${pattern}`);
        
        // Update UI button if it exists
        const button = document.getElementById(`${pattern}Toggle`);
        if (button) {
          button.classList.remove('active');
        }
      }
    } catch (error) {
      console.error(`Error toggling sleep pattern '${pattern}':`, error);
    }
  }
  
  /**
   * Set the sleep stage - required for backward compatibility with HTML controls
   */
  setSleepStage(stage) {
    // This is a shell function to maintain compatibility with the HTML
    console.log(`Sleep stage '${stage}' requested - using individual patterns instead`);
    
    // Clear all existing patterns
    if (this.mainDemo && this.mainDemo.activeWaveforms) {
      // Keep only alpha and theta background
      const currentPatterns = Array.from(this.mainDemo.activeWaveforms);
      for (const pattern of currentPatterns) {
        if (pattern !== 'alpha' && pattern !== 'theta') {
          this.mainDemo.activeWaveforms.delete(pattern);
        }
      }
    }
  }
}

// Initialize the sleep module when the demo is ready
document.addEventListener('DOMContentLoaded', () => {
  let initAttempts = 0;
  const maxAttempts = 10;
  
  const initSleepDemo = function() {
    if (window.demo && window.demo instanceof EEGWaveformDemo) {
      console.log("Initializing Sleep EEG module with main demo");
      window.sleepDemo = new EEGSleepModule(window.demo);
    } else {
      initAttempts++;
      if (initAttempts < maxAttempts) {
        console.log(`Main EEG demo not ready yet, retrying in 300ms (attempt ${initAttempts}/${maxAttempts})`);
        setTimeout(initSleepDemo, 300);
      } else {
        console.error("Failed to initialize Sleep EEG module: Main demo not available after multiple attempts");
      }
    }
  };
  
  // Start initialization after a short delay to ensure the main demo is loaded
  setTimeout(initSleepDemo, 500);
}); 