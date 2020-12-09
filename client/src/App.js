import React from 'react';
import $ from 'jquery'; 
import SpotifyWebApi from 'spotify-web-api-js';
import TrackItem from './TrackItem';
import global from './global.js';

const spotifyApi = new SpotifyWebApi();

function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  e = r.exec(q)
  while (e) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
     e = r.exec(q);
  }
  return hashParams;
}


class App extends React.Component {

  constructor() {
    super();
    const params = getHashParams();
    const token = params.access_token;

    if(token) {
      spotifyApi.setAccessToken(token);
    }

    this.state = {
      device_id : null,
      loggedIn: token ? true : false,
      nowPlaying: {
        name: 'Not Checked', 
        albumArt:'', 
        isPlaying: false, 
        progressMs: 0, 
        duration_ms: 0,
      },
      shuffle: 0,
      repeat: 0,
      skipTime: 0,
      searchTrack: "",
      tracks:[]
    }

    this.handleChange = this.handleChange.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleStatus = this.handleStatus.bind(this);
    this.getNowPlaying = this.getNowPlaying.bind(this);
    this.refreshPlaying = this.refreshPlaying.bind(this);
    this.queueTrack = this.queueTrack.bind(this);
    this.skipToNextTrack = this.skipToNextTrack.bind(this);
    this.skipToPreviousTrack = this.skipToPreviousTrack.bind(this);
    this.toggleShuffle = this.toggleShuffle.bind(this);
    this.toggleRepeat = this.toggleRepeat.bind(this);
  }

  componentDidMount(){
    this.refreshPlaying();
  }

  // Checks what is currently playing every x seconds
  refreshPlaying() {
    const x = 10;

    this.getNowPlaying();
    setTimeout(this.refreshPlaying, x*1000);
  }

  getNowPlaying() {
    spotifyApi.getMyCurrentPlaybackState()
    .then((response) => {
      console.log(response)
      if (response && response.item) {
        this.setState({
          device_id: response.device.id,
          nowPlaying: {
            name: response.item.name,
            albumArt: response.item.album.images[0].url,
            isPlaying: response.is_playing,
            progressMs: response.progress_ms,
            durationMs: response.item.duration_ms
          }
        });
      }
    })
  }

  handleChange(event) {
    const {name, value} = event.target;

    this.setState({
        [name]: value
    });
  }


  // Functions related to using the Spotify Web Player 
  // Play a specified track on the Web Playback SDK's device ID
  handlePlay(track_id) {
    console.log("Trying to play");
    var self = this;
    
    if (this.state.device_id){
      $.ajax({
          url: "https://api.spotify.com/v1/me/player/play?device_id=" + this.state.device_id,
          type: "PUT",
          data: '{"uris": ["' + track_id + '"]}',
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + spotifyApi.getAccessToken());},
          success: function(data) { 
            setTimeout(function() {
              self.getNowPlaying();
            },500);
          }
      });
    }
    else {
      console.log("Need to get device id first. Make sure Spotify device is currently playing music");
    }
  }

  // Resume/Pause
  handleStatus() {
    if (this.state.device_id) {
      if (this.state.nowPlaying.isPlaying) {
        spotifyApi.pause();
      }
      else {
        spotifyApi.play();
      }

      this.setState({
        nowPlaying: {
          name: this.state.nowPlaying.name,
          albumArt: this.state.nowPlaying.albumArt,
          isPlaying: !this.state.nowPlaying.isPlaying
        }
      });
    }
    else {
      console.log("Need to get device id first. Make sure Spotify device is currently playing music");
    }
  }

  // Add an item to the end of the user's current plaback queue
  queueTrack(track_id) {
    spotifyApi.queue(track_id)
  }

  skipToNextTrack() {
    var self = this;
    console.log("Skip to Next Track");
    spotifyApi.skipToNext()
    .then((response) => {
      setTimeout(function() {
        self.getNowPlaying();
      }, 250);
    });
  }

  skipToPreviousTrack() {
    var self = this;
    console.log("Skip to Previous Track");
    spotifyApi.skipToPrevious()
    .then((response) => {
      setTimeout(function() {
        self.getNowPlaying();
      }, 250);
    });
  }

  searchTrack() {
    console.log("trying to search");
    var self = this;
    if (this.searchTrack !== "")
    {
      $.ajax({
          url: "https://api.spotify.com/v1/search?q=" + this.state.searchTrack + "&type=track&market=US&limit=10",
          type: "GET",
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + spotifyApi.getAccessToken()},
          success: function(data) {
            console.log(data);
            self.setState ({
              tracks: Object.entries(data.tracks.items).map(([key,value]) => { 
                return {
                    id:key,
                    trackInfo: value
                }
              })
            })
          }
      });
    }
  }

  toggleShuffle() {
    console.log("Toggle Shuffle");
    spotifyApi.setShuffle(global.shuffleOptions[this.state.shuffle]);
    this.setState({
      shuffle: (this.state.shuffle + 1) % 2
    })
  }

  toggleRepeat() {
    console.log("Change Repeat");
    spotifyApi.setRepeat(global.repeatOptions[this.state.repeat]);
    this.setState({
      repeat: (this.state.repeat + 1) % 3
    })
  }

  // Skip to a certain position in the song
  skipToPosition() {
    spotifyApi.seek(this.state.skipTime * 1000).then(() => {
        console.log('Changed position!');
    });
  }

  render(){
    const trackItems = this.state.tracks.map(track =>
      <TrackItem 
        key={track.id} 
        trackInfo={track.trackInfo} 
        handlePlay={this.handlePlay}
        queueTrack={this.queueTrack}
      />
    );

    return (
      <div className="App">
        {
          !this.state.loggedIn &&
          <a href='http://localhost:8888'>
            Login to Spotify
          </a>
        }
        <div>
          {
            this.state.loggedIn &&
            <div>
              <div>
                Now Playing: { this.state.nowPlaying.name }
              </div>
              <div>
                <img src={this.state.nowPlaying.albumArt} style={{ height: 150 }} alt='Album'/>
              </div>

              {/* <button onClick={() => this.getNowPlaying()}>
                Check Now Playing
              </button> */}

              <div className="container">
                <div className="play-status">
                  <button onClick={() => this.skipToPreviousTrack()}>
                    Prev
                  </button>
                  <button onMouseOver={() => this.getNowPlaying()} onClick={() => this.handleStatus()}>
                    {
                      this.state.nowPlaying.isPlaying ? <span>Pause</span> : <span>Resume</span>
                    } 
                  </button>
                  <button onClick={() => this.skipToNextTrack()}>
                    Next
                  </button>
                  <button onClick={() => this.toggleShuffle()}>
                    Shuffle
                  </button>
                  <button onClick={() => this.toggleRepeat()}>
                    Repeat
                  </button>
                </div>
            
                <div className="skip-time">
                  <input 
                    type="number"
                    name="skipTime"
                    onChange={this.handleChange}
                    value={this.state.skipTime}
                    placeholder="0"
                  />
                  <button onClick={() => this.skipToPosition()}>
                    Skip to Time
                  </button>
                </div>
                
                <div className="search-track">
                  <input 
                    type="text"
                    name="searchTrack"
                    onChange={this.handleChange}
                    value={this.state.searchTrack}
                    placeholder="Search Track"
                  />
                  <button onClick={() => this.searchTrack()}>
                    Search Track
                  </button>
                </div>
                <div className="track-list">
                  {trackItems}
                </div>
                
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
