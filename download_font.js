const https = require('https');
const fs = require('fs');
const path = require('path');

const fontUrl = 'https://raw.githubusercontent.com/googlefonts/cairo/main/fonts/ttf/Cairo-Regular.ttf';
const dest = path.join(__dirname, 'app', 'public', 'Cairo-Regular.ttf');

const file = fs.createWriteStream(dest);
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
};

https.get(fontUrl, options, function(response) {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Handle redirect
    https.get(response.headers.location, options, function(redirectResponse) {
      redirectResponse.pipe(file);
    });
  } else {
    response.pipe(file);
  }
  
  file.on('finish', function() {
    file.close();
    console.log('Font downloaded successfully to ' + dest);
  });
}).on('error', function(err) {
  fs.unlink(dest);
  console.log('Error downloading font: ' + err.message);
});
