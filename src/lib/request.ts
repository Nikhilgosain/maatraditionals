/* eslint-disable @typescript-eslint/no-explicit-any */

// To make request with Axios to the backend/api
import { ROUTES } from "@/utils/constant";
import axios, { AxiosRequestConfig } from "axios";

/**
 * Create an Axios Client with defaults
 */
const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_APP_BASE_URL,
});

// Set the auth token for any request
client.interceptors.request.use(
    async config => {
        if (config.url === 'user') {
            return config;
        } else {
            const token = (await localStorage.getItem("authToken")) || "";
            if (token !== "") {
                config.headers.authorization = `Bearer ${token}`;
            }
            return config;
        }
    },
    error => {
        return Promise.reject(error);
    }
);

/**
 * Request Wrapper with default success/error actions
 */
const request = (options: AxiosRequestConfig) => {
    const onSuccess = (response: { headers: any; data: any }) => {
        return response.data;
    };

    const onError = (error: { config: any; response: { status: any; data: any; headers: any }; message: any }) => {
        if (error.response) {
            // Request was made but server responded with something
            // other than 2xx
            const { status, data } = error.response;
            switch (status) {
                case 400:
                    console.log("Bad Request:", data.message || "Invalid request");
                    break;
                case 401:
                    console.log("Unauthorized:", data.message || "You are not authorized");
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("clientId");
                        window.location.href = ROUTES.CLIENT_LOGIN || "/login/client";
                    }
                    break;
                case 403:
                    console.log("Forbidden:", data.message || "You don't have permission to access this resource");
                    break;
                case 404:
                    console.log("Not Found:", data.message || "Requested resource not found");
                    break;
                case 409:
                    console.log("Conflict:", data.message || "Duplicate entry detected");
                    break;
                case 500:
                    console.log("Internal Server Error:", data.message || "Something went wrong on the server");
                    break;
                default:
                    console.log(`Error ${status}:`, data.message || "An unexpected error occurred");
            }

            return Promise.reject({
                status,
                message: data.message || "An error occurred",
            });
        } else {
            // Something else happened while setting up the request
            // triggered the error
        }
        return Promise.reject(error.response || error.message);
    };

    return client(options)
        .then(onSuccess)
        .catch(onError);
};

export default request;
