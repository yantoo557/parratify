const express = require('express');
const youtubedl = require('youtube-dl-exec');  // <-- perubahan
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/download', async (req, res) => {
    const spotifyUrl = req.body.url?.trim();
    if (!spotifyUrl || !spotifyUrl.includes('spotify.com')) {
        return res.status(400).json({ error: 'URL tidak valid' });
    }

    const uid = uuidv4().slice(0,8);
    const outDir = path.join(__dirname, 'downloads', uid);
    fs.mkdirSync(outDir, { recursive: true });

    try {
        await youtubedl(spotifyUrl, {
            output: `${outDir}/%(title)s.%(ext)s`,
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0,
            noPlaylist: true,
        });

        const files = fs.readdirSync(outDir).filter(f => f.endsWith('.mp3'));
        if (files.length === 0) throw new Error('No MP3 generated');
        const filePath = path.join(outDir, files[0]);

        res.download(filePath, files[0], () => {
            fs.rmSync(outDir, { recursive: true, force: true });
        });
    } catch (err) {
        if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[H4CK3R4I] Server running on http://localhost:${PORT}`);
});
