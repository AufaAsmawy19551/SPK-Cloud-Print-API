import { getBestAlternative } from './topsis.js';
import fs from "fs";


try {
  const alternative = JSON.parse(fs.readFileSync('RequestStructure.json'));

  const result = getBestAlternative(alternative);

  console.log(result);


} catch (error) {
  console.log(error.message);
}
