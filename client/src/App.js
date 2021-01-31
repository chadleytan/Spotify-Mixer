import React from 'react';
import $ from 'jquery'; 
import SpotifyWebApi from 'spotify-web-api-js';
import TrackItem from './TrackItem';
import QueueItem from './QueueItem';
import global from './global.js';
import HelperClass from './HelperClass';
import loadSpotifyPlayer from './loadSpotifyPlayer.js';
import ProgressBar from './ProgressBar';
import './App.css';

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
      mixingMode: true,
      showOwnQueue: true,
      nowPlaying: {
        name: 'Not Checked', 
        albumArt:'', 
        isPlaying: false, 
        progressMs: 0, 
        durationMs: 0,
      },
      shuffle: 0,
      repeat: 0,
      shouldSkip: false,
      skipMin: 0,
      skipSec: 0,
      endMin: 0,
      endSec: 0,
      searchTrack: "",
      tracks:[],
      queue:[]
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleQueueChange = this.handleQueueChange.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleStatus = this.handleStatus.bind(this);
    this.getNowPlaying = this.getNowPlaying.bind(this);
    this.refreshPlaying = this.refreshPlaying.bind(this);
    this.progressTime = this.progressTime.bind(this);
    this.queueTrackSpotify = this.queueTrackSpotify.bind(this);
    this.queueTrackApp = this.queueTrackApp.bind(this);
    this.skipToNextTrack = this.skipToNextTrack.bind(this);
    this.skipToPreviousTrack = this.skipToPreviousTrack.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.playNextQueue = this.playNextQueue.bind(this);
    this.clearQueue = this.clearQueue.bind(this);
    this.deleteTrackQueue = this.deleteTrackQueue.bind(this);
  }

  componentDidMount(){
    if (this.state.loggedIn) {
      loadSpotifyPlayer(() => {
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
          player.addListener('player_state_changed', state => { 
            console.log("changed"); 
            console.log(state);
            
            if(state)
            {
              this.setState({
                nowPlaying: {
                  name: state.track_window.current_track.name,
                  artist: state.track_window.current_track.artists[0].name,
                  albumArt: state.track_window.current_track.album.images[0].url,
                  isPlaying: !state.paused,
                  progressMs: state.position,
                  durationMs: state.duration
                },
                repeat: state.repeat_mode,
                shuffle: state.shuffle
              }, function() {
                console.log('State Changed')
              });
            }  
          });
  
          // Ready
          player.addListener('ready', data => {
              console.log('Ready with Device ID', data.device_id);
              this.setState({
                spotifySDKReady: true, 
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
    }

    this.refreshPlaying();
    this.progressTime();
  }

  // Checks what is currently playing every x seconds
  refreshPlaying() {
    const x = 5;

    this.getNowPlaying();
    setTimeout(this.refreshPlaying, x*1000);
  }

  // Progresses time for currently playing track
  progressTime() {
    setTimeout(this.progressTime, 1000);

    if (this.state.nowPlaying.isPlaying) {
      this.setState({
        nowPlaying: {
          name: this.state.nowPlaying.name,
          artist: this.state.nowPlaying.artist,
          albumArt: this.state.nowPlaying.albumArt,
          isPlaying: this.state.nowPlaying.isPlaying,
          progressMs: this.state.nowPlaying.progressMs + 1000,
          durationMs: this.state.nowPlaying.durationMs
        }
      }, function() { // skips to next track in queue if "Mixing Mode is on" and there are songs in queue
        if (this.state.mixingMode && this.state.queue.length > 0 ) {
          if (this.state.nowPlaying.progressMs > this.state.nowPlaying.durationMs - 2000 
            || (this.state.shouldSkip 
              && this.state.nowPlaying.progressMs > helper.calculateMS(this.state.endMin, this.state.endSec))){
              console.log("Skipped");
            // Issue - Sometimes skips multiple times
            this.playNextQueue();
          }
        }
      });
    }
  }

  getNowPlaying() {
    spotifyApi.getMyCurrentPlaybackState()
    .then((response, error) => {
      const repeat_state = global.repeatOptions.indexOf(response.repeat_state);
      const shuffle_state = global.shuffleOptions.indexOf(response.shuffle_state);

      // console.log(response);
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

  // Get and set new access token. Also gets currently now playing
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
    }).then(()=> {
      this.getNowPlaying();
    })
  }

  handleChange(event) {
    const {name, value} = event.target;

    this.setState({
      [name]: value
    });
  }

  handleQueueChange(event, key) {
    const {name, value} = event.target;

    this.setState(prevState => {
      const queue = prevState.queue.map(track => 
        (track.id === key ? 
          Object.assign({}, track, {[name] : value}) :
          track
        )
      );

      return {
        queue,
      }
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

  toggleMixingMode() {
    console.log("toggle Mixing Mode");
    this.setState({
      mixingMode: !this.state.mixingMode
    });
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
      queue: [...this.state.queue, 
        {
          id: track_info.id + new Date().getTime(),
          info: track_info,
          startMin: 0,
          startSec: 0,
          endMin: helper.calculateMin(track_info.duration_ms),
          endSec: helper.calculateSec(track_info.duration_ms)
        }
      ]
    }, function(){
      console.log(this.state.queue);
    });
  }

  toggleQueue() {
    console.log("toggle queue");
    this.setState({
      showOwnQueue: !this.state.showOwnQueue
    });
  }

  // Plays next song from own queue
  playNextQueue() {
    console.log("Playing next song in queue");
    var self = this;

    if(this.state.queue.length !== 0) {
      var play_data = {
        uris: [this.state.queue[0].info.uri],
        position_ms: helper.calculateMS(this.state.queue[0].startMin, this.state.queue[0].startSec)
      }
      console.log(this.state.queue[0].info.uri);
      console.log(play_data);
      if (this.state.device_id){
        spotifyApi.play(play_data).then(() => {
          // Removes song played from queue
          self.setState(prevstate => {
            const queue = prevstate.queue.slice(1);
            const shouldSkip = false;
            const endMin = prevstate.queue[0].endMin;
            const endSec = prevstate.queue[0].endSec;

            return {
              queue,
              shouldSkip,
              endMin,
              endSec
            }
          }, function() {
            setTimeout(function() {
              self.getNowPlaying();
            }, 500)
          });
        });
      }
      else {
        console.log("Need to get device id first. Make sure Spotify device is currently playing music");
      }
    } else {
      console.log("No songs in queue");
    }
  }

  deleteTrackQueue(id) {
    this.setState(prevState => ({
      queue: prevState.queue.filter(el => el.id !== id)
    }), function() {
      console.log("Removed track with id: " + id);
    });
  }

  clearSearch() {
    this.setState({
      tracks: [],
      searchTrack: ""
    })
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
    if (this.state.device_id && this.state.nowPlaying.name) {
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
      });
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
      this.setState({
        nowPlaying: {
          name: this.state.nowPlaying.name,
          artist: this.state.nowPlaying.artist,
          albumArt: this.state.nowPlaying.albumArt,
          isPlaying: this.state.nowPlaying.isPlaying,
          progressMs: helper.calculateMS(this.state.skipMin, this.state.skipSec),
          durationMs: this.state.nowPlaying.durationMs
        }
      });
    });
  }

  toggleAutomaticSkip() {
    console.log("Toggle Automatic Skip");
    this.setState({
      shouldSkip: !this.state.shouldSkip
    });
  }

  searchTrack() {
    console.log("trying to search");
    var self = this;
    var limit = 12;
    if (this.searchTrack !== "")
    {
      $.ajax({
          url: "https://api.spotify.com/v1/search?q=" + this.state.searchTrack + "&type=track&market=US&limit=" + limit,
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
            });
          }
      });
    }
  }

  render(){
    const trackItems = this.state.tracks.map(track =>
      <TrackItem 
        key={track.id} 
        trackInfo={track.trackInfo} 
        mixingMode={this.state.mixingMode}
        handlePlay={this.handlePlay}
        queueTrackApp={this.queueTrackApp}
        queueTrackSpotify={this.queueTrackSpotify}
      />
    );

    const queueItems = this.state.queue.map((track, index) =>
      <QueueItem
        key={index}
        id={track.id}
        trackInfo={track}
        mixingMode={this.state.mixingMode}
        handleChange={(e, val) => this.handleQueueChange(e, val)}
        handleDelete={this.deleteTrackQueue}
      />
    );

    return (
      <div className="App">
        {
          !this.state.loggedIn &&
          <div>
            <a href='http://localhost:8888'>
              Login to Spotify
            </a>
          </div>
        }
        { 
          this.state.loggedIn &&
          <div className="app">
            <div className="app-controls">
              <button onClick={() => this.refreshToken()}>Refresh</button>
              {/* <button onClick={() => this.getNowPlaying()}>Get Status</button> */}
              {/* <button onClick={() => this.toggleMixingMode()}>
                Mixing Mode: {this.state.mixingMode ? <span>ON</span> : <span>OFF</span>}
              </button> */}
            </div>
            
            <div className="application-main">
              <div className="playback-main float-container">
                <div className="now-playing float-child">
                  <div className="now-playing-display center">
                    <p>
                      Now Playing: { this.state.nowPlaying.name } - {this.state.nowPlaying.artist} 
                    </p>
                    <img className={"album-art " + (this.state.nowPlaying.isPlaying ? "album-playing" : null)} 
                      src={this.state.nowPlaying.albumArt} alt='Album'
                    />
                  </div>
                  <div className="playback-controls center">
                    <button onClick={() => this.toggleShuffle()}>
                      Shuffle: {global.shuffleOptions[this.state.shuffle] ? <span>on</span> : <span>off</span>}
                    </button>
                    <button onClick={() => this.skipToPreviousTrack()}>
                      Prev
                    </button>
                    <button onClick={() => this.handleStatus()}>
                      {
                        this.state.nowPlaying.isPlaying ? <span>Pause</span> : <span>Resume</span>
                      } 
                    </button>
                    <button onClick={() => this.skipToNextTrack()}>
                      Next
                    </button>
                    <button onClick={() => this.toggleRepeat()}>
                      Repeat: {global.repeatOptions[this.state.repeat]}
                    </button>
                  </div>
                  <div className="track-progress">
                    <ProgressBar 
                      percentage={(this.state.nowPlaying.progressMs/this.state.nowPlaying.durationMs * 100)}
                      progressTime={helper.calculateTimeLength(this.state.nowPlaying.progressMs)}
                      durationTime={helper.calculateTimeLength(this.state.nowPlaying.durationMs)}
                    />
                  </div>

                  <div className="mixing-controls">
                    <div className="skip-time">
                      <span>Skip to: </span>
                      <input 
                        type="number"
                        name="skipMin"
                        onChange={this.handleChange}
                        value={this.state.skipMin}
                        placeholder="0"
                        min="0"
                        max={helper.calculateMin(this.state.nowPlaying.durationMs)}
                      />:
                      <input 
                        type="number"
                        name="skipSec"
                        onChange={this.handleChange}
                        value={this.state.skipSec}
                        placeholder="0"
                        min="0"
                        max={helper.calculateSec(this.state.nowPlaying.durationMs)}
                        
                      />
                      <button onClick={() => this.skipToPosition()}>
                        Skip
                      </button>
                    </div>

                    {
                      this.state.mixingMode &&
                      <div className="end-time">
                        <span>End Time: </span>
                        <input 
                          type="number"
                          name="endMin"
                          onChange={this.handleChange}
                          value={this.state.endMin}
                          placeholder="0"
                          min="0"
                          max={helper.calculateMin(this.state.nowPlaying.durationMs)}
                        />:
                        <input 
                          type="number"
                          name="endSec"
                          onChange={this.handleChange}
                          value={this.state.endSec}
                          placeholder="0"
                          min="0"
                          max="59"
                        />
                        {
                          this.state.mixingMode && this.state.queue.length > 0 &&
                          <button onClick={() => this.toggleAutomaticSkip()}>
                            Ready To Skip: {this.state.shouldSkip ? <span>YES</span> : <span>NO</span>}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
                
                <div className="own-queue float-child">
                  <button onClick={() => this.toggleQueue()}>
                    {this.state.showOwnQueue ? <span>Hide</span> : <span>Show</span>} Queue
                  </button>
                  {
                    this.state.queue.length > 0 &&
                    <div className="queue">
                      <button onClick={() =>this.playNextQueue()}>
                        Play Next in Queue
                      </button>
                      <button onClick={() => this.clearQueue()}>
                        Clear Queue
                      </button>
                    </div>
                  }
                  {
                    this.state.showOwnQueue &&
                    <div>
                      <h3>{this.state.queue.length > 0 ? <span>Queued Tracks:</span> : <span>No Tracks In Queue</span>}</h3>
                      <div className="queue-list">
                        {queueItems}
                      </div>
                    </div>
                  }
                </div>
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
                <button onClick={() => this.clearSearch()}>
                  Clear Search
                </button>
                {
                this.state.tracks.length > 0 &&
                <div className="track-list">
                  <h3>Search Results:</h3>
                  {trackItems}
                </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

export default App;
