#!/bin/bash

# Script to update all HTML files with proper mobile layout scripts

# Find all HTML files
HTML_FILES=$(find . -name "*.html")

# Loop through each HTML file
for file in $HTML_FILES; do
  echo "Updating $file..."
  
  # Check if the file already has ios-mobile.js, otherwise add it
  if ! grep -q 'ios-mobile.js' "$file"; then
    # Add before closing head tag if it exists, otherwise before closing body tag
    if grep -q '</head>' "$file"; then
      sed -i '' 's#</head>#  <!-- iOS Mobile Layout -->\n  <link rel="stylesheet" href="assets/css/ios-style-mobile.css">\n  <script src="assets/js/ios-mobile-init.js" defer></script>\n  <script src="assets/js/ios-mobile.js" defer></script>\n</head>#g' "$file"
    else
      sed -i '' 's#</body>#  <!-- iOS Mobile Layout -->\n  <link rel="stylesheet" href="assets/css/ios-style-mobile.css">\n  <script src="assets/js/ios-mobile-init.js" defer></script>\n  <script src="assets/js/ios-mobile.js" defer></script>\n</body>#g' "$file"
    fi
  else
    # If ios-mobile.js exists but the CSS doesn't, add the CSS
    if ! grep -q 'ios-style-mobile.css' "$file"; then
      sed -i '' 's#<script src="assets/js/ios-mobile.js" defer></script>#<link rel="stylesheet" href="assets/css/ios-style-mobile.css">\n  <script src="assets/js/ios-mobile.js" defer></script>#g' "$file"
    fi
    
    # If ios-mobile.js exists but the init file doesn't, add the init file
    if ! grep -q 'ios-mobile-init.js' "$file"; then
      sed -i '' 's#<script src="assets/js/ios-mobile.js" defer></script>#<script src="assets/js/ios-mobile-init.js" defer></script>\n  <script src="assets/js/ios-mobile.js" defer></script>#g' "$file"
    fi
  fi
  
  # Fix relative paths for subdirectories
  if [[ "$file" == ./flappy_brain/* ]]; then
    # For files in the flappy_brain directory, fix the paths
    sed -i '' 's#"assets/css/ios-style-mobile.css"#"../assets/css/ios-style-mobile.css"#g' "$file"
    sed -i '' 's#"assets/js/ios-mobile.js"#"../assets/js/ios-mobile.js"#g' "$file"
    sed -i '' 's#"assets/js/ios-mobile-init.js"#"../assets/js/ios-mobile-init.js"#g' "$file"
  fi
  
  # Ensure viewport meta tag is correct for iOS devices
  if grep -q '<meta name="viewport"' "$file"; then
    # Update existing viewport tag to include viewport-fit=cover for iOS notches - with escaped quotes
    sed -i '' 's#<meta name="viewport" content="[^"]*"#<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"#g' "$file"
  else
    # Add viewport meta tag if it doesn't exist
    sed -i '' 's#<head>#<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">#g' "$file"
  fi
  
  # Ensure we have apple-mobile-web-app meta tags for proper iOS display
  if ! grep -q 'apple-mobile-web-app-capable' "$file"; then
    # Use a different approach to avoid quoting issues
    grep -q '<meta name="viewport"' "$file" && awk '
      /<meta name="viewport"/ {
        print $0
        print "  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">"
        print "  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">"
        print "  <meta name=\"apple-mobile-web-app-title\" content=\"EEG Learning\">"
        print "  <meta name=\"theme-color\" content=\"#007aff\">"
        next
      }
      {print}
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
  
  # Remove any test-mobile-view.js scripts that might have been added previously
  if grep -q 'test-mobile-view.js' "$file"; then
    sed -i '' '/test-mobile-view.js/d' "$file"
  fi
done

echo "All HTML files have been updated with proper mobile layout support!" 