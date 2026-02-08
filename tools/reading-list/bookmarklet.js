// Reading List Bookmarklet
// Drag this to your bookmarks bar

// Simple version - just copies URL
javascript:(function(){prompt('Reading List - Copy URL:',location.href)})();

// Advanced version - generates add command
javascript:(function(){
  var url = location.href;
  var title = document.title;
  var cmd = './rl.sh add "' + url + '" -T "' + title.replace(/"/g, '\\"') + '"';
  prompt('Copy this command:', cmd);
})();

// Instructions:
// 1. Create a new bookmark in your browser
// 2. Name it "Add to Reading List"  
// 3. Paste one of the javascript: lines above as the URL
// 4. Click the bookmark on any page to add it
