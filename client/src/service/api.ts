import axios from 'axios';

const BASEURL = process.env.NEXT_PUBLIC_BASEURL;

// Create Axios instance
export const api = axios.create({
  baseURL: BASEURL,
  headers: {
    "Content-Type": "application/json",
  },
});
