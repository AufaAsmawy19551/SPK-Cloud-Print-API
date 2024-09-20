import Joi from "Joi";

const spkPrinterValidation = (request) => {
  const printerObject = { id: Joi.number().min(1).required() }

  request?.headers?.forEach(element => {
    printerObject[ element.title ] = Joi.number().required()
  });

  return Joi.object({
    headers:
      Joi.array().min(1).items(
        Joi.object({
          title: Joi.string().required(),
          type: Joi.string().valid('benefit', 'cost').required(),
          weight: Joi.number().min(0).required(),
        })
      ).required(),
    printers:
      Joi.array().items(
        Joi.object( printerObject)
      ).required()
  });
}

export {
  spkPrinterValidation,
}