const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();

app.get('/extract-audio', async (req, res) => {
  const videoUrl = req.query.videoUrl;
  if (!videoUrl) {
    return res.status(400).send('Video URL is required');
  }

  try {
    // Download video
    const videoResponse = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });

    const videoPath = path.join(__dirname, 'temp_video.mp4');
    const videoStream = fs.createWriteStream(videoPath);
    videoResponse.data.pipe(videoStream);

    await new Promise((resolve, reject) => {
      videoStream.on('finish', resolve);
      videoStream.on('error', reject);
    });

    // Extract audio
    const audioPath = path.join(__dirname, 'output_audio.mp3');
    exec(`ffmpeg -i ${videoPath} -q:a 0 -map a ${audioPath}`, (error) => {
      if (error) {
        console.error('Audio extraction error:', error);
        return res.status(500).send('Error in audio extraction');
      }

      res.download(audioPath, 'output.mp3', (err) => {
        if (err) {
          console.error('Error in sending file:', err);
        }
        // Clean up
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
