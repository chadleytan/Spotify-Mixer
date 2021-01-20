import React from "react";
import HelperClass from "./HelperClass.js";
import './QueueItem.css';

const helper = new HelperClass();

function QueueItem(props) {
    return (
        <div className="queue-item">
            <img src={props.trackInfo.info.album.images[0].url} style={{ height: 100 }} alt='Album'/>
            <p>{props.trackInfo.info.name} - {props.trackInfo.info.artists[0].name}</p>
            <p>Track Length: {helper.calculateTimeLength(props.trackInfo.info.duration_ms)}</p>
            {
                props.mixingMode &&
                <div className="control-time">
                    <div className="queue-start">
                        <span>Start Time: </span>  
                        <input 
                            type="number"
                            name="startMin"
                            onChange={(e) => props.handleChange(e, props.id)}
                            value={props.trackInfo.startMin}
                            placeholder="0"
                            min="0"
                            max={helper.calculateMin(props.trackInfo.info.duration_ms)}
                        />:
                        <input 
                            type="number"
                            name="startSec"
                            onChange={(e) => props.handleChange(e, props.id)}
                            value={props.trackInfo.startSec}
                            placeholder="0"
                            min="0"
                            max="59"
                        />
                    </div>
                    <div className="end-time">
                        <span>End Time: </span>
                        <input 
                            type="number"
                            name="endMin"
                            onChange={(e) => props.handleChange(e, props.id)}
                            value={props.trackInfo.endMin}
                            placeholder="0"
                            min="0"
                            max={helper.calculateMin(props.trackInfo.info.duration_ms)}
                        />:
                        <input 
                            type="number"
                            name="endSec"
                            onChange={(e) => props.handleChange(e, props.id)}
                            value={props.trackInfo.endSec}
                            placeholder="0"
                            min="0"
                            max="59"
                        />
                    </div>
                </div>
            }
            <button onClick={props.handleDelete.bind(this, props.id)}>
                Remove
            </button>
        </div>
    );
}

export default QueueItem;