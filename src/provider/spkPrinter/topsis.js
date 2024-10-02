import LinearAlgebra from 'linear-algebra'; // Import the linear-algebra module for matrix operations
const { Matrix } = LinearAlgebra(); // Extract the Matrix class from the linear algebra module

/**
 * Get the normalized weights for the criteria.
 * @param {Object} data - The alternatives data including criteria.
 * @returns {Array} weight - An array of normalized weights for each criterion.
 */
const getNormalizedWeights = (data) => {
  // Calculate the total weight of all criteria
  const totalWeight = data.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  // Return normalized weight for each criterion
  return data.criteria.map(criterion => criterion.weight / totalWeight);
};

/**
 * Determine if each criterion is a benefit or cost.
 * @param {Object} data - The alternatives data including criteria.
 * @returns {Array} type - An array indicating if each criterion is a benefit or cost.
 */
const getCriteriaTypes = (data) => {
  // Return the type of each criterion ('max' for benefits, 'min' for costs)
  return data.criteria.map(criterion =>
    (criterion.type.toLowerCase() === 'benefit' ? 'max' : 'min')
  );
};

/**
 * Get the max and min values for each criterion.
 * @param {Object} data - The alternatives data including criteria and alternatives.
 * @returns {Object} maxMinColumnValue - An object with max and min values for each criterion.
 */
const getMaxMinValues = (data) => {
  // Reduce criteria to get max and min values for each
  return data.criteria.reduce((acc, criterion) => {
    acc[ criterion.title ] = {
      // Find the maximum value for each alternative based on the criterion
      max: Math.max(...data.alternatives.map(a => a[ criterion.title ])),
      // Find the minimum value for each alternative based on the criterion
      min: Math.min(...data.alternatives.map(a => a[ criterion.title ])),
    };
    return acc; // Return the accumulator containing max and min values
  }, {});
};

/**
 * Preprocess the alternatives' criteria values.
 * @param {Object} data - The alternatives data including criteria and alternatives.
 * @returns {Matrix} preprocessMatrix - A preprocessed matrix of the alternatives' criteria values.
 */
const preprocessAlternatives = (data) => {
  const maxMinValues = getMaxMinValues(data); // Get max and min values for preprocessing

  // Preprocess each criterion value for every alternative
  const preprocessMatrix = data.alternatives.map(alternative =>
    data.criteria.map(criterion =>
      // Normalization formula: (value - min) / (max - min) * (range) + offset
      ((alternative[ criterion.title ] - maxMinValues[ criterion.title ].min) /
        (maxMinValues[ criterion.title ].max - maxMinValues[ criterion.title ].min + 1)) *
      (10 - 3) + 3) // Scale to range 3 to 10
  );

  return new Matrix(preprocessMatrix); // Return the preprocess matrix
};

/**
 * Normalize the alternatives' criteria values.
 * @param {Object} data - The alternatives data including criteria and alternatives.
 * @returns {Matrix} normalizedMatrix - A normalized matrix of the alternatives' criteria values.
 */
const normalizeAlternatives = (preprocessedAlternativeMatrix) => {
  // Check if preprocessed alternative matrix is not empty
  if (preprocessedAlternativeMatrix.cols == 0) {
    // Return preprocessed alternative matrix if preprocessed alternative matrix is empty
    return preprocessedAlternativeMatrix;
  }

  // Calculate norms for each column
  const { rows, cols, data } = preprocessedAlternativeMatrix;
  const normArray = new Array(cols).fill(0);

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      normArray[ j ] += data[ i ][ j ] ** 2;
    }
    normArray[ j ] = Math.sqrt(normArray[ j ]);
  }

  // Create a norm matrix as a column vector
  const normMatrix = new Matrix(preprocessedAlternativeMatrix.toArray().map(() => normArray));

  // Create normalized matrix
  const normalizedMatrix = preprocessedAlternativeMatrix.div(normMatrix);

  return normalizedMatrix; // Return the normalized matrix
};

/**
 * Compute the weighted normalized matrix.
 * @param {Matrix} normalizedMatrix - The normalized matrix of criteria values.
 * @param {Array} weights - The normalized weights for each criterion.
 * @returns {Matrix} weightedNormalizedMatrix - The weighted normalized matrix.
 */
const getWeightedNormalizedMatrix = (normalizedMatrix, weights) => {
  // Check if normalized matrix is not empty
  if (normalizedMatrix.cols == 0) {
    // Return normalized matrix if normalized matrix is empty
    return normalizedMatrix;
  }

  // Create a weight matrix as a column vector
  const weightMatrix = new Matrix(normalizedMatrix.toArray().map(() => weights));

  // Perform element-wise multiplication, broadcasting the weight vector across each row
  const weightedNormalizedMatrix = normalizedMatrix.mul(weightMatrix);

  return weightedNormalizedMatrix; // Return the weighted normalized matrix
};

/**
 * Calculate ideal and anti-ideal solutions for the criteria.
 * @param {Matrix} weightedNormalizedMatrix - The weighted normalized matrix.
 * @param {Array} types - An array indicating if each criterion is a benefit or cost.
 * @returns {Object} { idealSolution, antiIdealSolution } - The ideal and anti-ideal solutions.
 */
const getIdealSolutions = (weightedNormalizedMatrix, types) => {
  const idealSolution = []; // Array for the ideal solution
  const antiIdealSolution = []; // Array for the anti-ideal solution

  // Transpose the weighted normalized matrix and calculate ideal/anti-ideal solutions
  weightedNormalizedMatrix.trans().toArray().forEach((column, index) => {
    if (types[ index ] === 'min') {
      idealSolution.push(Math.min(...column)); // Ideal solution for cost criteria
      antiIdealSolution.push(Math.max(...column)); // Anti-ideal solution for cost criteria
    } else {
      idealSolution.push(Math.max(...column)); // Ideal solution for benefit criteria
      antiIdealSolution.push(Math.min(...column)); // Anti-ideal solution for benefit criteria
    }
  });

  return { idealSolution, antiIdealSolution }; // Return ideal and anti-ideal solutions
};

/**
 * Calculate the Euclidean distances to the ideal and anti-ideal solutions.
 * @param {Matrix} weightedNormalizedMatrix - The weighted normalized matrix.
 * @param {Array} idealSolution - The ideal solution array.
 * @param {Array} antiIdealSolution - The anti-ideal solution array.
 * @returns {Object} { distToIdeal, distToAntiIdeal } - Distances to ideal and anti-ideal solutions.
 */
const calculateDistances = (weightedNormalizedMatrix, idealSolution, antiIdealSolution) => {
  // Calculate the distance to the ideal solution for each alternative
  const distToIdeal = weightedNormalizedMatrix.toArray().map(row =>
    Math.sqrt(row.reduce((sum, value, index) => sum + (value - idealSolution[ index ]) ** 2, 0))
  );

  // Calculate the distance to the anti-ideal solution for each alternative
  const distToAntiIdeal = weightedNormalizedMatrix.toArray().map(row =>
    Math.sqrt(row.reduce((sum, value, index) => sum + (value - antiIdealSolution[ index ]) ** 2, 0))
  );

  return { distToIdeal, distToAntiIdeal }; // Return distances to ideal and anti-ideal solutions
};

/**
 * Calculate the preference score for each alternative.
 * @param {Object} distances - Distances to ideal and anti-ideal solutions.
 * @returns {Array} preferenceScores - An array of preference scores for each alternative.
 */
const calculatePreferenceScores = ({ distToIdeal, distToAntiIdeal }) => {
  // Calculate preference scores based on distances
  return distToAntiIdeal.map((dAnti, index) =>
    dAnti / (dAnti + distToIdeal[ index ]) // Preference score formula
  );
};

/**
 * Rank the alternatives based on the preference score.
 * @param {Array} preferenceScores - The preference scores for each alternative.
 * @param {Array} alternatives - The array of alternative options.
 * @param {Function} [rankBy] - A custom sorting function that defines the ranking order.
 * @returns {Object} bestAlternative - The best alternative based on scores.
 */
const rankAlternatives = (preferenceScores, alternatives, rankBy = function (a, b) { return b.score - a.score }) => {
  // Combine each alternative with its corresponding preference score
  const ranked = alternatives.map((alternative, index) => ({
    ...alternative, // Spread the properties of the alternative
    score: preferenceScores[ index ] ?? 1 // Assign the preference score; default to 1 if undefined
  })).sort(rankBy); // Sort the combined array by score using the provided ranking function

  // Return the highest-ranked alternative or null if none exists
  return ranked[ 0 ] || null;
};

/**
 * Main function to get the best alternative using the TOPSIS method.
 * @param {Object} data - The alternatives data including criteria and alternatives.
 * @param {Function} [rankBy] - A custom sorting function that defines the ranking order.
 * @returns {Object} bestAlternative - The best alternative determined by the method.
 */
export const getBestAlternative = (data, rankBy = function (a, b) { return b.score - a.score }) => {
  // Get the normalized weights for each criterion
  const weights = getNormalizedWeights(data);
  // Determine the types of criteria (benefit or cost)
  const types = getCriteriaTypes(data);
  // Normalize the alternatives' criteria values
  const preprocessMatrix = preprocessAlternatives(data);
  // Normalize the alternatives' criteria values
  const normalizedMatrix = normalizeAlternatives(preprocessMatrix);
  // Calculate the weighted normalized matrix
  const weightedNormalizedMatrix = getWeightedNormalizedMatrix(normalizedMatrix, weights);
  // Calculate ideal and anti-ideal solutions based on the weighted matrix
  const { idealSolution, antiIdealSolution } = getIdealSolutions(weightedNormalizedMatrix, types);
  // Calculate the distances to the ideal and anti-ideal solutions
  const distances = calculateDistances(weightedNormalizedMatrix, idealSolution, antiIdealSolution);
  // Calculate preference scores based on the distances
  const preferenceScores = calculatePreferenceScores(distances);
  // Rank the alternatives based on their preference scores and return the best alternative
  return rankAlternatives(preferenceScores, data.alternatives, rankBy);
}

// Export the main function for use in other modules
export default {
  getBestAlternative // Export the best alternative function
};

