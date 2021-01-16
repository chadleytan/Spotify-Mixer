class HelperClass {

    calculateTimeLength(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        return mins + ':' + ( '0' + secs).slice(-2);
    }

    calculateMS(minutes, seconds) {
        return (parseInt((minutes * 60)) + parseInt(seconds)) * 1000;
    }
}

export default HelperClass;