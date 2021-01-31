import React from "react";
import './TrackItem.css';

function TrackItem(props) {
    return (
        <div className="track-item">
            <img src={props.trackInfo.album.images[0].url} style={{ height: 100 }} alt='Album'/>
            <p className="track-info center">{props.trackInfo.name} - {props.trackInfo.artists[0].name}</p>
            <button onClick ={props.handlePlay.bind(this, props.trackInfo.uri)}>
                Play
            </button>
            <button onClick={props.mixingMode ? props.queueTrackApp.bind(this, props.trackInfo) : props.queueTrackSpotify.bind(this, props.trackInfo.uri)}>
                Queue
            </button> 
        </div>
    );
}

export default TrackItem;