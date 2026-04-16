const API_URL = "http://localhost:3000/api";

class ApiClient {
  static get token() {
    return localStorage.getItem("token");
  }

  static async request(endpoint, method = "GET", body = null) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error en la solicitud");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}
