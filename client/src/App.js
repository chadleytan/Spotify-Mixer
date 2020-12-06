import React from 'react';
import $ from 'jquery'; 
import SpotifyWebApi from 'spotify-web-api-js';
import TrackItem from './TrackItem';

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
      nowPlaying: {name: 'Not Checked', albumArt:''},
      skipTime: 0,
      searchTrack: "",
      tracks:[]
    }
    this.handleChange = this.handleChange.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.getNowPlaying = this.getNowPlaying.bind(this);
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
            albumArt: response.item.album.images[0].url
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
    console.log(this.state.device_id);
    var self = this;
    // const track_id = "spotify:track:46eu3SBuFCXWsPT39Yg3tJ";
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
      console.log("Need to get device id first. Click Check Now Playing");
    }
  }

  searchTrack(){
    console.log("trying to search");
    var self = this;
    if (this.searchTrack !== "")
    {
      $.ajax({
          url: "https://api.spotify.com/v1/search?q=" + this.state.searchTrack + "&type=track&market=US&limit=10",
          type: "GET",
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + spotifyApi.getAccessToken()},
          success: function(data) {
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

  // Skip to a certain position in the song
  skipToPosition() {
    spotifyApi.seek(this.state.skipTime * 1000).then(() => {
        console.log('Changed position!');
    });
  }

  render(){
    const trackItems = this.state.tracks.map(track =><TrackItem key={track.id} trackInfo={track.trackInfo} handlePlay={this.handlePlay}/>);

    return (
      <div className="App">
        {
          !this.state.loggedIn &&
          <a href='http://localhost:8888'>
            Login to Spotify
          </a>
        }
        <div>
          Now Playing: { this.state.nowPlaying.name }
        </div>
        <div>
          <img src={this.state.nowPlaying.albumArt} style={{ height: 150 }} alt='Album'/>
        </div>
        <div>
          {
            this.state.loggedIn &&
            <div>
              <button onClick={() => this.getNowPlaying()}>
                Check Now Playing
              </button>

              <div className="container">
                {/* <div className="play-track">
                  <button onClick={() => this.play()}>
                    Play Track
                  </button>
                </div> */}

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
