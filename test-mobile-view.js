/**
 * Mobile View Testing Script
 * This will verify that our mobile UI modifications are working correctly
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Running mobile view tests...');
  
  // Only run tests on mobile devices or when forcing mobile view
  if ((window.innerWidth <= 767 || window.location.search.includes('force-mobile=true')) 
      && window.location.search.includes('run-tests=true')) {
    // Force mobile view for testing on desktop
    if (window.location.search.includes('force-mobile=true')) {
      console.log('Forcing mobile view for testing');
      document.documentElement.style.setProperty('--test-mobile-width', '390px');
    }
    
    setTimeout(runTests, 1000); // Give time for ios-mobile.js to initialize
  }
});

function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Header and footer are hidden
  test(
    'Header and footer are hidden',
    function() {
      const header = document.querySelector('header, #header-container');
      const footer = document.querySelector('footer, #footer-container');
      const disclaimer = document.querySelector('#disclaimer-container');
      const copyright = document.querySelector('#copyright-container');
      
      return (!header || header.style.display === 'none') && 
             (!footer || footer.style.display === 'none') &&
             (!disclaimer || disclaimer.style.display === 'none') &&
             (!copyright || copyright.style.display === 'none');
    }
  );
  
  // Test 2: Mobile tab bar exists
  test(
    'Mobile tab bar exists',
    function() {
      const tabBar = document.querySelector('.mobile-nav');
      return tabBar !== null;
    }
  );
  
  // Test 3: Page title is showing
  test(
    'Page title is showing',
    function() {
      const pageTitle = document.querySelector('.ios-page-title');
      return pageTitle !== null && pageTitle.textContent.trim() !== '';
    }
  );
  
  // Test 4: Search tab exists
  test(
    'Search tab exists',
    function() {
      const searchTab = document.querySelector('.mobile-nav a[href="#search"]');
      return searchTab !== null;
    }
  );
  
  // Test 5: Settings tab exists
  test(
    'Settings tab exists',
    function() {
      const settingsTab = document.querySelector('.mobile-nav a[href="#settings"]');
      return settingsTab !== null;
    }
  );
  
  // Test 6: Search tab works
  test(
    'Search tab opens search sheet',
    function() {
      const searchTab = document.querySelector('.mobile-nav a[href="#search"]');
      if (!searchTab) return false;
      
      // Simulate click
      searchTab.click();
      
      // Check if search sheet opened
      const searchSheet = document.querySelector('.ios-sheet');
      const result = searchSheet !== null && 
                    searchSheet.querySelector('h2') !== null &&
                    searchSheet.querySelector('h2').textContent.includes('Search');
      
      // Close sheet for next tests
      if (searchSheet) {
        const overlay = document.querySelector('.ios-sheet + div');
        if (overlay) overlay.click();
        
        // If overlay click didn't work, try to find and click the close button
        const closeBtn = searchSheet.querySelector('.ios-sheet-close');
        if (closeBtn) closeBtn.click();
        
        // If still present, remove manually
        setTimeout(() => {
          if (document.body.contains(searchSheet)) {
            searchSheet.remove();
          }
        }, 100);
      }
      
      return result;
    }
  );
  
  // Test 7: Settings tab works
  test(
    'Settings tab opens settings sheet',
    function() {
      const settingsTab = document.querySelector('.mobile-nav a[href="#settings"]');
      if (!settingsTab) return false;
      
      // Simulate click
      settingsTab.click();
      
      // Check if settings sheet opened
      const settingsSheet = document.querySelector('.ios-sheet');
      const result = settingsSheet !== null && 
                    settingsSheet.querySelector('h2') !== null &&
                    settingsSheet.querySelector('h2').textContent.includes('Settings');
      
      // Close sheet after checking
      if (settingsSheet) {
        const closeBtn = settingsSheet.querySelector('.ios-sheet-close');
        if (closeBtn) closeBtn.click();
        
        // If still present, remove manually
        setTimeout(() => {
          if (document.body.contains(settingsSheet)) {
            settingsSheet.remove();
          }
        }, 100);
      }
      
      return result;
    }
  );
  
  // Test 8: Settings has links and copyright
  test(
    'Settings has links and copyright',
    function() {
      const settingsSheet = document.querySelector('.ios-sheet');
      if (!settingsSheet) return false;
      
      const links = settingsSheet.querySelectorAll('a.ios-setting-link');
      const copyright = settingsSheet.querySelector('.ios-copyright');
      
      // Close sheet for next tests
      const closeBtn = settingsSheet.querySelector('.ios-sheet-close');
      if (closeBtn) closeBtn.click();
      
      // If still present, remove manually
      setTimeout(() => {
        if (document.body.contains(settingsSheet)) {
          settingsSheet.remove();
        }
      }, 100);
      
      return links.length > 5 && copyright !== null;
    }
  );
  
  console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
  
  // Add visual indicator of test results that auto-fades
  const testResults = document.createElement('div');
  testResults.style.position = 'fixed';
  testResults.style.top = '4px';
  testResults.style.right = '4px';
  testResults.style.backgroundColor = testsFailed === 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)';
  testResults.style.color = 'white';
  testResults.style.padding = '4px 8px';
  testResults.style.borderRadius = '4px';
  testResults.style.fontSize = '11px';
  testResults.style.fontWeight = 'bold';
  testResults.style.zIndex = '10000';
  testResults.style.opacity = '0.8';
  testResults.style.transition = 'opacity 0.5s ease';
  testResults.textContent = testsFailed === 0 ? 
    `✓ ${testsPassed} tests passed` : 
    `✗ ${testsFailed} tests failed`;
  document.body.appendChild(testResults);
  
  // Fade out and remove after 5 seconds
  setTimeout(() => {
    testResults.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(testResults)) {
        testResults.remove();
      }
    }, 500);
  }, 5000);
  
  function test(name, testFn) {
    try {
      const result = testFn();
      if (result) {
        console.log(`✓ PASS: ${name}`);
        testsPassed++;
      } else {
        console.log(`✗ FAIL: ${name}`);
        testsFailed++;
      }
    } catch (e) {
      console.error(`✗ ERROR in test "${name}":`, e);
      testsFailed++;
    }
  }
} 