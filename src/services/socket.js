import API_BASE_URL from "../config";
import { io } from "socket.io-client";

const socket = io(API_BASE_URL); // Replace with your backend URL

export default socket;
