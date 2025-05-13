document.addEventListener('DOMContentLoaded', function() {
  // Initialize practice tabs navigation
  initPracticeTabs();
  
  // Initialize lead practice
  init();
  
  // Track scroll position
  window.addEventListener('scroll', function() {
    documentScrollX = window.scrollX || window.pageXOffset;
    documentScrollY = window.scrollY || window.pageYOffset;
  });
});

/**
 * Initialize practice tabs navigation
 */
function initPracticeTabs() {
  const practiceTabs = document.querySelectorAll('.practice-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  practiceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Get the tab to show
      const tabToShow = tab.getAttribute('data-tab');
      
      // Hide all tab contents
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Deactivate all tabs
      practiceTabs.forEach(t => {
        t.classList.remove('active');
      });
      
      // Show the selected tab content
      document.getElementById(`${tabToShow}-tab`).classList.add('active');
      
      // Activate the clicked tab
      tab.classList.add('active');
    });
  });
}

// Global variables to share across functions
const eegLeads = [
  'Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8',
  'T7', 'C3', 'Cz', 'C4', 'T8',
  'P7', 'P3', 'Pz', 'P4', 'P8',
  'O1', 'O2', 'A1', 'A2'
];

// Practice modes definitions
const practiceModes = {
  'standard': {
    name: 'Standard Practice',
    description: 'Place all leads at your own pace'
  },
  'timed': {
    name: 'Timed Challenge',
    description: 'Place all leads within time limit',
    timeLimit: 120 // seconds
  },
  'random': {
    name: 'Random Lead Quiz',
    description: 'Place specific requested leads',
    leadsToPlace: 10 // number of random leads to place
  },
  'guided': {
    name: 'Guided Practice',
    description: 'Follow step-by-step lead placement instructions'
  }
};

// Lead positions on the head model (percentages of container width/height)
const leadPositions = {
  'Fp1': { top: 15, left: 38 },
  'Fp2': { top: 15, left: 62 },
  'F7': { top: 32, left: 15 },
  'F3': { top: 32, left: 32 },
  'Fz': { top: 32, left: 50 },
  'F4': { top: 32, left: 68 },
  'F8': { top: 32, left: 85 },
  'T7': { top: 50, left: 10 },
  'C3': { top: 50, left: 32 },
  'Cz': { top: 50, left: 50 },
  'C4': { top: 50, left: 68 },
  'T8': { top: 50, left: 90 },
  'P7': { top: 68, left: 15 },
  'P3': { top: 68, left: 32 },
  'Pz': { top: 68, left: 50 },
  'P4': { top: 68, left: 68 },
  'P8': { top: 68, left: 85 },
  'O1': { top: 85, left: 38 },
  'O2': { top: 85, left: 62 },
  'A1': { top: 60, left: 3 },
  'A2': { top: 60, left: 97 }
};

// Difficulty settings for placement tolerance
const difficultySettings = {
  'easy': {
    tolerance: 25,
    description: 'Larger tolerance for correct placement'
  },
  'medium': {
    tolerance: 18,
    description: 'Standard tolerance for correct placement'
  },
  'hard': {
    tolerance: 10,
    description: 'Small tolerance for correct placement'
  },
  'expert': {
    tolerance: 5,
    description: 'Very precise placement required'
  }
};

// Montage definitions
const montages = {
  '10-20': eegLeads,
  'longitudinal-bipolar': [
    'Fp1-F3', 'F3-C3', 'C3-P3', 'P3-O1',
    'Fp2-F4', 'F4-C4', 'C4-P4', 'P4-O2',
    'Fp1-F7', 'F7-T7', 'T7-P7', 'P7-O1',
    'Fp2-F8', 'F8-T8', 'T8-P8', 'P8-O2'
  ],
  'transverse-bipolar': [
    'Fp1-Fp2',
    'F7-F3', 'F3-Fz', 'Fz-F4', 'F4-F8',
    'F7-Fp1', 'F8-Fp2',
    'A1-T7', 'T7-C3', 'C3-Cz', 'Cz-C4', 'C4-T8', 'T8-A2',
    'P7-P3', 'P3-Pz', 'Pz-P4', 'P4-P8',
    'O1-P7', 'P8-O2', 'O1-O2'
  ],
  'referential': [
    'Fp1-Cz', 'F7-Cz', 'F3-Cz', 'T7-Cz', 'C3-Cz', 
    'P7-Cz', 'P3-Cz', 'O1-Cz',
    'Fp2-Cz', 'F8-Cz', 'F4-Cz', 'T8-Cz', 'C4-Cz',
    'P8-Cz', 'P4-Cz', 'O2-Cz',
    'Fz-Cz', 'Pz-Cz'
  ],
  'laplacian': [
    'Fp1-avg(F3,F7,Fp2)', 
    'C3-avg(F3,P3,T7,Cz)', 
    'O1-avg(P3,O2)',
    'Fp2-avg(F4,F8,Fp1)',
    'C4-avg(F4,P4,T8,Cz)',
    'O2-avg(P4,O1)',
    'Fz-avg(F3,F4,Cz)',
    'Cz-avg(Fz,C3,C4,Pz)',
    'Pz-avg(Cz,P3,P4)'
  ]
};

// Variables to track state
let currentMontage = '10-20';
let placedLeads = {};
let selectedLead = null;
let initialTouchPos = null;
let currentDifficulty = 'medium'; // Default difficulty level
let currentMode = 'standard'; // Default practice mode
let timer = null;
let timeRemaining = 0;
let randomLeads = [];
let currentGuidedLead = null;
let guidedLeadIndex = 0;

// DOM elements
let leadsContainer;
let headModel;
let droppedLeadsContainer;
let montageSelect;
let checkBtn;
let resetBtn;
let scoreDisplay;
let feedbackDisplay;
let difficultySelect;
let modeSelect;
let timerDisplay;
let randomLeadPrompt;
let guidedInstructions;

// Initialize global variables to track document scroll
let documentScrollX = 0;
let documentScrollY = 0;

function init() {
  // Initialize DOM references
  leadsContainer = document.getElementById('leads-container');
  headModel = document.querySelector('.head-model');
  droppedLeadsContainer = document.getElementById('dropped-leads');
  montageSelect = document.getElementById('montage-select');
  checkBtn = document.getElementById('check-btn');
  resetBtn = document.getElementById('reset-btn');
  scoreDisplay = document.getElementById('score');
  feedbackDisplay = document.getElementById('feedback');
  difficultySelect = document.getElementById('difficulty-select');
  modeSelect = document.getElementById('mode-select');
  timerDisplay = document.getElementById('timer-display');
  randomLeadPrompt = document.getElementById('random-lead-prompt');
  guidedInstructions = document.getElementById('guided-instructions');
  
  // Log elements to ensure they exist
  console.log('Leads container found:', !!leadsContainer);
  console.log('Head model found:', !!headModel);
  console.log('Dropped leads container found:', !!droppedLeadsContainer);
  console.log('Montage select found:', !!montageSelect);
  console.log('Check button found:', !!checkBtn);
  console.log('Reset button found:', !!resetBtn);
  console.log('Score display found:', !!scoreDisplay);
  console.log('Feedback display found:', !!feedbackDisplay);
  console.log('Difficulty select found:', !!difficultySelect);
  console.log('Mode select found:', !!modeSelect);
  console.log('Timer display found:', !!timerDisplay);
  console.log('Random lead prompt found:', !!randomLeadPrompt);
  console.log('Guided instructions found:', !!guidedInstructions);
  
  // Initialize UI components
  initLeadButtons();
  setupHeadModelDropZone();
  
  // For visualization of montages
  montageSelect.addEventListener('change', function(e) {
    currentMontage = e.target.value;
    updateMontageView();
  });
  
  // Difficulty selector event listener
  if (difficultySelect) {
    difficultySelect.addEventListener('change', function(e) {
      currentDifficulty = e.target.value;
      updateDifficultyInfo();
    });
  }
  
  // Practice mode selector event listener
  if (modeSelect) {
    modeSelect.addEventListener('change', function(e) {
      resetAll(); // Reset before changing mode
      currentMode = e.target.value;
      updatePracticeModeUI();
      
      if (currentMode === 'random') {
        initRandomLeadMode();
      } else if (currentMode === 'guided') {
        initGuidedMode();
      } else if (currentMode === 'timed') {
        initTimedMode();
      }
    });
  }
  
  // Make sure event listeners are attached for buttons
  if (checkBtn) {
    checkBtn.addEventListener('click', checkPlacement);
    console.log('Check button event listener attached');
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAll);
    console.log('Reset button event listener attached');
  }
  
  // Initialize tutorial mode - with a slight delay to ensure DOM is fully processed
  setTimeout(initTutorialMode, 100);
  
  // Initialize difficulty info
  updateDifficultyInfo();
  
  // Initialize practice mode UI
  updatePracticeModeUI();
  
  console.log("EEG Lead Practice initialized successfully");
}

function initLeadButtons() {
  leadsContainer.innerHTML = '';
  
  eegLeads.forEach(lead => {
    const leadBtn = document.createElement('div');
    leadBtn.classList.add('lead-item');
    leadBtn.textContent = lead;
    leadBtn.setAttribute('data-lead', lead);
    
    // Check if this lead is already placed
    if (placedLeads[lead]) {
      leadBtn.classList.add('placed');
    }
    
    // Make lead draggable
    leadBtn.setAttribute('draggable', 'true');
    
    // Add drag event listeners
    leadBtn.addEventListener('dragstart', function(e) {
      // Only allow dragging if not already placed
      if (this.classList.contains('placed')) {
        e.preventDefault();
        return;
      }
      
      selectedLead = this.getAttribute('data-lead');
      this.classList.add('selected');
      
      // Set drag image (optional, for better UX)
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', selectedLead);
        e.dataTransfer.effectAllowed = 'move';
      }
    });
    
    leadBtn.addEventListener('dragend', function(e) {
      e.preventDefault(); // Prevent default behavior
      this.classList.remove('selected');
    });
    
    // Touch support for mobile
    leadBtn.addEventListener('touchstart', function(e) {
      // Only allow dragging if not already placed
      if (this.classList.contains('placed')) {
        return;
      }
      
      selectedLead = this.getAttribute('data-lead');
      this.classList.add('selected');
      
      // Create a visual clone for dragging
      const clone = this.cloneNode(true);
      clone.id = 'dragging-clone';
      clone.style.position = 'fixed'; // Use fixed positioning to handle scroll
      clone.style.zIndex = '1000';
      clone.style.opacity = '0.8';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);
      
      // Store touch start position
      const touch = e.touches[0];
      const rect = this.getBoundingClientRect();
      initialTouchPos = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      };
      
      // Position the clone correctly initially
      updateClonePosition(touch.clientX, touch.clientY);
      
      e.preventDefault(); // Prevent default touch behavior
    });
    
    leadBtn.addEventListener('touchmove', function(e) {
      if (!selectedLead || !initialTouchPos) return;
      
      const touch = e.touches[0];
      updateClonePosition(touch.clientX, touch.clientY);
      e.preventDefault();
    });
    
    leadBtn.addEventListener('touchend', function(e) {
      if (!selectedLead || !initialTouchPos) return;
      
      // Get final touch position
      const touch = e.changedTouches[0];
      const clone = document.getElementById('dragging-clone');
      
      // Check if touch ended over the head model
      const headRect = headModel.getBoundingClientRect();
      
      if (
        touch.clientX >= headRect.left &&
        touch.clientX <= headRect.right &&
        touch.clientY >= headRect.top &&
        touch.clientY <= headRect.bottom
      ) {
        // Calculate position relative to head model
        const x = ((touch.clientX - headRect.left) / headRect.width) * 100;
        const y = ((touch.clientY - headRect.top) / headRect.height) * 100;
        
        // Add lead to head model
        placeLead(selectedLead, x, y);
        
        // Mark the source lead as placed
        this.classList.add('placed');
      }
      
      // Clean up
      if (clone) {
        document.body.removeChild(clone);
      }
      
      this.classList.remove('selected');
      selectedLead = null;
      initialTouchPos = null;
    });
    
    // Handle touch cancel events
    leadBtn.addEventListener('touchcancel', function(e) {
      const clone = document.getElementById('dragging-clone');
      if (clone) {
        document.body.removeChild(clone);
      }
      
      this.classList.remove('selected');
      selectedLead = null;
      initialTouchPos = null;
    });
    
    leadsContainer.appendChild(leadBtn);
  });
}

function updateClonePosition(x, y) {
  const clone = document.getElementById('dragging-clone');
  if (clone && initialTouchPos) {
    // Apply the proper offset to make clone follow finger position
    // Use the position accounting for scroll
    clone.style.left = (x - initialTouchPos.offsetX) + 'px';
    clone.style.top = (y - initialTouchPos.offsetY) + 'px';
  }
}

function setupHeadModelDropZone() {
  // Add event listeners for drag and drop on the head model
  headModel.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  
  headModel.addEventListener('drop', (e) => {
    e.preventDefault();
    
    if (!selectedLead) return;
    
    // Calculate drop position relative to head model
    const rect = headModel.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Place the lead
    placeLead(selectedLead, x, y);
    
    // Mark the source lead as placed
    const sourceLead = document.querySelector(`.lead-item[data-lead="${selectedLead}"]`);
    if (sourceLead) {
      sourceLead.classList.add('placed');
    }
    
    selectedLead = null;
  });
}

// Function to place a lead on the head model
function placeLead(leadName, x, y) {
  // Check if this is random or guided mode with specific lead requirements
  if (currentMode === 'random' && randomLeads.length > 0 && leadName !== randomLeads[0]) {
    // If not the currently requested lead, don't allow placement
    return;
  }
  
  if (currentMode === 'guided' && leadName !== currentGuidedLead) {
    // If not the currently guided lead, don't allow placement
    return;
  }
  
  // Check if lead is already on head (for repositioning)
  const existingLead = document.querySelector(`.eeg-lead[data-lead="${leadName}"]`);
  if (existingLead) {
    // Update position
    existingLead.style.left = `${x}%`;
    existingLead.style.top = `${y}%`;
  } else {
    // Create new lead element
    const leadElement = document.createElement('div');
    leadElement.classList.add('eeg-lead');
    leadElement.setAttribute('data-lead', leadName);
    leadElement.textContent = leadName;
    leadElement.style.left = `${x}%`;
    leadElement.style.top = `${y}%`;
    
    // Make it draggable for repositioning
    leadElement.setAttribute('draggable', 'true');
    
    // Add drag event listeners for repositioning
    leadElement.addEventListener('dragstart', (e) => {
      selectedLead = leadName;
      e.dataTransfer.setData('text/plain', leadName);
      e.dataTransfer.effectAllowed = 'move';
      
      // Create a custom drag image instead of using the default one
      const dragIcon = document.createElement('div');
      dragIcon.style.width = '50px';
      dragIcon.style.height = '50px';
      dragIcon.style.borderRadius = '50%';
      dragIcon.style.backgroundColor = 'var(--accent-color)';
      dragIcon.style.display = 'flex';
      dragIcon.style.alignItems = 'center';
      dragIcon.style.justifyContent = 'center';
      dragIcon.style.color = 'white';
      dragIcon.style.fontWeight = 'bold';
      dragIcon.textContent = leadName;
      dragIcon.style.opacity = '0.8';
      
      // Need to add to the document for it to work as drag image
      document.body.appendChild(dragIcon);
      dragIcon.style.position = 'absolute';
      dragIcon.style.top = '-1000px'; // Off-screen
      
      // Set custom drag image
      e.dataTransfer.setDragImage(dragIcon, 25, 25);
      
      // Remove dragIcon after a short delay
      setTimeout(() => {
        document.body.removeChild(dragIcon);
      }, 100);
      
      // Hide the original element during drag
      setTimeout(() => {
        leadElement.style.opacity = '0.2';
      }, 0);
    });
    
    leadElement.addEventListener('dragend', (e) => {
      // Restore visibility
      leadElement.style.opacity = '1';
    });
    
    // Double click to remove
    leadElement.addEventListener('dblclick', () => {
      removeLead(leadName);
    });
    
    // Add touch events for mobile
    leadElement.addEventListener('touchstart', handleLeadTouchStart);
    leadElement.addEventListener('touchmove', handleLeadTouchMove);
    leadElement.addEventListener('touchend', handleLeadTouchEnd);
    leadElement.addEventListener('touchcancel', handleLeadTouchCancel);
    
    droppedLeadsContainer.appendChild(leadElement);
  }
  
  // Store position data for checking
  placedLeads[leadName] = { x, y };
  
  // For random and guided modes, check placement immediately
  if (currentMode === 'random' && randomLeads.length > 0 && leadName === randomLeads[0]) {
    checkRandomLeadPlacement(leadName);
  } else if (currentMode === 'guided' && leadName === currentGuidedLead) {
    checkGuidedLeadPlacement(leadName);
  }
}

// Function to remove a lead
function removeLead(leadName) {
  const leadElement = document.querySelector(`.eeg-lead[data-lead="${leadName}"]`);
  if (leadElement) {
    droppedLeadsContainer.removeChild(leadElement);
  }
  
  // Update the source lead item
  const sourceLead = document.querySelector(`.lead-item[data-lead="${leadName}"]`);
  if (sourceLead) {
    sourceLead.classList.remove('placed');
    
    // Also remove these classes in case they were set during tutorial/guided mode
    sourceLead.classList.remove('disabled');
    sourceLead.classList.remove('highlight');
  }
  
  // Remove from stored positions
  delete placedLeads[leadName];
}

// Touch handlers for placed leads
function handleLeadTouchStart(e) {
  const leadName = this.getAttribute('data-lead');
  selectedLead = leadName;
  
  // Store touch start position and element reference
  const touch = e.touches[0];
  const rect = this.getBoundingClientRect();
  
  initialTouchPos = {
    x: touch.clientX,
    y: touch.clientY,
    offsetX: touch.clientX - rect.left,
    offsetY: touch.clientY - rect.top,
    element: this
  };
  
  // Add a visual effect to show it's being dragged
  this.style.opacity = '0.8';
  this.style.zIndex = '100';
  
  e.preventDefault();
}

function handleLeadTouchMove(e) {
  if (!initialTouchPos) return;
  
  const touch = e.touches[0];
  const headRect = headModel.getBoundingClientRect();
  
  // Calculate new position relative to head model
  let x = ((touch.clientX - headRect.left) / headRect.width) * 100;
  let y = ((touch.clientY - headRect.top) / headRect.height) * 100;
  
  // Keep within boundaries
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));
  
  // Update position
  initialTouchPos.element.style.left = `${x}%`;
  initialTouchPos.element.style.top = `${y}%`;
  
  e.preventDefault();
}

function handleLeadTouchEnd(e) {
  if (!initialTouchPos) return;
  
  const leadName = selectedLead;
  const touch = e.changedTouches[0];
  const headRect = headModel.getBoundingClientRect();
  
  // Calculate final position
  const x = ((touch.clientX - headRect.left) / headRect.width) * 100;
  const y = ((touch.clientY - headRect.top) / headRect.height) * 100;
  
  // Reset visual properties
  initialTouchPos.element.style.opacity = '1';
  initialTouchPos.element.style.zIndex = '5';
  
  // Check if ended outside the head model
  if (
    touch.clientX < headRect.left || 
    touch.clientX > headRect.right || 
    touch.clientY < headRect.top || 
    touch.clientY > headRect.bottom
  ) {
    // Remove lead if dragged outside
    removeLead(leadName);
  } else {
    // Update position if within head
    placedLeads[leadName] = { x, y };
  }
  
  selectedLead = null;
  initialTouchPos = null;
}

// Handle touch cancel event for placed leads
function handleLeadTouchCancel(e) {
  if (initialTouchPos && initialTouchPos.element) {
    // Reset visual properties
    initialTouchPos.element.style.opacity = '1';
    initialTouchPos.element.style.zIndex = '5';
  }
  
  selectedLead = null;
  initialTouchPos = null;
}

// Update the display based on selected montage
function updateMontageView() {
  // Clear current view
  droppedLeadsContainer.innerHTML = '';
  
  if (currentMontage === '10-20') {
    // For 10-20 system, show the placement practice
    leadsContainer.style.display = 'flex';
    checkBtn.style.display = 'block';
    
    // Reset placed leads visual state
    document.querySelectorAll('.lead-item').forEach(el => {
      if (placedLeads[el.getAttribute('data-lead')]) {
        el.classList.add('placed');
      } else {
        el.classList.remove('placed');
      }
    });
  } else {
    // For other montages, show the montage visualization
    showMontageVisualization();
    leadsContainer.style.display = 'none';
    checkBtn.style.display = 'none';
  }
}

// Show visualization of selected montage
function showMontageVisualization() {
  // Clear any placed leads first
  droppedLeadsContainer.innerHTML = '';
  
  const montageLeads = montages[currentMontage];
  
  // Create arrays to hold different types of elements so we can control render order
  const referencePoints = [];
  const connectionLines = [];
  const mainLeads = [];
  
  // Display the leads in the selected montage
  montageLeads.forEach(item => {
    let leadComponents;
    let position;
    
    if (item.includes('-')) {
      // For bipolar or referential montages
      leadComponents = item.split('-');
      
      // Check if this is a laplacian montage with avg syntax
      if (leadComponents[1] && leadComponents[1].toLowerCase().startsWith('avg(')) {
        // Extract the main lead
        const mainLead = leadComponents[0];
        // Extract the reference leads
        const avgPart = leadComponents[1].match(/avg\((.*?)\)/i);
        
        if (avgPart && avgPart[1] && leadPositions[mainLead]) {
          const refLeads = avgPart[1].split(',');
          
          if (currentMontage === 'laplacian') {
            // Enhanced visualization for laplacian montage
            position = leadPositions[mainLead];
            
            // Create reference leads first (to be rendered underneath)
            refLeads.forEach(refLead => {
              if (leadPositions[refLead]) {
                // Store connection info to create later
                connectionLines.push({
                  lead1: mainLead,
                  lead2: refLead,
                  color: 'rgba(0, 102, 204, 0.4)'
                });
                
                // Create a smaller point for reference leads
                const refPoint = document.createElement('div');
                refPoint.classList.add('eeg-lead', 'laplacian-ref');
                refPoint.style.top = `${leadPositions[refLead].top}%`;
                refPoint.style.left = `${leadPositions[refLead].left}%`;
                refPoint.textContent = refLead;
                refPoint.style.pointerEvents = 'none';
                referencePoints.push(refPoint);
              }
            });
            
            // Store main lead to create later (on top)
            const fieldContainer = document.createElement('div');
            fieldContainer.classList.add('laplacian-container');
            fieldContainer.style.top = `${position.top}%`;
            fieldContainer.style.left = `${position.left}%`;
            
            // Create the main lead point (larger and highlighted)
            const mainPoint = document.createElement('div');
            mainPoint.classList.add('eeg-lead', 'laplacian-center');
            mainPoint.textContent = mainLead;
            mainPoint.style.pointerEvents = 'none';
            fieldContainer.appendChild(mainPoint);
            
            mainLeads.push(fieldContainer);
          } else {
            // Original implementation for other montages
            refLeads.forEach(refLead => {
              if (leadPositions[refLead]) {
                connectionLines.push({
                  lead1: mainLead,
                  lead2: refLead,
                  color: 'rgba(0, 102, 204, 0.3)'
                });
              }
            });
            // Create the main lead point
            position = leadPositions[mainLead];
            createMontagePoint(mainLead, position.top, position.left);
          }
        }
      } else {
        // For simple bipolar or referential montages
        // Create line between the two leads
        if (leadPositions[leadComponents[0]] && leadPositions[leadComponents[1]]) {
          connectionLines.push({
            lead1: leadComponents[0],
            lead2: leadComponents[1],
            color: 'var(--accent-color)'
          });
        }
        
        // Add points for both leads
        leadComponents.forEach(lead => {
          if (leadPositions[lead]) {
            position = leadPositions[lead];
            createMontagePoint(lead, position.top, position.left);
          }
        });
      }
    } else {
      // For 10-20 system (single leads)
      if (leadPositions[item]) {
        position = leadPositions[item];
        createMontagePoint(item, position.top, position.left);
      }
    }
  });
  
  // If we're in laplacian mode, render in correct order (bottom to top)
  if (currentMontage === 'laplacian') {
    // First add all reference leads
    referencePoints.forEach(point => {
      droppedLeadsContainer.appendChild(point);
    });
    
    // Then add all connection lines
    connectionLines.forEach(lineInfo => {
      createConnectionLine(lineInfo.lead1, lineInfo.lead2, lineInfo.color);
    });
    
    // Finally add the main leads on top
    mainLeads.forEach(container => {
      droppedLeadsContainer.appendChild(container);
    });
    
    // Add CSS for laplacian visualization
    addLaplacianStyles();
  } else {
    // For other montages, just create the connection lines
    connectionLines.forEach(lineInfo => {
      createConnectionLine(lineInfo.lead1, lineInfo.lead2, lineInfo.color);
    });
  }
}

// Add necessary styles for laplacian visualization
function addLaplacianStyles() {
  // Remove existing style element if it exists
  const existingStyles = document.getElementById('laplacian-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  
  // Create new style element
  const styleEl = document.createElement('style');
  styleEl.id = 'laplacian-styles';
  styleEl.textContent = `
    .laplacian-container {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      z-index: 20;
    }
    
    .laplacian-center {
      background: linear-gradient(135deg, #0066cc, #004080);
      color: white !important;
      transform: scale(1.2);
      border: 2px solid white;
      box-shadow: 0 0 8px rgba(0, 102, 204, 0.7), 0 0 0 4px rgba(255, 255, 255, 0.2);
      position: relative;
    }
    
    .laplacian-ref {
      background-color: rgba(0, 102, 204, 0.3) !important;
      transform: scale(0.8);
      border: 1px solid rgba(255, 255, 255, 0.6);
      z-index: 2;
      opacity: 0.7;
    }
    
    .connection-line.laplacian-line {
      opacity: 0.4;
      height: 1px;
      background: linear-gradient(90deg, rgba(0, 102, 204, 0.8), rgba(0, 102, 204, 0.2));
      box-shadow: 0 0 3px rgba(0, 102, 204, 0.4);
      z-index: 3;
    }
    
    /* Make the head model relative to allow accurate positioning */
    .head-model {
      position: relative;
    }
  `;
  
  document.head.appendChild(styleEl);
}

// Create a visual point for montage display
function createMontagePoint(label, top, left) {
  const point = document.createElement('div');
  point.classList.add('eeg-lead');
  point.style.top = `${top}%`;
  point.style.left = `${left}%`;
  point.textContent = label;
  point.style.pointerEvents = 'none'; // Disable interaction in visualization mode
  droppedLeadsContainer.appendChild(point);
}

// Create a line connecting two leads
function createConnectionLine(lead1, lead2, color = 'var(--accent-color)') {
  const pos1 = leadPositions[lead1];
  const pos2 = leadPositions[lead2];
  
  if (!pos1 || !pos2) return;
  
  const line = document.createElement('div');
  line.classList.add('connection-line');
  
  // Add laplacian-specific class if in laplacian mode
  if (currentMontage === 'laplacian') {
    line.classList.add('laplacian-line');
  }
  
  // Calculate line length and angle
  const length = Math.sqrt(Math.pow(pos2.left - pos1.left, 2) + Math.pow(pos2.top - pos1.top, 2));
  const angle = Math.atan2(pos2.top - pos1.top, pos2.left - pos1.left) * 180 / Math.PI;
  
  // Set line styles
  line.style.width = `${length}%`;
  line.style.height = '2px';
  line.style.background = color;
  line.style.position = 'absolute';
  line.style.top = `${pos1.top}%`;
  line.style.left = `${pos1.left}%`;
  line.style.transformOrigin = '0 0';
  line.style.transform = `rotate(${angle}deg)`;
  line.style.zIndex = '1';
  
  droppedLeadsContainer.appendChild(line);
}

// Check the accuracy of lead placements
function checkPlacement() {
  console.log('Check placement called');
  let correct = 0;
  let total = 0;
  
  // Reset previous results
  document.querySelectorAll('.eeg-lead').forEach(el => {
    el.classList.remove('correct', 'incorrect');
  });
  
  // Get current tolerance based on difficulty level
  const tolerance = difficultySettings[currentDifficulty].tolerance;
  
  // Check each placed lead
  for (const lead in placedLeads) {
    total++;
    const placement = placedLeads[lead];
    const correctPos = leadPositions[lead];
    
    if (correctPos) {
      // Calculate distance from correct position
      const distance = Math.sqrt(
        Math.pow(placement.x - correctPos.left, 2) + 
        Math.pow(placement.y - correctPos.top, 2)
      );
      
      // Get the element for this lead
      const leadElement = document.querySelector(`.eeg-lead[data-lead="${lead}"]`);
      
      // Check if it's within acceptable distance based on current difficulty
      if (distance <= tolerance) {
        correct++;
        if (leadElement) {
          leadElement.classList.add('correct');
          
          // Update position to the correct position
          leadElement.style.left = `${correctPos.left}%`;
          leadElement.style.top = `${correctPos.top}%`;
          placedLeads[lead].x = correctPos.left;
          placedLeads[lead].y = correctPos.top;
        }
      } else {
        if (leadElement) {
          leadElement.classList.add('incorrect');
        }
      }
    }
  }
  
  // Update score and feedback
  scoreDisplay.textContent = `${correct} / ${total} correct`;
  
  if (correct === total && total > 0) {
    feedbackDisplay.textContent = `Perfect! All leads are correctly placed on ${currentDifficulty} difficulty.`;
    feedbackDisplay.style.color = '#28a745';
    showMemeModal(true);
  } else if (correct > 0) {
    feedbackDisplay.textContent = 'Some leads are in the wrong position. Try adjusting them.';
    feedbackDisplay.style.color = '#ffc107';
    if (correct < total / 2) {
      showMemeModal(false);
    }
  } else if (total === 0) {
    feedbackDisplay.textContent = 'Place some leads on the head model first.';
    feedbackDisplay.style.color = '#17a2b8';
  } else {
    feedbackDisplay.textContent = 'None of the leads are correctly placed. Try again.';
    feedbackDisplay.style.color = '#dc3545';
    showMemeModal(false);
  }
}

// Reset all placed leads and score
function resetAll() {
  // Clear all placed leads
  droppedLeadsContainer.innerHTML = '';
  placedLeads = {};
  
  // Reset lead buttons
  document.querySelectorAll('.lead-item').forEach(lead => {
    lead.classList.remove('placed');
    lead.classList.remove('disabled');
    lead.classList.remove('highlight');
    lead.classList.remove('selected');
  });
  
  // Reset score display
  scoreDisplay.textContent = '0 / 0 correct';
  feedbackDisplay.textContent = '';
  
  // Reset any mode-specific state
  currentGuidedLead = null;
  guidedLeadIndex = 0;
  
  // Reset drag state
  selectedLead = null;
  initialTouchPos = null;
}

// Initialize tutorial mode
function initTutorialMode() {
  console.log('Initializing tutorial mode');
  
  const tutorialBtn = document.getElementById('tutorial-btn');
  const tutorialMode = document.querySelector('.tutorial-mode');
  const tutorialClose = document.querySelector('.tutorial-close');
  const prevStepBtn = document.getElementById('prev-step');
  const nextStepBtn = document.getElementById('next-step');
  const progressDots = document.querySelectorAll('.progress-dot');
  const tutorialSteps = document.querySelectorAll('.tutorial-step');
  
  // Log elements to ensure they exist
  console.log('Tutorial button found:', !!tutorialBtn);
  console.log('Tutorial modal found:', !!tutorialMode);
  
  if (!tutorialBtn || !tutorialMode) {
    console.error('Missing tutorial elements!');
    return;
  }
  
  let currentStep = 1;
  const totalSteps = tutorialSteps.length;
  
  // Open tutorial
  tutorialBtn.addEventListener('click', function() {
    console.log('Tutorial button clicked');
    
    // Reset all leads before starting tutorial to ensure a clean state
    resetAll();
    
    // Make sure we have the correct elements
    if (!tutorialMode) {
      console.error('Tutorial mode element not found!');
      return;
    }
    
    // Add active class to show the modal
    tutorialMode.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    console.log('Tutorial mode activated');
  });
  
  // Close tutorial
  tutorialClose.addEventListener('click', function() {
    tutorialMode.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
    
    // Make sure all lead items are properly reset
    document.querySelectorAll('.lead-item').forEach(lead => {
      lead.classList.remove('disabled');
      lead.classList.remove('highlight');
    });
  });
  
  // Click outside to close
  tutorialMode.addEventListener('click', function(e) {
    if (e.target === tutorialMode) {
      tutorialMode.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
      
      // Make sure all lead items are properly reset
      document.querySelectorAll('.lead-item').forEach(lead => {
        lead.classList.remove('disabled');
        lead.classList.remove('highlight');
      });
    }
  });
  
  // Previous step
  prevStepBtn.addEventListener('click', function() {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });
  
  // Next step
  nextStepBtn.addEventListener('click', function() {
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    } else {
      // On last step, finish the tutorial
      tutorialMode.classList.remove('active');
      document.body.style.overflow = ''; // Re-enable scrolling
      
      // Make sure all lead items are properly reset
      document.querySelectorAll('.lead-item').forEach(lead => {
        lead.classList.remove('disabled');
        lead.classList.remove('highlight');
      });
    }
  });
  
  // Go to specific step
  function goToStep(step) {
    // Hide all steps
    tutorialSteps.forEach(stepEl => {
      stepEl.classList.remove('active');
    });
    
    // Show the target step
    const targetStep = document.querySelector(`.tutorial-step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.classList.add('active');
      currentStep = step;
      
      // Update buttons
      prevStepBtn.disabled = (currentStep === 1);
      
      if (currentStep === totalSteps) {
        nextStepBtn.innerHTML = 'Finish Tutorial <i class="fas fa-check"></i>';
      } else {
        nextStepBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
      }
      
      // Update progress dots
      progressDots.forEach(dot => {
        const dotStep = parseInt(dot.getAttribute('data-step'));
        if (dotStep <= currentStep) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }
  
  // Allow clicking on progress dots to jump to that step
  progressDots.forEach(dot => {
    dot.addEventListener('click', function() {
      const step = parseInt(this.getAttribute('data-step'));
      goToStep(step);
    });
  });
}

function showMemeModal(isCorrect) {
  const memeModal = document.querySelector('.meme-modal');
  const memeImage = document.querySelector('.meme-image');
  const memeText = document.querySelector('.meme-text');
  const memeClose = document.querySelector('.meme-close');
  
  // Different text based on success or failure
  const successTexts = [
    "You've got a BRAIN for neuroscience!",
    "EEG-xcellent work! Your knowledge is off the charts!",
    "You've got those leads placed perfectly! Are you a mind reader?",
    "Look at you, placing leads like a pro! Your parents must be so proud!",
    "Congrats! You're officially an EEG whiz!"
  ];
  
  const failureTexts = [
    "Oops! Those leads aren't quite right...",
    "Keep practicing! You'll get better with each attempt.",
    "Almost there! Maybe check your anatomy textbook again?",
    "Those leads seem a bit lost. Want to try again?",
    "Not quite! But don't give up - you're learning!"
  ];
  
  // Select appropriate text based on success/failure
  const texts = isCorrect ? successTexts : failureTexts;
  const randomIndex = Math.floor(Math.random() * texts.length);
  memeText.textContent = texts[randomIndex];
  
  // Show loading state
  memeImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA4OGZmIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1kYXNoYXJyYXk9IjE1LjcgMTUuNyI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBkdXI9IjFzIiB2YWx1ZXM9IjAgMTIgMTI7MzYwIDEyIDEyIiBrZXlUaW1lcz0iMDsxIj48L2FuaW1hdGVUcmFuc2Zvcm0+PC9jaXJjbGU+PC9zdmc+';
  
  // Giphy API key
  const giphyKey = 'GZKGwdu6xlIM0iV58yFKJOFLqj0NLXFw';
  
  // Search query based on success/failure
  const searchQuery = isCorrect 
    ? 'happy animal celebration' 
    : 'sad puppy';
  
  // Fetch GIF from Giphy
  fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(searchQuery)}&limit=25&offset=0&rating=g&lang=en&bundle=messaging_non_clips`)
    .then(response => response.json())
    .then(data => {
      if (data.data && data.data.length > 0) {
        // Get a random GIF from the results
        const randomGifIndex = Math.floor(Math.random() * Math.min(data.data.length, 10));
        memeImage.src = data.data[randomGifIndex].images.original.url;
      } else {
        // Fallback to static images if API fails
        const fallbackImages = isCorrect
          ? [
              'https://i.imgur.com/DKUR9Tk.jpg',
              'https://i.imgur.com/6wYt4hw.jpg',
              'https://i.imgur.com/OWfGlQc.jpg'
            ]
          : [
              'https://i.imgur.com/d4zHYV1.jpg', // Sad puppy
              'https://i.imgur.com/jDimNTk.jpg', // Another sad puppy
              'https://i.imgur.com/8FRK4aP.jpg'  // Yet another sad puppy
            ];
        memeImage.src = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      }
    })
    .catch(err => {
      console.error('Error fetching GIF:', err);
      // Fallback to static images if API fails
      const fallbackImages = isCorrect
        ? [
            'https://i.imgur.com/DKUR9Tk.jpg',
            'https://i.imgur.com/6wYt4hw.jpg',
            'https://i.imgur.com/OWfGlQc.jpg'
          ]
        : [
            'https://i.imgur.com/d4zHYV1.jpg', // Sad puppy
            'https://i.imgur.com/jDimNTk.jpg', // Another sad puppy
            'https://i.imgur.com/8FRK4aP.jpg'  // Yet another sad puppy
          ];
      memeImage.src = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    });
  
  // Show the modal
  memeModal.classList.add('active');
  
  // Click anywhere to close
  memeModal.addEventListener('click', function(e) {
    if (e.target === memeModal) {
      memeModal.classList.remove('active');
    }
  });
  
  // Close button
  memeClose.addEventListener('click', function() {
    memeModal.classList.remove('active');
  });
}

// Function to update difficulty info display
function updateDifficultyInfo() {
  const difficultyInfo = document.getElementById('difficulty-info');
  if (difficultyInfo) {
    difficultyInfo.textContent = difficultySettings[currentDifficulty].description;
    
    // Update visually
    difficultyInfo.className = 'difficulty-info'; // Reset classes
    difficultyInfo.classList.add(currentDifficulty); // Add current difficulty as class
  }
}

// Initialize the practice mode UI based on the current mode
function updatePracticeModeUI() {
  // Hide all mode-specific elements first
  if (timerDisplay) timerDisplay.style.display = 'none';
  if (randomLeadPrompt) randomLeadPrompt.style.display = 'none';
  if (guidedInstructions) guidedInstructions.style.display = 'none';
  
  // Show relevant elements based on selected mode
  if (currentMode === 'timed') {
    if (timerDisplay) {
      timerDisplay.style.display = 'block';
      timerDisplay.innerHTML = formatTime(practiceModes.timed.timeLimit);
    }
  } else if (currentMode === 'random') {
    if (randomLeadPrompt) {
      randomLeadPrompt.style.display = 'block';
      randomLeadPrompt.innerHTML = 'Click Start to begin Random Lead Quiz';
    }
  } else if (currentMode === 'guided') {
    if (guidedInstructions) {
      guidedInstructions.style.display = 'block';
      guidedInstructions.innerHTML = 'Click Start to begin Guided Practice';
    }
  }
  
  // Update mode info if element exists
  const modeInfo = document.getElementById('mode-info');
  if (modeInfo) {
    modeInfo.textContent = practiceModes[currentMode].description;
    
    // Update visually
    modeInfo.className = 'mode-info'; // Reset classes
    modeInfo.classList.add(currentMode); // Add current mode as class
  }
  
  // Show/hide start button as needed
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.style.display = currentMode !== 'standard' ? 'block' : 'none';
    startBtn.textContent = `Start ${practiceModes[currentMode].name}`;
    
    // Remove any existing event listeners
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    
    // Add appropriate event listener based on mode
    if (currentMode === 'timed') {
      newStartBtn.addEventListener('click', startTimedMode);
    } else if (currentMode === 'random') {
      newStartBtn.addEventListener('click', startRandomMode);
    } else if (currentMode === 'guided') {
      newStartBtn.addEventListener('click', startGuidedMode);
    }
  }
}

// Initialize timed mode
function initTimedMode() {
  timeRemaining = practiceModes.timed.timeLimit;
  if (timerDisplay) {
    timerDisplay.innerHTML = formatTime(timeRemaining);
  }
}

// Start timed mode
function startTimedMode() {
  // Reset everything first
  resetAll();
  
  // Initialize timer
  timeRemaining = practiceModes.timed.timeLimit;
  if (timerDisplay) {
    timerDisplay.innerHTML = formatTime(timeRemaining);
    timerDisplay.classList.add('active');
  }
  
  // Start the countdown
  if (timer) clearInterval(timer);
  timer = setInterval(function() {
    timeRemaining--;
    if (timerDisplay) {
      timerDisplay.innerHTML = formatTime(timeRemaining);
    }
    
    // Change color as time gets low
    if (timeRemaining <= 30 && timerDisplay) {
      timerDisplay.classList.add('warning');
    }
    if (timeRemaining <= 10 && timerDisplay) {
      timerDisplay.classList.add('danger');
    }
    
    // Time's up
    if (timeRemaining <= 0) {
      clearInterval(timer);
      checkPlacement(); // Auto-check when time is up
      timerDisplay.innerHTML = "Time's up!";
    }
  }, 1000);
  
  // Hide start button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.style.display = 'none';
}

// Format seconds to MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Initialize random lead mode
function initRandomLeadMode() {
  // No initialization needed until user clicks start
}

// Start random lead mode
function startRandomMode() {
  // Reset everything first
  resetAll();
  
  // Generate random leads
  randomLeads = generateRandomLeads(practiceModes.random.leadsToPlace);
  
  // Display first lead
  if (randomLeadPrompt) {
    randomLeadPrompt.innerHTML = `<strong>Place lead:</strong> ${randomLeads[0]}`;
    randomLeadPrompt.classList.add('active');
  }
  
  // Show only the current lead to place
  document.querySelectorAll('.lead-item').forEach(lead => {
    if (lead.getAttribute('data-lead') === randomLeads[0]) {
      lead.classList.add('highlight');
    } else {
      lead.classList.add('disabled');
    }
  });
  
  // Hide start button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.style.display = 'none';
}

// Generate an array of random leads
function generateRandomLeads(count) {
  const shuffled = [...eegLeads].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, eegLeads.length));
}

// Check random lead placement
function checkRandomLeadPlacement(leadName) {
  const placed = placedLeads[leadName];
  const correct = leadPositions[leadName];
  
  if (placed && correct) {
    const distance = Math.sqrt(
      Math.pow(placed.x - correct.left, 2) + 
      Math.pow(placed.y - correct.top, 2)
    );
    
    const tolerance = difficultySettings[currentDifficulty].tolerance;
    const isCorrect = distance <= tolerance;
    
    // Get the element for this lead
    const leadElement = document.querySelector(`.eeg-lead[data-lead="${leadName}"]`);
    
    if (isCorrect) {
      if (leadElement) {
        leadElement.classList.add('correct');
        // Update position to the correct position
        leadElement.style.left = `${correct.left}%`;
        leadElement.style.top = `${correct.top}%`;
      }
      
      // Remove current lead from list and update UI
      randomLeads.shift();
      
      // If there are more leads, show the next one
      if (randomLeads.length > 0) {
        if (randomLeadPrompt) {
          randomLeadPrompt.innerHTML = `<strong>Place lead:</strong> ${randomLeads[0]}`;
        }
        
        // Update available leads
        document.querySelectorAll('.lead-item').forEach(lead => {
          lead.classList.remove('highlight', 'disabled');
          if (lead.getAttribute('data-lead') === randomLeads[0]) {
            lead.classList.add('highlight');
          } else {
            lead.classList.add('disabled');
          }
        });
      } else {
        // Complete!
        if (randomLeadPrompt) {
          randomLeadPrompt.innerHTML = '<strong>Complete!</strong> You placed all leads correctly!';
          randomLeadPrompt.classList.add('success');
        }
        showMemeModal(true);
      }
      
      return true;
    } else {
      // Incorrect placement
      if (leadElement) {
        leadElement.classList.add('incorrect');
        
        // Briefly show shake animation
        leadElement.classList.add('shake');
        setTimeout(() => {
          leadElement.classList.remove('shake');
        }, 500);
      }
      return false;
    }
  }
  
  return false;
}

// Initialize guided mode
function initGuidedMode() {
  // No initialization needed until user clicks start
}

// Start guided mode
function startGuidedMode() {
  // Reset everything first
  resetAll();
  
  // Start with the first lead
  guidedLeadIndex = 0;
  showNextGuidedLead();
  
  // Hide start button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.style.display = 'none';
}

// Show the next lead in guided mode
function showNextGuidedLead() {
  if (guidedLeadIndex >= eegLeads.length) {
    // All leads placed
    if (guidedInstructions) {
      guidedInstructions.innerHTML = '<strong>Complete!</strong> You placed all leads correctly!';
      guidedInstructions.classList.add('success');
    }
    showMemeModal(true);
    return;
  }
  
  currentGuidedLead = eegLeads[guidedLeadIndex];
  
  // Show instructions for placing this lead
  const leadInfo = getLeadDescription(currentGuidedLead);
  if (guidedInstructions) {
    guidedInstructions.innerHTML = `
      <strong>Place lead: ${currentGuidedLead}</strong><br>
      <p>${leadInfo}</p>
    `;
    guidedInstructions.classList.add('active');
  }
  
  // First, reset all lead items to their default state
  document.querySelectorAll('.lead-item').forEach(lead => {
    // Keep the "placed" class if it's already placed
    if (!lead.classList.contains('placed')) {
      lead.classList.remove('disabled');
      lead.classList.remove('highlight');
    }
  });
  
  // Now highlight only the current lead to place
  document.querySelectorAll('.lead-item').forEach(lead => {
    if (lead.getAttribute('data-lead') === currentGuidedLead) {
      lead.classList.add('highlight');
      lead.classList.remove('disabled');
    } else if (!lead.classList.contains('placed')) {
      lead.classList.add('disabled');
    }
  });
}

// Get descriptive text for each lead in guided mode
function getLeadDescription(leadName) {
  const descriptions = {
    'Fp1': 'Left frontopolar (forehead) - on the left side of the forehead, about 10% in from the edge',
    'Fp2': 'Right frontopolar (forehead) - on the right side of the forehead, about 10% in from the edge',
    'F7': 'Left anterior temporal - on the left side of the head, above the ear and toward the front',
    'F3': 'Left frontal - on the left side of the head, between the midline and F7',
    'Fz': 'Midline frontal - at the front of the head, directly on the midline',
    'F4': 'Right frontal - on the right side of the head, between the midline and F8',
    'F8': 'Right anterior temporal - on the right side of the head, above the ear and toward the front',
    'T7': 'Left mid-temporal - on the left side of the head, directly above the ear',
    'C3': 'Left central - on the left side of the head, between the midline and T7',
    'Cz': 'Central vertex - at the top center of the head, where the midlines intersect',
    'C4': 'Right central - on the right side of the head, between the midline and T8',
    'T8': 'Right mid-temporal - on the right side of the head, directly above the ear',
    'P7': 'Left posterior temporal - on the left side of the head, above the ear and toward the back',
    'P3': 'Left parietal - on the left side of the head, between the midline and P7',
    'Pz': 'Midline parietal - at the back of the head, directly on the midline',
    'P4': 'Right parietal - on the right side of the head, between the midline and P8',
    'P8': 'Right posterior temporal - on the right side of the head, above the ear and toward the back',
    'O1': 'Left occipital - on the left side of the back of the head',
    'O2': 'Right occipital - on the right side of the back of the head',
    'A1': 'Left ear (auricular) - on the left earlobe or mastoid process',
    'A2': 'Right ear (auricular) - on the right earlobe or mastoid process'
  };
  
  return descriptions[leadName] || `Place the ${leadName} lead in the correct position`;
}

// Check guided lead placement
function checkGuidedLeadPlacement(leadName) {
  if (leadName !== currentGuidedLead) return false;
  
  const placed = placedLeads[leadName];
  const correct = leadPositions[leadName];
  
  if (placed && correct) {
    const distance = Math.sqrt(
      Math.pow(placed.x - correct.left, 2) + 
      Math.pow(placed.y - correct.top, 2)
    );
    
    const tolerance = difficultySettings[currentDifficulty].tolerance;
    const isCorrect = distance <= tolerance;
    
    // Get the element for this lead
    const leadElement = document.querySelector(`.eeg-lead[data-lead="${leadName}"]`);
    
    if (isCorrect) {
      if (leadElement) {
        leadElement.classList.add('correct');
        // Update position to the correct position
        leadElement.style.left = `${correct.left}%`;
        leadElement.style.top = `${correct.top}%`;
      }
      
      // Move to next lead
      guidedLeadIndex++;
      showNextGuidedLead();
      
      return true;
    } else {
      // Incorrect placement
      if (leadElement) {
        leadElement.classList.add('incorrect');
        
        // Briefly show shake animation
        leadElement.classList.add('shake');
        setTimeout(() => {
          leadElement.classList.remove('shake');
          leadElement.classList.remove('incorrect');
        }, 500);
        
        // Remove the incorrect lead
        setTimeout(() => {
          removeLead(leadName);
        }, 600);
      }
      return false;
    }
  }
  
  return false;
}

// Helper function to get position accounting for scroll
function getElementPositionWithScroll(element) {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left + documentScrollX,
    top: rect.top + documentScrollY,
    right: rect.right + documentScrollX,
    bottom: rect.bottom + documentScrollY,
    width: rect.width,
    height: rect.height
  };
} 