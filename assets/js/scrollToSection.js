function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Get the height of any fixed header if present
    let headerOffset = 0;
    const header = document.querySelector("header");
    if (header) {
      headerOffset = header.offsetHeight;
    }
    
    // Calculate position
    const sectionPosition = section.getBoundingClientRect().top;
    const offsetPosition = sectionPosition + window.pageYOffset - headerOffset - 20; // 20px extra padding
    
    // Scroll smoothly to the section
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
    
    // Open the details element if it is closed
    const parentDetails = section.closest("details");
    if (parentDetails && !parentDetails.open) {
      parentDetails.open = true;
    }
  }
} 