import { validate } from "../validation/validation.js";
import { spkPrinterValidation } from "../validation/spkPrinter-validation.js";
import { getBestAlternative } from '../provider/spkPrinter/topsis.js';

const findPrinter = async (request) => {
  let spkPrinter = validate(spkPrinterValidation(request), request);

  const bestPrinter = getBestAlternative(
    {
      criteria: spkPrinter.headers,
      alternatives: spkPrinter.printers
    }, (a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Sort by queue ascending
      if (a.queue !== b.queue) {
        return a.queue - b.queue;
      }
      // Sort by dimension ascending
      if (a.dimension !== b.dimension) {
        return a.dimension - b.dimension;
      }
      // Sort by distance ascending
      return a.distance - b.distance;
    });

  return bestPrinter;
}

export default {
  findPrinter
}