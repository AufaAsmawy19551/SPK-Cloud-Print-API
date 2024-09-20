import { validate } from "../validation/validation.js";
import { spkPrinterValidation } from "../validation/spkPrinter-validation.js";
import { getBestAlternative } from '../provider/spkPrinter/topsis.js';

const findPrinter = async (request) => {
  let spkPrinter = validate(spkPrinterValidation(request), request);

  const bestPrinter = getBestAlternative(spkPrinter);

  return bestPrinter
}

export default {
  findPrinter
}