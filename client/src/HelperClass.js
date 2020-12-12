class HelperClass {

    calculateTimeLength(number) {
        return '' + Math.floor(number/1000.0/60) + ':' + ( '0' + (Math.round((number / 1000) % 60))).slice(-2);
    }

    calculateMS(minutes, seconds) {
        return (parseInt((minutes * 60)) + parseInt(seconds)) * 1000;
    }
}

export default HelperClass;