import React from 'react';
import $ from 'jquery'; 
import SpotifyWebApi from 'spotify-web-api-js';
import TrackItem from './TrackItem';
import QueueItem from './QueueItem';
import global from './global.js';
import HelperClass from './HelperClass';
import loadSpotifyPlayer from './loadSpotifyPlayer.js';

const spotifyApi = new SpotifyWebApi();
const helper = new HelperClass();

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
    const access_token = params.access_token;

    if(access_token) {
      spotifyApi.setAccessToken(access_token);
    }

    this.state = {
      device_id : null,
      refresh_token: params.refresh_token,
      spotifySDKReady: false,
      loggedIn: access_token ? true : false,
      showOwnQueue: false,
      nowPlaying: {
        name: 'Not Checked', 
        albumArt:'', 
        isPlaying: false, 
        progressMs: 0, 
        duration_ms: 0,
      },
      shuffle: 0,
      repeat: 0,
      skipMin: 0,
      skipSec: 0,
      queueStartMin: 0,
      queueStartSec: 0,
      searchTrack: "",
      tracks:[],
      queue:[]
    }

    this.handleChange = this.handleChange.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleStatus = this.handleStatus.bind(this);
    this.getNowPlaying = this.getNowPlaying.bind(this);
    this.refreshPlaying = this.refreshPlaying.bind(this);
    this.queueTrackSpotify = this.queueTrackSpotify.bind(this);
    this.queueTrackApp = this.queueTrackApp.bind(this);
    this.skipToNextTrack = this.skipToNextTrack.bind(this);
    this.skipToPreviousTrack = this.skipToPreviousTrack.bind(this);
    this.toggleShuffle = this.toggleShuffle.bind(this);
    this.toggleRepeat = this.toggleRepeat.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.toggleQueue = this.toggleQueue.bind(this);
    this.playNextQueue = this.playNextQueue.bind(this);
    this.clearQueue = this.clearQueue.bind(this);
  }

  componentDidMount(){
    if (this.state.loggedIn) {
      loadSpotifyPlayer(() => {
        this.setState({
          spotifySDKReady: true
        }, function() {
          console.log('WebplaySDK');
          window.onSpotifyWebPlaybackSDKReady = () => {
            const token = spotifyApi.getAccessToken();
            const player = new window.Spotify.Player({
                name: 'Web Playback SDK Quick Start Player',
                getOAuthToken: cb => { cb(token); }
            });
            
    
            // Error handling
            player.addListener('initialization_error', ({ message }) => { console.error(message); });
            player.addListener('authentication_error', ({ message }) => { console.error(message); });
            player.addListener('account_error', ({ message }) => { console.error(message); });
            player.addListener('playback_error', ({ message }) => { console.error(message); });
    
            // Playback status updates
            player.addListener('player_state_changed', state => { console.log(state); });
    
            // Ready
            player.addListener('ready', data => {
                console.log('Ready with Device ID', data.device_id);
                this.setState({
                  device_id: data.device_id
                })
            });
    
            // Not Ready
            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });
    
            // Connect to the player!
            player.connect();
          }
        });
      });
    }

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
    .then((response, error) => {
      const repeat_state = global.repeatOptions.indexOf(response.repeat_state);
      const shuffle_state = global.shuffleOptions.indexOf(response.shuffle_state);

      console.log(response);
      if (response && response.item) {
        this.setState({
          device_id: response.device.id,
          nowPlaying: {
            name: response.item.name,
            artist: response.item.artists[0].name,
            albumArt: response.item.album.images[0].url,
            isPlaying: response.is_playing,
            progressMs: response.progress_ms,
            durationMs: response.item.duration_ms
          },
          repeat: repeat_state,
          shuffle: shuffle_state
        });
      }
      else if (error) {
        this.refreshToken();
      }
    });
  }

  // Get and set new access token
  refreshToken() {
    console.log("Refresh Token")
    $.ajax({
      url:"http://localhost:8888/refresh_token",
      data: {
        'refresh_token': this.state.refresh_token
      }
    }).then((response) => {
      spotifyApi.setAccessToken(response.access_token);
      console.log(response);
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

  // Add an item to the end of the user's current plaback queue on Spotify
  queueTrackSpotify(track_id) {
    console.log("Add track to Spotify queue");
    spotifyApi.queue(track_id)
  }

  // Add an item to the end of the application queue
  // Spotify currently cannot display the user's current queue so need to have seperate queue for mixer functionality
  queueTrackApp(track_info) {
    console.log("Add track to App queue");
    console.log(track_info);
    this.setState({
      queue: [...this.state.queue, track_info]
    }, function(){
      console.log(this.state.queue);
    });
  }

  toggleQueue() {
    console.log("toggle queue");
    this.setState({
      showOwnQueue: !this.state.showOwnQueue
    }, function() {
      if(this.state.showOwnQueue) {
        console.log("Show queue");
      }
      else {
        console.log("Hide queue");
      }
    });
  }

  // Plays next song from own queue
  playNextQueue() {
    console.log("Playing next song in queue");
    var self = this;

    if(this.state.queue.length !== 0) {
      var play_data = {
        uris: [this.state.queue[0].uri],
        position_ms: helper.calculateMS(this.state.queueStartMin, this.state.queueStartSec)
      }
      console.log(this.state.queue[0].uri);
      console.log(play_data);
      if (this.state.device_id){
        spotifyApi.play(play_data).then(() => {
          // Removes song played from queue
          self.setState({
            queue: this.state.queue.shift()
          });
        });
      }
      else {
        console.log("Need to get device id first. Make sure Spotify device is currently playing music");
      }
    }
  }

  clearQueue() {
    this.setState({
      queue: []
    });
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

  // Resume/Pause
  handleStatus() {
    if (this.state.device_id) {
      this.setState({
        nowPlaying: {
          name: this.state.nowPlaying.name,
          artist: this.state.nowPlaying.artist,
          albumArt: this.state.nowPlaying.albumArt,
          isPlaying: !this.state.nowPlaying.isPlaying,
          progressMs: this.state.nowPlaying.progressMs,
          durationMs: this.state.nowPlaying.durationMs
        }
      }, function() {
        if (!this.state.nowPlaying.isPlaying) {
          spotifyApi.pause();
        }
        else {
          spotifyApi.play();
        }
      }
      );
    }
    else {
      console.log("Need to get device id first. Make sure Spotify device is currently playing music");
    }
  }

  toggleShuffle() {
    console.log("Toggle Shuffle");
    this.setState({
      shuffle: (this.state.shuffle + 1) % 2
    }, function() {
      spotifyApi.setShuffle(global.shuffleOptions[this.state.shuffle]);
    });
  }

  toggleRepeat() {
    console.log("Change Repeat");
    this.setState({
      repeat: (this.state.repeat + 1) % 3
    }, function() {
      spotifyApi.setRepeat(global.repeatOptions[this.state.repeat]);
    });
  }

  // Skip to a certain position in the song
  skipToPosition() {
    spotifyApi.seek(helper.calculateMS(this.state.skipMin, this.state.skipSec)).then(() => {
        console.log('Changed position to: ' + helper.calculateMS(this.state.skipMin, this.state.skipSec)+ 'ms');
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

  render(){
    const trackItems = this.state.tracks.map(track =>
      <TrackItem 
        key={track.id} 
        trackInfo={track.trackInfo} 
        handlePlay={this.handlePlay}
        queueTrackApp={this.queueTrackApp}
        queueTrackSpotify={this.queueTrackSpotify}
      />
    );

    const queueItems = this.state.queue.map(track =>
      <QueueItem
        trackInfo={track}
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
        { 
          this.state.loggedIn &&
          <button onClick={() => this.refreshToken()}>Refresh Token</button>
        }
        <div>
          {
            this.state.loggedIn &&
            <div>
              <div className="now-playing">
                Now Playing: { this.state.nowPlaying.name } - {this.state.nowPlaying.artist}
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
                    Shuffle: {global.shuffleOptions[this.state.shuffle] ? <span>on</span> : <span>off</span>}
                  </button>
                  <button onClick={() => this.toggleRepeat()}>
                    Repeat: {global.repeatOptions[this.state.repeat]}
                  </button>
                </div>
                
                <div className="track-progress">
                    <p>Track length: {helper.calculateTimeLength(this.state.nowPlaying.durationMs)}</p>
                </div>

                <div className="skip-time">
                  <input 
                    type="number"
                    name="skipMin"
                    onChange={this.handleChange}
                    value={this.state.skipMin}
                    placeholder="0"
                  />
                  <input 
                    type="number"
                    name="skipSec"
                    onChange={this.handleChange}
                    value={this.state.skipSec}
                    placeholder="0"
                  />
                  <button onClick={() => this.skipToPosition()}>
                    Skip to Time
                  </button>
                </div>

                <div className="own-queue">
                  {
                    this.state.queue.length > 0 &&
                    <div className="queue-start">
                      <input 
                        type="number"
                        name="queueStartMin"
                        onChange={this.handleChange}
                        value={this.state.queueStartMin}
                        placeholder="0"
                      />
                      <input 
                        type="number"
                        name="queueStartSec"
                        onChange={this.handleChange}
                        value={this.state.queueStartSec}
                        placeholder="0"
                      />
                      <button onClick={() =>this.playNextQueue()}>
                        Play Next in Queue
                      </button>
                      <button onClick={() => this.clearQueue()}>
                        Clear Queue
                      </button>
                    </div>
                  }
                  <button onClick={() => this.toggleQueue()}>
                    Show Own Queue
                  </button>
                  {
                    this.state.showOwnQueue &&
                    <div className="queue-list">
                      <h3>{this.state.queue.length > 0 ? <span>Queued Tracks:</span> : <span>No Tracks In Queue</span>}</h3>
                      {queueItems}
                    </div>
                  }
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
                {
                  this.state.tracks.length > 0 &&
                <div className="track-list">
                  <h3>Search Results:</h3>
                  {trackItems}
                </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
