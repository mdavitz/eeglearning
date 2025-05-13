#!/bin/bash

# Cleanup script for EEG Training website
# Removes temporary, backup, and system files

echo "🧹 Starting cleanup process..."

# Remove .DS_Store files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete

# Remove backup files
echo "Removing backup files..."
find . -name "*.bak" -type f -delete

# Remove any Thumbs.db files (Windows)
echo "Removing Thumbs.db files..."
find . -name "Thumbs.db" -type f -delete

# Empty tmp directory but keep the directory itself
echo "Cleaning tmp directory..."
if [ -d "tmp" ]; then
  rm -f tmp/*
  echo "tmp directory cleaned"
else
  echo "tmp directory not found, skipping"
fi

# Remove any log files
echo "Removing log files..."
find . -name "*.log" -type f -delete

echo "✅ Cleanup complete!" 