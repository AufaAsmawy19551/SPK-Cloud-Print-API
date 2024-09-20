import LinearAlgebra from 'linear-algebra';
const { Matrix } = LinearAlgebra();

const getnormalisedAlternativeMatrix = (alternative) => {
  
  // get maximum and minimum column value
  const maxMinColumnValue = {};
  
  alternative.headers.forEach((header) => {
    maxMinColumnValue[ header.title ] = {};

    maxMinColumnValue[ header.title ][ 'max' ] = alternative.printers.reduce(
      (max, printer) => { return printer[ header.title ] > max ? printer[ header.title ] : max },
      alternative.printers.length > 0 ? alternative.printers[ 0 ][ header.title ] : 0
    );

    maxMinColumnValue[ header.title ][ 'min' ] = alternative.printers.reduce(
      (min, printer) => { return printer[ header.title ] < min ? printer[ header.title ] : min },
      alternative.printers.length > 0 ? alternative.printers[ 0 ][ header.title ] : 0
    );
  })
  
  // normalised each column value
  let normalised = alternative.printers.map((printer) => {
    let row = [];

    alternative.headers.forEach((header) => {
      row.push(
        ((printer[ header.title ] - maxMinColumnValue[ header.title ].min) / (maxMinColumnValue[ header.title ].max - maxMinColumnValue[ header.title ].min + 1)) * (10 - 3) + 3
      );
    })

    return row
  })

  return new Matrix(normalised);
}

const getWeight = (alternative) => {
  let totalWeight = 0;

  alternative.headers.forEach(header => {
    totalWeight += header.weight
  });

  let weight = [];

  alternative.headers.forEach(header => {
    weight.push(header.weight / totalWeight);
  });

  return weight;
}

const getType = (alternative) => {
  let type = [];

  alternative.headers.forEach(header => {
    type.push(header.type.toLowerCase() == 'benefit' ? 'max' : 'min');
  });

  return type;
}

const getScoredAlternative = (normalisedAlternativeMatrix, weight, type) => {
  // validation
  if (!normalisedAlternativeMatrix.cols) {
    return [];
  }

  if (!(normalisedAlternativeMatrix.data)) {
    throw new Error('ERROR. Matrix argument MUST be a linear-algebra module matrix.');
  }

  if (Array.isArray(type) === false) {
    throw new Error('ERROR. Impact argument MUST be an array.');
  }

  if (type.length !== normalisedAlternativeMatrix.cols) {
    throw new Error('ERROR. Impact argument size MUST be equal to Alternative Matrix columns size.');
  }

  if (type.every(i => typeof i === 'string') === false) {
    throw new Error('ERROR. Impact argument MUST contain string type elements.');
  }

  const c1 = type.indexOf('max') > -1;
  const c2 = type.indexOf('min') > -1;

  if (!(c1 || c2)) {
    throw new Error('ERROR. Impact argument MUST contain string type element exactly named "max" or "min" accordingly.');
  }

  if (Array.isArray(weight) === false) {
    throw new Error('ERROR. Weights argument MUST be an array.');
  }

  if (weight.length !== normalisedAlternativeMatrix.cols) {
    throw new Error('ERROR. Weights argument size MUST be equal to Alternative Matrix columns size.');
  }

  let i = 0;

  for (i = 0; i < normalisedAlternativeMatrix.cols; i += 1) {
    if (weight[ i ] > 1) {
      throw new Error('ERROR. The value from an element in the weights argument cannot be higher than 1.');
    }
  }

  function add(a, b) {
    return a + b;
  }


  if (weight.reduce(add, 0) > 1) {
    throw new Error('ERROR. Elements from the weights argument must sum exactly 1.');
  }


  // Normalization
  
  let j; // Cols
  i = 0; // Rows
  let norm = 0;
  const normArray = [];

  for (j = 0; j < normalisedAlternativeMatrix.cols; j += 1) {
    for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
      const num = normalisedAlternativeMatrix.data[ i ][ j ];
      norm = (num ** 2) + norm;
    }

    norm = Math.round(Math.sqrt(norm) * 100) / 100;
    normArray.push(norm);
    norm = 0;
  }

  let mNormArray = [];

  i = 0;

  for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
    mNormArray.push(normArray);
  }

  mNormArray = new Matrix(mNormArray);

  // Normalised Alternative Matrix

  let nm = [];

  nm = normalisedAlternativeMatrix.div(mNormArray);

  // Weighted normalised alternative matrix
  let ev = [];
  i = 0;
  for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
    ev.push(weight);
  }

  ev = new Matrix(ev);

  const wnm = nm.mul(ev);


  // Computing ideal and anti-ideal solution

  i = 0; // Rows
  j = 0; // Columns
  let a = 0; // iterations
  let attributeValues = [];
  const idealSolution = [];
  const aidealSolution = [];
  let attributeFunction = null;

  for (a = 0; a < 2; a += 1) {
    for (j = 0; j < normalisedAlternativeMatrix.cols; j += 1) {
      for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
        attributeValues.push(wnm.data[ i ][ j ]);
      }

      if (a === 0) {
        if (type[ j ] === 'min') {
          attributeFunction = Math.min(...attributeValues);
          idealSolution.push(attributeFunction);
        } else if (type[ j ] === 'max') {
          attributeFunction = Math.max(...attributeValues);
          idealSolution.push(attributeFunction);
        }
      } else if (a === 1) {
        if (type[ j ] === 'min') {
          attributeFunction = Math.max(...attributeValues);
          aidealSolution.push(attributeFunction);
        } else if (type[ j ] === 'max') {
          attributeFunction = Math.min(...attributeValues);
          aidealSolution.push(attributeFunction);
        }
      }

      attributeValues = [];
    }
    j = 0;
  }


  // Calculate distance to ideal and antiideal solution
  i = 0; // Rows
  j = 0; // Cols
  a = 0;

  const listIdeal = [];
  const listaIdeal = [];
  let distToI = 0;
  let distToaI = 0;

  for (a = 0; a < 2; a += 1) {
    for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
      distToI = 0;
      distToaI = 0;
      for (j = 0; j < normalisedAlternativeMatrix.cols; j += 1) {
        if (a === 0) {
          distToI += ((wnm.data[ i ][ j ] - idealSolution[ j ]) ** 2);
        } else {
          distToaI += ((wnm.data[ i ][ j ] - aidealSolution[ j ]) ** 2);
        }
      }

      if (a === 0) {
        distToI = Math.sqrt(distToI);
        listIdeal.push(distToI);
      } else {
        distToaI = Math.sqrt(distToaI);
        listaIdeal.push(distToaI);
      }
    }
  }


  i = 0;
  const listedPerformancedScore = [];
  let perferenceScore = null;
  for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
    perferenceScore = listaIdeal[ i ] / (listIdeal[ i ] + listaIdeal[ i ]);
    listedPerformancedScore.push(perferenceScore);
  }


  const indexedPerferenceScore = [];
  i = 0;
  for (i = 0; i < normalisedAlternativeMatrix.rows; i += 1) {
    const dp = {
      index: i,
      data: normalisedAlternativeMatrix.data[ i ],
      ps: listedPerformancedScore[ i ],
    };
    indexedPerferenceScore.push(dp);
  }

  return indexedPerferenceScore;
}

const getRankedAlternative = (scoredAlternative) => {
  return scoredAlternative.sort((a, b) => {
    if (b[ 'ps' ] > a[ 'ps' ]) {
      return 1;
    } if (b[ 'ps' ] < a[ 'ps' ]) {
      return -1;
    }
    return 0;
  })
}

export const getBestAlternative = (alternative) => {
  const normalisedAlternativeMatrix = getnormalisedAlternativeMatrix(alternative);

  const weight = getWeight(alternative);

  const type = getType(alternative);

  const scoredAlternative = getScoredAlternative(normalisedAlternativeMatrix, weight, type)

  const rankedAlternative = getRankedAlternative(scoredAlternative);

  return alternative.printers[ rankedAlternative[ 0 ]?.index ] ?? {};
}

export default {
  getBestAlternative
}









