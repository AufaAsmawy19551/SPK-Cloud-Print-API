import spkPrinterService from "../service/spkPrinter-service.js";
import { logger } from "../application/logging.js";

const findPrinter = async (req, res, next) => {
  try {
    const result = await spkPrinterService.findPrinter(req.body);
    res.status(200).json({
      data: result,
    })
  } catch (error) {
    next(error);
  }
}

export default {
  findPrinter,
}