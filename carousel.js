// Examples Carousel Functionality
let slideIndex = 1;
let carouselInterval; // Variable to store the interval ID
let autoRotationEnabled = true; // Track if auto-rotation is enabled
const rotationSpeed = 5000; // Rotation speed in milliseconds (5 seconds)

document.addEventListener('DOMContentLoaded', function() {
  showSlide(slideIndex);
  
  // Find carousel controls and attach event listeners
  const prevButton = document.querySelector('.carousel-prev');
  const nextButton = document.querySelector('.carousel-next');
  const pauseButton = document.querySelector('.carousel-pause'); 
  const dots = document.querySelectorAll('.carousel-dot');
  
  if (prevButton) {
    prevButton.addEventListener('click', function() {
      moveSlide(-1);
      // Reset timer on manual navigation
      resetAutoRotation();
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function() {
      moveSlide(1);
      // Reset timer on manual navigation
      resetAutoRotation();
    });
  }
  
  if (pauseButton) {
    pauseButton.addEventListener('click', function() {
      toggleAutoRotation();
      
      // Toggle the pause/play icon
      const icon = pauseButton.querySelector('i');
      if (autoRotationEnabled) {
        icon.className = 'fas fa-pause';
        pauseButton.classList.remove('paused');
      } else {
        icon.className = 'fas fa-play';
        pauseButton.classList.add('paused');
      }
    });
  }
  
  dots.forEach(function(dot, index) {
    dot.addEventListener('click', function() {
      currentSlide(index + 1);
      // Reset timer on manual navigation
      resetAutoRotation();
    });
  });
  
  // Start auto-rotation on page load
  startAutoRotation();
});

function moveSlide(n) {
  showSlide(slideIndex += n);
}

function currentSlide(n) {
  showSlide(slideIndex = n);
}

function showSlide(n) {
  const slides = document.getElementsByClassName("example-slide");
  const dots = document.getElementsByClassName("carousel-dot");
  
  if (!slides.length || !dots.length) return;
  
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  // Hide all slides
  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active");
  }
  
  // Remove active class from all dots
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }
  
  // Show the current slide and activate corresponding dot
  slides[slideIndex-1].classList.add("active");
  dots[slideIndex-1].classList.add("active");
}

function startAutoRotation() {
  if (autoRotationEnabled) {
    // Clear any existing interval to prevent multiple intervals
    clearInterval(carouselInterval);
    
    // Set up new rotation interval
    carouselInterval = setInterval(function() {
      moveSlide(1); // Move to next slide
    }, rotationSpeed);
  }
}

function stopAutoRotation() {
  clearInterval(carouselInterval);
}

function resetAutoRotation() {
  stopAutoRotation();
  if (autoRotationEnabled) {
    startAutoRotation();
  }
}

function toggleAutoRotation() {
  autoRotationEnabled = !autoRotationEnabled;
  if (autoRotationEnabled) {
    startAutoRotation();
  } else {
    stopAutoRotation();
  }
} 