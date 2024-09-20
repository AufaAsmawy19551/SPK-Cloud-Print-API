import express from "express";
import spkPrinterController from "../controller/spkPrinter-controller.js";
import {authMiddleware} from "../middleware/auth-middleware.js";

const publicRouter = express.Router();

publicRouter.post('/api/spk-printer/find-printer', spkPrinterController.findPrinter);

export {
    publicRouter
}