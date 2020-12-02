import React from 'react';
import $ from 'jquery'; 
import SpotifyWebApi from 'spotify-web-api-js';

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
      nowPlaying: {name: 'Not Checked', albumArt:''}
    }
  }

  getNowPlaying() {
    spotifyApi.getMyCurrentPlaybackState()
    .then((response) => {
      console.log(response)
      this.setState({
        device_id: response.device.id,
        nowPlaying: {
          name: response.item.name,
          albumArt: response.item.album.images[0].url
        }
      })
    })
  }


// Functions related to using the Spotify Web Player 
// Play a specified track on the Web Playback SDK's device ID
Play() {
  console.log("trying to play track");
  console.log(spotifyApi.getAccessToken);
  console.log(this.state.t);
  $.ajax({
      url: "https://api.spotify.com/v1/me/player/play?device_id=" + this.state.device_id,
      type: "PUT",
      data: '{"uris": ["spotify:track:1RMJOxR6GRPsBHL8qeC2ux"]}',
      beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + spotifyApi.getAccessToken());},
      success: function(data) { 
          console.log(data)
      }
  });
}

// SearchTrack(event){
//   const {name, value} = event.target;
//   $.ajax({
//       url: "https://api.spotify.com/v1/search?q=" + value + "&type=track&market=US&limit=10",
//       type: "GET",
//       headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.state.token},
//       success: function(data) {
//           console.log(data);
//       }
//   });
// }

// // Skip to a certain position in the song
// SkipToPosition(event) {
//   this.state.player.seek(time * 1000).then(() => {
//       console.log('Changed position!');
//   });
// }

  render(){
    return (
      <div className="App">
        {
          !this.state.loggedIn &&
          <a href='http://localhost:8888'>Login to Spotify</a>
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
                <button onClick={() => this.Play()}>
                  Play Track
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
