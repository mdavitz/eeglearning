// EEG Waveform Demonstration Class
class EEGWaveformDemo {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Standard EEG settings
    this.standardScale = {
      mmPerSecond: 30, // Standard EEG scale: 30mm/sec = 3cm/sec
      smallGridMm: 5,  // Small grid = 5mm
      largeGridMm: 10   // Large grid = 10mm
    };
    
    // Calculate pixel density and scaling
    this.calculatePixelDensity();
    
    this.options = {
      backgroundColor: '#ffffff', // White background like Natus EEG
      waveformColor: '#000000', // Black waveforms for contrast on white
      gridColor: '#dddddd', // Light gray grid lines
      majorGridColor: '#aaaaaa', // Darker gray major grid lines
      leadSpacing: 120, // Increased vertical space between leads
      leadHeight: 100, // Increased height of each lead display
      leadCount: 8 // Number of leads to display
    };

    // State
    this.isPlaying = false;
    this.currentTime = 0;
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
    this.activeWaveforms = new Set(['alpha', 'beta', 'eyeBlinks']); // Set default waveforms with eye blinks
    this.speed = 1;
    this.isPanning = false;
    this.lastPanPosition = null;
    this.currentMode = 'normal'; // Set default mode
    
    // Spike customization parameters
    this.spikeFrequency = 2; // 1-4 = rare, occasional, frequent, abundant
    this.spikePeriodicity = 0.2; // 0.0 to 1.0 - affects how regular/periodic the spikes are (0 = random, 1 = perfectly periodic)
    
    // Sharp wave customization parameters
    this.sharpWaveFrequency = 2; // 1-4 = rare, occasional, frequent, abundant
    this.sharpWavePeriodicity = 0.5; // 0 to 3.0 Hz - controls the periodicity of sharp waves
    
    // Spike and wave periodicity (0, 2, 3, or 5 Hz)
    this.spikeAndWavePeriodicity = 2.0;
    
    // LRDA periodicity (0-2 Hz)
    this.lrdaPeriodicity = 1.0;
    
    // Spike and wave frequency and LRDA frequency (1-4 = rare, occasional, frequent, abundant)
    this.spikeAndWaveFrequency = 2;
    this.lrdaFrequency = 2;
    
    // EEG Modes
    this.modes = {
      custom: {
        name: 'Custom Waveforms',
        description: 'Select individual waveforms to display',
        waveforms: {} // Empty as this is for manual selection
      },
      normal: {
        name: 'Normal Awake',
        description: 'Normal awake EEG with posterior alpha, central mixed alpha/beta, and frontal beta bilaterally',
        waveforms: {
          alpha: { 
            freq: 10, 
            amp: 15, // Reduced from 20 to 15
            region: 'posterior',
            centralMix: 0.6,  // Increased from 0.5 to 0.6 for better propagation to central
            // Slight amplitude variations between hemispheres
            leftRightAsymmetry: 1.1, // Left side 10% higher amplitude
            // Add frequency modulation to alpha
            modulation: 0.12, // Add 12% frequency modulation
            // Add slight frequency fluctuation
            freqFluctuation: 0.1, // 10% fluctuation in frequency
            // Minimal amplitude variability
            ampVariability: 0.01, // 1% amplitude variability (reduced from 3%)
          },
          beta: { 
            freq: 15, 
            amp: 5, // Reduced from 8 to 5
            region: 'frontal',
            centralMix: 0.7,  // Increased from 0.5 to 0.7
            // Remove amplitude modulation for cleaner appearance
            modulation: 0,
            // Add slight frequency fluctuation
            freqFluctuation: 0.05, // 5% fluctuation in frequency
            // Minimal amplitude variability
            ampVariability: 0.01, // 1% amplitude variability (reduced from 2%)
          },
          // Add small amount of theta (normal in adults)
          theta: {
            freq: 6,
            amp: 7, // Reduced from 10 to 7
            region: 'all',
            // Add slight frequency fluctuation
            freqFluctuation: 0.08, // 8% fluctuation in frequency
            // Add amplitude variability
            ampVariability: 0.12, // 12% amplitude variability
          },
          eyeBlinks: {
            enabled: true
          }
        }
      },
      mildSlowing: {
        name: 'Mild Slowing',
        description: 'Mild slowing with frontal alpha and posterior theta',
        waveforms: {
          alpha: { 
            freq: 8, 
            amp: 10, // Further reduced from 15 to 10
            region: 'frontal',
            // Add slight frequency fluctuation
            freqFluctuation: 0.15, // 15% fluctuation in frequency
            // Add amplitude variability
            ampVariability: 0.18, // 18% amplitude variability
          },
          theta: { 
            freq: 5.5, 
            amp: 10, // Further reduced from 15 to 10
            region: 'posterior',
            // Add slight frequency fluctuation
            freqFluctuation: 0.12, // 12% fluctuation in frequency
            // Add amplitude variability
            ampVariability: 0.2, // 20% amplitude variability
          },
          eyeBlinks: {
            enabled: true
          }
        }
      },
      moderateSlowing: {
        name: 'Moderate Slowing',
        description: 'Moderate slowing with diffuse delta and superimposed theta',
        waveforms: {
          delta: { 
            freq: 2.5, 
            amp: 40, 
            region: 'all',
            // Random bursts of delta
            burstPattern: true,
            burstFrequency: 0.7, // Bursts appear 70% of the time
            burstCycleTime: [3, 6], // Burst cycles of 3-6 seconds
            burstDuration: [2, 5], // Longer bursts lasting 2-5 seconds
            // Add significant frequency fluctuation
            freqFluctuation: 0.3, // 30% fluctuation in frequency
            // Add amplitude variability
            ampVariability: 0.5, // 50% amplitude variability
            // Set moderate suppression between bursts
            suppressionAmplitude: 0.3 // 30% amplitude during non-burst periods
          },
          theta: { 
            freq: 4.0, // Slowed from 5Hz to 4Hz (slow theta)
            amp: 25,
            region: 'all',
            // Make theta continuous (not burst-dependent)
            // Add significant frequency fluctuation, but ensure not above 5Hz
            freqFluctuation: 0.15, // Reduced to 15% to ensure we don't exceed 5Hz
            maxFrequency: 5.0, // Explicitly limit to 5Hz maximum
            // Add amplitude variability
            ampVariability: 0.25, // 25% amplitude variability
          }
        }
      },
      severeSlowing: {
        name: 'Severe Slowing',
        description: 'Severe diffuse slowing with monomorphic delta',
        waveforms: {
          delta: { 
            freq: 1.8, // Slower delta at 1.8 Hz
            amp: 40, // High amplitude delta
            region: 'all',
            // Minimal frequency fluctuation for monomorphic appearance
            freqFluctuation: 0.1, // Only 10% fluctuation
            // Minimal amplitude variability for monomorphic appearance
            ampVariability: 0.15, // Only 15% variability
          }
          // No other frequencies present
        }
      },
      burstSuppression: {
        name: 'Burst Suppression',
        description: 'Flat background with intermittent bursts of theta activity',
        waveforms: {
          theta: {
            freq: 6,
            amp: 100, // Increased base amplitude to 100
            region: 'all',
            // Random burst pattern
            burstPattern: true,
            burstFrequency: 1.0, // Always show bursts during the active window
            burstCycleTime: [7, 12], // 7-12 seconds between bursts
            burstDuration: [1, 3], // Bursts last 1-3 seconds
            // Add more frequency fluctuation
            freqFluctuation: 0.25, // 25% fluctuation in frequency
            // Extreme amplitude variability
            ampVariability: 0.8, // 80% amplitude variability in bursts
            // Highly variable burst amplitude
            burstAmplitudeVariability: 0.7, // Each burst can vary by up to 70% from base amplitude
            // Flatter between bursts
            suppressionAmplitude: 0.005 // 0.5% amplitude during suppression periods
          }
        }
      },
      spikeWave3Hz: {
        name: 'Spike & Wave (3Hz)',
        description: 'Generalized 3Hz spike and wave pattern typical of absence seizures',
        waveforms: {
          custom3HzSpikeWave: {
            enabled: true
          }
        }
      }
    };

    // EEG Leads (from frontal to occipital)
    this.leads = [
      { name: 'Fp1-F7', color: '#0000ff', region: 'frontal', ampFactor: 0.7 },  // Left frontal - Blue - 30% reduction
      { name: 'F7-T3', color: '#0000ff', region: 'frontal', ampFactor: 0.75 },   // Left frontal-temporal - Blue - 25% reduction
      { name: 'T3-T5', color: '#0000ff', region: 'posterior' }, // Left posterior - Blue
      { name: 'T5-O1', color: '#0000ff', region: 'posterior' }, // Left posterior - Blue
      { name: 'Fp2-F8', color: '#ff0000', region: 'frontal', ampFactor: 0.7 },  // Right frontal - Red - 30% reduction
      { name: 'F8-T4', color: '#ff0000', region: 'frontal', ampFactor: 0.75 },   // Right frontal-temporal - Red - 25% reduction
      { name: 'T4-T6', color: '#ff0000', region: 'posterior' }, // Right posterior - Red
      { name: 'T6-O2', color: '#ff0000', region: 'posterior' }  // Right posterior - Red
    ];

    // Initialize waveforms
    this.waveforms = {
      // Normal waveforms
      alpha: {
        draw: this.generateSinusoidalWaveform.bind(this, 8, 10),
        modulationPattern: false
      },
      beta: {
        draw: this.generateSinusoidalWaveform.bind(this, 15, 5)
      },
      theta: {
        draw: this.generateSinusoidalWaveform.bind(this, 6, 8)
      },
      delta: {
        draw: this.generateSinusoidalWaveform.bind(this, 3, 12)
      },
      
      // Epileptiform patterns
      spikes: {
        draw: this.generateSpikeWaveform.bind(this, 100, 0.2)
      },
      // Add seizure pattern right in the constructor
      seizure: {
        draw: this.generateSeizureWaveform.bind(this),
        description: 'Focal seizure with right temporal onset, secondary generalization, and postictal slowing'
      },
      sharpWaves: {
        draw: this.generateSharpWaveWaveform.bind(this, 80, 0.15)
      },
      spikeAndWaves: {
        draw: this.generateSpikeAndWaveWaveform.bind(this, 250, 0.2)
      },
      
      // Abnormal patterns
      eyeBlinks: {
        custom: true,
        color: '#000000',
        description: 'Eye Blinks',
        draw: (x, centerY, leadName, timePosition) => {
          // Only apply to frontal leads (Fp1-F7 and Fp2-F8)
          if (leadName !== 'Fp1-F7' && leadName !== 'Fp2-F8') {
            return centerY; // No effect on non-frontal leads
          }
          
          // Calculate blink timing - approximately every 5-7 seconds
          const blinkPeriod = 6 + Math.sin(timePosition * 0.1) * 1; // 5-7 seconds between blinks
          const blinkTime = Math.floor(timePosition / blinkPeriod) * blinkPeriod;
          
          // Calculate time from current blink
          const timeFromBlink = timePosition - blinkTime;
          
          // Blink duration is 0.5 seconds
          const blinkDuration = 0.5;
          
          // Check if we're within a blink window
          if (timeFromBlink < blinkDuration) {
            // Calculate the blink shape - rapid negative deflection followed by slower return
            const normalizedTime = timeFromBlink / blinkDuration;
            
            // Create an asymmetric shape for the blink
            let blinkAmplitude;
            if (normalizedTime < 0.2) {
              // Fast downward deflection (first 20% of the blink time)
              blinkAmplitude = -350 * (normalizedTime / 0.2); // Maintain eye blink amplitude at 350
            } else {
              // Slower return to baseline (remaining 80% of the blink time)
              blinkAmplitude = -350 * (1 - ((normalizedTime - 0.2) / 0.8)); // Maintain eye blink amplitude at 350
            }
            
            return centerY + blinkAmplitude;
          }
          
          return centerY; // No blink effect
        },
        priority: 10 // Higher priority than other waveforms
      },
      sweatArtifact: {
        custom: true,
        color: '#006400',
        description: 'Sweat Artifact',
        draw: (x, centerY, leadName, timePosition) => {
          // Sweat artifact characteristics by region:
          // - Frontal (Fp): Highest amplitude, most prominent
          // - Temporal (T): Moderate amplitude, often affected
          // - Posterior (O): Minimal or no sweat artifact
          
          // Determine lead characteristics
          let amplitudeScale = 0;
          let isAffected = false;
          let leadGroup = '';
          
          // Group by anatomical regions
          if (leadName.includes('Fp')) {
            // Frontal polar - highest sweat artifact
            leadGroup = 'frontalPolar';
            isAffected = true;
            amplitudeScale = 1.0;
          } else if (leadName.includes('F7') || leadName.includes('F8')) {
            // Frontal lateral - high sweat artifact
            leadGroup = 'frontalLateral';
            isAffected = true;
            amplitudeScale = 0.9;
          } else if (leadName.includes('T3') || leadName.includes('T4')) {
            // Mid-temporal - moderate sweat artifact
            leadGroup = 'midTemporal';
            isAffected = true;
            amplitudeScale = 0.7;
          } else if (leadName.includes('T5') || leadName.includes('T6')) {
            // Posterior temporal - less sweat artifact
            leadGroup = 'posteriorTemporal';
            isAffected = Math.random() > 0.3; // 70% chance of being affected
            amplitudeScale = 0.5;
          } else if (leadName.includes('O')) {
            // Occipital - minimal sweat artifact
            leadGroup = 'occipital';
            isAffected = Math.random() > 0.7; // 30% chance of minimal effect
            amplitudeScale = 0.2;
          }
          
          if (!isAffected) {
            return centerY; // This lead is not affected by sweat
          }
          
          // Generate seed based on lead name for consistent random behavior
          const leadSeed = leadName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          
          // Different leads have different base frequencies
          let baseFreq1, baseFreq2, baseFreq3;
          
          // Mimic anatomical distribution of sweat
          switch (leadGroup) {
            case 'frontalPolar':
              // Frontal polar leads have slower, higher amplitude sweat artifact
              baseFreq1 = 0.1 + Math.sin(timePosition * 0.03 + leadSeed * 0.5) * 0.05;
              baseFreq2 = 0.15 + Math.sin(timePosition * 0.02 + leadSeed * 0.7) * 0.05;
              baseFreq3 = 0.2 + Math.sin(timePosition * 0.01 + leadSeed * 0.9) * 0.05;
              break;
            case 'frontalLateral':
              // Frontal lateral leads have slightly faster frequencies 
              baseFreq1 = 0.15 + Math.sin(timePosition * 0.04 + leadSeed * 0.3) * 0.05;
              baseFreq2 = 0.2 + Math.sin(timePosition * 0.03 + leadSeed * 0.5) * 0.05;
              baseFreq3 = 0.25 + Math.sin(timePosition * 0.02 + leadSeed * 0.7) * 0.05;
              break;
            case 'midTemporal':
              // Mid-temporal has mixed frequencies
              baseFreq1 = 0.2 + Math.sin(timePosition * 0.05 + leadSeed * 0.2) * 0.07;
              baseFreq2 = 0.3 + Math.sin(timePosition * 0.04 + leadSeed * 0.4) * 0.07;
              baseFreq3 = 0.4 + Math.sin(timePosition * 0.03 + leadSeed * 0.6) * 0.07;
              break;
            case 'posteriorTemporal':
              // Posterior temporal has faster, lower amplitude sweat
              baseFreq1 = 0.3 + Math.sin(timePosition * 0.06 + leadSeed * 0.1) * 0.1;
              baseFreq2 = 0.4 + Math.sin(timePosition * 0.05 + leadSeed * 0.3) * 0.1;
              baseFreq3 = 0.5 + Math.sin(timePosition * 0.04 + leadSeed * 0.5) * 0.1;
              break;
            case 'occipital':
              // Occipital has fastest, lowest amplitude sweat (when present)
              baseFreq1 = 0.4 + Math.sin(timePosition * 0.07 + leadSeed * 0.05) * 0.15;
              baseFreq2 = 0.5 + Math.sin(timePosition * 0.06 + leadSeed * 0.2) * 0.15;
              baseFreq3 = 0.6 + Math.sin(timePosition * 0.05 + leadSeed * 0.4) * 0.15;
              break;
            default:
              // Fallback
              baseFreq1 = 0.2;
              baseFreq2 = 0.3;
              baseFreq3 = 0.4;
          }
          
          // Left and right hemispheres have slightly different patterns
          const isLeftHemisphere = leadName.includes('Fp1') || leadName.includes('F7') || 
                                  leadName.includes('T3') || leadName.includes('T5') || 
                                  leadName.includes('O1');
          
          // Add time offset between hemispheres to create asynchronous patterns
          let timeOffset = 0;
          if (isLeftHemisphere) {
            timeOffset = 2.5; // Left hemisphere sweat pattern is offset
          }
          
          const shiftedTime = timePosition + timeOffset + (leadSeed * 0.1);
          
          // Combine sinusoidal components with lead-specific weights
          // Amplitude is highest for slow components in frontal regions
          let wave1Amp, wave2Amp, wave3Amp;
          
          switch (leadGroup) {
            case 'frontalPolar':
              wave1Amp = 120; // Highest amplitude for slowest component
              wave2Amp = 60;
              wave3Amp = 30;
              break;
            case 'frontalLateral':
              wave1Amp = 100;
              wave2Amp = 70;
              wave3Amp = 40;
              break;
            case 'midTemporal':
              wave1Amp = 80;
              wave2Amp = 70;
              wave3Amp = 50;
              break;
            case 'posteriorTemporal':
              wave1Amp = 60;
              wave2Amp = 50;
              wave3Amp = 40;
              break;
            case 'occipital':
              wave1Amp = 30;
              wave2Amp = 25;
              wave3Amp = 20;
              break;
            default:
              wave1Amp = 70;
              wave2Amp = 50;
              wave3Amp = 30;
          }
          
          // Generate the waveform components
          const wave1 = Math.sin(2 * Math.PI * baseFreq1 * shiftedTime) * wave1Amp;
          const wave2 = Math.sin(2 * Math.PI * baseFreq2 * shiftedTime + leadSeed * 0.1) * wave2Amp;
          const wave3 = Math.sin(2 * Math.PI * baseFreq3 * shiftedTime + leadSeed * 0.2) * wave3Amp;
          
          // Add slow baseline drift (DC offset) more prominent in frontal regions
          let driftAmp = 0;
          if (leadGroup === 'frontalPolar') driftAmp = 80;
          else if (leadGroup === 'frontalLateral') driftAmp = 60;
          else if (leadGroup === 'midTemporal') driftAmp = 40;
          else if (leadGroup === 'posteriorTemporal') driftAmp = 20;
          else driftAmp = 10;
          
          const driftFreq = 0.02 + (leadSeed * 0.001);
          const drift = Math.sin(2 * Math.PI * driftFreq * shiftedTime) * driftAmp;
          
          // Sweat artifact appears and disappears over time
          // More persistent in frontal regions, more intermittent in posterior regions
          let onOffFreq, onOffThreshold;
          
          switch (leadGroup) {
            case 'frontalPolar':
              onOffFreq = 0.01; // Very slow cycling (most persistent)
              onOffThreshold = -0.5; // Present ~83% of the time
              break;
            case 'frontalLateral':
              onOffFreq = 0.015;
              onOffThreshold = -0.3; // Present ~77% of the time
              break;
            case 'midTemporal':
              onOffFreq = 0.02;
              onOffThreshold = 0; // Present ~67% of the time
              break;
            case 'posteriorTemporal':
              onOffFreq = 0.025;
              onOffThreshold = 0.3; // Present ~53% of the time
              break;
            case 'occipital':
              onOffFreq = 0.03;
              onOffThreshold = 0.5; // Present ~33% of the time
              break;
            default:
              onOffFreq = 0.02;
              onOffThreshold = 0;
          }
          
          const isActiveNow = Math.sin(2 * Math.PI * onOffFreq * timePosition + leadSeed) > onOffThreshold;
          
          if (!isActiveNow) {
            return centerY; // No sweat artifact at this moment for this lead
          }
          
          // Combine waves for the final effect
          const sweatEffect = (wave1 + wave2 + wave3 + drift) * amplitudeScale;
          
          // Apply pattern transition factor
          const sweatFactor = this.getPatternTransitionFactor('sweatArtifact');
          
          // Return modified center point to disrupt the background
          return centerY + sweatEffect * sweatFactor;
        },
        priority: 12 // Higher than normal waveforms but lower than seizures/spikes
      },
      sixtyHzArtifact: {
        custom: true,
        color: '#000000',
        description: '60Hz Artifact',
        draw: (x, centerY, leadName, timePosition) => {
          // Only display in frontal leads (Fp1-F7 and Fp2-F8)
          
          // Check if this is a frontal lead
          if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8') {
            // Full amplitude for frontal leads only
            const amplitudeScale = 1.0;
            
            // Apply realistic amplitude
            const amplitude = 100 * amplitudeScale;
            
            // Pure 60Hz oscillation
            const oscillation = Math.sin(2 * Math.PI * 60 * timePosition) * amplitude;
            
            // Return the oscillating value
            return centerY + oscillation;
          } else {
            // No effect on other leads - just return the baseline
            return centerY;
          }
        },
        priority: 15
      },
      spikes: {
        custom: true,
        color: '#FF0000',
        description: 'Left Temporal Spikes',
        draw: (x, centerY, leadName, timePosition) => {
          // ... existing code ...
        }
      },
      sharpWaves: {
        custom: true,
        color: '#FF851B',
        description: 'Sharp Waves',
      },
      slowing: {
        custom: true,
        color: '#B10DC9',
        description: 'Slowing',
      },
      // Add focal slowing as separate pattern
      focalSlowing: {
        custom: true,
        color: '#0074D9',
        description: 'LRDA (Lateralized Rhythmic Delta Activity)',
      },
      // Add GRDA as separate pattern
      generalizedSlowing: {
        custom: true,
        color: '#7FDBFF',
        description: 'GRDA (Generalized Rhythmic Delta Activity)',
      },
      // Added chewing artifact
      chewing: {
        custom: true,
        color: '#000000',
        description: 'Chewing Artifact',
        draw: (x, centerY, leadName, timePosition) => {
          // Chewing affects only temporal leads
          let leadFactor = 0;
          
          // Maximum amplitude in temporal leads - make it very strong in all relevant leads
          if (leadName === 'F7-T3' || leadName === 'F8-T4') {
            leadFactor = 0.595; // Further reduced by 15% (from 0.7 to 0.595)
          } else if (leadName === 'T3-T5' || leadName === 'T4-T6') {
            leadFactor = 0.536; // Further reduced by 15% (from 0.63 to 0.536)
          } else {
            return centerY; // No effect in other leads
          }
          
          // Create intermittent chewing bursts with 15-30 second breaks
          const totalCyclePeriod = 45; // Total cycle length (chewing + break)
          const cyclePosition = (timePosition % totalCyclePeriod) / totalCyclePeriod;
          
          // Use a pseudo-random function for consistent break durations
          const cycleSeed = Math.floor(timePosition / totalCyclePeriod);
          const pseudoRandom = (Math.sin(cycleSeed * 98765.4321) * 0.5 + 0.5);
          
          // Break duration varies between 15-30 seconds
          const breakDuration = 15 + (pseudoRandom * 15);
          const chewingDuration = totalCyclePeriod - breakDuration;
          
          // Determine if we're in a chewing period
          const chewingActiveTime = chewingDuration / totalCyclePeriod;
          const isChewing = cyclePosition < chewingActiveTime;
          
          // If we're in a break, return baseline
          if (!isChewing) {
            return centerY;
          }
          
          // Calculate chewing frequency that varies between 0.9-1.1 Hz (reduced variation)
          // Use a slower sine wave to modulate the frequency for smoother transitions
          const freqModulation = Math.sin(timePosition * 0.05) * 0.1; // ±0.1 Hz variation, slower modulation
          const baseFreq = 1.0; // Center frequency
          const chewFreq = baseFreq + freqModulation; // 0.9-1.1 Hz
          
          // Create chewing bursts at the calculated frequency
          const cycleTime = 1 / chewFreq; // Time for one chew cycle
          const chewPosition = (timePosition % cycleTime) / cycleTime;
          
          // Show chewing artifact for 40% of cycle (increased from 25%) for longer chews
          if (chewPosition > 0.4) {
            return centerY; // No artifact during relaxation phase
          }
          
          // Create a strong burst with very high amplitude
          // Use simple math for reliable rendering
          const burstIntensity = Math.sin(chewPosition * Math.PI * 2);
          
          // Generate frequencies similar to a real EMG burst
          const emg1 = Math.sin(timePosition * 100) * 0.3;
          const emg2 = Math.sin(timePosition * 150) * 0.4;
          const emg3 = Math.sin(timePosition * 200) * 0.3;
          
          // Further reduce base amplitude by 15% (from 560 to 476)
          const baseAmplitude = 476;
          const amplitude = baseAmplitude * leadFactor * Math.abs(burstIntensity);
          
          // Combine frequencies for a realistic EMG appearance
          return centerY + (amplitude * (emg1 + emg2 + emg3));
        },
        priority: 30 // Extremely high priority to ensure it's always visible
      },
      // Add 3Hz spike and wave pattern for generalized seizures
      custom3HzSpikeWave: {
        custom: true,
        color: '#FF0000',
        description: '3Hz Spike & Wave (Generalized)',
        draw: (x, centerY, leadName, timePosition) => {
          // This is a generalized pattern affecting all leads
          
          // Create intermittent runs of spike-wave (2-4 second bursts)
          const burstCycle = 10; // 10 second total cycle (burst + pause)
          const minBurstDuration = 2; // Minimum burst duration in seconds
          const maxBurstDuration = 4; // Maximum burst duration in seconds
          
          // Vary the burst duration based on time position
          const burstDuration = minBurstDuration + 
                               (Math.sin(timePosition * 0.05) + 1) * (maxBurstDuration - minBurstDuration) / 2;
          
          // Determine if we're in an active burst period
          const cyclePosition = (timePosition % burstCycle) / burstCycle;
          const burstFraction = burstDuration / burstCycle;
          const inActiveBurst = cyclePosition < burstFraction;
          
          // Handle both active and inactive periods
          if (!inActiveBurst) {
            // Not in active burst, use baseline
            return centerY;
            } else {
            // In active burst, calculate the spike-wave pattern
            
            // Add smooth onset/offset for the burst
            let intensityFactor = 1.0;
            const transitionTime = 0.2; // 200ms transition time
            
            // Calculate normalized position within the burst (0-1)
            const burstPosition = cyclePosition / burstFraction;
            
            // Onset transition (first 20% of transition time)
            if (burstPosition < transitionTime) {
              intensityFactor = burstPosition / transitionTime;
            }
            // Offset transition (last 20% of transition time)
            else if (burstPosition > (1 - transitionTime)) {
              intensityFactor = (1 - burstPosition) / transitionTime;
            }
            
            // Calculate amplitude based on lead location for more realistic appearance
            let amplitudeScale = 1.0;
            
            // Frontal and central regions tend to show higher amplitude spike-waves
            if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8' || 
                leadName === 'F7-T3' || leadName === 'F8-T4') {
              amplitudeScale = 1.2; // Higher in frontal leads
            } else if (leadName === 'T3-T5' || leadName === 'T4-T6') {
              amplitudeScale = 0.9; // Slightly lower in mid-temporal regions
            } else if (leadName === 'T5-O1' || leadName === 'T6-O2') {
              amplitudeScale = 0.8; // Lowest in occipital regions
            }
            
            // Basic parameters for 3Hz spike-wave
            const frequency = 3; // 3Hz base frequency
            const cycleTime = 1 / frequency; // Time for one full cycle
            
            // Calculate where we are in the current cycle
            const spikeWavePosition = (timePosition % cycleTime) / cycleTime; // 0 to 1 within each cycle
            
            // Calculate the spike-wave shape
            let amplitude = 0;
            
            // Spike (first 10% of the cycle) - steep upward then immediate drop
            if (spikeWavePosition < 0.1) {
              const spikePhase = spikeWavePosition / 0.1;
              if (spikePhase < 0.3) {
                // Fast upstroke (first 30% of spike)
                amplitude = 120 * amplitudeScale * (spikePhase / 0.3);
              } else {
                // Fast downstroke (remaining 70% of spike)
                amplitude = 120 * amplitudeScale * (1 - ((spikePhase - 0.3) / 0.7));
              }
            } 
            // Slow wave (following 90% of cycle)
            else {
              const wavePhase = (spikeWavePosition - 0.1) / 0.9;
              // Create a smoother wave that starts negative then returns to baseline
              // Use a smoother curve with slightly lower amplitude
              amplitude = -70 * amplitudeScale * Math.pow(Math.sin(wavePhase * Math.PI), 0.9);
            }
            
            // Add minor variability in amplitude to make it more realistic
            const variability = Math.sin(timePosition * 5) * 5;
            amplitude += variability;
            
            // Apply intensity factor based on burst onset/offset
            amplitude *= intensityFactor;
            
            return centerY + amplitude;
          }
        },
        priority: 20 // Higher priority than other waveforms
      },
      // Add focal seizure pattern
      focalSeizure: {
        custom: true,
        color: '#FF0000',
        description: 'Focal Seizure (R Temporal)',
        draw: (x, centerY, leadName, timePosition) => {
          // This affects primarily right temporal and adjacent regions
          // Check if this lead should be affected by the focal seizure
          const primaryAffectedLeads = ['F8-T4', 'T4-T6'];
          const secondaryAffectedLeads = ['Fp2-F8', 'T6-O2'];
          const minorAffectedLeads = ['F7-T3', 'T3-T5']; // Some contralateral involvement
          
          // Check if this is a right hemisphere lead (for post-ictal attenuation)
          const isRightHemisphere = leadName.includes('Fp2') || 
                                   leadName.includes('F8') || 
                                   leadName.includes('T4') ||
                                   leadName.includes('T6') ||
                                   leadName.includes('O2');
          
          // Skip leads not affected at all (neither in seizure nor post-ictal phase)
          if (!primaryAffectedLeads.includes(leadName) && 
              !secondaryAffectedLeads.includes(leadName) && 
              !minorAffectedLeads.includes(leadName) && 
              !isRightHemisphere) {
            return centerY; // Not affected
          }
          
          // Determine amplitude scale based on lead location
          let amplitudeScale = 1.0;
          
          if (primaryAffectedLeads.includes(leadName)) {
            amplitudeScale = 1.0; // Full amplitude in primary affected region
          } else if (secondaryAffectedLeads.includes(leadName)) {
            amplitudeScale = 0.7; // 70% amplitude in adjacent regions
          } else if (minorAffectedLeads.includes(leadName)) {
            amplitudeScale = 0.2; // 20% amplitude in contralateral regions
          } else if (isRightHemisphere) {
            // Other right hemisphere leads only affected in post-ictal
            amplitudeScale = 0.0;
          }
          
          // Variable seizure duration between 12-22 seconds based on seed value
          const seedValue = Math.sin(timePosition * 0.01) * 0.5 + 0.5; // 0-1 value
          const seizureDuration = 12 + (seedValue * 10); // 12-22 second seizure
          const postIctalDuration = 10; // 10 seconds of post-ictal changes
          const seizureCycle = seizureDuration + postIctalDuration + 10; // Total cycle including post-ictal
          const seizurePosition = (timePosition % seizureCycle) / seizureCycle;
          const inActiveSeizure = seizurePosition < (seizureDuration / seizureCycle);
          const inPostIctal = !inActiveSeizure && 
                             seizurePosition < ((seizureDuration + postIctalDuration) / seizureCycle);
          
          // Post-ictal phase
          if (inPostIctal) {
            const postIctalPhase = (seizurePosition - (seizureDuration / seizureCycle)) * (seizureCycle / postIctalDuration);
            
            // Right hemisphere attenuation in post-ictal phase
            if (isRightHemisphere) {
              // Determine attenuation based on lead and phase
              let attenuationFactor = 0.2; // Base attenuation (80% reduction)
              
              // More attenuation in primary affected regions
              if (primaryAffectedLeads.includes(leadName)) {
                attenuationFactor = 0.1; // 90% reduction
              }
              
              // Gradual recovery over post-ictal period
              const recoveryFactor = Math.min(1, postIctalPhase * 1.2);
              attenuationFactor = attenuationFactor + (0.8 * recoveryFactor);
              
              // Create attenuated version of normal activity
              const normalFreq = 10 + (leadName.includes('F8') ? 5 : 0); // Higher freq in frontal
              const normalAmp = 15 * attenuationFactor; // Attenuated amplitude
              const slowFreq = 2 + Math.sin(timePosition) * 0.5; // 1.5-2.5 Hz delta
              const slowAmp = 40 * (1 - postIctalPhase) * attenuationFactor; // Diminishing delta
              
              // Mix of attenuated normal activity and delta
              const normalComponent = normalAmp * Math.sin(2 * Math.PI * normalFreq * timePosition);
              const slowComponent = slowAmp * Math.sin(2 * Math.PI * slowFreq * timePosition);
              
              // More slow activity in primary affected leads
              const mixRatio = primaryAffectedLeads.includes(leadName) ? 0.7 : 0.3;
              const combinedSignal = (normalComponent * (1 - mixRatio)) + (slowComponent * mixRatio);
              
              return centerY + combinedSignal;
            }
            // Primary affected regions get delta slowing
            else if (primaryAffectedLeads.includes(leadName)) {
              const deltaFreq = 1.5 + Math.sin(timePosition) * 0.5; // ~1-2 Hz delta
              const deltaAmp = 60 * (1 - postIctalPhase) * amplitudeScale; // Diminishing amplitude
              return centerY + (deltaAmp * Math.sin(2 * Math.PI * deltaFreq * timePosition));
            }
            // Minor slowing in contralateral leads with quicker recovery
            else if (minorAffectedLeads.includes(leadName)) {
              const recoverFactor = Math.min(1, postIctalPhase * 2); // Faster recovery (half-time)
              if (recoverFactor < 0.95) {
                const deltaFreq = 3 + Math.sin(timePosition) * 0.5; // 2.5-3.5 Hz
                const deltaAmp = 15 * (1 - postIctalPhase*1.5) * amplitudeScale; // Quickly diminishing
                return centerY + (deltaAmp * Math.sin(2 * Math.PI * deltaFreq * timePosition));
              }
            }
            
            return centerY; // Default return
          }
          // Outside seizure/post-ictal - normal baseline
          else if (!inActiveSeizure) {
            return centerY;
          }
          
          // Active seizure phase - calculate normalized position
          const seizureProgressNormalized = (seizurePosition * seizureCycle) / seizureDuration;
          
          // Seizure evolution phases
          let frequency, amplitude;
          let waveformModifier = 0;
          
          if (seizureProgressNormalized < 0.2) {
            // Phase 1: Initial low amplitude fast activity (15-25 Hz)
            frequency = 20 + (seizureProgressNormalized * 10); // Increasing frequency
            amplitude = 20 + (seizureProgressNormalized * 80); // Low to medium amplitude
            waveformModifier = 1; // Fast activity
          } 
          else if (seizureProgressNormalized < 0.6) {
            // Phase 2: Rhythmic ictal pattern (8-15 Hz)
            const phase2Progress = (seizureProgressNormalized - 0.2) / 0.4;
            frequency = 20 - (phase2Progress * 5); // Gradually decreasing frequency
            amplitude = 100 + (phase2Progress * 30); // Increasing amplitude
            waveformModifier = 2; // Rhythmic spikes
          }
          else if (seizureProgressNormalized < 0.85) {
            // Phase 3: Slowing phase (3-8 Hz)
            const phase3Progress = (seizureProgressNormalized - 0.6) / 0.25;
            frequency = 15 - (phase3Progress * 10); // Further slowing
            amplitude = 130 * (1 - (phase3Progress * 0.2)); // Slight amplitude decrease
            waveformModifier = 3; // Discrete complexes
          }
          else {
            // Phase 4: Terminal attenuation phase
            const phase4Progress = (seizureProgressNormalized - 0.85) / 0.15;
            frequency = 5 - (phase4Progress * 2); // Continued slowing
            amplitude = 130 * (1 - phase4Progress) * 0.8; // Progressive attenuation
            waveformModifier = 3; // Discrete complexes with attenuation
          }
          
          // Apply amplitude scaling based on lead location
          amplitude *= amplitudeScale;
          
          // Calculate the seizure waveform based on phase
          let waveformValue = 0;
          
          if (waveformModifier === 1) {
            // Fast activity - use multiple sine waves with slightly different frequencies
            const component1 = Math.sin(2 * Math.PI * frequency * timePosition);
            const component2 = Math.sin(2 * Math.PI * (frequency + 3) * timePosition);
            const component3 = Math.sin(2 * Math.PI * (frequency - 2) * timePosition);
            waveformValue = (component1 + 0.3*component2 + 0.2*component3) / 1.5;
          }
          else if (waveformModifier === 2) {
            // Rhythmic spikes - sharper waveform using power functions
            const cyclicPos = (timePosition * frequency) % 1;
            if (cyclicPos < 0.3) {
              // Sharp upstroke
              waveformValue = Math.pow(cyclicPos / 0.3, 0.5);
            } else {
              // Slower downstroke
              waveformValue = Math.pow(1 - ((cyclicPos - 0.3) / 0.7), 0.5);
            }
          }
          else {
            // Discrete complexes with pauses
            const cyclicPos = (timePosition * frequency) % 1;
            if (cyclicPos < 0.2) {
              // Complex (polyspike-like)
              waveformValue = Math.sin(2 * Math.PI * 5 * cyclicPos);
            } else if (cyclicPos < 0.4) {
              // Slow wave after polyspike
              waveformValue = -0.7 * Math.sin(2 * Math.PI * (cyclicPos - 0.2) / 0.2);
            } else {
              // Relative attenuation between complexes
              waveformValue = -0.1 * Math.sin(2 * Math.PI * (cyclicPos - 0.4));
            }
          }
          
          // Add natural variability
          const variability = Math.sin(timePosition * 10) * (amplitude * 0.05);
          
          return centerY + (waveformValue * amplitude) + variability;
        },
        priority: 30 // Highest priority - seizure overrides other patterns
      },
      // Artifacts
      ecgArtifact: {
        custom: true,
        color: '#000000',
        description: 'ECG Artifact',
        draw: (x, centerY, leadName, timePosition) => {
          // Calculate heart rate - steady at a slower rate for clarity
          const heartRate = 65; // Fixed rate for better visibility
          const secondsPerBeat = 60 / heartRate;
          
          // Calculate position within the cardiac cycle
          const beatPosition = (timePosition % secondsPerBeat) / secondsPerBeat;
          
          // Similar to LPDs, but synchronized to ECG rate and all upward deflections
          // Only show spikes during QRS complex (about 10% of cardiac cycle)
          if (beatPosition >= 0.25 && beatPosition < 0.35) {
            // QRS duration ~100ms (0.1 seconds)
            const spikePhase = (beatPosition - 0.25) / 0.1;
            
            // Base amplitude for the spike - reduced for more subtle appearance
            let baseAmplitude = 20; // Reduced from 50 to 20 for much more subtle appearance
            
            // Adjust amplitude based on lead (ensure visible in all channels)
            let leadFactor = 1.0;
            
            // Different leads show different amplitudes
            if (leadName.includes('Fp')) {
              leadFactor = 0.6; // Frontal polar - more subtle
            } else if (leadName.includes('F7') || leadName.includes('F8')) {
              leadFactor = 0.7; // Frontal - subtle but visible
            } else if (leadName.includes('T3') || leadName.includes('T4')) {
              leadFactor = 1.0; // Temporal - highest amplitude (closest to heart/neck)
            } else if (leadName.includes('T5') || leadName.includes('T6')) {
              leadFactor = 0.8; // Posterior temporal - moderate amplitude
            } else if (leadName.includes('O')) {
              leadFactor = 0.5; // Occipital - most subtle
            }
            
            // Create a spike morphology similar to epileptiform spikes but simpler
            let spikeAmplitude = 0;
            
            if (spikePhase < 0.3) {
              // Fast upstroke (30% of QRS duration = ~30ms)
              spikeAmplitude = baseAmplitude * Math.pow(spikePhase / 0.3, 0.6) * leadFactor;
            } else if (spikePhase < 0.7) {
              // Plateau/slow decline (40% of QRS duration = ~40ms)
              const plateauPhase = (spikePhase - 0.3) / 0.4;
              spikeAmplitude = baseAmplitude * (1 - 0.2 * plateauPhase) * leadFactor;
            } else {
              // Fast downstroke (30% of QRS duration = ~30ms)
              const downPhase = (spikePhase - 0.7) / 0.3;
              spikeAmplitude = baseAmplitude * 0.8 * (1 - downPhase) * leadFactor;
            }
            
            // Add slight variation based on lead
            const leadVariation = Math.sin(timePosition * 2.5 * (leadName.charCodeAt(0) % 5)) * 5;
            
            // Return the spike value as an additive offset to centerY
            return spikeAmplitude + leadVariation;
          }
          
          // No ECG artifact outside of QRS complex
          return 0;
        },
        priority: 15, // High priority to ensure visibility
        
        // Add ECG artifact calculation and drawing method
        drawWaveform: function(time) {
          // Calculate heart rate steady at 65 bpm for clarity
          const heartRate = 65;
          const secondsPerBeat = 60 / heartRate;
          
          // Create a "fake ECG" lead at the bottom of the EEG display
          const fakeEcgLeadY = this.canvas.height - 20;
          
          // Clear the area for the ECG lead
          this.ctx.fillStyle = '#f8f8f8';
          this.ctx.fillRect(0, fakeEcgLeadY - 50, this.canvas.width, 70);
          
          // Draw ECG lead label
          this.ctx.fillStyle = '#333';
          this.ctx.font = '12px Arial';
          this.ctx.fillText('ECG', 5, fakeEcgLeadY - 35);
          
          // Draw a bolder line for better visibility
          this.ctx.beginPath();
          this.ctx.strokeStyle = '#333';
          this.ctx.lineWidth = 2; // Increased line thickness for better visibility
          
          // Calculate the ECG pattern
          for (let x = 0; x < this.canvas.width; x++) {
            const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
            const beatPosition = (timePosition % secondsPerBeat) / secondsPerBeat;
            
            let ecgValue = 0;
            
            // P wave (atrial depolarization)
            if (beatPosition >= 0.18 && beatPosition < 0.25) {
              ecgValue = 15 * Math.sin((beatPosition - 0.18) * Math.PI / 0.07);
            }
            // QRS complex (ventricular depolarization)
            else if (beatPosition >= 0.25 && beatPosition < 0.35) {
              const qrsPhase = (beatPosition - 0.25) / 0.1;
              if (qrsPhase < 0.2) {
                // Q wave - negative deflection
                ecgValue = -30 * qrsPhase / 0.2;
              } else if (qrsPhase < 0.6) {
                // R wave - large positive deflection
                ecgValue = -30 + 150 * Math.pow((qrsPhase - 0.2) / 0.4, 0.6);
              } else {
                // S wave - negative deflection after R
                ecgValue = 120 - 150 * Math.pow((qrsPhase - 0.6) / 0.4, 0.5);
              }
            }
            // T wave (ventricular repolarization)
            else if (beatPosition >= 0.45 && beatPosition < 0.65) {
              ecgValue = 30 * Math.sin((beatPosition - 0.45) * Math.PI / 0.2);
            }
            
            // Draw the ECG point
            if (x === 0) {
              this.ctx.moveTo(x, fakeEcgLeadY - ecgValue);
            } else {
              this.ctx.lineTo(x, fakeEcgLeadY - ecgValue);
            }
          }
          
          // Stroke the ECG waveform
          this.ctx.stroke();
          
          // Add grid line to separate ECG from EEG
          this.ctx.beginPath();
          this.ctx.strokeStyle = '#ddd';
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(0, fakeEcgLeadY - 25);
          this.ctx.lineTo(this.canvas.width, fakeEcgLeadY - 25);
          this.ctx.stroke();
        }
      },
      movement: {
        custom: true,
        color: '#000000',
        description: 'Movement Artifact',
        draw: (x, centerY, leadName, timePosition) => {
          // Add initial 10-second delay before any movement occurs
          const initialDelay = 10;
          if (timePosition < initialDelay) {
            return centerY; // No movement during initial delay
          }
          
          // Adjust time to account for the initial delay
          const adjustedTime = timePosition - initialDelay;
          
          // Generate a hash-based random number that's consistent for the same time positions
          const getConsistentRandom = (seed) => {
            const hashStr = (adjustedTime * 12345 + seed * 54321).toString();
            let hash = 0;
            for (let i = 0; i < hashStr.length; i++) {
              hash = (hash << 5) - hash + hashStr.charCodeAt(i);
              hash |= 0; // Convert to 32bit integer
            }
            // Normalize to 0-1 range
            return Math.abs(hash % 1000) / 1000;
          };
          
          // Create highly variable, intermittent movement bursts
          // Use a variable cycle length to make pattern less predictable
          const baseCycle = 30 + getConsistentRandom(adjustedTime * 0.1) * 90; // 30-120 second variable cycle
          const totalCyclePeriod = baseCycle; // Variable total cycle length
          const cyclePosition = (adjustedTime % totalCyclePeriod) / totalCyclePeriod;
          
          // Generate pseudo-random burst durations
          const cycleSeed = Math.floor(adjustedTime / totalCyclePeriod);
          const pseudoRandom = (Math.sin(cycleSeed * 45678.9876) * 0.5 + 0.5);
          
          // Movement duration varies considerably between 1-8 seconds
          const movementDuration = 1 + (pseudoRandom * 7);
          const movementActiveTime = movementDuration / totalCyclePeriod;
          
          // Determine if we're in a movement period - make these rare
          const isMoving = cyclePosition < movementActiveTime && getConsistentRandom(cycleSeed + 999) < 0.7;
          
          // If we're not in a movement period, return baseline
          if (!isMoving) {
            return centerY;
          }
          
          // Determine which leads are affected by this particular movement
          const burstSeed = cycleSeed * 100;
          const leadSeed = leadName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          const affectsThisLead = getConsistentRandom(leadSeed + burstSeed) < 0.5; // 50% chance per lead
          
          if (!affectsThisLead) {
            return centerY; // This lead is unaffected by this movement burst
          }
          
          // Movement intensity varies by lead
          const leadFactor = 0.3 + getConsistentRandom(leadSeed + burstSeed + 1) * 0.7;
          
          // NEW APPROACH: Create dense burst of movement artifact using chunking
          const chunkDuration = 2.0 + getConsistentRandom(cycleSeed + 8888) * 2.0; // 2-4 second chunks
          const chunkPositionInCycle = (cyclePosition / movementActiveTime) * chunkDuration;
          
          // Calculate time inside the current movement burst
          const timeInsideBurst = cyclePosition * totalCyclePeriod;
          
          // Create sharp density variation using multiples of sine waves
          let movementSignal = 0;
          
          // Burst envelope - rise fast, maintain density, fall fast
          let burstEnvelope;
          const normalizedBurstPosition = cyclePosition / movementActiveTime; // 0-1 within burst
          
          if (normalizedBurstPosition < 0.1) {
            // Fast rise (first 10%)
            burstEnvelope = normalizedBurstPosition / 0.1;
          } else if (normalizedBurstPosition > 0.9) {
            // Fast fall (last 10%)
            burstEnvelope = (1.0 - normalizedBurstPosition) / 0.1;
          } else {
            // Full amplitude for middle 80%
            burstEnvelope = 1.0;
          }
          
          // NEW: Use fixed-size dense "clusters" of activity with ~40% coverage 
          // This ensures consistent density throughout the burst
          const segmentLength = 0.15; // 150ms segments
          const segmentIndex = Math.floor(timeInsideBurst / segmentLength);
          const segmentRandom = getConsistentRandom(segmentIndex + leadSeed + cycleSeed * 1000);
          
          // Determine if this segment should be active (40% of segments have activity)
          if (segmentRandom < 0.4) {
            // This segment has dense movement activity
            
            // Sub-segment to create fine structure
            const subSegmentLength = 0.03; // 30ms for fine structure
            const subSegmentPosition = (timeInsideBurst % subSegmentLength) / subSegmentLength;
            const subSegmentIndex = Math.floor((timeInsideBurst % segmentLength) / subSegmentLength);
            
            // Create 6-8 overlapping spikes per active segment for density
            const numSpikes = 6 + Math.floor(getConsistentRandom(segmentIndex + 777) * 3);
            
            for (let i = 0; i < numSpikes; i++) {
              // Each spike has different frequency and phase
              const spikeFreq = 70 + getConsistentRandom(segmentIndex + i * 111) * 80; // 70-150 Hz
              const spikePhase = getConsistentRandom(segmentIndex + i * 222) * Math.PI * 2;
              const spikeAmp = 0.7 + getConsistentRandom(segmentIndex + i * 333) * 0.6; // 0.7-1.3
              
              // Add basic high frequency component
              movementSignal += spikeAmp * Math.sin(timeInsideBurst * spikeFreq * Math.PI * 2 + spikePhase);
              
              // Add harmonics for sharpness
              const harmonic2 = spikeAmp * 0.7 * Math.sin(timeInsideBurst * spikeFreq * 2 * Math.PI * 2 + spikePhase);
              const harmonic3 = spikeAmp * 0.5 * Math.sin(timeInsideBurst * spikeFreq * 3 * Math.PI * 2 + spikePhase);
              
              movementSignal += harmonic2 + harmonic3;
            }
            
            // Further amplify active segments for more contrast
            movementSignal *= 1.5;
          } else {
            // Low amplitude noise between active segments
            // Just enough to maintain visual connection between active segments
            const noiseFreq = 50 + getConsistentRandom(segmentIndex) * 30; // 50-80 Hz
            movementSignal = Math.sin(timeInsideBurst * noiseFreq * Math.PI * 2) * 0.15;
          }
          
          // Apply the burst envelope
          movementSignal *= burstEnvelope;
          
          // Scale by lead factor and base amplitude
          const baseAmplitude = 550; // Increased for more prominence
          const amplitude = baseAmplitude * leadFactor * movementSignal;
          
          return centerY + amplitude;
        },
        priority: 35 // Higher priority than chewing but lower than seizures
      },
      // Add pulse artifact pattern
      pulseArtifact: {
        custom: true,
        color: '#000000',
        description: 'Pulse Artifact',
        draw: (x, centerY, leadName, timePosition) => {
          // Calculate heart rate - use the same rate as ECG artifact for consistency
          const heartRate = 65; // Fixed rate for better visibility
          const secondsPerBeat = 60 / heartRate;
          
          // Calculate position within the cardiac cycle
          const beatPosition = (timePosition % secondsPerBeat) / secondsPerBeat;
          
          // Pulse artifact appears after the QRS complex with a delay
          // QRS is at 0.25-0.35, so pulse artifact starts around 0.4 (reflecting conduction delay)
          if (beatPosition >= 0.4 && beatPosition < 0.98) {
            // Duration of pulse artifact ~580ms (0.58 seconds) - extremely wide delta appearance
            const pulsePhase = (beatPosition - 0.4) / 0.58;
            
            // Base amplitude for the delta wave
            let baseAmplitude = 40;
            
            // Only affect specific mid-temporal leads with opposite polarities
            let leadFactor = 0.0;
            let polarity = 1.0; // Default polarity (upward)
            
            // Strictly limit to mid-temporal leads with specific polarities
            if (leadName === 'F7-T3' || leadName === 'F8-T4') {
              // Lead 1 - frontal-temporal - upward delta
              leadFactor = 1.0; 
              polarity = 1.0; // Upward
            } else if (leadName === 'T3-T5' || leadName === 'T4-T6') {
              // Lead 2 - mid-temporal - downward delta
              leadFactor = 1.0;
              polarity = -1.0; // Downward
            } else {
              // No effect in other leads
              return 0;
            }
            
            // Create a delta wave morphology (slow wave, 1-3 Hz appearance)
            let pulseAmplitude = 0;
            
            // Delta wave has a rounded appearance with a slow rise and fall
            if (pulsePhase < 0.5) {
              // First half - slow rise (resembling delta wave upstroke)
              pulseAmplitude = baseAmplitude * Math.sin(pulsePhase * Math.PI) * leadFactor * polarity;
            } else {
              // Second half - slow decline (resembling delta wave downstroke)
              pulseAmplitude = baseAmplitude * Math.sin((1.0 - (pulsePhase - 0.5) * 2) * Math.PI/2) * leadFactor * polarity;
            }
            
            // Add slight variation between heartbeats
            const beatVariation = Math.sin(timePosition * 0.753) * 4 * polarity;
            
            // Return the pulse artifact as an additive offset
            return pulseAmplitude + beatVariation;
          }
          
          // No pulse artifact outside the specified window
          return 0;
        },
        priority: 14 // Just below ECG priority
      }
    };

    // Setup
    this.setupControls();
    this.bindEvents();
    this.resizeCanvas();
    this.startAnimation();
    
    // Add a property to track pattern fade-in transitions
    this.patternTransitions = new Map();
  }

  calculatePixelDensity() {
    // Create a test element to determine pixel density
    const testElem = document.createElement('div');
    testElem.style.width = '3cm';
    testElem.style.height = '1px';
    testElem.style.position = 'absolute';
    testElem.style.left = '-9999px';
    document.body.appendChild(testElem);
    
    // Measure the actual pixel width of 3cm
    const pixelsFor3cm = testElem.offsetWidth;
    document.body.removeChild(testElem);
    
    // If we couldn't get a sensible value, fall back to an estimate
    if (!pixelsFor3cm || pixelsFor3cm < 50) {
      // Fallback to an estimated 96 DPI (standard for many screens)
      this.pixelsPerMm = 96 / 25.4; // 25.4mm = 1 inch
    } else {
      this.pixelsPerMm = pixelsFor3cm / 30; // 30mm = 3cm
    }
    
    // Calculate timeScale (pixels per second) based on the standard 30mm/sec
    this.timeScale = this.pixelsPerMm * this.standardScale.mmPerSecond;
    
    // Calculate gridSize (pixels per small grid) based on the standard 5mm grid
    this.smallGridSize = this.pixelsPerMm * this.standardScale.smallGridMm;
    
    // Calculate large grid size (pixels per large grid) based on the standard 10mm grid
    this.largeGridSize = this.pixelsPerMm * this.standardScale.largeGridMm;

    // Update display info
    this.updateScaleInfo();
  }

  updateScaleInfo() {
    // Update scale information in the measurement container if it exists
    const measurementContainer = document.querySelector('.measurement-container');
    if (!measurementContainer) return;
    
    try {
      // Try to add ACNS interpretation
      this.updateAcnsInterpretation(measurementContainer);
    } catch (e) {
      console.error('Error updating ACNS interpretation', e);
      // Fallback to basic scale info
      measurementContainer.innerHTML = `
        <div class="measurement-result">
          <span>Scale: ${this.standardScale.mmPerSecond}mm/sec (3cm/sec)</span>
          <span>Display: ${this.pixelsPerMm.toFixed(1)} pixels/mm</span>
          <span>Grid: ${this.smallGridSize.toFixed(0)}px = 5mm</span>
        </div>
      `;
    }
  }
  
  updateAcnsInterpretation(container) {
    if (!container) return;
    
    // Determine the background pattern first
    let backgroundPattern = '';
    let pdrFrequency = '';
    let abnormalFindings = [];
    
    // Check for PDR/alpha (determines if awake and organized)
    const hasPDR = this.waveforms.alpha.modulationPattern;
    const hasAlpha = this.activeWaveforms.has('alpha');
    
    if (hasAlpha && hasPDR) {
      backgroundPattern = 'Awake, Well-Organized';
      pdrFrequency = 'with PDR of 9-10 Hz';
    } else if (hasAlpha && !hasPDR) {
      backgroundPattern = 'Awake, Disorganized';
      pdrFrequency = 'with diffuse alpha at 8-9 Hz';
    } else if (this.activeWaveforms.has('theta')) {
      backgroundPattern = 'Drowsy';
      pdrFrequency = 'with admixed theta at 5-7 Hz';
    } else {
      backgroundPattern = 'Indeterminate';
      pdrFrequency = '';
    }
    
    // Check for specific abnormal patterns
    // Seizure trumps everything else as most significant finding
    if (this.activeWaveforms.has('focalSeizure')) {
      abnormalFindings.push('Right Temporal Seizure');
    } 
    // 3Hz Spike & Wave
    else if (this.activeWaveforms.has('custom3HzSpikeWave')) {
      abnormalFindings.push('Generalized Spike-and-Wave at 3 Hz');
    }
    // LPDs and LRDA
    else {
      // Check for LPDs
      if (this.activeWaveforms.has('lpds')) {
        if (this.activeWaveforms.has('focalSlowing')) {
          abnormalFindings.push('Left Temporal LRDA+S (Lateralized Rhythmic Delta Activity with Superimposed Sharp Waves)');
        } else {
          abnormalFindings.push('Left Temporal LPDs (Lateralized Periodic Discharges at 2 Hz)');
        }
      } 
      // LRDA (Focal Slowing) alone
      else if (this.activeWaveforms.has('focalSlowing')) {
        abnormalFindings.push('Left Temporal LRDA (Lateralized Rhythmic Delta Activity at 1-2 Hz)');
      }
      
      // Spikes and sharp waves (they can appear with the above)
      if (this.activeWaveforms.has('spikes')) {
        abnormalFindings.push('Left Temporal Spikes');
      }
      if (this.activeWaveforms.has('sharpWaves')) {
        abnormalFindings.push('Right Temporal Sharp Waves');
      }
    }
    
    // Format the HTML output
    let acnsOutput = `
      <div class="measurement-result">
        <span><strong>ACNS Interpretation:</strong> ${backgroundPattern} ${pdrFrequency}</span>
      </div>
    `;
    
    // Add abnormal findings if present
    if (abnormalFindings.length > 0) {
      acnsOutput += `
        <div class="measurement-result">
          <span><strong>Abnormal Findings:</strong> ${abnormalFindings.join('; ')}</span>
        </div>
      `;
    }
    
    // Add artifact information if present
    const artifacts = [];
    if (this.activeWaveforms.has('eyeBlinks')) {
      artifacts.push('Eye Blinks');
    }
    if (this.activeWaveforms.has('chewing')) {
      artifacts.push('Chewing Artifact');
    }
    if (this.activeWaveforms.has('sweatArtifact')) {
      artifacts.push('Sweat Artifact');
    }
    if (this.activeWaveforms.has('sixtyHzArtifact')) {
      artifacts.push('60Hz Artifact');
    }
    if (this.activeWaveforms.has('ecgArtifact')) {
      artifacts.push('ECG Artifact');
    }
    if (this.activeWaveforms.has('movement')) {
      artifacts.push('Movement Artifact');
    }
    
    if (artifacts.length > 0) {
      acnsOutput += `
        <div class="measurement-result">
          <span><strong>Artifacts:</strong> ${artifacts.join(', ')}</span>
        </div>
      `;
    }
    
    // Add standard EEG parameters as a reference
    acnsOutput += `
      <div class="measurement-result" style="font-size: 0.8em; color: #666;">
        <span>Scale: ${this.standardScale.mmPerSecond}mm/sec</span>
      </div>
    `;
    
    container.innerHTML = acnsOutput;
  }

  setupControls() {
    const container = document.querySelector('.waveform-controls');
    
    // Add mode selector (now hidden)
    const modeControl = document.createElement('div');
    modeControl.style.display = 'none'; // Changed from 'inline-block' to 'none'
    modeControl.innerHTML = `
      <label>EEG Mode: </label>
      <select onchange="demo.setMode(this.value)">
        <option value="normal" selected>Normal Awake</option>
        <option value="custom">Custom Waveforms</option>
        <option value="mildSlowing">Mild Slowing</option>
        <option value="severeSlowing">Severe Slowing</option>
        <option value="spikeWave3Hz">Spike & Wave (3Hz)</option>
      </select>
    `;
    container.appendChild(modeControl);

    // Add waveform selector
    const waveformControl = document.createElement('div');
    waveformControl.className = 'waveform-selector';
    waveformControl.style.display = 'none';
    waveformControl.innerHTML = `
      <div class="waveform-buttons">
        <button onclick="demo.setWaveform('delta')" class="wave-btn" data-wave="delta">Delta</button>
        <button onclick="demo.setWaveform('theta')" class="wave-btn" data-wave="theta">Theta</button>
        <button onclick="demo.setWaveform('alpha')" class="wave-btn" data-wave="alpha">Alpha</button>
        <button onclick="demo.setWaveform('beta')" class="wave-btn" data-wave="beta">Beta</button>
        <button onclick="demo.setWaveform('gamma')" class="wave-btn" data-wave="gamma">Gamma</button>
        <button onclick="demo.setWaveform('spikes')" class="wave-btn" data-wave="spikes">Spikes</button>
        <button onclick="demo.setWaveform('sharpWaves')" class="wave-btn" data-wave="sharpWaves">Sharp Waves</button>
        <button onclick="demo.setWaveform('slowing')" class="wave-btn" data-wave="slowing">Slowing</button>
      </div>
    `;
    container.appendChild(waveformControl);

    // Add speed control
    const speedControl = document.createElement('div');
    speedControl.style.display = 'inline-block';
    speedControl.innerHTML = `
      <label>Speed: </label>
      <select onchange="demo.setSpeed(this.value)">
        <option value="0.1">0.1x</option>
        <option value="0.25">0.25x</option>
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1" selected>1x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
        <option value="3">3x</option>
        <option value="5">5x</option>
        <option value="10">10x</option>
      </select>
    `;
    container.appendChild(speedControl);

    // Store references
    this.waveformControl = waveformControl;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.calculatePixelDensity();
    });
    
    this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));
    this.canvas.addEventListener('mousedown', (e) => this.handlePanStart(e));
    this.canvas.addEventListener('mousemove', (e) => this.handlePanMove(e));
    this.canvas.addEventListener('mouseup', () => this.handlePanEnd());
    this.canvas.addEventListener('mouseleave', () => this.handlePanEnd());
    
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
  }

  resizeCanvas() {
    const containerWidth = this.canvas.parentElement.clientWidth;
    this.canvas.width = Math.max(600, containerWidth);
    this.canvas.height = this.options.leadCount * this.options.leadSpacing;
    this.drawGrid();
  }

  drawGrid() {
    const { ctx, canvas } = this;

    // Clear canvas
    ctx.fillStyle = this.options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw only 1-second gridlines
    ctx.beginPath();
    ctx.strokeStyle = this.options.majorGridColor;
    ctx.lineWidth = 1;

    // Vertical lines at 1-second intervals
    for (let x = 0; x < canvas.width; x += this.timeScale) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    ctx.stroke();

    // Draw time labels
    ctx.fillStyle = '#666';
    ctx.font = '12px "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
    for (let x = 0; x < canvas.width; x += this.timeScale) {
      const seconds = x / this.timeScale;
      ctx.fillText(`${seconds}s`, x + 5, 15);
    }

    // Draw lead labels with larger font
    this.leads.forEach((lead, index) => {
      const y = index * this.options.leadSpacing + this.options.leadHeight / 2;
      ctx.fillStyle = lead.color;
      ctx.font = 'bold 14px "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(lead.name, 15, y);
    });
  }

  drawWaveform(time) {
    // Update pattern transitions
    this.updatePatternTransitions(time);
    
    this.drawGrid();

    // Calculate alpha cycle to synchronize eye blinks with PDR
    const alphaCyclePeriod = 7.5 + 2.5 * Math.sin(time * 0.1); // 5-10 second cycle

    // Calculate spike timings (more irregular than eye blinks)
    const spikeBaseInterval = 12; // Base interval of ~12 seconds between spikes
    const spikeRandomOffset = Math.sin(time * 0.05) * 2; // +/- 2 second variation
    const spikeInterval = spikeBaseInterval + spikeRandomOffset;
    const spikeTime = Math.floor(time / spikeInterval) * spikeInterval;
    const timeFromSpike = time - spikeTime;
    const spikeDuration = 0.2; // 200ms spike duration
    const hasSpike = timeFromSpike < spikeDuration && this.activeWaveforms.has('spikes');

    // Draw ECG lead at bottom if ECG artifact is active
    if (this.activeWaveforms.has('ecgArtifact')) {
      // Call the ECG artifact's drawWaveform method
      this.waveforms.ecgArtifact.drawWaveform.call(this, time);
    }

    // Draw each lead
    this.leads.forEach((lead, leadIndex) => {
      const leadY = leadIndex * this.options.leadSpacing;
      const centerY = leadY + this.options.leadHeight / 2;
      const leadName = lead.name; // Explicitly define leadName for use in all functions

      // First calculate eye blink baseline for frontal leads
      let eyeBlinkBaseline = new Array(this.canvas.width).fill(centerY);
      let hasEyeBlink = false;
      
      // Check if this is a frontal lead or a temporal lead that might be affected by eye blinks
      if (this.activeWaveforms.has('eyeBlinks') && 
         (leadName === 'Fp1-F7' || leadName === 'Fp2-F8' || 
          leadName === 'F7-T3' || lead.name === 'F8-T4')) {
        
        const isFrontal = (leadName === 'Fp1-F7' || leadName === 'Fp2-F8');
        const isTemporal = (leadName === 'F7-T3' || lead.name === 'F8-T4');
        
        hasEyeBlink = true;
        
        // Get transition factor for eye blinks
        const eyeBlinkFactor = this.getPatternTransitionFactor('eyeBlinks');
        
        // Calculate the eye blink baseline
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Calculate the cycle for this specific position
          const xCyclePeriod = 7.5 + 2.5 * Math.sin(timePosition * 0.1);
          const xCyclePosition = (timePosition % xCyclePeriod) / xCyclePeriod;
          
          // Check if we're in a blink window - just before alpha burst
          // For temporal leads, use a narrower window
          const blinkStart = 0.65;
          const blinkEnd = isFrontal ? 0.75 : 0.72; // Even narrower window for temporal leads
          
          if (xCyclePosition >= blinkStart && xCyclePosition <= blinkEnd) {
            // Calculate blink phase adjusted for the window width
            const blinkWindowWidth = blinkEnd - blinkStart;
            const blinkPhase = (xCyclePosition - blinkStart) / blinkWindowWidth; // 0-1 within the blink
            
            // Use a sine curve for a rounder blink shape
            let blinkAmplitude;
            if (isFrontal) {
              // Full amplitude for frontal leads
              blinkAmplitude = Math.sin(blinkPhase * Math.PI) * 250;
            } else if (isTemporal) {
              // Reduced amplitude (20%) for temporal leads - smaller than before
              
              // Shift the temporal blink slightly to the right by subtracting from the phase
              // This makes the blink appear slightly later in the temporal leads
              const phaseShift = 0.25; // Shift by 25% of the total width (increased from 15%)
              const shiftedPhase = Math.max(0, Math.min(1, blinkPhase - phaseShift));
              
              // Apply amplitude to the shifted phase
              blinkAmplitude = Math.sin(shiftedPhase * Math.PI) * 50;
            }
            
            // Apply transition factor for smooth fading
            blinkAmplitude *= eyeBlinkFactor;
            
            eyeBlinkBaseline[x] = centerY + blinkAmplitude;
          }
        }
      }
      
      // Calculate sweat artifact baseline
      let sweatArtifactBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSweatArtifact = false;
      
      if (this.activeWaveforms.has('sweatArtifact')) {
        // Determine if this lead should be affected by sweat
        let amplitudeScale = 0;
        
        // Primarily affects frontal and temporal leads
        if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8') {
          amplitudeScale = 1.0; // Full effect on frontal leads
          hasSweatArtifact = true;
        } else if (leadName === 'F7-T3' || lead.name === 'F8-T4') {
          amplitudeScale = 0.8; // Strong effect on fronto-temporal
          hasSweatArtifact = true;
        } else if (lead.name === 'T3-T5' || lead.name === 'T4-T6') {
          amplitudeScale = 0.6; // Moderate effect on temporal
          hasSweatArtifact = true;
        } else {
          amplitudeScale = 0.3; // Minimal effect on posterior leads
          hasSweatArtifact = true;
        }
        
        // Get transition factor for sweat artifact
        const sweatArtifactFactor = this.getPatternTransitionFactor('sweatArtifact');
        
        // Calculate the sweat artifact baseline
        if (amplitudeScale > 0) {
          for (let x = 0; x < this.canvas.width; x++) {
            const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
            
            // Use multiple sine waves of different ultra-low frequencies to create realistic sweat artifact
            const baseFreq1 = 0.1 + (Math.sin(timePosition * 0.05) * 0.05); // ~0.1 Hz
            const baseFreq2 = 0.3 + (Math.sin(timePosition * 0.03 + 1) * 0.1); // ~0.3 Hz
            const baseFreq3 = 0.6 + (Math.sin(timePosition * 0.01 + 2) * 0.1); // ~0.6 Hz
            
            // Combine multiple sinusoidal components for a complex waveform
            const wave1 = Math.sin(2 * Math.PI * baseFreq1 * timePosition) * 100; // Primary component
            const wave2 = Math.sin(2 * Math.PI * baseFreq2 * timePosition) * 60; // Secondary component
            const wave3 = Math.sin(2 * Math.PI * baseFreq3 * timePosition) * 30; // Tertiary component
            
            // Add slow baseline drift characteristic of sweat
            const drift = Math.sin(2 * Math.PI * 0.05 * timePosition + lead.name.length) * 40;
            
            // Combine waves with different weights
            const sweatEffect = (wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.1 + drift) * amplitudeScale;
            
            // Apply transition factor
            const adjustedSweatEffect = sweatEffect * sweatArtifactFactor;
            
            // Set the baseline
            sweatArtifactBaseline[x] = centerY + adjustedSweatEffect;
          }
        }
      }
      
      // Calculate 60Hz artifact baseline
      let sixtyHzArtifactBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSixtyHzArtifact = this.activeWaveforms.has('sixtyHzArtifact'); // Immediately set to true if active
      
      if (hasSixtyHzArtifact) {
        // Get transition factor for 60Hz artifact
        const sixtyHzArtifactFactor = this.getPatternTransitionFactor('sixtyHzArtifact');
        
        // Calculate the 60Hz artifact baseline
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Use the 60Hz artifact custom draw function 
          const sixtyHzValue = this.waveforms.sixtyHzArtifact.draw(x, centerY, leadName, timePosition);
          
          // Apply the value directly to the baseline
          sixtyHzArtifactBaseline[x] = sixtyHzValue;
        }
      }
      
      // Initialize other arrays for all the leads
      let ecgArtifactBaseline = new Array(this.canvas.width).fill(centerY); // Changed to centerY for replacement approach
      let hasECGArtifact = this.activeWaveforms.has('ecgArtifact');
      
      // Add initialization for pulse artifact
      let pulseArtifactBaseline = new Array(this.canvas.width).fill(centerY);
      let hasPulseArtifact = this.activeWaveforms.has('pulseArtifact');
      
      if (hasECGArtifact) {
        // Calculate ECG waveform for each canvas position
        const ecgArtifactFactor = this.getPatternTransitionFactor('ecgArtifact');
        
        for (let x = 0; x < this.canvas.width; x++) {
          // Calculate time position for this x coordinate
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Get ECG offset from base ECG function
          const ecgOffset = this.waveforms.ecgArtifact.draw(x, 0, leadName, timePosition);
          
          // Apply transition factor for smooth appearance/disappearance
          const adjustedEcgOffset = ecgOffset * ecgArtifactFactor;
          
          // Save in our array of values, invert so it shows as upward deflections as expected
          ecgArtifactBaseline[x] = centerY - adjustedEcgOffset; // Inverted to show upward deflections
        }
      }

      // Calculate pulse artifact, which depends on ECG timing
      if (hasPulseArtifact) {
        // Calculate pulse waveform for each canvas position
        const pulseArtifactFactor = this.getPatternTransitionFactor('pulseArtifact');
        
        for (let x = 0; x < this.canvas.width; x++) {
          // Calculate time position for this x coordinate
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Get pulse offset from pulse artifact function
          const pulseOffset = this.waveforms.pulseArtifact.draw(x, 0, leadName, timePosition);
          
          // Apply transition factor for smooth appearance/disappearance
          const adjustedPulseOffset = pulseOffset * pulseArtifactFactor;
          
          // Save in our array of values
          pulseArtifactBaseline[x] = centerY - adjustedPulseOffset; // Inverted to show upward deflections
        }
      }
      
      // Now calculate left temporal spike effect if spikes are enabled
      let spikeBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSpike = this.activeWaveforms.has('spikes') && 
                     (lead.name === 'F7-T3' || lead.name === 'T3-T5' ||
                      lead.name === 'Fp1-F7' || lead.name === 'T5-O1');
                    
      if (hasSpike) {
        // Get transition factor for spikes (0-1)
        const spikeFactor = this.getPatternTransitionFactor('spikes');
        
        // Determine polarity and amplitude based on lead
        let polarity = 1;
        let amplitudeScale = 1;
        
        if (lead.name === 'T3-T5') {
          // Phase reversal in T3-T5
          polarity = -1; 
          amplitudeScale = 1;
        } else if (lead.name === 'Fp1-F7') {
          // Slight deflection in the lead above with same polarity but lower amplitude
          polarity = 1;
          amplitudeScale = 0.5; // 50% of the amplitude
        } else if (lead.name === 'T5-O1') {
          // Slight deflection in the lead below with same polarity as T3-T5 but lower amplitude
          polarity = -1;
          amplitudeScale = 0.4; // 40% of the amplitude
        }
        
        // Calculate the spike pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // More realistic spike timing - variable intervals, sometimes clustering
          // Use a combination of regular timing and clustering effects
          
          // Apply spike frequency parameter (lower value = longer intervals)
          const frequencyAdjustment = 1.0 / this.spikeFrequency; // Inverse relationship
          
          // Base timing uses a non-linear function to create irregular but deterministic intervals
          const baseIntervalFactor = 0.8 + 0.4 * Math.sin(timePosition * 0.03);
          
          // Create clustering effect where spikes sometimes occur closer together
          const clusterFactor = Math.sin(timePosition * 0.008) * 0.5 + 0.5; // 0-1 value
          const clusterThreshold = 0.7; // Only cluster when factor is high
          
          // Calculate effective interval - shorter during clusters, longer outside clusters
          let effectiveInterval;
          
          // NEW IMPLEMENTATION: Periodicity is now in Hz (0-3Hz)
          // - 0 Hz means random/non-periodic
          // - 0.5-3 Hz means specific frequency in Hz
          
          if (this.spikePeriodicity > 0) {
            // Convert from Hz to seconds (period = 1/frequency)
            effectiveInterval = 1.0 / this.spikePeriodicity;
            
            // Add slight variability for natural appearance (less at higher frequencies)
            const maxVariability = Math.max(0, 0.1 - (this.spikePeriodicity * 0.02));
            const variabilityFactor = 1.0 + (Math.sin(timePosition * 0.3) * maxVariability);
            effectiveInterval *= variabilityFactor;
          } else {
            // At periodicity = 0 Hz (random), use variable timing with clustering
            if (clusterFactor > clusterThreshold) {
              // In clustering mode - spikes are closer together
              effectiveInterval = 5.5 + Math.sin(timePosition * 0.15) * 1.5;
            } else {
              // Regular mode - more variable intervals
              effectiveInterval = 12 + Math.sin(timePosition * 0.05) * 2;
            }
            
            // Apply the base interval factor for more natural variation
            effectiveInterval *= baseIntervalFactor;
            
            // Apply frequency adjustment to make spikes more or less frequent
            effectiveInterval *= frequencyAdjustment;
          }
          
          // Calculate nearest spike time using this variable interval
          let nearestSpikeTime;
          
          if (this.spikePeriodicity > 0) {
            // For any non-zero periodicity, use the frequency-based effectiveInterval
            nearestSpikeTime = Math.floor(timePosition / effectiveInterval) * effectiveInterval;
          } else {
            // For periodicity = 0, use more variable timing
            // Initialize variables for the while loop
            let currentTime = 0;
            nearestSpikeTime = 0;
            
            while (currentTime <= timePosition) {
              // Calculate next interval dynamically based on current time
              const fixedComponent = 5.5 * frequencyAdjustment;
              const variableComponent = 8 * Math.pow(Math.sin(currentTime * 0.01), 2) + 
                                      Math.sin(currentTime * 0.15) * 2;
              
              const dynamicInterval = fixedComponent + variableComponent;
              currentTime += dynamicInterval;
              if (currentTime > timePosition) break;
              nearestSpikeTime = currentTime;
            }
          }
          
          const xTimeFromSpike = timePosition - nearestSpikeTime;
          
          // Add slight delay to propagation for leads above/below 
          let timeOffset = 0;
          if (lead.name === 'Fp1-F7') {
            timeOffset = 0.02; // 20ms delay for propagation upward
          } else if (lead.name === 'T5-O1') {
            timeOffset = 0.03; // 30ms delay for propagation downward
          }
          
          const adjustedTimeFromSpike = xTimeFromSpike - timeOffset;
          
          // More realistic spike duration - exactly 70ms duration per ACNS criteria
          const spikeDuration = 0.07; 
          
          // Check if we're in a spike window (accounting for any delay)
          if (adjustedTimeFromSpike >= 0 && adjustedTimeFromSpike < spikeDuration) {
            // Calculate spike shape - sharper than eye blinks
            let spikeAmplitude;
            
            // Create an asymmetric spike shape with classic epileptiform morphology
            // Per ACNS criteria: pointed peak, steeper upstroke than downstroke, duration <70ms
            if (adjustedTimeFromSpike < 0.02) { // Very fast upstroke (20ms)
              // Sharp, vertical rise with accelerating trajectory - classic EEG spike morphology
              spikeAmplitude = 85 * Math.pow(adjustedTimeFromSpike / 0.02, 0.5);
            } else if (adjustedTimeFromSpike < 0.04) { // Steeper initial downstroke (20ms)
              const downPhase = (adjustedTimeFromSpike - 0.02) / 0.02;
              // Very steep initial descent
              spikeAmplitude = 85 * (1 - Math.pow(downPhase, 0.8)); 
            } else { // Slow after-wave with biphasic morphology (30ms)
              const afterWavePhase = (adjustedTimeFromSpike - 0.04) / (spikeDuration - 0.04);
              // More pronounced negative after-wave (biphasic morphology)
              spikeAmplitude = 85 * (-0.3 * Math.sin(afterWavePhase * Math.PI)) * 
                              (1 - Math.pow(afterWavePhase, 0.7));
            }
            
            // Add slight variability to spike amplitude (±10%)
            const spikeVariability = 1 + (Math.sin(nearestSpikeTime * 4.27) * 0.1);
            spikeAmplitude *= spikeVariability;
            
            // Apply pattern transition factor
            spikeAmplitude *= spikeFactor;
            
            // Apply polarity and scaling
            spikeBaseline[x] = centerY + (spikeAmplitude * polarity * amplitudeScale);
          }
        }
      }
      
      // Calculate sharp waves (temporal right side)
      let sharpWaveBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSharpWaves = this.activeWaveforms.has('sharpWaves') && 
                         (lead.name === 'F8-T4' || lead.name === 'T4-T6' ||
                          lead.name === 'Fp2-F8' || lead.name === 'T6-O2');
                         
      if (hasSharpWaves) {
        // Get transition factor for sharp waves
        const sharpWavesFactor = this.getPatternTransitionFactor('sharpWaves');
        
        // Determine polarity and amplitude based on lead
        let polarity = 1;
        let amplitudeScale = 1;
        
        if (lead.name === 'T4-T6') {
          // Phase reversal in T4-T6
          polarity = -1; 
          amplitudeScale = 1;
        } else if (lead.name === 'Fp2-F8') {
          // Increased deflection in the lead above
          polarity = 1;
          amplitudeScale = 0.6; // 60% of amplitude
        } else if (lead.name === 'T6-O2') {
          // Increased deflection in the lead below
          polarity = -1;
          amplitudeScale = 0.5; // 50% of amplitude
        }
        
        // Calculate the sharp wave pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // More realistic sharp wave timing with variable intervals
          // Create clustering pattern occasionally
          
          // Apply sharp wave frequency parameter (lower value = longer intervals)
          const frequencyAdjustment = 1.0 / this.sharpWaveFrequency; // Inverse relationship
          
          // Base timing uses a non-linear function to create irregular but deterministic intervals
          const baseIntervalFactor = 0.9 + 0.2 * Math.sin(timePosition * 0.025);
          
          // Calculate effective interval based on periodicity
          let effectiveInterval;
          
          // Apply periodicity parameter (now in Hz)
          // When periodicity is > 0, use that exact frequency in Hz
          // When periodicity is 0, use variable intervals
          if (this.sharpWavePeriodicity > 0) {
            // Convert from Hz to seconds (period = 1/frequency)
            effectiveInterval = 1.0 / this.sharpWavePeriodicity;
            
            // Add slight variability for natural appearance (less at higher frequencies)
            const maxVariability = Math.max(0, 0.15 - (this.sharpWavePeriodicity * 0.03));
            const variabilityFactor = 1.0 + (Math.sin(timePosition * 0.3) * maxVariability);
            effectiveInterval *= variabilityFactor;
          } else {
            // At periodicity = 0 Hz (random), use variable timing
            // Sharp waves tend to be more frequent than spikes with less clustering 
            effectiveInterval = (7 + Math.sin(timePosition * 0.04) * 1.5) * baseIntervalFactor;
            
            // Apply frequency adjustment to make sharp waves more or less frequent
            effectiveInterval *= frequencyAdjustment;
          }
          
          // Calculate nearest sharp wave time using this variable interval
          let nearestSharpWaveTime;
          
          if (this.sharpWavePeriodicity > 0) {
            // For any non-zero periodicity, use the frequency-based effectiveInterval
            nearestSharpWaveTime = Math.floor(timePosition / effectiveInterval) * effectiveInterval;
          } else {
            // For periodicity = 0, use more variable timing
            // Initialize variables for the while loop
            let currentTime = 0;
            nearestSharpWaveTime = 0;
            
            while (currentTime <= timePosition) {
              // More regular intervals with less variation than spikes
              const dynamicInterval = 7 + Math.sin(currentTime * 0.07) * 1.5;
              // Apply frequency adjustment
              currentTime += dynamicInterval * frequencyAdjustment;
              if (currentTime > timePosition) break;
              nearestSharpWaveTime = currentTime;
            }
          }
          
          const timeFromSharpWave = timePosition - nearestSharpWaveTime;
          
          // Add slight delay to propagation for leads above/below
          let timeOffset = 0;
          if (lead.name === 'Fp2-F8') {
            timeOffset = 0.03; // 30ms delay for propagation upward
          } else if (lead.name === 'T6-O2') {
            timeOffset = 0.04; // 40ms delay for propagation downward
          }
          
          const adjustedTimeFromSharpWave = timeFromSharpWave - timeOffset;
          
          // Per ACNS criteria: Sharp waves duration 70-200ms (we'll use ~150ms to differentiate from spikes)
          const sharpWaveDuration = 0.15;
          
          // Check if we're in a sharp wave window
          if (adjustedTimeFromSharpWave >= 0 && adjustedTimeFromSharpWave < sharpWaveDuration) {
            // Calculate sharp wave shape - more realistic morphology
            let sharpWaveAmplitude;
            
            // Per ACNS criteria: sharply contoured but less pointed than spike, duration 70-200ms
            // Modified shape for appropriate duration with realistic morphology
            if (adjustedTimeFromSharpWave < 0.04) { // Initial rise phase (40ms)
              // Pointed rise but slightly less sharp than a spike
              sharpWaveAmplitude = 100 * Math.pow(adjustedTimeFromSharpWave / 0.04, 0.65); 
            } else if (adjustedTimeFromSharpWave < 0.1) { // Longer downslope (60ms)
              const downPhase = (adjustedTimeFromSharpWave - 0.04) / 0.06;
              
              // More gradual descent than spike - key differentiating feature
              sharpWaveAmplitude = 100 * (1 - Math.pow(downPhase, 0.9));
            } else { // After-potential (50ms)
              const afterWavePhase = (adjustedTimeFromSharpWave - 0.1) / (sharpWaveDuration - 0.1);
              // Prominent slow after-wave (more pronounced than in spikes)
              sharpWaveAmplitude = 100 * (-0.4 * Math.sin(afterWavePhase * Math.PI)) * 
                                 (1 - Math.pow(afterWavePhase, 0.7));
            }
            
            // Add more subtle variability to sharp wave amplitude (±7%)
            const sharpWaveVariability = 1 + (Math.sin(nearestSharpWaveTime * 3.85) * 0.07);
            sharpWaveAmplitude *= sharpWaveVariability;
            
            // Apply pattern transition factor
            sharpWaveAmplitude *= sharpWavesFactor;
            
            // Apply polarity and scaling
            sharpWaveBaseline[x] = centerY + (sharpWaveAmplitude * polarity * amplitudeScale);
          }
        }
      }

      // Calculate LRDA (Lateralized Rhythmic Delta Activity)
      let focalSlowingBaseline = new Array(this.canvas.width).fill(centerY);
      
      // Use the current timestamp to ensure consistent selection within a session
      // but varies between sessions
      const timestamp = new Date().getTime();
      const sessionSeed = Math.floor(timestamp / 1000) % 1000; // Changes every session
      
      // Generate a random lead pair that remains fixed during usage
      // Use a property to store the selected leads if not already set
      if (!this.lrdaLeadPair) {
        const random = Math.abs(Math.sin(sessionSeed * 12345.6789));
        // Select a starting lead index between 0 and 6 (to ensure second lead exists)
        this.lrdaLeadPair = {
          start: Math.floor(random * 7),
          initialized: true
        };
        console.log("Selected LRDA lead pair starting at index:", this.lrdaLeadPair.start);
      }
      
      // Check if the current lead is one of the two adjacent leads selected for LRDA
      let hasFocalSlowing = this.activeWaveforms.has('focalSlowing') && 
                           (leadIndex === this.lrdaLeadPair.start || 
                            leadIndex === this.lrdaLeadPair.start + 1);
                         
      if (hasFocalSlowing) {
        // Get transition factor for focal slowing
        const focalSlowingFactor = this.getPatternTransitionFactor('focalSlowing');
        
        // Maximum amplitude in the second affected lead, slightly less in the first
        let amplitudeScale = 1.0;
        
        if (leadIndex === this.lrdaLeadPair.start) {
          amplitudeScale = 0.85; // 85% amplitude in first lead
        } else if (leadIndex === this.lrdaLeadPair.start + 1) {
          amplitudeScale = 1.0; // Full amplitude in second lead
        }
        
        // Calculate the LRDA pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Use the user-selected periodicity instead of fixed value
          const baseFreq = this.lrdaPeriodicity; // User-configurable frequency (0-2 Hz)
          
          // Create evolving frequency pattern (slight variation around base frequency)
          const evolveRate = Math.sin(timePosition * 0.03) * 0.1; // Reduced variation
          let effectiveFreq = baseFreq * (1 + evolveRate);
          
          // Special handling for 0 Hz (random discharges)
          let burstModulator = 0;
          
          if (baseFreq === 0) {
            // In 0 Hz mode, generate random infrequent discharges (similar to spike and wave)
            // Create a seed based on time that changes every ~8-10 seconds
            const dischargeInterval = 9; // Base interval of 9 seconds
            const randomSeed = Math.floor(timePosition / dischargeInterval);
            
            // Use a consistent random value for this time period
            const pseudo_random = (Math.sin(randomSeed * 12345.6789) * 0.5 + 0.5);
            
            // Add a small random variation to the interval (±1 second)
            const adjustedInterval = dischargeInterval + (pseudo_random * 2 - 1);
            
            // Calculate current position within the interval
            const intervalPosition = timePosition % adjustedInterval;
            
            // Discharge occurs at the beginning of the interval
            if (intervalPosition < 0.7) { // 700ms discharge duration
              // Calculate phase within the discharge (0 to 1)
              const dischargePhase = intervalPosition / 0.7;
              
              // Create smooth envelope for discharge
              const envelope = Math.sin(Math.PI * dischargePhase) * 0.9 + 0.1;
              
              // Set the modulator based on the envelope
              burstModulator = envelope;
              
              // Use a higher effective frequency for random discharges (waves at ~2-3 Hz)
              effectiveFreq = 2.5;
            }
          } else {
            // Regular LRDA pattern with bursts when frequency > 0
            // Create distinct burst pattern (10-15 second bursts with 5-10 second pauses)
            const burstCycle = 20 + Math.sin(timePosition * 0.04) * 5; // 15-25 second total cycle
            const burstPosition = (timePosition % burstCycle) / burstCycle;
            
            // Active for 60% of the cycle (longer bursts characteristic of LRDA)
            if (burstPosition < 0.6) {
              // Within active burst period
              const burstPhase = burstPosition / 0.6;
              
              // Amplitude waxing and waning within burst (characteristic of LRDA)
              if (burstPhase < 0.15) {
                // Ramp up - first 15% of burst
                burstModulator = burstPhase / 0.15;
              } else if (burstPhase > 0.85) {
                // Ramp down - last 15% of burst
                burstModulator = (1 - burstPhase) / 0.15;
              } else {
                // Middle of burst - slight amplitude variation (not perfectly constant)
                burstModulator = 0.9 + 0.1 * Math.sin(burstPhase * Math.PI * 4);
              }
            }
          }
          
          // Calculate LRDA waveform with appropriate amplitude (20-40 μV)
          // Higher amplitude for higher periodicity values to maintain visibility
          const baseAmplitude = 30 * (1 + (baseFreq > 0 ? baseFreq * 0.2 : 0));
          const amplitude = baseAmplitude * amplitudeScale * burstModulator;
          const phase = 2 * Math.PI * effectiveFreq * timePosition;
          
          // Create smoother, more sinusoidal waveform (less sharp contours)
          const sharpness = 0.8; // Closer to 1.0 means more sinusoidal
          const normalizedSine = Math.sin(phase);
          const smootherWave = Math.sign(normalizedSine) * Math.pow(Math.abs(normalizedSine), sharpness);
          
          // Add minor harmonics for realistic appearance
          const mainWave = smootherWave;
          const harmonic1 = 0.2 * Math.sin(phase * 2 + 0.2); // Second harmonic
          const harmonic2 = 0.1 * Math.sin(phase * 3 - 0.1); // Third harmonic
          
          // Combine waves into final LRDA pattern
          const lrdaValue = amplitude * (mainWave + harmonic1 + harmonic2);
          
          // LRDA completely disrupts background when active
          focalSlowingBaseline[x] = centerY + lrdaValue;
          
          // Apply pattern transition factor
          focalSlowingBaseline[x] *= focalSlowingFactor;
        }
      }

      // Calculate GRDA (Generalized Rhythmic Delta Activity) - affects all channels
      let generalizedSlowingBaseline = new Array(this.canvas.width).fill(centerY);
      let hasGeneralizedSlowing = this.activeWaveforms.has('generalizedSlowing');
                         
      if (hasGeneralizedSlowing) {
        // Get transition factor for generalized slowing
        const generalizedSlowingFactor = this.getPatternTransitionFactor('generalizedSlowing');
        
        // Subtle variation in amplitude across channels (for natural appearance)
        // Use lead index to create slight variation (5% per channel)
        const leadVariation = 0.95 + (leadIndex * 0.01);
        
        // Calculate the GRDA pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Use the user-selected periodicity instead of fixed value
          const baseFreq = this.grdaPeriodicity || 1.0; // User-configurable frequency (0-2 Hz), default 1Hz
          
          // Create evolving frequency pattern (slight variation around base frequency)
          const evolveRate = Math.sin(timePosition * 0.02) * 0.1; // Reduced variation
          let effectiveFreq = baseFreq * (1 + evolveRate);
          
          // Special handling for 0 Hz (random discharges)
          let burstModulator = 0;
          
          if (baseFreq === 0) {
            // In 0 Hz mode, generate random infrequent discharges
            // Create a seed based on time that changes every ~10-12 seconds
            const dischargeInterval = 11; // Base interval of 11 seconds
            const randomSeed = Math.floor(timePosition / dischargeInterval);
            
            // Use a consistent random value for this time period
            const pseudo_random = (Math.sin(randomSeed * 54321.9876) * 0.5 + 0.5);
            
            // Add a small random variation to the interval (±1 second)
            const adjustedInterval = dischargeInterval + (pseudo_random * 2 - 1);
            
            // Calculate current position within the interval
            const intervalPosition = timePosition % adjustedInterval;
            
            // Discharge occurs at the beginning of the interval
            if (intervalPosition < 0.8) { // 800ms discharge duration (slightly longer than LRDA)
              // Calculate phase within the discharge (0 to 1)
              const dischargePhase = intervalPosition / 0.8;
              
              // Create smooth envelope for discharge
              const envelope = Math.sin(Math.PI * dischargePhase) * 0.9 + 0.1;
              
              // Set the modulator based on the envelope
              burstModulator = envelope;
              
              // Use a lower effective frequency for random discharges (waves at ~1.5-2 Hz)
              effectiveFreq = 1.5 + (leadIndex * 0.05); // Slight variation by lead
            }
            } else {
            // Regular GRDA pattern with bursts when frequency > 0
            // Create distinct burst pattern (15-20 second bursts with 5-10 second pauses)
            const burstCycle = 25 + Math.sin(timePosition * 0.03) * 5; // 20-30 second total cycle
            const burstPosition = (timePosition % burstCycle) / burstCycle;
            
            // Active for 70% of the cycle (longer bursts characteristic of GRDA vs LRDA)
            if (burstPosition < 0.7) {
              // Within active burst period
              const burstPhase = burstPosition / 0.7;
              
              // Amplitude waxing and waning within burst (characteristic of GRDA)
              if (burstPhase < 0.2) {
                // Ramp up - first 20% of burst
                burstModulator = burstPhase / 0.2;
              } else if (burstPhase > 0.8) {
                // Ramp down - last 20% of burst
                burstModulator = (1 - burstPhase) / 0.2;
              } else {
                // Middle of burst - slight amplitude variation (not perfectly constant)
                burstModulator = 0.9 + 0.1 * Math.sin(burstPhase * Math.PI * 3);
              }
            }
          }
          
          // Calculate GRDA waveform with appropriate amplitude (20-40 μV)
          // Higher amplitude for higher periodicity values to maintain visibility
          const baseAmplitude = 25 * (1 + (baseFreq > 0 ? baseFreq * 0.15 : 0));
          const amplitude = baseAmplitude * leadVariation * burstModulator;
          
          // Add slight phase offset based on lead index to create propagation effect
          const phaseOffset = leadIndex * 0.3;
          const phase = 2 * Math.PI * effectiveFreq * timePosition + phaseOffset;
          
          // Create smoother, more sinusoidal waveform (less sharp contours)
          const sharpness = 0.9; // More sinusoidal than LRDA
          const normalizedSine = Math.sin(phase);
          const smootherWave = Math.sign(normalizedSine) * Math.pow(Math.abs(normalizedSine), sharpness);
          
          // Add minor harmonics for realistic appearance
          const mainWave = smootherWave;
          const harmonic1 = 0.15 * Math.sin(phase * 2 + 0.3); // Second harmonic
          const harmonic2 = 0.05 * Math.sin(phase * 3 - 0.2); // Third harmonic
          
          // Combine waves into final GRDA pattern
          const grdaValue = amplitude * (mainWave + harmonic1 + harmonic2);
          
          // GRDA completely disrupts background when active
          generalizedSlowingBaseline[x] = centerY + grdaValue;
          
          // Apply pattern transition factor
          generalizedSlowingBaseline[x] = centerY + ((generalizedSlowingBaseline[x] - centerY) * generalizedSlowingFactor);
        }
      }

      // Calculate chewing artifact (affects temporalis muscle areas - all temporal leads)
      let chewingBaseline = new Array(this.canvas.width).fill(centerY);
      let hasChewing = this.activeWaveforms.has('chewing') && 
                       (lead.name === 'F7-T3' || lead.name === 'F8-T4' ||
                        lead.name === 'T3-T5' || lead.name === 'T4-T6');
      
      // Add a flag to track if any chewing is active at this moment to avoid flat lines
      let hasActiveChewingPoints = false;
      
      if (hasChewing) {
        // Calculate chewing artifact pattern
        // Chewing typically occurs at ~1Hz and appears as high-frequency EMG bursts
        const chewingFactor = this.patternTransitions.get('chewing') || 1; // Default to full intensity if no transition
        
        console.log(`Drawing chewing for ${lead.name}, factor: ${chewingFactor}`);
        
        // Use the draw function from the waveform definition instead of generating separately
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          try {
            chewingBaseline[x] = this.waveforms.chewing.draw(x, centerY, lead.name, timePosition);
            
            // Check if this point has active chewing (differs from baseline)
            if (Math.abs(chewingBaseline[x] - centerY) > 1) {
              hasActiveChewingPoints = true;
            }
          } catch (error) {
            console.error("Error generating chewing waveform:", error);
            chewingBaseline[x] = centerY;
          }
        }
        
        // Log whether we have any active points
        if (hasActiveChewingPoints) {
          console.log(`Active chewing points detected for ${lead.name}`);
        }
      }

      // Calculate movement artifact (affects random leads)
      let movementBaseline = new Array(this.canvas.width).fill(centerY);
      let hasMovement = this.activeWaveforms.has('movement');

      // Add a flag to track if any movement is active at this moment
      let hasActiveMovementPoints = false;

      if (hasMovement) {
        // Calculate movement artifact pattern
        const movementFactor = this.patternTransitions.get('movement') || 1; // Default to full intensity if no transition
        
        // Use the draw function from the waveform definition
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          try {
            movementBaseline[x] = this.waveforms.movement.draw(x, centerY, lead.name, timePosition);
            
            // Check if this point has active movement (differs from baseline)
            if (Math.abs(movementBaseline[x] - centerY) > 1) {
              hasActiveMovementPoints = true;
            }
          } catch (error) {
            console.error("Error generating movement waveform:", error);
            movementBaseline[x] = centerY;
          }
        }
      }

      // Calculate 3Hz spike and wave pattern (generalized)
      let spikeWaveBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSpikeWave = this.activeWaveforms.has('custom3HzSpikeWave');
      
      // Calculate custom spike and wave pattern with adjustable frequency
      let spikeAndWavesBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSpikeAndWaves = this.activeWaveforms.has('spikeAndWaves');
      
      if (hasSpikeAndWaves) {
        // Get transition factor for spike and waves
        const spikeAndWavesFactor = this.getPatternTransitionFactor('spikeAndWaves');
        
        // Calculate the spike and wave pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Use the spike and wave generator function
          const spikeAndWaveValue = this.waveforms.spikeAndWaves.draw(x, centerY, leadName, timePosition);
          
          // Apply transition factor
          const adjustedValue = centerY + ((spikeAndWaveValue - centerY) * spikeAndWavesFactor);
          
          // Set the value
          spikeAndWavesBaseline[x] = adjustedValue;
        }
      }
      
      if (hasSpikeWave) {
        // Get transition factor for 3Hz spike-wave
        const spikeWaveFactor = this.getPatternTransitionFactor('custom3HzSpikeWave');
        
        // Calculate the 3Hz spike-wave pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Calculate intensity factor based on burst timing
          const burstPeriod = 10; // 10 second cycle (3s burst, 7s normal)
          const normalizedCyclePosition = (timePosition % burstPeriod) / burstPeriod;
          let intensityFactor = 0;
          
          // Bursts with gradual onset/offset
          if (normalizedCyclePosition < 0.3) { // 3 second burst (0-30% of cycle)
            // Calculate intensity - smooth transitions at start and end of burst
            if (normalizedCyclePosition < 0.05) { // First 0.5 seconds = ramp up
              intensityFactor = normalizedCyclePosition / 0.05; // 0 to 1 over 0.5 seconds
            } else if (normalizedCyclePosition > 0.25) { // Last 0.5 seconds = ramp down
              intensityFactor = 1 - ((normalizedCyclePosition - 0.25) / 0.05); // 1 to 0 over 0.5 seconds
            } else {
              intensityFactor = 1; // Full intensity in the middle of the burst
            }
          }
          
          if (intensityFactor > 0) {
            // Calculate amplitude based on lead location for more realistic appearance
            let amplitudeScale = 1.0;
            
            // Frontal and central regions tend to show higher amplitude spike-waves
            if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8' || 
                leadName === 'F7-T3' || leadName === 'F8-T4') {
              amplitudeScale = 1.2; // Higher in frontal leads
            } else if (leadName === 'T3-T5' || leadName === 'T4-T6') {
              amplitudeScale = 0.9; // Slightly lower in mid-temporal regions
            } else if (leadName === 'T5-O1' || leadName === 'T6-O2') {
              amplitudeScale = 0.8; // Lowest in occipital regions
            }
            
            // Basic parameters for 3Hz spike-wave
            const frequency = 3; // 3Hz base frequency
            const cycleTime = 1 / frequency; // Time for one full cycle
            
            // Calculate where we are in the current cycle
            const spikeWavePosition = (timePosition % cycleTime) / cycleTime; // 0 to 1 within each cycle
            
            // Calculate the spike-wave shape
            let amplitude = 0;
            
            // Spike (first 10% of the cycle) - steep upward then immediate drop
            if (spikeWavePosition < 0.1) {
              const spikePhase = spikeWavePosition / 0.1;
              if (spikePhase < 0.3) {
                // Fast upstroke (first 30% of spike)
                amplitude = 120 * amplitudeScale * (spikePhase / 0.3);
              } else {
                // Fast downstroke (remaining 70% of spike)
                amplitude = 120 * amplitudeScale * (1 - ((spikePhase - 0.3) / 0.7));
              }
            } 
            // Slow wave (following 90% of cycle)
            else {
              const wavePhase = (spikeWavePosition - 0.1) / 0.9;
              // Create a smoother wave that starts negative then returns to baseline
              // Use a smoother curve with slightly lower amplitude
              amplitude = -70 * amplitudeScale * Math.pow(Math.sin(wavePhase * Math.PI), 0.9);
            }
            
            // Add minor variability in amplitude to make it more realistic
            const variability = Math.sin(timePosition * 5) * 5;
            amplitude += variability;
            
            // Apply intensity factor based on burst onset/offset
            amplitude *= intensityFactor;
            
            // Apply pattern transition factor
            const finalAmplitude = (amplitude * spikeWaveFactor);
            
            // Calculate final value with center and apply transition
            spikeWaveBaseline[x] = centerY + finalAmplitude;
          } else {
            // Outside of burst, return to baseline
            spikeWaveBaseline[x] = centerY;
          }
        }
      }

      // Calculate focal seizure pattern
      let focalSeizureBaseline = new Array(this.canvas.width).fill(centerY);
      let hasFocalSeizure = this.activeWaveforms.has('focalSeizure');
      
      if (hasFocalSeizure) {
        // Get transition factor for focal seizure
        const focalSeizureFactor = this.getPatternTransitionFactor('focalSeizure');
        
        // Calculate the focal seizure pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Use the focal seizure custom draw function but apply transition factor
          const baseValue = this.waveforms.focalSeizure.draw(x, centerY, leadName, timePosition);
          
          // Calculate transition - blend between baseline and seizure pattern
          focalSeizureBaseline[x] = centerY + ((baseValue - centerY) * focalSeizureFactor);
        }
      }

      // Calculate LPDs (Lateralized Periodic Discharges) pattern
      let lpdsBaseline = new Array(this.canvas.width).fill(0); // Changed to zeros for additive approach
      let hasLPDs = this.activeWaveforms.has('lpds');
      
      if (hasLPDs) {
        // Get transition factor for LPDs
        const lpdsFactor = this.getPatternTransitionFactor('lpds');
        
        // Calculate the LPDs pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Use the LPDs custom draw function to get the y value for this position
          // Store as offset from center rather than absolute position for additive approach
          let lpdsValue = this.waveforms.lpds.draw(x, 0, leadName, timePosition);
          
          // Apply transition factor to make it fade in
          lpdsValue *= lpdsFactor;
          
          lpdsBaseline[x] = lpdsValue;
        }
      }
      
      // Calculate seizure pattern
      let seizureBaseline = new Array(this.canvas.width).fill(centerY);
      let hasSeizure = this.activeWaveforms.has('seizure');
      
      if (hasSeizure) {
        // Get transition factor for seizure
        const seizureFactor = this.getPatternTransitionFactor('seizure');
        
        // Calculate the seizure pattern
        for (let x = 0; x < this.canvas.width; x++) {
          const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
          
          // Generate seizure waveform for this position
          const seizureY = this.generateSeizureWaveform(x, centerY, leadName, timePosition);
          
          // Apply transition factor
          seizureBaseline[x] = centerY + ((seizureY - centerY) * seizureFactor);
        }
      }

      // Draw waveforms using the eye blink baseline for frontal leads
      let combinedY = new Array(this.canvas.width).fill(0);
      let activeCount = 0;

      // Calculate combined waveform
      this.activeWaveforms.forEach(type => {
        // Skip eye blinks, spikes, sharp waves and chewing as they're handled as the baseline
        if (type === 'eyeBlinks' || type === 'spikes' || type === 'sharpWaves' || 
            type === 'chewing' || type === 'custom3HzSpikeWave' || type === 'spikeAndWaves' || 
            type === 'focalSeizure' || type === 'lpds' || type === 'seizure') return;
        
        const waveform = this.waveforms[type];
        const modeConfig = this.modes[this.currentMode];
        const modeWaveform = modeConfig.waveforms[type];
        
        if (modeWaveform) {
          // Check if this waveform should be shown in this lead's region
          if (modeWaveform.region === 'all' || modeWaveform.region === lead.region || modeWaveform.enabled) {
            // Don't skip beta waves - preserve all underlying rhythms
            activeCount++;

            for (let x = 0; x < this.canvas.width; x++) {
              const timePosition = Math.floor(((x + this.panOffset.x) / this.timeScale + time) * 100) / 100;
              let y;

              if (waveform.custom) {
                y = waveform.draw(x + this.panOffset.x, centerY, leadName, timePosition);
                
                // If we have an eye blink baseline, adjust the y position relative to it
                if (hasEyeBlink) {
                  // Preserve the oscillation around the baseline but center it around the eye blink
                  const oscillation = y - centerY;
                  y = eyeBlinkBaseline[x] + oscillation;
                }
                
                // Apply sweat artifact baseline if present
                if (hasSweatArtifact) {
                  if (hasEyeBlink) {
                    // If we already have eye blinks, add the sweat artifact deviation
                    y += (sweatArtifactBaseline[x] - centerY);
                  } else {
                    // Otherwise just use the sweat artifact baseline
                    y = sweatArtifactBaseline[x];
                  }
                }
                
                // Apply 60Hz artifact if present - completely override other waveforms
                if (hasSixtyHzArtifact) {
                  y = sixtyHzArtifactBaseline[x];
                }
                
                // Apply spike baseline if present - combine with existing baseline
                if (hasSpike) {
                  // If we already have a modified baseline, add the spike deviation to it
                  if (hasEyeBlink || hasSweatArtifact) {
                    y += (spikeBaseline[x] - centerY);
                  } else {
                    // Otherwise just use the spike baseline
                    y = spikeBaseline[x];
                  }
                }
              } else {
                const frequency = modeWaveform.freq;
                let amplitude = modeWaveform.amp * this.zoomLevel;
                
                // Apply hemisphere-specific amplitude adjustments for more realism
                if (modeWaveform.leftRightAsymmetry) {
                  const isLeftHemisphere = (lead.name === 'Fp1-F7' || lead.name === 'F7-T3' || 
                                           lead.name === 'T3-T5' || lead.name === 'T5-O1');
                  
                  if (isLeftHemisphere) {
                    amplitude *= modeWaveform.leftRightAsymmetry; // Apply left hemisphere amplitude modifier
                  }
                }
                
                // Add small natural variations based on lead position for realism
                const leadIndex = this.leads.findIndex(l => l.name === lead.name);
                const leadVariability = 0.95 + (leadIndex * 0.01); // Subtle variations (0.95-1.02) based on lead
                amplitude *= leadVariability;
                
                // Apply amplitude reduction factor for frontal and anterior temporal leads
                if (lead.ampFactor) {
                  amplitude *= lead.ampFactor;
                }
                
                // Apply special alpha modulation pattern for posterior leads
                if (type === 'alpha' && lead.region === 'posterior') {
                  // Always use the lower amplitude for posterior alpha unless PDR is enabled
                  let amplitudeModulator = 0.3; // Default to 30% amplitude
                  
                  if (waveform.modulationPattern) {
                    // Calculate cycle for this x position
                    const xCyclePeriod = 7.5 + 2.5 * Math.sin(timePosition * 0.1);
                    
                    // Calculate where we are in the cycle (0 to 1)
                    const cyclePosition = (timePosition % xCyclePeriod) / xCyclePeriod;
                    
                    // Create a sharp peak during a small portion of the cycle
                    if (cyclePosition > 0.8) {
                      // Last 20% of the cycle has full amplitude (burst)
                      amplitudeModulator = 1;
                    }
                  }
                  
                  amplitude *= amplitudeModulator;
                }
                
                // Adjust amplitude for central leads if specified
                if (modeWaveform.centralMix && lead.region === 'posterior') {
                  // For central leads (T3-T5 and T4-T6), mix the waveforms
                  if (lead.name === 'T3-T5' || lead.name === 'T4-T6') {
                    amplitude *= modeWaveform.centralMix;
                    // Increase amplitude for T leads to match O leads
                    amplitude *= 1.2; // 20% increase for T leads
                  }
                }
                
                const modulation = waveform.modulation || 0;
                
                // Apply frequency fluctuation if defined
                let effectiveFrequency = frequency;
                if (modeWaveform.freqFluctuation) {
                  // Create natural, slow-changing frequency variation based on time
                  const fluctuationAmount = modeWaveform.freqFluctuation;
                  const fluctuationRate = 0.03; // Slow rate of change
                  const fluctuationOffset = leadIndex * 0.5; // Different phase for each lead
                  
                  // Calculate fluctuation factor (-1 to 1 range, changes slowly)
                  const fluctuationFactor = Math.sin(timePosition * fluctuationRate + fluctuationOffset);
                  
                  // Apply fluctuation to base frequency
                  effectiveFrequency = frequency * (1 + fluctuationFactor * fluctuationAmount);
                  
                  // Apply maxFrequency cap if defined
                  if (modeWaveform.maxFrequency && effectiveFrequency > modeWaveform.maxFrequency) {
                    effectiveFrequency = modeWaveform.maxFrequency;
                  }
                }
                
                // Add natural amplitude variability
                const ampVariabilityRate = 0.02; // Very slow rate of change for amplitude
                const ampVariabilityOffset = leadIndex * 0.7; // Different phase for each lead
                // Use different sine phase than frequency to avoid synchronized changes
                const ampVariabilityFactor = Math.sin(timePosition * ampVariabilityRate + ampVariabilityOffset + 1.5);
                // Use the waveform-specific variability if defined, or default to 10%
                const ampVariabilityAmount = modeWaveform.ampVariability || 0.1;
                // Apply the variability to amplitude
                let effectiveAmplitude = amplitude * (1 + (ampVariabilityFactor * ampVariabilityAmount));
                
                // Handle random burst patterns (for delta in moderate slowing and burst suppression)
                if (modeWaveform.burstPattern) {
                  // Generate a pseudo-random value based on time only (not lead-dependent for synchronization)
                  const burstSeed = Math.sin((timePosition * 0.17) * 0.37) * 0.5 + 0.5;
                  
                  // Get burst cycle time from config or use default
                  let burstCycleMin = 4;
                  let burstCycleMax = 5;
                  if (modeWaveform.burstCycleTime) {
                    burstCycleMin = modeWaveform.burstCycleTime[0];
                    burstCycleMax = modeWaveform.burstCycleTime[1];
                  }
                  
                  // Calculate variable cycle length based on position (without leadIndex for synchronization)
                  const cycleSeed = Math.sin((timePosition * 0.05) * 0.19) * 0.5 + 0.5;
                  const burstCycle = burstCycleMin + cycleSeed * (burstCycleMax - burstCycleMin);
                  
                  // Calculate position within burst cycle
                  const burstPosition = (timePosition % burstCycle) / burstCycle;
                  
                  // Get burst duration from config or use default
                  let burstDurationMin = 1;
                  let burstDurationMax = 3;
                  if (modeWaveform.burstDuration) {
                    burstDurationMin = modeWaveform.burstDuration[0];
                    burstDurationMax = modeWaveform.burstDuration[1];
                  }
                  
                  // Calculate variable burst duration (without leadIndex for synchronization)
                  const durationSeed = Math.sin((timePosition * 0.13) * 0.31) * 0.5 + 0.5;
                  const burstDuration = burstDurationMin + durationSeed * (burstDurationMax - burstDurationMin);
                  
                  // Calculate if we're in an active burst period
                  const activeBurstWindow = burstDuration / burstCycle;
                  const inActiveBurstWindow = burstPosition < activeBurstWindow;
                  
                  // Bursts appear based on burstFrequency (probability) and active window
                  const inBurstPeriod = inActiveBurstWindow && (burstSeed < (modeWaveform.burstFrequency || 0.2));
                  
                  if (!inBurstPeriod) {
                    // If not in a burst, significantly reduce amplitude
                    // Use suppression amplitude if specified (for burst suppression) or default to 10%
                    const suppressionAmp = modeWaveform.suppressionAmplitude || 0.1;
                    effectiveAmplitude *= suppressionAmp; 
                  } else {
                    // Calculate the burst ID to create variable amplitude between different bursts
                    // This creates a unique but deterministic ID for each burst based on its start time
                    const burstStartTime = Math.floor(timePosition / burstCycle) * burstCycle;
                    const burstIdSeed = Math.sin(burstStartTime * 0.37) * 0.5 + 0.5;
                    
                    // Apply burst-to-burst amplitude variability if specified
                    if (modeWaveform.burstAmplitudeVariability) {
                      // Each burst can have different baseline amplitude
                      const burstAmpVariability = modeWaveform.burstAmplitudeVariability;
                      const burstBaseMultiplier = 1 - burstAmpVariability/2 + burstIdSeed * burstAmpVariability;
                      effectiveAmplitude *= burstBaseMultiplier;
                    }
                    
                    // When in a burst, add additional variability within each burst
                    // Use leadIndex only for amplitude variations within burst
                    const burstAmpSeed = Math.sin((timePosition * 0.41 + leadIndex * 7.89) * 0.67) * 0.5 + 0.5;
                    effectiveAmplitude *= (0.8 + burstAmpSeed * 0.4); // 80-120% amplitude variation within burst
                    
                    // Also slightly slow the frequency during bursts (common in clinical patterns)
                    effectiveFrequency *= 0.9;
                  }
                }
                
                // Calculate the base Y position
                let baseY = centerY;
                
                // Apply eye blink baseline if present
                if (hasEyeBlink) {
                  baseY = eyeBlinkBaseline[x];
                }
                
                // Apply sweat artifact baseline if present
                if (hasSweatArtifact) {
                  if (hasEyeBlink) {
                    // If we already have eye blinks, add the sweat artifact deviation
                    baseY += (sweatArtifactBaseline[x] - centerY);
                  } else {
                    // Otherwise just use the sweat artifact baseline
                    baseY = sweatArtifactBaseline[x];
                  }
                }
                
                // Apply 60Hz artifact if present - completely override other waveforms
                if (hasSixtyHzArtifact) {
                  baseY = sixtyHzArtifactBaseline[x];
                }
                
                // Apply spike baseline if present - combine with existing baseline
                if (hasSpike) {
                  // If we already have a modified baseline, add the spike deviation to it
                  if (hasEyeBlink || hasSweatArtifact) {
                    baseY += (spikeBaseline[x] - centerY);
                  } else {
                    // Otherwise just use the spike baseline
                    baseY = spikeBaseline[x];
                  }
                }
                
                // Apply sharp wave baseline
                if (hasSharpWaves) {
                  if (hasEyeBlink || hasSpike) {
                    // Add sharp wave deviation to existing baseline
                    baseY += (sharpWaveBaseline[x] - centerY);
                  } else {
                    // Otherwise just use the sharp wave baseline
                    baseY = sharpWaveBaseline[x];
                  }
                }
                
                // Apply focal slowing baseline
                if (hasFocalSlowing) {
                  const focalDelta = focalSlowingBaseline[x] - centerY;
                  
                  // Only apply focal slowing if it's active at this position
                  if (Math.abs(focalDelta) > 0.01) {
                    // When focal slowing is active, it completely disrupts the background
                    // No contribution from the underlying activity (similar to eye blinks)
                    baseY = centerY + focalDelta;
                  }
                }
                
                // Apply generalized slowing baseline
                if (hasGeneralizedSlowing) {
                  const generalizedDelta = generalizedSlowingBaseline[x] - centerY;
                  
                  // Only apply generalized slowing if it's active at this position
                  if (Math.abs(generalizedDelta) > 0.01) {
                    // When generalized slowing is active, it completely disrupts the background
                    baseY = centerY + generalizedDelta;
                  }
                }
                
                // Apply chewing artifact baseline
                if (hasChewing) {
                  const chewDelta = chewingBaseline[x] - centerY;
                  
                  // Always disrupt the background with chewing artifact when present
                  // No threshold check so it fully replaces the background EEG
                  if (Math.abs(chewDelta) > 0.01) {
                    baseY = centerY + chewDelta;
                  }
                }
                
                // Apply movement artifact
                if (hasMovement && hasActiveMovementPoints) {
                  const movementDelta = movementBaseline[x] - centerY;
                  
                  // Always disrupt the background with movement artifact when present
                  if (Math.abs(movementDelta) > 0.01) {
                    baseY = centerY + movementDelta;
                  }
                }
                
                // Apply ECG artifact (before spike-wave and seizures which have higher priority)
                if (hasECGArtifact) {
                  // Don't completely override the baseline like before
                  // Instead, add the ECG artifact to the existing baseline (like eye blinks)
                  // This allows ECG to be visible while still showing eye blinks
                  baseY += (ecgArtifactBaseline[x] - centerY);
                }
                
                // Apply pulse artifact after ECG
                if (hasPulseArtifact) {
                  // Add the pulse artifact to the baseline (appears as oscillations after ECG)
                  baseY += (pulseArtifactBaseline[x] - centerY);
                }
                
                // Apply spike-wave pattern (overrides everything as it's a seizure)
                if (hasSpikeWave) {
                  baseY = spikeWaveBaseline[x];
                }
                
                // Apply spike and waves pattern with custom frequency
                if (hasSpikeAndWaves) {
                  // If we have eye blinks, add the spike and wave pattern to it rather than replacing
                  if (hasEyeBlink) {
                    // Add the spike and wave deviation from center to the current baseline
                    baseY += (spikeAndWavesBaseline[x] - centerY);
                  } else {
                    // Otherwise just use the spike and wave baseline
                    baseY = spikeAndWavesBaseline[x];
                  }
                }
                
                // Apply focal seizure pattern (highest priority)
                if (hasFocalSeizure) {
                  baseY = focalSeizureBaseline[x];
                }
                
                // Apply seizure pattern (highest priority)
                if (hasSeizure) {
                  baseY = seizureBaseline[x];
                }
                
                // Apply LPDs pattern additively after checking for other higher priority patterns
                if (hasLPDs && !hasFocalSeizure) {
                  // Add the LPDs value to the existing baseline instead of replacing it
                  baseY += lpdsBaseline[x];
                }
                
                // Calculate the waveform around the baseline position
                y = baseY + 
                    effectiveAmplitude * Math.sin(2 * Math.PI * effectiveFrequency * timePosition * (1 + modulation * Math.sin(timePosition))) +
                    this.panOffset.y;
                    
                // Add subtle background noise and low-amplitude variability
                const noiseLevel = Math.min(5, effectiveAmplitude * 0.08); // Background noise (5μV maximum)
                // Use position-based deterministic noise with fixed algorithm
                const noiseSeed = Math.sin((timePosition * 157.21 + leadIndex * 47.63 + x * 0.01) * 43.758) * 10000;
                const noise = (Math.sin(noiseSeed) * 0.5) * noiseLevel;
                
                // Add very subtle slow baseline wandering (common in real EEG)
                const baselineWander = Math.sin(timePosition * 0.05 + leadIndex) * (effectiveAmplitude * 0.03);
                
                // Apply the noise and baseline variations - but skip for beta waves
                if (type !== 'beta') {
                  y += noise + baselineWander;
                }
              }

              // Add this waveform's contribution to the combined waveform
              combinedY[x] += y;
            }
          }
        }
      });

      // Draw the combined waveform if any active
      if (activeCount > 0) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = lead.color;
        this.ctx.lineWidth = 2;

        // Normalize the combined waveform
        for (let x = 0; x < this.canvas.width; x++) {
          const normalizedY = combinedY[x] / activeCount;
          // If there's no baseline effect, use the normalized value; otherwise we've already included the baseline
          const finalY = (hasEyeBlink || hasSweatArtifact || hasSpike || hasSharpWaves || hasFocalSlowing || hasGeneralizedSlowing || hasSpikeWave || hasSpikeAndWaves || hasFocalSeizure || hasSixtyHzArtifact || hasECGArtifact || hasPulseArtifact || hasSeizure) ? normalizedY : centerY + (normalizedY - centerY);
          
          if (x === 0) {
            this.ctx.moveTo(x, finalY);
          } else {
            this.ctx.lineTo(x, finalY);
          }
        }
        this.ctx.stroke();
      } else if (hasEyeBlink || hasSweatArtifact || hasSpike || hasSharpWaves || hasFocalSlowing || hasChewing || hasSpikeWave || hasSpikeAndWaves || hasFocalSeizure || hasSixtyHzArtifact || hasECGArtifact || hasSeizure || hasMovement || hasPulseArtifact) {
        // If there are no other waveforms but we have a baseline effect, draw just that
        this.ctx.beginPath();
        this.ctx.strokeStyle = lead.color;
        this.ctx.lineWidth = 2;
        
        for (let x = 0; x < this.canvas.width; x++) {
          let baselineY = centerY;
          
          if (hasEyeBlink) {
            baselineY = eyeBlinkBaseline[x];
          }
          
          if (hasSweatArtifact) {
            if (hasEyeBlink) {
              // If we already have eye blinks, add the sweat artifact deviation
              baselineY += (sweatArtifactBaseline[x] - centerY);
            } else {
              // Otherwise just use the sweat artifact baseline
              baselineY = sweatArtifactBaseline[x];
            }
          }
          
          if (hasSpike) {
            // If we already have other baselines, add the spike deviation
            if (hasEyeBlink || hasSweatArtifact) {
              baselineY += (spikeBaseline[x] - centerY);
            } else {
              // Otherwise just use the spike baseline
              baselineY = spikeBaseline[x];
            }
          }
          
          if (hasSharpWaves) {
            // If we already have other baselines, add the sharp wave deviation
            if (hasEyeBlink || hasSpike) {
              baselineY += (sharpWaveBaseline[x] - centerY);
            } else {
              // Otherwise just use the sharp wave baseline
              baselineY = sharpWaveBaseline[x];
            }
          }
          
          if (hasFocalSlowing) {
            // Apply focal slowing as predominant rhythm when active
            const focalDelta = focalSlowingBaseline[x] - centerY;
            
            // Only apply focal slowing if it's active at this position
            if (Math.abs(focalDelta) > 0.01) {
              // When focal slowing is active, it completely disrupts the background
              // No contribution from the underlying activity (similar to eye blinks)
              baselineY = centerY + focalDelta;
            }
          }
          
          if (hasChewing) {
            // Apply chewing artifact baseline when active
            const chewDelta = chewingBaseline[x] - centerY;
            
            // Always disrupt the background with chewing artifact when present
            // No threshold check so it fully replaces the background EEG
            if (Math.abs(chewDelta) > 0.01) {
              baselineY = centerY + chewDelta;
            }
            // Normal activity shows between chewing episodes
          }
          
          if (hasMovement && hasActiveMovementPoints) {
            // Apply movement artifact baseline when active
            const movementDelta = movementBaseline[x] - centerY;
            
            // Always disrupt the background with movement artifact when present
            if (Math.abs(movementDelta) > 0.01) {
              baselineY = centerY + movementDelta;
            }
            // Normal activity shows between movement episodes
          }
          
          // Apply spike-wave pattern (overrides everything as it's a seizure)
          if (hasSpikeWave) {
            baselineY = spikeWaveBaseline[x];
          }
          
          // Apply spike and waves pattern with custom frequency
          if (hasSpikeAndWaves) {
            // If we have eye blinks, add the spike and wave pattern to it rather than replacing
            if (hasEyeBlink) {
              // Add the spike and wave deviation from center to the current baseline
              baselineY += (spikeAndWavesBaseline[x] - centerY);
            } else {
              // Otherwise just use the spike and wave baseline
              baselineY = spikeAndWavesBaseline[x];
            }
          }
          
          // Apply focal seizure pattern (highest priority)
          if (hasFocalSeizure) {
            baselineY = focalSeizureBaseline[x];
          }
          
          // Apply seizure pattern (highest priority)
          if (hasSeizure) {
            baselineY = seizureBaseline[x];
          }
          
          // Apply LPDs pattern additively after checking for other higher priority patterns
          if (hasLPDs && !hasFocalSeizure) {
            // Add the LPDs value to the existing baseline instead of replacing it
            baselineY += lpdsBaseline[x];
          }
          
          // Apply 60Hz artifact additively
          if (hasSixtyHzArtifact) {
            // Always apply the 60Hz artifact directly, without thresholds
            // This ensures it's consistently visible like chewing
            baselineY = sixtyHzArtifactBaseline[x];
          }
          
          // Apply ECG artifact
          if (hasECGArtifact) {
            // Use direct replacement like eye blinks (not offset addition)
            baselineY = ecgArtifactBaseline[x];
          }
          
          // Apply pulse artifact after ECG
          if (hasPulseArtifact) {
            // If ECG is also active, add the pulse on top of it
            if (hasECGArtifact) {
              baselineY += (pulseArtifactBaseline[x] - centerY);
            } else {
              // Otherwise use the pulse artifact baseline directly
              baselineY = pulseArtifactBaseline[x];
            }
          }
          
          if (x === 0) {
            this.ctx.moveTo(x, baselineY);
          } else {
            this.ctx.lineTo(x, baselineY);
          }
        }
        
        this.ctx.stroke();
      }
    });
  }

  startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Use a fixed time step instead of timestamp-based calculation
    const fixedFrameRate = 60; // fps
    const fixedTimeStep = 1 / fixedFrameRate;
    let accumulatedTime = 0;

    const animate = () => {
      if (this.isPlaying) {
        // Use fixed time increment instead of variable deltaTime
        accumulatedTime += fixedTimeStep * this.speed;
        
        // Keep time in a reasonable range to prevent floating point precision issues
        if (accumulatedTime > 1000) {
          accumulatedTime = 0;
        }
        
        // Set currentTime to the accumulated time
        this.currentTime = accumulatedTime;
      }

      // Round time to 2 decimal places to further reduce jitter
      const renderTime = Math.floor(this.currentTime * 100) / 100;
      
      this.drawWaveform(renderTime);
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  handleZoom(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel * zoomFactor));
  }

  handlePanStart(e) {
    this.isPanning = true;
    this.lastPanPosition = { x: e.clientX, y: e.clientY };
  }

  handlePanMove(e) {
    if (!this.isPanning) return;
    
    const deltaX = e.clientX - this.lastPanPosition.x;
    const deltaY = e.clientY - this.lastPanPosition.y;
    
    this.panOffset.x += deltaX;
    this.panOffset.y += deltaY;
    
    this.lastPanPosition = { x: e.clientX, y: e.clientY };
  }

  handlePanEnd() {
    this.isPanning = false;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.handlePanStart(e.touches[0]);
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      this.handlePanMove(e.touches[0]);
    }
  }

  handleTouchEnd() {
    this.handlePanEnd();
  }

  play() {
    this.isPlaying = true;
    if (!this.animationFrame) {
      this.startAnimation();
    }
  }

  pause() {
    this.isPlaying = false;
  }

  reset() {
    // Reset all parameters
    this.currentTime = 0;
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
    this.isPlaying = true; // Set to true to ensure animation plays after reset
    
    // Cancel any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Reset to normal mode - exactly the way it's initialized in the constructor
    this.currentMode = 'normal';
    
    // Reset to default waveforms and make sure they match constructor state
    this.activeWaveforms.clear();
    this.activeWaveforms.add('alpha');
    this.activeWaveforms.add('beta');  
    this.activeWaveforms.add('eyeBlinks');
    
    // Initialize the waveforms if needed
    if (!this.waveforms) {
      this.setupWaveforms();
    }
    
    // Specifically set the alpha modulationPattern for PDR
    if (this.waveforms && this.waveforms.alpha) {
      this.waveforms.alpha.modulationPattern = true;
    }
    
    // Reset the UI to match default state - only eyeBlinks and PDR should be active
    const allToggleButtons = document.querySelectorAll('.waveform-controls button');
    
    allToggleButtons.forEach(button => {
      // Default active buttons are eyeBlinks and pdrToggle
      if (button.id === 'eyeBlinkToggle' || button.id === 'pdrToggle') {
        button.classList.add('active');
      } else if (button.id !== 'play' && button.id !== 'pause' && button.id !== 'reset') {
        button.classList.remove('active');
      }
    });
    
    // Remove all pattern transitions
    this.patternTransitions = new Map();
    
    // Update any ACNS interpretation
    this.updateScaleInfo();
    
    // Force immediate redraw to show the correct state
    this.drawWaveform(this.currentTime);
    
    // Start a new animation
    this.startAnimation();
  }

  setMode(mode) {
    this.currentMode = mode;
    this.activeWaveforms.clear();
    const modeConfig = this.modes[mode];
    
    // Show/hide waveform selector based on mode
    this.waveformControl.style.display = mode === 'custom' ? 'block' : 'none';
    
    if (mode !== 'custom') {
      // Activate waveforms for the selected mode
      Object.keys(modeConfig.waveforms).forEach(type => {
        this.activeWaveforms.add(type);
      });
      
      // Always add eye blinks for normal mode
      if (mode === 'normal') {
        this.activeWaveforms.add('eyeBlinks');
    }
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  setSpeed(speed) {
    this.speed = parseFloat(speed);
  }

  setWaveform(type, active = true) {
    if (this.waveforms[type]) {
      if (active) {
        // Start a transition when adding a waveform
        if (!this.activeWaveforms.has(type)) {
          this.startPatternTransition(type);
        }
        
        this.activeWaveforms.add(type);
        // For spikes, sharp waves, spike and waves, and slowing, we want to show them immediately
        if (type === 'spikes' || type === 'sharpWaves' || type === 'spikeAndWaves' || type === 'slowing') {
          this.currentTime = 0; // Reset time to show the abnormality
        }
      } else {
        this.activeWaveforms.delete(type);
        // Remove any ongoing transition for this pattern
        this.patternTransitions.delete(type);
      }
      
      // Update button state
      const button = document.querySelector(`.wave-btn[data-wave="${type}"]`);
      if (button) {
        button.classList.toggle('active', active);
      }
      
      // Update ACNS interpretation
      this.updateScaleInfo();
    }
  }
  
  startPatternTransition(patternName, duration = 2000) {
    // Create a new transition
    this.patternTransitions.set(patternName, {
      startTime: performance.now(),
      duration: duration,
      progress: 0
    });
  }

  toggleEyeBlinks() {
    const button = document.getElementById('eyeBlinkToggle');
    if (button.classList.contains('active')) {
      // Turn off eye blinks
      button.classList.remove('active');
      this.activeWaveforms.delete('eyeBlinks');
      this.patternTransitions.delete('eyeBlinks');
    } else {
      // Turn on eye blinks
      button.classList.add('active');
      this.startPatternTransition('eyeBlinks');
      this.activeWaveforms.add('eyeBlinks');
    }
  }

  toggleChewing() {
    console.log("Toggling chewing artifact");
    const button = document.getElementById('chewingToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off chewing artifact
      console.log("Turning off chewing artifact");
      this.activeWaveforms.delete('chewing');
      this.patternTransitions.delete('chewing');
    } else {
      // Turn on chewing artifact
      console.log("Turning on chewing artifact");
      
      // Ensure chewing is added to active waveforms
      this.activeWaveforms.add('chewing');
      
      // Start transition with longer duration for smoother effect
      this.startPatternTransition('chewing', 1000);
      
      // Log active waveforms for debugging
      console.log("Active waveforms:", Array.from(this.activeWaveforms));
      console.log("Pattern transitions:", Array.from(this.patternTransitions.keys()));
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  togglePDR() {
    const button = document.getElementById('pdrToggle');
    if (button.classList.contains('active')) {
      // Turn off PDR
      button.classList.remove('active');
      // Update the modulationPattern property for alpha
      this.waveforms.alpha.modulationPattern = false;
      this.patternTransitions.delete('pdr');
    } else {
      // Turn on PDR
      button.classList.add('active');
      this.startPatternTransition('pdr');
      // Update the modulationPattern property for alpha
      this.waveforms.alpha.modulationPattern = true;
      
      // If turning PDR on, make sure alpha is active
      if (!this.activeWaveforms.has('alpha')) {
        this.activeWaveforms.add('alpha');
      }
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleFocalSlowing() {
    const button = document.getElementById('focalSlowingToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off focal slowing
      this.activeWaveforms.delete('focalSlowing');
      this.patternTransitions.delete('focalSlowing');
      
      // Hide the LRDA adjusters
      const lrdaAdjusters = document.getElementById('lrda-adjusters');
      if (lrdaAdjusters) {
        lrdaAdjusters.style.display = 'none';
      }
    } else {
      // Start transition for focal slowing
      this.startPatternTransition('focalSlowing');
      // Turn on focal slowing
      this.activeWaveforms.add('focalSlowing');
      
      // Show the LRDA adjusters
      const lrdaAdjusters = document.getElementById('lrda-adjusters');
      if (lrdaAdjusters) {
        lrdaAdjusters.style.display = 'block';
      }
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleGeneralizedSlowing() {
    const button = document.getElementById('generalizedSlowingToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off generalized slowing
      this.activeWaveforms.delete('generalizedSlowing');
      this.patternTransitions.delete('generalizedSlowing');
      
      // Hide the GRDA adjusters
      const grdaAdjusters = document.getElementById('grda-adjusters');
      if (grdaAdjusters) {
        grdaAdjusters.style.display = 'none';
      }
    } else {
      // Start transition for generalized slowing
      this.startPatternTransition('generalizedSlowing');
      // Turn on generalized slowing
      this.activeWaveforms.add('generalizedSlowing');
      
      // Show the GRDA adjusters
      const grdaAdjusters = document.getElementById('grda-adjusters');
      if (grdaAdjusters) {
        grdaAdjusters.style.display = 'block';
      }
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleSpikeWave3Hz() {
    const button = document.getElementById('spikeWave3HzToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off 3Hz spike and wave
      this.activeWaveforms.delete('custom3HzSpikeWave');
      this.patternTransitions.delete('custom3HzSpikeWave');
    } else {
      // Start transition
      this.startPatternTransition('custom3HzSpikeWave');
      // Turn on 3Hz spike and wave
      this.activeWaveforms.add('custom3HzSpikeWave');
      // Reset time to show the pattern from the beginning
      this.currentTime = 0;
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleFocalSeizure() {
    const button = document.getElementById('focalSeizureToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off focal seizure
      this.activeWaveforms.delete('focalSeizure');
      this.patternTransitions.delete('focalSeizure');
    } else {
      // Start transition
      this.startPatternTransition('focalSeizure');
      // Turn on focal seizure
      this.activeWaveforms.add('focalSeizure');
      // Reset time to show the seizure from the beginning
      this.currentTime = 0;
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleSweatArtifact() {
    const button = document.getElementById('sweatArtifactToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off sweat artifact
      this.activeWaveforms.delete('sweatArtifact');
      this.patternTransitions.delete('sweatArtifact');
    } else {
      // Start transition
      this.startPatternTransition('sweatArtifact');
      // Turn on sweat artifact
      this.activeWaveforms.add('sweatArtifact');
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleSixtyHzArtifact() {
    const button = document.getElementById('sixtyHzArtifactToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off 60Hz artifact
      this.activeWaveforms.delete('sixtyHzArtifact');
      this.patternTransitions.delete('sixtyHzArtifact');
    } else {
      // Start transition
      this.startPatternTransition('sixtyHzArtifact');
      // Turn on 60Hz artifact
      this.activeWaveforms.add('sixtyHzArtifact');
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  toggleLPDs() {
    const button = document.getElementById('lpdsToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off LPDs
      this.activeWaveforms.delete('lpds');
      this.patternTransitions.delete('lpds');
    } else {
      // Start transition
      this.startPatternTransition('lpds');
      // Turn on LPDs
      this.activeWaveforms.add('lpds');
      // Reset time to show the pattern from the beginning
      this.currentTime = 0;
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }
  
  // Add helper method to handle pattern transitions
  updatePatternTransitions(time) {
    // Process all active transitions
    for (const [patternName, transition] of this.patternTransitions.entries()) {
      // Update transition progress based on time
      const elapsedTime = performance.now() - transition.startTime;
      const duration = transition.duration;
      
      // Calculate progress (0 to 1)
      transition.progress = Math.min(elapsedTime / duration, 1);
      
      // Remove completed transitions
      if (transition.progress >= 1) {
        this.patternTransitions.delete(patternName);
      }
    }
  }
  
  // Get transition factor for a pattern (0 to 1)
  getPatternTransitionFactor(patternName) {
    const transition = this.patternTransitions.get(patternName);
    if (!transition) return 1; // No transition = full intensity
    
    // Apply easing function for smoother transition
    return this.easeInOutCubic(transition.progress);
  }
  
  // Easing function for smoother transitions
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  toggleMildSlowing() {
    const button = document.getElementById('mildSlowingToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (!isActive) {
      // Set to mild slowing mode
      this.currentMode = 'mildSlowing';
      this.activeWaveforms.clear();
      
      // Activate the waveforms for mild slowing
      this.activeWaveforms.add('alpha');
      this.activeWaveforms.add('theta');
      this.activeWaveforms.add('eyeBlinks'); // Ensure eye blinks remain active
      
      // Deactivate conflicting patterns
      const buttonsToDeactivate = [
        'focalSlowingToggle', 'lpdsToggle', 'spikeWave3HzToggle', 
        'focalSeizureToggle', 'chewingToggle', 'sweatArtifactToggle', 
        'sixtyHzArtifactToggle'
      ];
      
      buttonsToDeactivate.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.classList.contains('active')) {
          btn.classList.remove('active');
        }
      });
      
      // Deactivate custom waves
      const waveButtons = document.querySelectorAll('.wave-btn.active');
      waveButtons.forEach(btn => {
        btn.classList.remove('active');
        const type = btn.dataset.wave;
        this.activeWaveforms.delete(type);
      });
    } else {
      // Call reset when turning off mild slowing
      this.reset();
    }
  }

  toggleModerateSlowing() {
    const button = document.getElementById('moderateSlowingToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (!isActive) {
      // Deactivate mild slowing if it's active
      const mildSlowingBtn = document.getElementById('mildSlowingToggle');
      if (mildSlowingBtn && mildSlowingBtn.classList.contains('active')) {
        mildSlowingBtn.classList.remove('active');
      }
    
      // Set to moderate slowing mode
      this.currentMode = 'moderateSlowing';
      this.activeWaveforms.clear();
      
      // Activate the waveforms for moderate slowing - both delta and theta
      this.activeWaveforms.add('delta');
      this.activeWaveforms.add('theta');
      // Explicitly do NOT add eye blinks
      
      // Deactivate eye blinks and PDR
      const eyeBlinkBtn = document.getElementById('eyeBlinkToggle');
      if (eyeBlinkBtn && eyeBlinkBtn.classList.contains('active')) {
        eyeBlinkBtn.classList.remove('active');
      }
      
      const pdrBtn = document.getElementById('pdrToggle');
      if (pdrBtn && pdrBtn.classList.contains('active')) {
        pdrBtn.classList.remove('active');
      }
      
      // Deactivate conflicting patterns
      const buttonsToDeactivate = [
        'focalSlowingToggle', 'lpdsToggle', 'spikeWave3HzToggle', 
        'focalSeizureToggle', 'chewingToggle', 'sweatArtifactToggle', 
        'sixtyHzArtifactToggle'
      ];
      
      buttonsToDeactivate.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.classList.contains('active')) {
          btn.classList.remove('active');
        }
      });
      
      // Deactivate custom waves
      const waveButtons = document.querySelectorAll('.wave-btn.active');
      waveButtons.forEach(btn => {
        btn.classList.remove('active');
        const type = btn.dataset.wave;
        this.activeWaveforms.delete(type);
      });
    } else {
      // Call reset when turning off moderate slowing
      this.reset();
    }
  }

  toggleSevereSlowing() {
    const button = document.getElementById('severeSlowingToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (!isActive) {
      // Deactivate mild and moderate slowing if active
      const mildSlowingBtn = document.getElementById('mildSlowingToggle');
      if (mildSlowingBtn && mildSlowingBtn.classList.contains('active')) {
        mildSlowingBtn.classList.remove('active');
      }
      
      const moderateSlowingBtn = document.getElementById('moderateSlowingToggle');
      if (moderateSlowingBtn && moderateSlowingBtn.classList.contains('active')) {
        moderateSlowingBtn.classList.remove('active');
      }
    
      // Set to severe slowing mode
      this.currentMode = 'severeSlowing';
      this.activeWaveforms.clear();
      
      // Activate only delta for severe slowing
      this.activeWaveforms.add('delta');
      
      // Deactivate eye blinks and PDR
      const eyeBlinkBtn = document.getElementById('eyeBlinkToggle');
      if (eyeBlinkBtn && eyeBlinkBtn.classList.contains('active')) {
        eyeBlinkBtn.classList.remove('active');
      }
      
      const pdrBtn = document.getElementById('pdrToggle');
      if (pdrBtn && pdrBtn.classList.contains('active')) {
        pdrBtn.classList.remove('active');
      }
      
      // Deactivate conflicting patterns
      const buttonsToDeactivate = [
        'focalSlowingToggle', 'lpdsToggle', 'spikeWave3HzToggle', 
        'focalSeizureToggle', 'chewingToggle', 'sweatArtifactToggle', 
        'sixtyHzArtifactToggle'
      ];
      
      buttonsToDeactivate.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.classList.contains('active')) {
          btn.classList.remove('active');
        }
      });
      
      // Deactivate custom waves
      const waveButtons = document.querySelectorAll('.wave-btn.active');
      waveButtons.forEach(btn => {
        btn.classList.remove('active');
        const type = btn.dataset.wave;
        this.activeWaveforms.delete(type);
      });
    } else {
      // Call reset when turning off severe slowing
      this.reset();
    }
  }

  toggleBurstSuppression() {
    const button = document.getElementById('burstSuppressionToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (!isActive) {
      // Deactivate other slowing modes if active
      ['mildSlowingToggle', 'moderateSlowingToggle', 'severeSlowingToggle'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.classList.contains('active')) {
          btn.classList.remove('active');
        }
      });
    
      // Set to burst suppression mode
      this.currentMode = 'burstSuppression';
      this.activeWaveforms.clear();
      
      // Activate only theta for burst suppression
      this.activeWaveforms.add('theta');
      
      // Deactivate eye blinks and PDR
      const eyeBlinkBtn = document.getElementById('eyeBlinkToggle');
      if (eyeBlinkBtn && eyeBlinkBtn.classList.contains('active')) {
        eyeBlinkBtn.classList.remove('active');
      }
      
      const pdrBtn = document.getElementById('pdrToggle');
      if (pdrBtn && pdrBtn.classList.contains('active')) {
        pdrBtn.classList.remove('active');
      }
      
      // Deactivate conflicting patterns
      const buttonsToDeactivate = [
        'focalSlowingToggle', 'lpdsToggle', 'spikeWave3HzToggle', 
        'focalSeizureToggle', 'chewingToggle', 'sweatArtifactToggle', 
        'sixtyHzArtifactToggle'
      ];
      
      buttonsToDeactivate.forEach(id => {
        const btn = document.getElementById(id);
        if (btn && btn.classList.contains('active')) {
          btn.classList.remove('active');
        }
      });
      
      // Deactivate custom waves
      const waveButtons = document.querySelectorAll('.wave-btn.active');
      waveButtons.forEach(btn => {
        btn.classList.remove('active');
        const type = btn.dataset.wave;
        this.activeWaveforms.delete(type);
      });
    } else {
      // Return to normal mode
      this.currentMode = 'normal';
      this.activeWaveforms.clear();
      
      // Restore normal waveforms
      Object.keys(this.modes.normal.waveforms).forEach(type => {
        this.activeWaveforms.add(type);
      });
      
      // Re-enable eye blinks and PDR in UI
      const eyeBlinkBtn = document.getElementById('eyeBlinkToggle');
      if (eyeBlinkBtn && !eyeBlinkBtn.classList.contains('active')) {
        eyeBlinkBtn.classList.add('active');
      }
      
      const pdrBtn = document.getElementById('pdrToggle');
      if (pdrBtn && !pdrBtn.classList.contains('active')) {
        pdrBtn.classList.add('active');
      }
    }
  }

  toggleECGArtifact() {
    const button = document.getElementById('ecgArtifactToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off ECG artifact
      this.activeWaveforms.delete('ecgArtifact');
      this.patternTransitions.delete('ecgArtifact');
    } else {
      // Start transition - very fast transition for immediate visibility
      this.startPatternTransition('ecgArtifact', 300); // Even faster transition (300ms)
      
      // Turn on ECG artifact
      this.activeWaveforms.add('ecgArtifact');
      
      // For better visualization, turn off any competing artifacts
      this.activeWaveforms.delete('sixtyHzArtifact');
      this.activeWaveforms.delete('sweatArtifact');
      this.activeWaveforms.delete('spikes');
      this.activeWaveforms.delete('sharpWaves');
      
      // Update UI to reflect state of incompatible artifacts
      const sixtyHzButton = document.getElementById('sixtyHzArtifactToggle');
      if (sixtyHzButton && sixtyHzButton.classList.contains('active')) {
        sixtyHzButton.classList.remove('active');
      }
      
      const sweatButton = document.getElementById('sweatArtifactToggle');
      if (sweatButton && sweatButton.classList.contains('active')) {
        sweatButton.classList.remove('active');
      }
      
      // Remove active class from spike buttons if present
      document.querySelectorAll('.wave-btn[data-wave="spikes"], .wave-btn[data-wave="sharpWaves"]').forEach(btn => {
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
        }
      });
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  setSpikeFrequency(frequency) {
    // Convert from ACNS criteria numerical scale to internal frequency adjustment value
    // 1 = Rare (<1% of record)
    // 2 = Occasional (1-10% of record)
    // 3 = Frequent (10-50% of record) 
    // 4 = Abundant (>50% of record)
    const frequencyValue = parseInt(frequency);
    
    // Map ACNS criteria value to internal frequency values
    let internalValue;
    switch(frequencyValue) {
      case 1: // Rare
        internalValue = 0.1; // Very low frequency
        break;
      case 2: // Occasional
        internalValue = 0.4; // Low-moderate frequency
        break;
      case 3: // Frequent
        internalValue = 0.7; // Moderate-high frequency
        break;
      case 4: // Abundant
        internalValue = 1.0; // Highest frequency
        break;
      default:
        internalValue = 0.4; // Default to Occasional
    }
    
    this.spikeFrequency = internalValue;
    console.log("Spike frequency set to:", this.spikeFrequency, "(ACNS criteria level:", frequencyValue, ")");
  }
  
  setSpikePeriodicity(periodicity) {
    // Ensure periodicity is within valid range (now 0-3 Hz)
    this.spikePeriodicity = Math.max(0, Math.min(3.0, parseFloat(periodicity)));
    console.log("Spike periodicity set to:", this.spikePeriodicity, "Hz");
  }
  
  setSharpWaveFrequency(frequency) {
    // Convert from ACNS criteria numerical scale to internal frequency adjustment value
    // 1 = Rare (<1% of record)
    // 2 = Occasional (1-10% of record)
    // 3 = Frequent (10-50% of record) 
    // 4 = Abundant (>50% of record)
    const frequencyValue = parseInt(frequency);
    
    // Map ACNS criteria value to internal frequency values
    let internalValue;
    switch(frequencyValue) {
      case 1: // Rare
        internalValue = 0.1; // Very low frequency
        break;
      case 2: // Occasional
        internalValue = 0.4; // Low-moderate frequency
        break;
      case 3: // Frequent
        internalValue = 0.7; // Moderate-high frequency
        break;
      case 4: // Abundant
        internalValue = 1.0; // Highest frequency
        break;
      default:
        internalValue = 0.4; // Default to Occasional
    }
    
    this.sharpWaveFrequency = internalValue;
    console.log("Sharp wave frequency set to:", this.sharpWaveFrequency, "(ACNS criteria level:", frequencyValue, ")");
  }
  
  setSharpWavePeriodicity(periodicity) {
    // Ensure periodicity is within valid range (now 0-3 Hz)
    this.sharpWavePeriodicity = Math.max(0, Math.min(3.0, parseFloat(periodicity)));
    console.log("Sharp wave periodicity set to:", this.sharpWavePeriodicity, "Hz");
  }
  
  setSpikeAndWavePeriodicity(periodicity) {
    // Set the periodicity for spike and waves (in Hz)
    this.spikeAndWavePeriodicity = periodicity;
    
    // If the pattern is active, update the display
    if (this.activeWaveforms.has('spikeAndWaves')) {
      // Optional: Reset the timing to show the new frequency from the beginning
      this.currentTime = 0;
    }
  }
  
  // Set the periodicity for LRDA (in Hz)
  setLRDAPeriodicity(periodicity) {
    // Set the periodicity for LRDA (in Hz)
    this.lrdaPeriodicity = periodicity;
    
    // If the pattern is active, update the display
    if (this.activeWaveforms.has('focalSlowing')) {
      // Optional: Reset the timing to show the new frequency from the beginning
      this.currentTime = 0;
    }
  }

  // Generate a sharp wave pattern (longer duration than spikes, same general shape)
  generateSharpWaveWaveform(amplitude, duration, x, centerY, leadName, time) {
    // Similar to spike waveform but with longer duration (150-200ms)
    return this.generateSharpOrSpikeWaveform(amplitude, duration, x, centerY, leadName, time, true);
  }
  
  // Generate a spike and wave pattern with adjustable periodicity
  generateSpikeAndWaveWaveform(amplitude, duration, x, centerY, leadName, time) {
    // Determine if this lead is affected (temporal leads mainly)
    let leadFactor = 0;
    
    // Make the pattern more generalized - higher lead factors across all leads
    if (leadName === 'F7-T3' || leadName === 'F8-T4') {
      leadFactor = 0.9; // Strong in frontal-temporal
    } else if (leadName === 'T3-T5' || leadName === 'T4-T6') {
      leadFactor = 1.0; // Strongest in temporal
    } else if (leadName === 'T5-O1' || leadName === 'T6-O2') {
      leadFactor = 0.9; // Strong in temporal-occipital
    } else if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8') {
      leadFactor = 0.8; // Strong in frontopolar
    } else {
      leadFactor = 0.7; // Strong but less pronounced in others
    }
    
    // No effect if lead factor is 0
    if (leadFactor === 0) {
      return centerY;
    }
    
    // Get the current periodicity setting
    const periodicity = this.spikeAndWavePeriodicity; 
    
    // When periodicity is 0 Hz, display random single discharges instead of regular pattern
    if (periodicity === 0) {
      // Generate random infrequent discharges (approximately every 8-10 seconds)
      // Use the same timing for all leads to ensure synchronized discharges
      const randomOffset = Math.sin(time * 0.37) * 1; // Small variation based only on time
      const dischargeInterval = 9 + randomOffset; // Base interval with slight random variation
      
      // Calculate if we're in a discharge window - same calculation for all leads
      const dischargeTime = Math.floor(time / dischargeInterval) * dischargeInterval;
      const timeFromDischarge = time - dischargeTime;
      const dischargeDuration = 0.7; // 700ms for a single discharge
      
      if (timeFromDischarge < dischargeDuration) {
        // We're in a discharge window
        const dischargePhase = timeFromDischarge / dischargeDuration;
        
        // First 40% of the discharge is the spike
        const spikePhase = 0.4;
        // Remaining 60% is the wave (slower than the spike)
        const wavePhase = 0.6;
        
        let waveformOffset = 0;
        
        if (dischargePhase < spikePhase) {
          // Generate spike during first phase - spike goes down (negative)
          const spikeProgress = dischargePhase / spikePhase;
          if (spikeProgress < 0.3) {
            // Fast rising phase (0-30% of spike)
            waveformOffset = -(amplitude * 1.2 * leadFactor) * (spikeProgress / 0.3); // Increased amplitude for spikes
          } else if (spikeProgress < 0.4) {
            // Quick peak (30-40% of spike)
            waveformOffset = -(amplitude * 1.2 * leadFactor); // Increased amplitude for spikes
          } else {
            // Descending phase (40-100% of spike)
            const descendingProgress = (spikeProgress - 0.4) / 0.6;
            waveformOffset = -(amplitude * 1.2 * leadFactor) * (1 - descendingProgress); // Increased amplitude for spikes
          }
        } else {
          // Generate slow wave during second phase - wave goes up (positive)
          const waveProgress = (dischargePhase - spikePhase) / wavePhase;
          // Invert the sine wave (make it negative) so it goes upward instead of downward
          waveformOffset = -(amplitude * 1.1 * leadFactor) * Math.sin(waveProgress * Math.PI); // Increased amplitude for wave
        }
        
        // Add smooth onset/offset for the discharge
        let envelopeModifier = 1.0;
        if (dischargePhase < 0.1) {
          // Smooth onset - first 10% of the discharge
          envelopeModifier = dischargePhase / 0.1;
        } else if (dischargePhase > 0.9) {
          // Smooth offset - last 10% of the discharge
          envelopeModifier = (1 - dischargePhase) / 0.1;
        }
        
        waveformOffset *= envelopeModifier;
        
        return centerY + waveformOffset;
      }
      
      return centerY; // No discharge at this time
    }
    
    // Create bursts of activity lasting 1-5 seconds
    const burstCycleDuration = 10; // Total cycle duration in seconds
    const minBurstDuration = 1; // Minimum duration of burst in seconds
    const maxBurstDuration = 5; // Maximum duration of burst in seconds
    
    // Calculate burst duration based on periodicity (higher periodicity = longer bursts)
    const burstDuration = minBurstDuration + ((maxBurstDuration - minBurstDuration) * (periodicity / 5.0));
    
    // Calculate when bursts should occur
    const burstCyclePosition = (time % burstCycleDuration) / burstCycleDuration;
    
    // Only show activity during the burst window (first part of the cycle)
    const burstWindow = burstDuration / burstCycleDuration;
    if (burstCyclePosition > burstWindow) {
      return centerY; // Outside burst window, return to baseline
    }
    
    // Calculate cycle time in seconds based on periodicity (inverse of frequency)
    const cycleTime = 1.0 / periodicity;
    
    // Calculate position in the cycle
    const cyclePosition = (time % cycleTime) / cycleTime;
    
    // Spike phase (first 20% of the cycle)
    const spikePhase = 0.2;
    // Wave phase (next 60% of the cycle)
    const wavePhase = 0.6;
    // Rest phase (remaining 20% of the cycle)
    const restPhase = 0.2;
    
    let waveformOffset = 0;
    
    // Apply smooth onset/offset to the burst
    let burstEnvelope = 1.0;
    if (burstCyclePosition < 0.05) {
      // Smooth onset - first 5% of the burst window
      burstEnvelope = burstCyclePosition / 0.05;
    } else if (burstCyclePosition > (burstWindow - 0.05)) {
      // Smooth offset - last 5% of the burst window
      burstEnvelope = (burstWindow - burstCyclePosition) / 0.05;
    }
    
    if (cyclePosition < spikePhase) {
      // Generate spike during spike phase - spike goes down (negative)
      const spikeProgress = cyclePosition / spikePhase;
      if (spikeProgress < 0.3) {
        // Fast rising phase (0-30% of spike)
        waveformOffset = -(amplitude * leadFactor) * (spikeProgress / 0.3);
      } else if (spikeProgress < 0.4) {
        // Quick peak (30-40% of spike)
        waveformOffset = -(amplitude * leadFactor);
      } else {
        // Descending phase (40-100% of spike)
        const descendingProgress = (spikeProgress - 0.4) / 0.6;
        waveformOffset = -(amplitude * leadFactor) * (1 - descendingProgress);
      }
    } else if (cyclePosition < spikePhase + wavePhase) {
      // Generate slow wave during wave phase - wave goes up (positive)
      const waveProgress = (cyclePosition - spikePhase) / wavePhase;
      // Invert the sine wave (make it negative) so it goes upward instead of downward
      waveformOffset = -(amplitude * 0.9 * leadFactor) * Math.sin(waveProgress * Math.PI);
    }
    
    // Apply burst envelope (smooth onset/offset)
    waveformOffset *= burstEnvelope;
    
    // Return final waveform value
    return centerY + waveformOffset;
  }
  
  // Generate a sinusoidal waveform with specified frequency and amplitude
  generateSinusoidalWaveform(frequency, amplitude, x, centerY, leadName, time) {
    // ... existing code ...
  }

  // Generate a spike waveform pattern
  generateSpikeWaveform(amplitude, duration, x, centerY, leadName, time) {
    return this.generateSharpOrSpikeWaveform(amplitude, duration, x, centerY, leadName, time, false);
  }
  
  // Generate spike or sharp wave patterns with customizable parameters
  generateSharpOrSpikeWaveform(amplitude, duration, x, centerY, leadName, time, isSharpWave) {
    // Determine if this lead is affected (temporal leads mainly)
    let leadFactor = 0;
    let isLeft = leadName.includes('1') || leadName.includes('3') || leadName.includes('5') || leadName.includes('7');
    
    // For spikes or sharp waves, we want them primarily in temporal regions with some spread
    if (leadName === 'F7-T3' || leadName === 'F8-T4') {
      leadFactor = 0.9; // Strong in frontal-temporal
    } else if (leadName === 'T3-T5' || leadName === 'T4-T6') {
      leadFactor = 1.0; // Strongest in mid-temporal
    } else if (leadName === 'T5-O1' || leadName === 'T6-O2') {
      leadFactor = 0.7; // Good in temporal-occipital
    } else if (leadName === 'Fp1-F7' || leadName === 'Fp2-F8') {
      leadFactor = 0.4; // Mild in frontopolar
    } else {
      leadFactor = 0.2; // Minimal in others
    }
    
    // No effect if lead factor is 0
    if (leadFactor === 0) {
      return centerY;
    }
    
    // Get frequency and periodicity based on type
    const frequency = isSharpWave ? this.sharpWaveFrequency : this.spikeFrequency;
    const periodicity = isSharpWave ? this.sharpWavePeriodicity : this.spikePeriodicity;
    
    // Calculate the base interval between patterns in seconds (inverse of frequency)
    // Lower frequency = longer interval between spikes
    const baseInterval = 1.0 / (frequency * 0.2); // Convert 0.1-1.0 scale to realistic intervals (5-50 seconds)
    
    // Apply periodicity factor (0-1) to randomize timing
    // Higher periodicity = more regular timing (less random)
    let randomOffset = 0;
    if (periodicity < 1.0) {
      // Only apply randomness if periodicity is not at maximum
      const randomFactor = 1.0 - periodicity; // Invert (0 = perfectly periodic, 1 = completely random)
      randomOffset = (Math.sin(time * 0.1 + leadName.length) * baseInterval * 0.5) * randomFactor;
    }
    
    // Final interval with randomization
    const interval = baseInterval + randomOffset;
    
    // Calculate spike/sharp wave timing
    const patternTime = Math.floor(time / interval) * interval;
    const timeFromPattern = time - patternTime;
    
    // Duration depends on type (spikes are shorter than sharp waves)
    const patternDuration = isSharpWave ? duration * 3.0 : duration; // Sharp waves are 3x longer
    
    // Check if we're in a pattern window
    if (timeFromPattern < patternDuration) {
      // Calculate the spike shape
      const normalizedTime = timeFromPattern / patternDuration;
      
      // Create shape with fast rise and slower decay
      let waveformOffset;
      
      if (isSharpWave) {
        // Sharper waves have a more gradual rise and fall
        if (normalizedTime < 0.3) {
          // Rising phase (0-30%)
          waveformOffset = -(amplitude * leadFactor) * (normalizedTime / 0.3);
        } else if (normalizedTime < 0.4) {
          // Peak (30-40%)
          waveformOffset = -(amplitude * leadFactor);
        } else {
          // Falling phase (40-100%)
          waveformOffset = -(amplitude * leadFactor) * (1 - ((normalizedTime - 0.4) / 0.6));
        }
      } else {
        // Spikes have very fast rise and slightly slower fall
        if (normalizedTime < 0.15) {
          // Rising phase (very fast - 0-15%)
          waveformOffset = -(amplitude * leadFactor) * (normalizedTime / 0.15);
        } else if (normalizedTime < 0.25) {
          // Peak (15-25%)
          waveformOffset = -(amplitude * leadFactor);
        } else {
          // Falling phase (25-100%)
          waveformOffset = -(amplitude * leadFactor) * (1 - ((normalizedTime - 0.25) / 0.75));
        }
      }
      
      return centerY + waveformOffset;
    }
    
    return centerY; // No pattern effect
  }

  // Add method to set spike and wave periodicity
  setSpikeAndWavePeriodicity(periodicity) {
    this.spikeAndWavePeriodicity = parseFloat(periodicity);
    
    // If spike and wave is currently active, update the display
    if (this.activeWaveforms.has('spikeAndWaves')) {
      // Keep playing to show the new pattern
      this.play();
    }
  }
  
  // Add method to set LRDA periodicity
  setLRDAPeriodicity(periodicity) {
    this.lrdaPeriodicity = parseFloat(periodicity);
    
    // If LRDA is currently active, update the display
    if (this.activeWaveforms.has('focalSlowing')) {
      // Keep playing to show the new pattern
      this.play();
    }
  }
  
  // Add method to set spike and wave frequency
  setSpikeAndWaveFrequency(frequency) {
    this.spikeAndWaveFrequency = parseInt(frequency);
    
    // If spike and wave is currently active, update the display
    if (this.activeWaveforms.has('spikeAndWaves')) {
      // Keep playing to show the new pattern
      this.play();
    }
  }
  
  // Add method to set LRDA frequency
  setLRDAFrequency(frequency) {
    this.lrdaFrequency = parseInt(frequency);
    
    // If LRDA is currently active, update the display
    if (this.activeWaveforms.has('focalSlowing')) {
      // Keep playing to show the new pattern
      this.play();
    }
  }

  // Add toggleSeizure function to handle the seizure button
  toggleSeizure() {
    const button = document.getElementById('seizureToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off seizure
      this.activeWaveforms.delete('seizure');
      this.patternTransitions.delete('seizure');
      
      // Hide seizure adjusters
      const seizureAdjusters = document.getElementById('seizure-adjusters');
      if (seizureAdjusters) {
        seizureAdjusters.style.display = 'none';
      }
      
      // Restore PDR if it was previously active (checked via button state)
      const pdrButton = document.getElementById('pdrToggle');
      if (pdrButton && pdrButton.classList.contains('active')) {
        this.activeWaveforms.add('alpha');
        this.startPatternTransition('pdr');
      }
    } else {
      // Reset time to 0 to ensure we start at the beginning of the normal phase
      this.currentTime = 0;
      
      // Start transition
      this.startPatternTransition('seizure');
      
      // Turn on seizure
      this.activeWaveforms.add('seizure');
      
      // Turn off PDR during seizure
      this.activeWaveforms.delete('alpha');
      this.patternTransitions.delete('pdr');
      
      // Show seizure adjusters
      const seizureAdjusters = document.getElementById('seizure-adjusters');
      if (seizureAdjusters) {
        seizureAdjusters.style.display = 'block';
      }
      
      // Force update to ensure first frame shows properly
      this.drawWaveform(this.currentTime);
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  // Set seizure speed (1=slow, 2=normal, 3=fast)
  setSeizureSpeed(speed) {
    this.seizureSpeed = parseInt(speed);
    console.log("Seizure speed set to:", this.seizureSpeed);
    
    // If seizure is active, reset the time to show the effect immediately
    if (this.activeWaveforms.has('seizure')) {
      this.currentTime = 0;
    }
  }
  
  // Set seizure intensity (1=mild, 2=moderate, 3=severe)
  setSeizureIntensity(intensity) {
    this.seizureIntensity = parseInt(intensity);
    console.log("Seizure intensity set to:", this.seizureIntensity);
    
    // If seizure is active, reset the time to show the effect immediately
    if (this.activeWaveforms.has('seizure')) {
      this.currentTime = 0;
    }
  }

  // Generate a seizure waveform based on time and lead
  generateSeizureWaveform(x, centerY, leadName, timePosition) {
    // Factor in seizure speed setting
    const speedFactor = this.seizureSpeed || 2; // Default to normal (2)
    const adjustedTime = timePosition * (speedFactor / 2); // Adjust time based on speed
    
    // Factor in intensity setting 
    const intensityFactor = this.seizureIntensity || 2; // Default to moderate (2)
    const baseAmplitude = 40 + (intensityFactor * 20); // Base amplitude range: 60-100
    
    // Define the seizure evolution timeline (in seconds)
    const normalPhase = 10;    // First 10 seconds: normal background
    const thetaPhase = 5;      // Next 5 seconds: rhythmic theta activity
    const mixedPhase = 5;      // Next 5 seconds: mixture of theta and sharps
    const sharpPhase = 8;      // Next 8 seconds: sharp waves fully developed
    const spreadPhase = 5;     // Next 5 seconds: activity spreads
    
    // Calculate the seizure phase
    const seizureTotalDuration = normalPhase + thetaPhase + mixedPhase + sharpPhase + spreadPhase;
    const cyclePosition = adjustedTime % seizureTotalDuration;
    
    // Determine which phase we're in
    const inNormalPhase = cyclePosition < normalPhase;
    const inThetaPhase = cyclePosition >= normalPhase && cyclePosition < (normalPhase + thetaPhase);
    const inMixedPhase = cyclePosition >= (normalPhase + thetaPhase) && 
                         cyclePosition < (normalPhase + thetaPhase + mixedPhase);
    const inSharpPhase = cyclePosition >= (normalPhase + thetaPhase + mixedPhase) && 
                         cyclePosition < (normalPhase + thetaPhase + mixedPhase + sharpPhase);
    const inSpreadPhase = cyclePosition >= (normalPhase + thetaPhase + mixedPhase + sharpPhase);
    
    // Progress within each phase (0-1)
    let thetaProgress = 0;
    let mixedProgress = 0;
    let sharpProgress = 0;
    let spreadProgress = 0;
    
    if (inThetaPhase) {
      thetaProgress = (cyclePosition - normalPhase) / thetaPhase;
    } else if (inMixedPhase) {
      thetaProgress = 1;
      mixedProgress = (cyclePosition - (normalPhase + thetaPhase)) / mixedPhase;
    } else if (inSharpPhase) {
      thetaProgress = 1;
      mixedProgress = 1;
      sharpProgress = (cyclePosition - (normalPhase + thetaPhase + mixedPhase)) / sharpPhase;
    } else if (inSpreadPhase) {
      thetaProgress = 1;
      mixedProgress = 1;
      sharpProgress = 1;
      spreadProgress = (cyclePosition - (normalPhase + thetaPhase + mixedPhase + sharpPhase)) / spreadPhase;
    }
    
    // Generate normal background activity (used in multiple phases)
    const generateNormalBackground = () => {
      if (leadName.includes('O1') || leadName.includes('O2') || 
          leadName.includes('P3') || leadName.includes('P4') ||
          leadName.includes('T5') || leadName.includes('T6')) {
        // Posterior alpha (8-12 Hz)
        const alphaFreq = 9 + (Math.sin(adjustedTime * 0.5) * 1.5);
        const alphaAmp = 15 + (Math.sin(adjustedTime * 0.3) * 5);
        return Math.sin(adjustedTime * alphaFreq) * alphaAmp;
      } else {
        // Anterior beta (14-30 Hz)
        const betaFreq = 18 + (Math.sin(adjustedTime * 0.4) * 4);
        const betaAmp = 8 + (Math.sin(adjustedTime * 0.25) * 3);
        return Math.sin(adjustedTime * betaFreq) * betaAmp;
      }
    };
    
    // Generate theta rhythm (used in multiple phases)
    const generateTheta = (amplitudeFactor = 1.0) => {
      // Theta frequency (4-8 Hz) with slight variability
      const thetaFreq = 6 - thetaProgress * 1; // Slowing from 6Hz to 5Hz
      const thetaAmp = baseAmplitude * 0.4 * amplitudeFactor;
      return Math.sin(adjustedTime * thetaFreq) * thetaAmp;
    };
    
    // Generate sharp waves (used in multiple phases)
    const generateSharpWaves = (frequency, sharpnessFactor, amplitudeFactor = 1.0) => {
      // Create sharp wave pattern
      const cycle = (adjustedTime * frequency) % 1; // 0-1 for each cycle
      
      // Generate asymmetric waveform
      let waveform;
      if (cycle < 0.2) { // Rising phase (fast)
        waveform = cycle / 0.2; // 0-1 linear rise
      } else { // Falling phase (slower)
        waveform = Math.pow(1 - ((cycle - 0.2) / 0.8), sharpnessFactor);
      }
      
      const amplitude = baseAmplitude * amplitudeFactor;
      return waveform * amplitude;
    };
    
    // Phase 1: Normal background - completely normal, no seizure activity
    if (inNormalPhase) {
      // Generate pure normal background
      if (leadName.includes('O1') || leadName.includes('O2') || 
          leadName.includes('P3') || leadName.includes('P4') ||
          leadName.includes('T5') || leadName.includes('T6')) {
        // Posterior alpha (8-12 Hz)
        const alphaFreq = 9 + (Math.sin(adjustedTime * 0.5) * 1.5);
        const alphaAmp = 15 + (Math.sin(adjustedTime * 0.3) * 5);
        return centerY + Math.sin(adjustedTime * alphaFreq) * alphaAmp;
      } else {
        // Anterior beta (14-30 Hz)
        const betaFreq = 18 + (Math.sin(adjustedTime * 0.4) * 4);
        const betaAmp = 8 + (Math.sin(adjustedTime * 0.25) * 3);
        return centerY + Math.sin(adjustedTime * betaFreq) * betaAmp;
      }
    }
    
    // Phase 2: Theta rhythm development
    // Starts in right temporal region (T6)
    if (inThetaPhase) {
      // Calculate spatial factor (where the rhythm starts)
      let spatialFactor = 0;
      
      // Start in T6 initially
      if (leadName.includes('T6')) {
        spatialFactor = 0.2 + thetaProgress * 0.8; // Gradual build-up
      } 
      // Spread to adjacent regions gradually
      else if (leadName.includes('T4') || leadName.includes('O2')) {
        spatialFactor = Math.max(0, thetaProgress - 0.3) * 0.6; // Delayed start, up to 0.6
      }
      
      if (spatialFactor > 0) {
        // Mix decreasing normal background with increasing theta
        const normalComponent = generateNormalBackground() * (1 - thetaProgress * 0.8);
        const thetaComponent = generateTheta(spatialFactor);
        return centerY + normalComponent + thetaComponent;
      } else {
        // Other leads keep their normal background but gradually decrease in amplitude
        return centerY + generateNormalBackground() * (1 - thetaProgress * 0.3);
      }
    }
    
    // Phase 3: Mixed theta and sharp waves
    if (inMixedPhase) {
      // Calculate spatial factor
      let spatialFactor = 0;
      
      // Start in right temporal and adjacent areas
      if (leadName.includes('T6')) {
        spatialFactor = 1.0;
      } 
      else if (leadName.includes('T4')) {
        spatialFactor = 0.8;
      }
      else if (leadName.includes('O2')) {
        spatialFactor = 0.7;
      }
      else if (leadName.includes('F8')) {
        spatialFactor = 0.4 + mixedProgress * 0.2; // Gradual involvement
      }
      
      if (spatialFactor > 0) {
        // Mix between theta rhythm and sharp waves
        const thetaComponent = generateTheta(spatialFactor * (1 - mixedProgress * 0.7)); // Decreasing theta
        const sharpnessFactor = 0.3 + mixedProgress * 0.4; // Increasing sharpness
        const sharpComponent = generateSharpWaves(5, sharpnessFactor, spatialFactor * mixedProgress); // Increasing sharp waves
        
        return centerY + thetaComponent + sharpComponent;
      } else {
        // Other leads have diminishing normal background
        return centerY + generateNormalBackground() * (1 - mixedProgress * 0.6);
      }
    }
    
    // Phase 4: Sharp waves fully developed
    if (inSharpPhase) {
      // Calculate spatial factor
      let spatialFactor = 0;
      
      // Involvement in right temporal and adjacent areas
      if (leadName.includes('T6')) {
        spatialFactor = 1.0;
      } 
      else if (leadName.includes('T4')) {
        spatialFactor = 0.9;
      }
      else if (leadName.includes('O2')) {
        spatialFactor = 0.8;
      }
      else if (leadName.includes('F8')) {
        spatialFactor = 0.7;
      }
      // Beginning spread to left sides
      else if (leadName.includes('T5') && sharpProgress > 0.5) {
        spatialFactor = Math.min(0.6, (sharpProgress - 0.5) * 1.2);
      }
      
      if (spatialFactor > 0) {
        // Fully developed 5Hz sharp waves
        const sharpnessFactor = 0.7 + sharpProgress * 0.3; // Maximum sharpness achieved
        return centerY + generateSharpWaves(5, sharpnessFactor, spatialFactor);
      } else {
        // Other leads have minimal activity
        return centerY + generateNormalBackground() * 0.2;
      }
    }
    
    // Phase 5: Spread to other brain regions
    if (inSpreadPhase) {
      // Calculate regional involvement
      let regionalFactor = 0;
      
      // Initial regions remain fully involved
      if (leadName.includes('T6') || leadName.includes('T4') || leadName.includes('O2')) {
        regionalFactor = 1.0;
      }
      // Secondary spread to right frontal
      else if (leadName.includes('F8') || leadName.includes('Fp2')) {
        regionalFactor = 0.8;
      }
      // Tertiary spread to left posterior
      else if (leadName.includes('T5')) {
        regionalFactor = 0.7;
      }
      else if (leadName.includes('O1')) {
        regionalFactor = 0.6;
      }
      // Quaternary spread to remaining left hemisphere
      else if (leadName.includes('T3') && spreadProgress > 0.3) {
        regionalFactor = Math.min(0.6, (spreadProgress - 0.3) * 1.5);
      }
      else if ((leadName.includes('F7') || leadName.includes('Fp1')) && spreadProgress > 0.5) {
        regionalFactor = Math.min(0.5, (spreadProgress - 0.5) * 1.5);
      }
      // Final involvement of central regions 
      else if (spreadProgress > 0.7) {
        regionalFactor = Math.min(0.3, (spreadProgress - 0.7) * 1.5);
      }
      
      if (regionalFactor > 0) {
        // Sharp wave pattern fully developed
        return centerY + generateSharpWaves(5, 1.0, regionalFactor);
      } else {
        // Minimal activity in uninvolved regions
        return centerY + (Math.sin(adjustedTime * 15) * 3);
      }
    }

    // Default return if no seizure activity at this lead
    return centerY;
  }

  setLRDAPeriodicity(periodicity) {
    console.log(`Setting LRDA periodicity to ${periodicity}`);
    this.lrdaPeriodicity = parseFloat(periodicity);
  }
  
  setGRDAFrequency(frequency) {
    console.log(`Setting GRDA frequency to ${frequency}`);
    this.grdaFrequency = parseInt(frequency);
  }
  
  setGRDAPeriodicity(periodicity) {
    console.log(`Setting GRDA periodicity to ${periodicity}`);
    this.grdaPeriodicity = parseFloat(periodicity);
  }

  // Add toggleMovement function to handle the movement artifact button
  toggleMovement() {
    console.log("Toggling movement artifact");
    const button = document.getElementById('movementToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off movement artifact
      console.log("Turning off movement artifact");
      this.activeWaveforms.delete('movement');
      this.patternTransitions.delete('movement');
    } else {
      // Turn on movement artifact
      console.log("Turning on movement artifact");
      
      // Ensure movement is added to active waveforms
      this.activeWaveforms.add('movement');
      
      // Start transition with short duration for quick effect
      this.startPatternTransition('movement', 500);
      
      // Log active waveforms for debugging
      console.log("Active waveforms:", Array.from(this.activeWaveforms));
      console.log("Pattern transitions:", Array.from(this.patternTransitions.keys()));
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }

  // Add toggle function for pulse artifact
  togglePulseArtifact() {
    const button = document.getElementById('pulseArtifactToggle');
    const isActive = button.classList.contains('active');
    
    // Toggle the button state
    button.classList.toggle('active');
    
    if (isActive) {
      // Turn off pulse artifact
      this.activeWaveforms.delete('pulseArtifact');
      this.patternTransitions.delete('pulseArtifact');
    } else {
      // Start transition - fast transition for immediate visibility
      this.startPatternTransition('pulseArtifact', 300);
      
      // Turn on pulse artifact
      this.activeWaveforms.add('pulseArtifact');
      
      // Remove automatic ECG activation - let user control ECG separately
      
      // For better visualization, turn off competing artifacts
      this.activeWaveforms.delete('sixtyHzArtifact');
      this.activeWaveforms.delete('sweatArtifact');
      
      // Update UI to reflect state of incompatible artifacts
      const sixtyHzButton = document.getElementById('sixtyHzArtifactToggle');
      if (sixtyHzButton && sixtyHzButton.classList.contains('active')) {
        sixtyHzButton.classList.remove('active');
      }
      
      const sweatButton = document.getElementById('sweatArtifactToggle');
      if (sweatButton && sweatButton.classList.contains('active')) {
        sweatButton.classList.remove('active');
      }
    }
    
    // Update ACNS interpretation
    this.updateScaleInfo();
  }
} 