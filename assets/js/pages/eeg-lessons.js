/**
 * EEG Lessons: Phase Reversal Simulator and 10-20 System Tutorials
 * This script handles the interactive elements for the EEG lessons, including 
 * the phase reversal simulator and lesson tab navigation.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize lesson tabs navigation
  initLessonTabs();
  
  // Initialize the phase reversal simulator
  initPhaseReversalSimulator();
});

/**
 * Initialize lesson tabs navigation
 */
function initLessonTabs() {
  const lessonTabs = document.querySelectorAll('.lesson-tab');
  const lessonContents = document.querySelectorAll('.lesson-content');
  
  lessonTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Get the lesson to show
      const lessonToShow = tab.getAttribute('data-lesson');
      
      // Hide all lessons
      lessonContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Deactivate all tabs
      lessonTabs.forEach(t => {
        t.classList.remove('active');
      });
      
      // Show the selected lesson
      document.getElementById(`${lessonToShow}-lesson`).classList.add('active');
      
      // Activate the clicked tab
      tab.classList.add('active');
    });
  });
}

/**
 * Initialize the phase reversal simulator
 */
function initPhaseReversalSimulator() {
  const headDiagram = document.querySelector('.head-diagram');
  const waveformDisplay = document.getElementById('phase-reversal-waveforms');
  const activitySource = document.getElementById('activity-source');
  const montageSelect = document.getElementById('reversal-montage-select');
  const reversalExplanation = document.getElementById('reversal-explanation');
  const electrodes = document.querySelectorAll('.electrode');
  const voltageSlider = document.getElementById('voltage-slider');
  const voltageValue = document.getElementById('voltage-value');
  
  // Track discharge type - always negative now
  let isPositiveDischarge = false; // Keep this for compatibility but always false
  
  // Track last clicked electrode for examples
  let lastClickedElectrode = null;
  let lastClickedVoltages = {};
  
  // Montage definitions matching those in eeg-lead-practice.js
  const montages = {
    'longitudinal-bipolar': [
      'Fp1-F3', 'F3-C3', 'C3-P3', 'P3-O1',
      'Fp2-F4', 'F4-C4', 'C4-P4', 'P4-O2',
      'Fp1-F7', 'F7-T7', 'T7-P7', 'P7-O1',
      'Fp2-F8', 'F8-T8', 'T8-P8', 'P8-O2',
      'Fz-Cz', 'Cz-Pz'
    ],
    'referential-avg': [
      'Fp1-Avg', 'F3-Avg', 'C3-Avg', 'P3-Avg', 'O1-Avg',
      'Fp2-Avg', 'F4-Avg', 'C4-Avg', 'P4-Avg', 'O2-Avg',
      'F7-Avg', 'T7-Avg', 'P7-Avg',
      'F8-Avg', 'T8-Avg', 'P8-Avg',
      'Fz-Avg', 'Cz-Avg', 'Pz-Avg'
    ]
  };
  
  // Initialize the waveform display with the default montage
  createWaveformRows(montages[montageSelect.value]);
  
  // Initialize the slider track width based on the default value
  const sliderVal = parseInt(voltageSlider.value);
  const sliderMin = parseInt(voltageSlider.min);
  const sliderMax = parseInt(voltageSlider.max);
  const percentage = ((sliderVal - sliderMin) / (sliderMax - sliderMin)) * 100;
  document.getElementById('slider-track').style.width = percentage + '%';
  
  // Handle montage selection changes
  montageSelect.addEventListener('change', () => {
    const selectedMontage = montageSelect.value;
    createWaveformRows(montages[selectedMontage]);
    // If we have a last clicked electrode, update the display with the new montage
    if (lastClickedElectrode) {
      updateWaveforms(lastClickedVoltages);
      updateExplanation(lastClickedElectrode);
    }
  });
  
  // Handle voltage slider changes
  voltageSlider.addEventListener('input', function() {
    // Update the displayed voltage value
    voltageValue.textContent = this.value;
    
    // Update the slider track width to visualize the selected value
    const min = parseInt(this.min);
    const max = parseInt(this.max);
    const val = parseInt(this.value);
    const percentage = ((val - min) / (max - min)) * 100;
    document.getElementById('slider-track').style.width = percentage + '%';
    
    // If we have a last clicked electrode, update with new voltage
    if (lastClickedElectrode) {
      const rect = headDiagram.getBoundingClientRect();
      const elX = parseFloat(document.querySelector(`[data-electrode="${lastClickedElectrode}"]`).style.left);
      const elY = parseFloat(document.querySelector(`[data-electrode="${lastClickedElectrode}"]`).style.top);
      const xPercent = elX;
      const yPercent = elY;
      
      lastClickedVoltages = calculateVoltages(xPercent, yPercent);
      updateWaveforms(lastClickedVoltages);
    }
  });
  
  // Handle click on the head diagram to show phase reversal
  headDiagram.addEventListener('click', (e) => {
    // Calculate click position relative to the head diagram
    const rect = headDiagram.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate position in percentage
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Show the activity source at click position
    activitySource.style.left = `${xPercent}%`;
    activitySource.style.top = `${yPercent}%`;
    activitySource.classList.add('visible');
    
    // Reset all electrodes
    electrodes.forEach(el => el.classList.remove('active'));
    
    // Find the nearest electrode to the click
    const nearestElectrode = findNearestElectrode(xPercent, yPercent);
    if (nearestElectrode) {
      nearestElectrode.classList.add('active');
      lastClickedElectrode = nearestElectrode.getAttribute('data-electrode');
    }
    
    // Calculate voltages for all electrodes based on distance from click
    lastClickedVoltages = calculateVoltages(xPercent, yPercent);
    
    // Update waveforms based on voltages
    updateWaveforms(lastClickedVoltages);
    
    // Update explanation
    updateExplanation(nearestElectrode ? nearestElectrode.getAttribute('data-electrode') : null);
    
    // Set activity source styling - always use negative discharge (red)
    activitySource.style.background = 'radial-gradient(circle, rgba(255,0,0,0.7) 0%, rgba(255,0,0,0) 70%)';
    
    // Hide activity source after 2 seconds
    setTimeout(() => {
      activitySource.classList.remove('visible');
    }, 2000);
  });
  
  /**
   * Create waveform rows for the selected montage
   * @param {Array} montageChannels - Array of channels in the selected montage
   */
  function createWaveformRows(montageChannels) {
    // Clear current waveforms
    waveformDisplay.innerHTML = '';
    
    // Group channels for organized display
    const groups = {
      'Left': montageChannels.filter(ch => ch.includes('Fp1') || ch.includes('F3') || 
                                       ch.includes('C3') || ch.includes('P3') || 
                                       ch.includes('O1') || ch.includes('F7') || 
                                       ch.includes('T7') || ch.includes('P7')),
      'Midline': montageChannels.filter(ch => ch.includes('Fz') || ch.includes('Cz') || ch.includes('Pz')),
      'Right': montageChannels.filter(ch => ch.includes('Fp2') || ch.includes('F4') || 
                                        ch.includes('C4') || ch.includes('P4') || 
                                        ch.includes('O2') || ch.includes('F8') || 
                                        ch.includes('T8') || ch.includes('P8')),
      'Other': montageChannels.filter(ch => ch.includes('A1') || ch.includes('A2'))
    };
    
    // Add header
    const header = document.createElement('div');
    header.classList.add('waveform-header');
    header.innerHTML = `<h5>EEG - ${montageSelect.options[montageSelect.selectedIndex].text}</h5>`;
    waveformDisplay.appendChild(header);
    
    // Add groups with labels
    Object.entries(groups).forEach(([groupName, channels]) => {
      if (channels.length === 0) return;
      
      // Group label
      const groupLabel = document.createElement('div');
      groupLabel.classList.add('waveform-group-label');
      groupLabel.textContent = groupName;
      waveformDisplay.appendChild(groupLabel);
      
      // Add channels for this group
      channels.forEach(channel => {
        const row = document.createElement('div');
        row.classList.add('waveform-row');
        
        // Create label
        const label = document.createElement('div');
        label.classList.add('waveform-label');
        label.textContent = channel;
        
        // Create graph area
        const graph = document.createElement('div');
        graph.classList.add('waveform-graph');
        graph.setAttribute('data-channel', channel);
        
        // Add baseline
        const baseline = document.createElement('div');
        baseline.classList.add('baseline');
        graph.appendChild(baseline);
        
        // Add waveform line
        const waveformLine = document.createElement('div');
        waveformLine.classList.add('waveform-line');
        waveformLine.style.transform = 'scaleY(0)';
        graph.appendChild(waveformLine);
        
        // Add components to row
        row.appendChild(label);
        row.appendChild(graph);
        
        // Add row to display
        waveformDisplay.appendChild(row);
      });
    });
    
    // Add a time scale at the bottom
    const timeScale = document.createElement('div');
    timeScale.classList.add('time-scale');
    timeScale.innerHTML = '<div class="scale-label">1 sec</div><div class="scale-line"></div>';
    waveformDisplay.appendChild(timeScale);
  }
  
  /**
   * Find the nearest electrode to the click position
   * @param {number} x - X position in percentage
   * @param {number} y - Y position in percentage
   * @returns {Element} The nearest electrode element
   */
  function findNearestElectrode(x, y) {
    let nearestElectrode = null;
    let minDistance = Infinity;
    
    electrodes.forEach(electrode => {
      const elX = parseFloat(electrode.style.left);
      const elY = parseFloat(electrode.style.top);
      
      const distance = Math.sqrt(Math.pow(x - elX, 2) + Math.pow(y - elY, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestElectrode = electrode;
      }
    });
    
    return nearestElectrode;
  }
  
  /**
   * Calculate voltages for all electrodes based on distance from click
   * @param {number} x - x-coordinate of click (percentage)
   * @param {number} y - y-coordinate of click (percentage)
   * @returns {Object} - Object with calculated voltages for all electrodes
   */
  function calculateVoltages(x, y) {
    // Always use negative discharge (isPositive = false)
    const isPositive = false;
    const voltageMax = parseInt(document.getElementById('voltage-slider').value || 120);
    const falloff = 0.07; // Controls how quickly voltage drops with distance
    
    const voltages = {};
    
    // Add special electrodes for complete montage
    voltages['A1'] = 0; // Left ear electrode - negligible voltage
    voltages['A2'] = 0; // Right ear electrode - negligible voltage
    
    electrodes.forEach(electrode => {
      const elX = parseFloat(electrode.style.left);
      const elY = parseFloat(electrode.style.top);
      const distance = Math.sqrt(Math.pow(x - elX, 2) + Math.pow(y - elY, 2));
      
      // Inverse relationship with distance (closer = higher voltage)
      // Reverse polarity - Negative discharge should produce positive voltage
      // and positive discharge should produce negative voltage
      const polarity = isPositive ? -1 : 1;
      
      // Apply a more gradual falloff for distance
      // Ensure even distant electrodes receive meaningful voltage
      const voltage = polarity * voltageMax * Math.exp(-falloff * distance);
      
      // Add a minimum voltage threshold for nearby electrodes in the same region
      const minRegionalVoltage = voltageMax * 0.2; // 20% of max voltage as minimum for regional effect
      
      // Check if electrodes are in the same region (e.g., T7 and F7 are both on left side)
      const isRegionallyRelated = isElectrodesRegionallyRelated(electrode.getAttribute('data-electrode'), nearestElectrodeToPoint(x, y));
      
      // For regionally related electrodes, ensure a minimum voltage
      if (isRegionallyRelated && Math.abs(voltage) < minRegionalVoltage) {
        voltages[electrode.getAttribute('data-electrode')] = polarity * minRegionalVoltage;
      } else {
        voltages[electrode.getAttribute('data-electrode')] = voltage;
      }
    });
    
    // Calculate average reference voltage
    let sum = 0;
    let count = 0;
    
    // Only include actual scalp electrodes in the average (exclude A1, A2)
    Object.entries(voltages).forEach(([electrode, value]) => {
      if (electrode !== 'A1' && electrode !== 'A2') {
        sum += value;
        count++;
      }
    });
    
    const avgVoltage = count > 0 ? sum / count : 0;
    voltages['Avg'] = avgVoltage;
    
    return voltages;
  }
  
  /**
   * Determine if two electrodes are regionally related (e.g., both on left side, right side, etc.)
   * @param {string} electrode1 - First electrode name
   * @param {string} electrode2 - Second electrode name
   * @returns {boolean} Whether the electrodes are regionally related
   */
  function isElectrodesRegionallyRelated(electrode1, electrode2) {
    if (!electrode1 || !electrode2) return false;
    
    // Define regional groups
    const leftSide = ['Fp1', 'F7', 'F3', 'T7', 'C3', 'P7', 'P3', 'O1'];
    const rightSide = ['Fp2', 'F8', 'F4', 'T8', 'C4', 'P8', 'P4', 'O2'];
    const midline = ['Fz', 'Cz', 'Pz'];
    
    // Check if electrodes are in the same regional group
    if (leftSide.includes(electrode1) && leftSide.includes(electrode2)) return true;
    if (rightSide.includes(electrode1) && rightSide.includes(electrode2)) return true;
    if (midline.includes(electrode1) && midline.includes(electrode2)) return true;
    
    return false;
  }
  
  /**
   * Get the nearest electrode name to a point on the head
   * @param {number} x - X position in percentage
   * @param {number} y - Y position in percentage
   * @returns {string} The name of the nearest electrode
   */
  function nearestElectrodeToPoint(x, y) {
    let nearestElectrode = null;
    let minDistance = Infinity;
    
    electrodes.forEach(electrode => {
      const elX = parseFloat(electrode.style.left);
      const elY = parseFloat(electrode.style.top);
      
      const distance = Math.sqrt(Math.pow(x - elX, 2) + Math.pow(y - elY, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestElectrode = electrode.getAttribute('data-electrode');
      }
    });
    
    return nearestElectrode;
  }
  
  /**
   * Update waveforms based on calculated voltages
   * @param {Object} voltages - Object with electrode names as keys and voltage values as values
   */
  function updateWaveforms(voltages) {
    const waveformGraphs = document.querySelectorAll('.waveform-graph');
    
    // Clear all existing highlighted phase reversals
    document.querySelectorAll('.phase-reversal-indicator').forEach(el => el.remove());
    
    // Track adjacent channels for phase reversal detection
    const channelData = [];
    
    waveformGraphs.forEach(graph => {
      const channel = graph.getAttribute('data-channel');
      const electrodes = channel.split('-');
      
      if (electrodes.length === 2) {
        // Calculate voltage difference for bipolar channel
        const voltage1 = voltages[electrodes[0]] || 0;
        const voltage2 = voltages[electrodes[1]] || 0;
        const difference = voltage1 - voltage2;
        
        // Store the channel data for phase reversal detection
        channelData.push({
          channel: channel,
          element: graph,
          electrodes: electrodes,
          difference: difference,
          scaleFactor: Math.min(Math.max(difference / 40, -2.5), 2.5) // More sensitive scaling (changed from 50 to 40)
        });
        
        // Remove previous waveform if it exists
        const existingWaveform = graph.querySelector('svg');
        if (existingWaveform) {
          existingWaveform.remove();
        }
        
        // Lower threshold for showing detailed waveforms (changed from 5 to 3)
        if (Math.abs(difference) > 3) {
          // Create an SVG element for the waveform
          createWaveformSVG(graph, difference);
        } else {
          // Create a subtle background activity for insignificant differences
          createBackgroundActivity(graph);
        }
      }
    });
    
    // Detect and highlight phase reversals
    detectPhaseReversals(channelData);
  }
  
  /**
   * Create an SVG element with realistic EEG waveform
   * @param {Element} container - Container for the waveform
   * @param {number} difference - Voltage difference to determine amplitude
   */
  function createWaveformSVG(container, difference) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const centerY = height / 2;
    
    // Scale factor to determine amplitude of the waveform
    // More aggressive scaling for better visibility of small differences
    const scaleFactor = Math.min(Math.max(difference / 40, -2.2), 2.2); // Changed from 50 to 40
    
    // Adjust amplitude calculation to ensure visible waveforms even for small differences
    let amplitudePercentage;
    if (Math.abs(difference) < 10) {
      // For very small differences, use a minimum amplitude percentage
      amplitudePercentage = 0.2 + (Math.abs(difference) * 0.02); // At least 20% amplitude
    } else {
      amplitudePercentage = Math.abs(scaleFactor) / 2.2; // Normal scaling for larger differences
    }
    
    const amplitude = Math.max(height * 0.15, height * 0.35 * amplitudePercentage);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.classList.add('waveform-svg');
    
    // Create path for the waveform
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Generate path data for the waveform
    const pathData = generateWaveformPath(width, centerY, amplitude, difference);
    
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', difference < 0 ? '#0066cc' : '#e74c3c');
    
    // Increase stroke width for more visible waveforms
    // Ensure even small deflections have a minimum stroke width
    const strokeWidth = Math.max(2, Math.min(3 + Math.abs(scaleFactor) * 0.6, 4));
    path.setAttribute('stroke-width', strokeWidth);
    path.style.opacity = '0';
    
    // Add the path to the SVG
    svg.appendChild(path);
    
    // Add the SVG to the container
    container.appendChild(svg);
    
    // Animate the waveform
    setTimeout(() => {
      path.style.opacity = '1';
      path.style.transition = 'opacity 0.3s ease';
      
      // Add a class to indicate this is a significant waveform
      container.classList.add('significant-waveform');
      
      // Add extra styling for phase reversals - lower threshold for better visibility
      if (Math.abs(scaleFactor) > 0.5) { // Changed from 0.7 to 0.5
        container.classList.add('phase-reversal-waveform');
        svg.style.zIndex = '5';
      }
    }, 10);
  }
  
  /**
   * Generate a path for a realistic EEG waveform
   * @param {number} width - Width of the container
   * @param {number} centerY - Y-coordinate of the center line
   * @param {number} amplitude - Maximum amplitude of the waveform
   * @param {number} difference - Voltage difference to determine direction
   * @returns {string} SVG path data
   */
  function generateWaveformPath(width, centerY, amplitude, difference) {
    // Determine the direction of the waveform based on the sign of the difference
    const direction = difference < 0 ? -1 : 1;
    
    // The main spike will be positioned around 50% of the width
    const spikePosition = width * 0.5;
    
    // Increase the amplitude for more pronounced spikes but reduced to prevent cutoff
    const enhancedAmplitude = amplitude * 1.2; // Reduced from 1.5 to 1.2
    
    // Start point of the path
    let pathData = `M 0,${centerY}`;
    
    // Generate random fluctuations in the baseline (background activity)
    for (let x = 0; x < spikePosition - width * 0.15; x += width / 50) {
      const y = centerY + (Math.random() - 0.5) * (amplitude * 0.15);
      pathData += ` L ${x},${y}`;
    }
    
    // Create the main spike - sharper for larger amplitudes
    // Increase sharpness overall, but make spikes wider
    const sharpness = Math.min(Math.abs(difference) / 40, 1.5); // Reduced from 1.8 to 1.5
    const spikeWidth = width * (0.12 - sharpness * 0.04); // Wider spike width
    
    // Add a more pronounced pre-spike deflection in the opposite direction
    const preDeflection = enhancedAmplitude * 0.2 * -direction; // Reduced from 0.25 to 0.2
    pathData += ` L ${spikePosition - spikeWidth * 2.0},${centerY}`;
    pathData += ` L ${spikePosition - spikeWidth * 1.2},${centerY + preDeflection}`;
    
    // Build the main spike with steeper curve
    pathData += ` L ${spikePosition - spikeWidth * 0.6},${centerY}`;
    pathData += ` L ${spikePosition},${centerY - direction * enhancedAmplitude}`;
    pathData += ` L ${spikePosition + spikeWidth * 0.6},${centerY}`;
    
    // Add a more pronounced post-spike deflection in the opposite direction
    pathData += ` L ${spikePosition + spikeWidth * 1.2},${centerY + preDeflection}`;
    pathData += ` L ${spikePosition + spikeWidth * 2.0},${centerY}`;
    
    // Continue with background activity after the spike
    for (let x = spikePosition + spikeWidth * 2.0; x <= width; x += width / 50) {
      const y = centerY + (Math.random() - 0.5) * (amplitude * 0.15);
      pathData += ` L ${x},${y}`;
    }
    
    return pathData;
  }
  
  /**
   * Create subtle background activity for channels with minimal voltage difference
   * @param {Element} container - Container for the background activity
   */
  function createBackgroundActivity(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const centerY = height / 2;
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    
    // Create path for the background activity
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Generate path data for subtle background activity
    let pathData = `M 0,${centerY}`;
    
    // Slightly more pronounced background activity
    const bgAmplitude = height * 0.12; // Increased from 0.1 to 0.12
    
    // Generate random fluctuations (background EEG)
    for (let x = 0; x <= width; x += width / 80) {
      const y = centerY + (Math.random() - 0.5) * bgAmplitude;
      pathData += ` L ${x},${y}`;
    }
    
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#777'); // Darker color for better visibility
    path.setAttribute('stroke-width', '1.5');
    path.style.opacity = '0';
    
    // Add the path to the SVG
    svg.appendChild(path);
    
    // Add the SVG to the container
    container.appendChild(svg);
    
    // Animate the background activity
    setTimeout(() => {
      path.style.opacity = '0.7'; // Increased from 0.6 to 0.7
      path.style.transition = 'opacity 0.3s ease';
    }, 10);
  }
  
  /**
   * Detect phase reversals in the waveform data and highlight them
   * @param {Array} channelData - Array of channel data objects
   */
  function detectPhaseReversals(channelData) {
    // Group channels by similar electrodes for detecting reversals
    const groupedChannels = {};
    
    // Create groups based on shared electrodes
    channelData.forEach(data => {
      data.electrodes.forEach(electrode => {
        if (!groupedChannels[electrode]) {
          groupedChannels[electrode] = [];
        }
        groupedChannels[electrode].push(data);
      });
    });
    
    // Find channels that form a phase reversal (different directions around a shared electrode)
    Object.entries(groupedChannels).forEach(([electrode, channels]) => {
      if (channels.length < 2) return;
      
      // Check for pairs that might form a reversal
      for (let i = 0; i < channels.length; i++) {
        for (let j = i + 1; j < channels.length; j++) {
          const channel1 = channels[i];
          const channel2 = channels[j];
          
          // Check if they have opposing deflections (one positive, one negative)
          // AND the shared electrode is between them
          if (channel1.difference * channel2.difference < 0) {
            // Verify the shared electrode is the second electrode in one channel
            // and the first electrode in the other channel
            const reversal = (
              (channel1.electrodes[1] === electrode && channel2.electrodes[0] === electrode) ||
              (channel1.electrodes[0] === electrode && channel2.electrodes[1] === electrode)
            );
            
            // Lower the threshold significantly to detect more subtle phase reversals
            if (reversal && Math.abs(channel1.difference) > 3 && Math.abs(channel2.difference) > 3) {
              // This is a phase reversal! Highlight both channels
              highlightPhaseReversal(channel1.element, channel2.element, electrode);
              
              // Scroll to first channel with phase reversal
              setTimeout(() => {
                channel1.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }
          }
        }
      }
    });
  }
  
  /**
   * Highlight a detected phase reversal between two channels
   * @param {Element} element1 - First channel element
   * @param {Element} element2 - Second channel element
   * @param {string} electrode - The electrode name at reversal point
   */
  function highlightPhaseReversal(element1, element2, electrode) {
    // Add indicator to the first channel
    const indicator = document.createElement('div');
    indicator.classList.add('phase-reversal-indicator');
    indicator.innerHTML = `<span>Phase Reversal at ${electrode}</span>`;
    element1.appendChild(indicator);
    
    // Add highlighting to both channels
    element1.classList.add('has-phase-reversal');
    element2.classList.add('has-phase-reversal');
    
    // Add pulsing effect to both waveforms
    element1.querySelectorAll('svg').forEach(svg => {
      svg.classList.add('pulse-waveform');
      // Increase the stroke-width for highlighted phase reversals
      const path = svg.querySelector('path');
      if (path) {
        const currentWidth = parseFloat(path.getAttribute('stroke-width') || 2);
        path.setAttribute('stroke-width', currentWidth * 1.2);
      }
    });
    
    element2.querySelectorAll('svg').forEach(svg => {
      svg.classList.add('pulse-waveform');
      // Increase the stroke-width for highlighted phase reversals
      const path = svg.querySelector('path');
      if (path) {
        const currentWidth = parseFloat(path.getAttribute('stroke-width') || 2);
        path.setAttribute('stroke-width', currentWidth * 1.2);
      }
    });
  }
  
  /**
   * Update the explanation text based on the active electrode
   * @param {string} electrodeName - Name of the active electrode
   */
  function updateExplanation(electrodeName) {
    // Check if the explanation element exists before attempting to update it
    if (!reversalExplanation) return;
    if (!electrodeName) return;
    
    // Remove all the dynamic explanation text and keep only the basic instruction
    let explanation = `<p>Click on the head diagram to see phase reversal patterns. The electrode closest to your click will show the highest voltage, creating a phase reversal in the bipolar montage.</p>`;
    
    reversalExplanation.innerHTML = explanation;
  }
} 