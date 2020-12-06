import React from "react";

function TrackItem(props) {
    return (
        <div className="track-item">
            <p>{props.trackInfo.name}</p>
            <button onClick ={props.handlePlay.bind(this, props.trackInfo.uri)}>
                Play
            </button>
        </div>
    );
}

export default TrackItem;