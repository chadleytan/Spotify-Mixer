import React from 'react';

function ProgressBar(props) {
    return (
        <div>
            Current Time: {props.progressTime}
            <div className="progress-bar">
                <div className="filler" style={{"width": props.percentage + '%'}}/>
            </div>
            Track Duration: {props.durationTime}
        </div>
    )
}

export default ProgressBar;