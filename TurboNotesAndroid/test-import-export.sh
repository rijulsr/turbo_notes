#!/bin/bash

echo "🚀 Turbo Notes Import/Export Testing Script"
echo "============================================="
echo

# Create sample files for testing import functionality
echo "📝 Creating sample files for import testing..."

# Create sample JSON file (Turbo Notes format)
cat > sample-notes.json << 'EOF'
[
  {
    "id": "1701234567890",
    "content": "Welcome to Turbo Notes!\n\nThis is a sample note imported from JSON format. You can create, edit, and organize all your notes here.",
    "createdAt": "2024-08-15T10:00:00.000Z",
    "updatedAt": "2024-08-15T10:00:00.000Z"
  },
  {
    "id": "1701234567891",
    "content": "Meeting Notes - Project Alpha\n\n• Discussed timeline and milestones\n• Assigned tasks to team members\n• Next meeting scheduled for Friday",
    "createdAt": "2024-08-15T11:30:00.000Z",
    "updatedAt": "2024-08-15T11:30:00.000Z"
  },
  {
    "id": "1701234567892",
    "content": "Shopping List\n\n- Milk\n- Bread\n- Eggs\n- Coffee\n- Apples\n- Chicken",
    "createdAt": "2024-08-15T12:15:00.000Z",
    "updatedAt": "2024-08-15T12:15:00.000Z"
  }
]
EOF

# Create sample Markdown file
cat > sample-notes.md << 'EOF'
# Turbo Notes Export

Exported on: August 15, 2024

---

## Note 1

**Created:** 2024-08-15 10:00:00
**Updated:** 2024-08-15 10:00:00

# Travel Ideas

## Europe Trip 2024
- Visit Paris in spring
- Explore Italian countryside
- Northern lights in Iceland

## Packing List
- Passport and documents
- Camera equipment
- Comfortable walking shoes

---

## Note 2

**Created:** 2024-08-15 11:30:00
**Updated:** 2024-08-15 11:30:00

# Recipe: Chocolate Chip Cookies

## Ingredients
- 2 cups flour
- 1 cup butter
- 3/4 cup brown sugar
- 1/2 cup white sugar
- 2 eggs
- 2 tsp vanilla
- 1 tsp baking soda
- 1 cup chocolate chips

## Instructions
1. Preheat oven to 375°F
2. Mix dry ingredients
3. Cream butter and sugars
4. Add eggs and vanilla
5. Combine all ingredients
6. Bake for 9-11 minutes

EOF

# Create sample CSV file
cat > sample-notes.csv << 'EOF'
ID,Content,Created,Updated
1701234567890,"Daily Standup Notes\n\n• Sprint progress: 75% complete\n• Blockers: API integration issues\n• Next: Code review session","2024-08-15T09:00:00.000Z","2024-08-15T09:00:00.000Z"
1701234567891,"Book Recommendations\n\n1. The Pragmatic Programmer\n2. Clean Code by Robert Martin\n3. Design Patterns: Elements of Reusable Object-Oriented Software","2024-08-15T14:20:00.000Z","2024-08-15T14:20:00.000Z"
1701234567892,"Workout Plan - Week 1\n\nMonday: Chest & Triceps\nTuesday: Back & Biceps\nWednesday: Legs\nThursday: Shoulders\nFriday: Cardio\nWeekend: Rest","2024-08-15T18:45:00.000Z","2024-08-15T18:45:00.000Z"
EOF

# Create sample plain text file
cat > sample-notes.txt << 'EOF'
PERSONAL NOTES COLLECTION
=========================

Important Reminders
-------------------
- Call dentist for appointment
- Renew car insurance by month end
- Submit expense reports by Friday
- Pick up dry cleaning

==================================================

Project Ideas
-------------
1. Home automation system
2. Personal finance tracker
3. Recipe organizer app
4. Fitness progress monitor

==================================================

Quotes & Inspiration
-------------------
"The only way to do great work is to love what you do." - Steve Jobs

"Innovation distinguishes between a leader and a follower." - Steve Jobs

"Stay hungry, stay foolish." - Steve Jobs

==================================================

Learning Goals 2024
------------------
• Master TypeScript and React
• Learn mobile app development
• Improve UI/UX design skills
• Study system architecture patterns

EOF

echo "✅ Sample files created:"
echo "   📄 sample-notes.json (Turbo Notes format)"
echo "   📝 sample-notes.md (Markdown format)"  
echo "   📊 sample-notes.csv (CSV format)"
echo "   📋 sample-notes.txt (Plain text format)"
echo

echo "🎯 Testing Instructions:"
echo "========================"
echo
echo "1. 📱 OPEN the Turbo Notes app on your emulator"
echo "2. 🍔 TAP the menu button (⋮) in the top-right corner"
echo "3. 📥 TEST IMPORT functionality:"
echo "   • Tap 'Import from File'"
echo "   • Select one of the sample files created above"
echo "   • Verify notes are imported correctly"
echo
echo "4. 📤 TEST EXPORT functionality:"
echo "   • Add a few notes in the app"
echo "   • Tap menu → Export Notes"
echo "   • Try different formats (JSON, Markdown, CSV, TXT)"
echo "   • Check Documents folder for exported files"
echo
echo "5. 🍎 TEST APPLE NOTES import:"
echo "   • Tap 'Import from Apple Notes'"
echo "   • Follow the instructions provided"
echo
echo "6. 📱 TEST GOOGLE KEEP import:"
echo "   • Tap 'Import from Google Keep'"
echo "   • Follow the instructions provided"
echo

echo "📋 Manual Testing Scenarios:"
echo "============================"
echo
echo "SCENARIO 1: Basic Export"
echo "• Create 3-5 notes with different content"
echo "• Export as JSON → verify file structure"
echo "• Export as Markdown → check formatting"
echo "• Export as CSV → verify data integrity"
echo
echo "SCENARIO 2: Import & Merge"
echo "• Import sample-notes.json"
echo "• Choose 'MERGE' option"
echo "• Verify existing notes are preserved"
echo
echo "SCENARIO 3: Import & Replace"  
echo "• Import sample-notes.md"
echo "• Choose 'REPLACE' option"
echo "• Verify all notes are replaced"
echo
echo "SCENARIO 4: Clipboard Import"
echo "• Copy some text to clipboard"
echo "• Try Apple Notes or Google Keep import"
echo "• Choose clipboard import option"
echo "• Test both single note and split options"
echo

echo "🔧 ADB Commands for Testing:"
echo "============================"
echo
echo "# Push sample files to device for easy access:"
echo "adb push sample-notes.json /sdcard/Download/"
echo "adb push sample-notes.md /sdcard/Download/"
echo "adb push sample-notes.csv /sdcard/Download/"
echo "adb push sample-notes.txt /sdcard/Download/"
echo
echo "# Take screenshot of app:"
echo "adb shell screencap -p /sdcard/turbo_notes_test.png"
echo "adb pull /sdcard/turbo_notes_test.png ."
echo
echo "# View app logs:"
echo "adb logcat -s Capacitor -s TurboNotes"
echo
echo "# Check exported files:"
echo "adb shell ls -la /sdcard/Documents/"
echo "adb pull /sdcard/Documents/turbo-notes-*.* ."
echo

echo "📊 Feature Checklist:"
echo "====================="
echo "□ Menu opens when tapping ⋮ button"
echo "□ Export options display correctly"
echo "□ JSON export works and creates valid file"
echo "□ Markdown export formats notes properly"
echo "□ CSV export includes all note data"
echo "□ Plain text export is readable"
echo "□ File import dialog opens"
echo "□ JSON import preserves note structure"
echo "□ Markdown import parses headers correctly"
echo "□ CSV import handles quoted content"
echo "□ Text import splits notes by delimiters"
echo "□ Merge option preserves existing notes"
echo "□ Replace option clears existing notes"
echo "□ Apple Notes instructions are helpful"
echo "□ Google Keep instructions are helpful"
echo "□ Clipboard import works"
echo "□ Haptic feedback works on import/export"
echo "□ Error handling works for invalid files"
echo

echo "🚀 Ready to test! Open Turbo Notes and start exploring the import/export features!"
echo
echo "💡 Tip: Use './test-app.sh' for general app testing commands"

