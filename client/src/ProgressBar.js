import React from 'react';
import './ProgressBar.css';

function ProgressBar(props) {
    return (
        <div className="progress">
            <span className="time">{props.progressTime}</span>
            <div className="progress-bar">
                <div className="filler" style={{"width": props.percentage + '%'}}/>
            </div>
            <span className="time">{props.durationTime}</span>
        </div>
    )
}

export default ProgressBar;