const loadSpotifyPlayer = (callback) => {
    const existingScript = document.getElementById('spotifyPlayer');

    if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';

        script.id = 'spotifyPlayer';
        document.body.appendChild(script);

        script.onload = () => {
            if (callback) callback();
        }
    }

    if (existingScript && callback) callback();
}

export default loadSpotifyPlayer;