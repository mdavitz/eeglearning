#!/bin/bash

# Script to add iOS mobile styling to all HTML files

# Find all HTML files except index.html (which we already updated)
HTML_FILES=$(find . -name "*.html" -not -path "./index.html")

# Loop through each HTML file
for file in $HTML_FILES; do
  echo "Updating $file..."
  
  # Check if viewport meta tag exists and update it
  if grep -q '<meta name="viewport"' "$file"; then
    sed -i '' 's#<meta name="viewport" content="width=device-width, initial-scale=1.0"#<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"#g' "$file"
  fi
  
  # Add iOS meta tags if they don't exist
  if ! grep -q '<meta name="apple-mobile-web-app-capable"' "$file"; then
    sed -i '' '/<meta name="viewport"/a \
  <meta name="apple-mobile-web-app-capable" content="yes">\
  <meta name="apple-mobile-web-app-status-bar-style" content="default">\
  <meta name="apple-mobile-web-app-title" content="EEG Learning">\
  <meta name="theme-color" content="#007aff">' "$file"
  fi
  
  # Add iOS CSS and JS if they don't exist
  if ! grep -q 'ios-style-mobile.css' "$file"; then
    sed -i '' '/<link rel="stylesheet" href="assets\/css\/mobile-cards-fix.css"/a \
  \
  <!-- iOS-style mobile interface -->\
  <link rel="stylesheet" href="assets/css/ios-style-mobile.css" />' "$file"
  fi
  
  if ! grep -q 'ios-mobile.js' "$file"; then
    sed -i '' '/<script src="assets\/js\/news-ticker.js"/a \
  <script src="assets/js/ios-mobile.js" defer></script>' "$file"
  fi
  
  # Update title if needed
  sed -i '' 's#<title>EEG Curriculum</title>#<title>EEG Learning</title>#g' "$file"
done

echo "All HTML files have been updated with iOS mobile styling!" 