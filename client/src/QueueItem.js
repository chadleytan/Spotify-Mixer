import React from "react";

function QueueItem(props) {
    return (
        <div className="queue-item">
            <img src={props.trackInfo.album.images[0].url} style={{ height: 100 }} alt='Album'/>
            <p>{props.trackInfo.name} - {props.trackInfo.artists[0].name}</p>
        </div>
    );
}

export default QueueItem;