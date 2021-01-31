class HelperClass {

    // Returns min and sec in time mm:ss str format
    calculateTimeLength(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        return mins + ':' + ( '0' + secs).slice(-2);
    }

    calculateSec(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;

        return secs;
    }

    calculateMin(s) {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;

        return mins;
    }

    calculateMS(minutes, seconds) {
        return (parseInt((minutes * 60)) + parseInt(seconds)) * 1000;
    }
}

export default HelperClass;