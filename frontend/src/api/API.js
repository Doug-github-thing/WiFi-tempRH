// For handling the web requests for fetching data from the database
class API {

    // static backend_url = "http://192.168.0.47:3333";
    static backend_url = "https://wifi-temprh-web-backend.vercel.app";
    
    // Perform a GET request to the backend for the current (most up-to-date temp/humidity)
    static async getCurrent() {
        return await fetch(`${this.backend_url}/current`)
            .then(response => response.json())
            .catch(error => console.error(error));
    }

    // Perform a GET request to the backend for the data from the last hour
    static async getData() {
        const raw_data = await fetch(`${this.backend_url}/day`)
            .then(response => response.json())
            .catch(error => console.error(error));

        // Converts the timestamps from unix timestamps and saves them as a human readable value
        for (var i = 0; i < raw_data.length; i++)
            raw_data[i].timestamp = convertUnixTimestamp(raw_data[i].unix_timestamp);
        
            return raw_data;
    }
}


// Converts a unix timestamp to a human readable HH:MM
function convertUnixTimestamp(unix_timestamp) {
    const date = new Date(unix_timestamp * 1000);
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return date.getHours() + ':' + minutes;
}

export default API;