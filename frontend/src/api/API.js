// For handling the web requests for fetching data from the database
class API {

    static backend_url = process.env.REACT_APP_BACKEND_URL;

    /**
     * Perform a GET request to the backend for the sensors within a given node
     * @node Number corresponding to the node to be queried
     * @returns Promise of a list of json objects
     */
    static async getSensors(node) {
        console.log("Trying to get from url: " + this.backend_url);
        return await fetch(`${this.backend_url}/node/${node}`)
            .then(response => response.json())
            .catch(error => console.error(error));
    }
    
    /**
     * Perform a GET request to the backend for the data on a given sensor by that node.
     * @node Number corresponding to the node to be queried
     * @sensor_id Number corresponding to the sensor ID to be queried
     * @returns Promise of a list of json objects
     */
    static async getData(node, sensor_id) {
        return await fetch(`${this.backend_url}/node/${node}/${sensor_id}`)
            .then(response => response.json())
            .catch(error => console.error(error));
    }   

    /**
     * Perform a GET request to the backend for the current (most recent reading) of a given node/sensor
     * @node Number corresponding to the node to be queried
     * @returns Promise of a list of json objects
     */
    static async getCurrent(node) {
        return await fetch(`${this.backend_url}/current/${node}`)
            .then(response => response.json())
            .catch(error => console.error(error));
    }
}


// Converts a unix timestamp to a human readable HH:MM
function convertUnixTimestamp(unix_timestamp) {
    const date = new Date(unix_timestamp * 1000);
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return date.getHours() + ':' + minutes;
}

export default API;
