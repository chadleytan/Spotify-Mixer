import React from 'react';

function ProgressBar(props) {
    return (
        <div className="progress-bar">
           <div className="filler" style={{"width": props.percentage + '%'}}/>
        </div>
    )
}

export default ProgressBar;