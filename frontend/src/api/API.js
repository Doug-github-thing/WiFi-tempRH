// For handling the web requests for fetching data from the database
class API {

    static backend_url = "http://192.168.0.47:3333";

    // Perform a GET request to the backend for the current (most up-to-date temp/humidity)
    static async getCurrent() {
        return await fetch(`${this.backend_url}/current`)
            .then(response => response.json())
            .catch(error => console.error(error));
    }

    // Perform a GET request to the backend for the data from the last hour
    static async getData() {
        return await fetch(`${this.backend_url}/day`)
            .then(response => response.json())
            .catch(error => console.error(error));
    }
}

export default API;