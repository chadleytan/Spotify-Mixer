import React from "react";

function TrackItem(props) {
    return (
        <div className="track-item">
            <img src={props.trackInfo.album.images[0].url} style={{ height: 100 }} alt='Album'/>
                <p>{props.trackInfo.name} - {props.trackInfo.artists[0].name}</p>
            <button onClick ={props.handlePlay.bind(this, props.trackInfo.uri)}>
                Play
            </button>
            <button onClick={props.queueTrackApp.bind(this, props.trackInfo)}>
                Queue
            </button>
            <button onClick={props.queueTrackSpotify.bind(this, props.trackInfo.uri)}>
                Spotify Queue
            </button>
        </div>
    );
}

export default TrackItem;